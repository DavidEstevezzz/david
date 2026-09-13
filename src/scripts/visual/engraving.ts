import { CanvasTexture, MeshStandardMaterial, SRGBColorSpace, Vector2 } from 'three';

/**
 * A mark cut into metal.
 *
 * Painting a logo onto a surface as a translucent bitmap gives away the trick
 * twice over: the contour carries whatever staircase the rasteriser left at the
 * resolution it was baked, and the relief comes from banded tones that read as
 * a filter effect rather than as a cut. Both go away if the shape is kept as
 * geometry for as long as possible, so this module never ships a picture of the
 * mark. It ships a signed distance field.
 *
 *   · The contour is reconstructed in the fragment shader from that field and
 *     antialiased against the pixel's own footprint, so it stays exactly one
 *     pixel wide at any size, any angle and any zoom — there is no baked edge
 *     left to show its texels.
 *   · The wall of the cut is a function of the same distance, with a profile
 *     that is continuous in its second derivative. No steps to band, and the
 *     highlight rolls along the wall the way it rolls along a fillet.
 *   · Colour rides the same distance, leaving the contour as the exact metal
 *     around it and reaching the floor further in, so the mark has no outline
 *     of its own. Roughness follows a much shorter ramp, because a cutter
 *     takes the polish off the whole cut and not just its bottom.
 */

/** A filled path with its placement inside the mark's own square box. */
export interface EngravedPath {
  x: number;
  y: number;
  s: number;
  d: string;
}

/** A metal finish: what it looks like and how rough the light finds it. */
export interface Finish {
  color: string;
  roughness: number;
}

export interface EngravingOptions {
  /** Side of the square box the paths are laid out in, in their own units. */
  box: number;
  /** Width of the wall of the cut, in box units. */
  wall: number;
  /** How far the wall tips away from the surface, as a normal map scale. */
  depth: number;
  /** The sheet being cut: the finish the mark has to disappear into. */
  surface: Finish;
  /** What the cutter leaves behind — blasted metal, or a filled inlay. */
  floor: Finish;
  metalness: number;
  /** Renderer maximum, from WebGLRenderer.capabilities.getMaxAnisotropy(). */
  anisotropy: number;
  /**
   * Resolution of the distance transform, and of the maps sampled from it.
   * They are deliberately separate: the field only has to place the contour,
   * which interpolation recovers from very little, while the maps carry the
   * shading of a wall a couple of pixels wide and want the room. Both default
   * to what the block on the lid needs; a smaller mark should ask for less.
   */
  field?: number;
  maps?: number;
  /**
   * Whether the plane carrying the mark is mounted face-down, which mirrors
   * its tangent frame. Left unset, the walls catch the key light on the near
   * side and the mark reads as a boss standing proud of the sheet.
   */
  mirrored?: boolean;
}

export interface Engraving {
  material: MeshStandardMaterial;
  dispose(): void;
}

/**
 * Distances are stored in one byte over this range, in box units. It only has
 * to cover the contour the shader reconstructs and the wall the maps shade —
 * keeping it tight spends the byte where the precision is read.
 */
const REACH = 1.6;

const smootherstep = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
/** Its derivative, for the wall normal. Zero at both ends: no crease either way. */
const smootherslope = (t: number) => 30 * t * t * (t - 1) * (t - 1);

/**
 * Felzenszwalb & Huttenlocher's exact distance transform, one dimension of it:
 * the lower envelope of the parabolas rooted at each sample. Linear in the
 * length of the row, which is what makes an exact field affordable at load.
 */
function lowerEnvelope(f: Float64Array, d: Float64Array, v: Int32Array, z: Float64Array, n: number) {
  let k = 0;
  v[0] = 0; z[0] = -Infinity; z[1] = Infinity;
  for (let q = 1; q < n; q++) {
    let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) {
      k--;
      s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    }
    k++; v[k] = q; z[k] = s; z[k + 1] = Infinity;
  }
  k = 0;
  for (let q = 0; q < n; q++) {
    while (z[k + 1] < q) k++;
    d[q] = (q - v[k]) * (q - v[k]) + f[v[k]];
  }
}

/** Euclidean distance, in texels, from every texel to the nearest seeded one. */
function distanceToSeeds(seeded: (index: number) => boolean, size: number) {
  const grid = new Float64Array(size * size);
  for (let i = 0; i < grid.length; i++) grid[i] = seeded(i) ? 0 : 1e20;
  const f = new Float64Array(size), d = new Float64Array(size);
  const v = new Int32Array(size), z = new Float64Array(size + 1);
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) f[y] = grid[y * size + x];
    lowerEnvelope(f, d, v, z, size);
    for (let y = 0; y < size; y++) grid[y * size + x] = d[y];
  }
  for (let y = 0; y < size; y++) {
    const row = y * size;
    for (let x = 0; x < size; x++) f[x] = grid[row + x];
    lowerEnvelope(f, d, v, z, size);
    for (let x = 0; x < size; x++) grid[row + x] = Math.sqrt(d[x]);
  }
  return grid;
}

/**
 * The signed distance to the contour, in box units and positive inside the
 * mark. Texels the rasteriser left partly covered carry their own sub-texel
 * offset instead of a whole-texel distance, which is what keeps the contour
 * true to the outline rather than to the grid it was sampled on.
 */
function signedDistance(coverage: Float32Array, size: number, box: number) {
  const outward = distanceToSeeds(index => coverage[index] < .5, size);
  const inward = distanceToSeeds(index => coverage[index] >= .5, size);
  const field = new Float32Array(size * size);
  const unit = box / size;
  for (let i = 0; i < field.length; i++) {
    const c = coverage[i];
    const texels = c > 0 && c < 1 ? c - .5
      : c >= .5 ? outward[i] - .5 : .5 - inward[i];
    field[i] = texels * unit;
  }
  return field;
}

/** Bilinear read, so the maps can be built at their own, finer resolution. */
function sample(grid: Float32Array, size: number, x: number, y: number) {
  const edge = size - 1;
  const fx = x < 0 ? 0 : x > edge ? edge : x;
  const fy = y < 0 ? 0 : y > edge ? edge : y;
  const x0 = Math.floor(fx), y0 = Math.floor(fy);
  const x1 = x0 < edge ? x0 + 1 : edge, y1 = y0 < edge ? y0 + 1 : edge;
  const tx = fx - x0, ty = fy - y0;
  const top = grid[y0 * size + x0] + (grid[y0 * size + x1] - grid[y0 * size + x0]) * tx;
  const bottom = grid[y1 * size + x0] + (grid[y1 * size + x1] - grid[y1 * size + x0]) * tx;
  return top + (bottom - top) * ty;
}

/**
 * Every canvas here is written and read back from JavaScript, never composited.
 * Saying so keeps the browser from backing it on the GPU, where each readback
 * costs a pipeline stall — by far the most expensive thing this module did
 * before it asked.
 */
function context2d(size: number) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  return canvas.getContext('2d', { willReadFrequently: true })!;
}

/** Reads "#rrggbb" into the 0-255 triplet the maps are written in. */
function channels(color: string): [number, number, number] {
  const value = parseInt(color.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

export function createEngraving(paths: readonly EngravedPath[], options: EngravingOptions): Engraving {
  const {
    box, wall, depth, surface, floor, metalness, anisotropy, mirrored,
    field: FIELD = 256, maps: MAPS = 512,
  } = options;

  // One rasterisation, at the resolution the distance transform runs at.
  const mask = context2d(FIELD);
  mask.scale(FIELD / box, FIELD / box);
  mask.fillStyle = '#000'; mask.fillRect(0, 0, box, box);
  mask.fillStyle = '#fff';
  for (const piece of paths) {
    mask.save();
    mask.translate(piece.x, piece.y);
    mask.scale(piece.s, piece.s);
    mask.fill(new Path2D(piece.d));
    mask.restore();
  }
  const pixels = mask.getImageData(0, 0, FIELD, FIELD).data;
  const coverage = new Float32Array(FIELD * FIELD);
  for (let i = 0; i < coverage.length; i++) coverage[i] = pixels[i * 4] / 255;
  const field = signedDistance(coverage, FIELD, box);

  // The wall tips along the gradient of the distance, which is smooth wherever
  // the contour is. Differencing the wall profile instead would reintroduce
  // the steps this whole approach exists to avoid, so the gradient is taken
  // once, here, from the field itself.
  const fieldUnit = box / FIELD, fieldEdge = FIELD - 1;
  const at = (x: number, y: number) =>
    field[(y < 0 ? 0 : y > fieldEdge ? fieldEdge : y) * FIELD + (x < 0 ? 0 : x > fieldEdge ? fieldEdge : x)];
  const gradientX = new Float32Array(FIELD * FIELD);
  const gradientY = new Float32Array(FIELD * FIELD);
  for (let y = 0; y < FIELD; y++) for (let x = 0; x < FIELD; x++) {
    gradientX[y * FIELD + x] = (at(x + 1, y) - at(x - 1, y)) / (2 * fieldUnit);
    gradientY[y * FIELD + x] = (at(x, y + 1) - at(x, y - 1)) / (2 * fieldUnit);
  }

  // Four maps, all of them functions of that one distance.
  const distanceContext = context2d(MAPS);
  const normalContext = context2d(MAPS);
  const colorContext = context2d(MAPS);
  const roughnessContext = context2d(MAPS);
  const distanceImage = distanceContext.createImageData(MAPS, MAPS);
  const normalImage = normalContext.createImageData(MAPS, MAPS);
  const colorImage = colorContext.createImageData(MAPS, MAPS);
  const roughnessImage = roughnessContext.createImageData(MAPS, MAPS);
  const [surfaceR, surfaceG, surfaceB] = channels(surface.color);
  const [floorR, floorG, floorB] = channels(floor.color);
  const step = FIELD / MAPS;
  const sign = mirrored ? -1 : 1;

  // Only the band around the contour actually varies. Everything beyond it is
  // either untouched sheet or open floor, and writing those as constants keeps
  // the whole bake off the frame budget at load.
  const band = REACH + fieldUnit * 2;
  const flatNormal = (1 * .5 + .5) * 255;
  for (let y = 0; y < MAPS; y++) for (let x = 0; x < MAPS; x++) {
    const index = (y * MAPS + x) * 4;
    const fx = (x + .5) * step - .5, fy = (y + .5) * step - .5;
    const nearest = field[Math.round(fy < 0 ? 0 : fy > fieldEdge ? fieldEdge : fy) * FIELD
      + Math.round(fx < 0 ? 0 : fx > fieldEdge ? fieldEdge : fx)];

    if (nearest <= -band || nearest >= band) {
      const inside = nearest > 0;
      distanceImage.data[index] = inside ? 255 : 0;
      distanceImage.data[index + 3] = 255;
      normalImage.data[index] = 128;
      normalImage.data[index + 1] = 128;
      normalImage.data[index + 2] = flatNormal;
      normalImage.data[index + 3] = 255;
      colorImage.data[index] = inside ? floorR : surfaceR;
      colorImage.data[index + 1] = inside ? floorG : surfaceG;
      colorImage.data[index + 2] = inside ? floorB : surfaceB;
      colorImage.data[index + 3] = 255;
      roughnessImage.data[index + 1] = (inside ? floor.roughness : surface.roughness) * 255;
      roughnessImage.data[index + 3] = 255;
      continue;
    }

    const distance = sample(field, FIELD, fx, fy);
    const ratio = distance / wall;
    const t = ratio < 0 ? 0 : ratio > 1 ? 1 : ratio;
    const sunk = smootherstep(t);
    // The finish changes far faster than the shape does: a cutter takes the
    // polish off the whole cut, walls included. Ramping it across the full
    // wall instead leaves a mirror-bright fillet at the contour, and a tight
    // specular lobe on a sliver that narrow sparkles as the lid turns.
    const polish = distance / (wall * .28);
    const finish = smootherstep(polish < 0 ? 0 : polish > 1 ? 1 : polish);

    const stored = .5 + distance / (2 * REACH);
    distanceImage.data[index] = (stored < 0 ? 0 : stored > 1 ? 1 : stored) * 255;
    distanceImage.data[index + 3] = 255;

    const slope = t > 0 && t < 1 ? -smootherslope(t) / wall : 0;
    const nx = -slope * sample(gradientX, FIELD, fx, fy) * depth * sign;
    const ny = slope * sample(gradientY, FIELD, fx, fy) * depth * sign;
    // Math.hypot guards against overflows that cannot happen here, and costs
    // an order of magnitude more than the square root for the trouble.
    const length = Math.sqrt(nx * nx + ny * ny + 1);
    normalImage.data[index] = (nx / length * .5 + .5) * 255;
    normalImage.data[index + 1] = (ny / length * .5 + .5) * 255;
    normalImage.data[index + 2] = (1 / length * .5 + .5) * 255;
    normalImage.data[index + 3] = 255;

    // Colour and finish start as the untouched sheet and end at the floor, so
    // the mark has nothing to give away at its contour.
    colorImage.data[index] = surfaceR + (floorR - surfaceR) * sunk;
    colorImage.data[index + 1] = surfaceG + (floorG - surfaceG) * sunk;
    colorImage.data[index + 2] = surfaceB + (floorB - surfaceB) * sunk;
    colorImage.data[index + 3] = 255;

    roughnessImage.data[index + 1] = (surface.roughness + (floor.roughness - surface.roughness) * finish) * 255;
    roughnessImage.data[index + 3] = 255;
  }
  distanceContext.putImageData(distanceImage, 0, 0);
  normalContext.putImageData(normalImage, 0, 0);
  colorContext.putImageData(colorImage, 0, 0);
  roughnessContext.putImageData(roughnessImage, 0, 0);

  // Closed, the lid is read at a grazing angle: without anisotropic samples
  // the hardware picks a mip from the compressed axis and softens both.
  const texture = (canvas: HTMLCanvasElement, srgb = false) => {
    const map = new CanvasTexture(canvas);
    map.anisotropy = anisotropy;
    if (srgb) map.colorSpace = SRGBColorSpace;
    return map;
  };
  const distanceMap = texture(distanceContext.canvas);
  const normalMap = texture(normalContext.canvas);
  const colorMap = texture(colorContext.canvas, true);
  const roughnessMap = texture(roughnessContext.canvas);

  const material = new MeshStandardMaterial({
    map: colorMap,
    roughnessMap, roughness: 1,
    metalness,
    normalMap, normalScale: new Vector2(1, 1),
    transparent: true, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -1,
  });
  // The contour is the one thing that is never baked. Reconstructing it here
  // costs two instructions and buys an edge exactly one pixel wide whatever
  // the mark is doing on screen.
  material.onBeforeCompile = shader => {
    shader.uniforms.uEngraving = { value: distanceMap };
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <alphamap_pars_fragment>',
        '#include <alphamap_pars_fragment>\nuniform sampler2D uEngraving;')
      .replace('#include <alphamap_fragment>',
        `#include <alphamap_fragment>
        float engravingDistance = texture2D( uEngraving, vMapUv ).r - .5;
        float engravingEdge = max( fwidth( engravingDistance ), 1e-5 );
        diffuseColor.a *= smoothstep( -engravingEdge, engravingEdge, engravingDistance );`);
  };
  // Two engravings compile to the same source; the key keeps them from sharing
  // one program, since each carries its own field in its own uniform.
  material.customProgramCacheKey = () => `engraving-${material.uuid}`;

  return {
    material,
    dispose() {
      material.dispose();
      distanceMap.dispose(); normalMap.dispose();
      colorMap.dispose(); roughnessMap.dispose();
    },
  };
}
