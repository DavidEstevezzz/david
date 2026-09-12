import {
  BufferGeometry, CircleGeometry, CylinderGeometry, Group,
  InstancedMesh, Material, Mesh, MeshBasicMaterial, MeshStandardMaterial,
  Object3D, PlaneGeometry, BufferAttribute, CanvasTexture, SRGBColorSpace,
} from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { brandBlock, type BrandPath } from '../../lib/brand';

export interface Laptop {
  group: Group;
  lid: Group;
  screen: Mesh<PlaneGeometry, MeshBasicMaterial>;
  dispose(): void;
}

/**
 * Model space: the keyboard faces +Y; its front edge is +Z.
 * The screen faces +Z when open. Rotating the hinge to PI / 2 closes it.
 * Geometry stays in model space, leaving the entire camera choreography to the caller.
 */
export function createLaptop(): Laptop {
  const group = new Group();
  group.name = 'laptop';
  const base = new Group();
  base.name = 'laptop-base';
  group.add(base);

  const geometries = new Set<BufferGeometry>();
  const materials = new Set<Material>();
  const instances = new Set<InstancedMesh>();
  const keepGeometry = <T extends BufferGeometry>(geometry: T) => {
    geometries.add(geometry);
    return geometry;
  };
  const keepMaterial = <T extends Material>(material: T) => {
    materials.add(material);
    return material;
  };

  const aluminium = keepMaterial(new MeshStandardMaterial({
    color: '#727b80', metalness: .84, roughness: .28,
  }));
  const deckMaterial = keepMaterial(new MeshStandardMaterial({
    color: '#939c9f', metalness: .78, roughness: .34,
  }));
  const edgeMaterial = keepMaterial(new MeshStandardMaterial({
    color: '#b9c1c2', metalness: .86, roughness: .3,
  }));
  const graphite = keepMaterial(new MeshStandardMaterial({
    color: '#11181a', metalness: .32, roughness: .43,
  }));
  const keysMaterial = keepMaterial(new MeshStandardMaterial({
    color: '#20282a', metalness: .16, roughness: .39,
  }));
  const trackpadMaterial = keepMaterial(new MeshStandardMaterial({
    color: '#7f8a8d', metalness: .57, roughness: .42,
  }));
  const glassMaterial = keepMaterial(new MeshStandardMaterial({
    color: '#060c10', metalness: .35, roughness: .12,
  }));
  const insetMaterial = keepMaterial(new MeshBasicMaterial({ color: '#080d0e' }));
  const lensMaterial = keepMaterial(new MeshStandardMaterial({
    color: '#2b555c', metalness: .6, roughness: .08,
  }));

  // Round in the two broad dimensions before compressing the thickness. This
  // preserves the chassis silhouette instead of limiting its corner radius to
  // half the thickness of a conventional rounded box.
  function plate(width: number, height: number, depth: number, radius: number, segments = 5) {
    const fullDepth = Math.max(radius * 2, depth);
    const geometry = new RoundedBoxGeometry(width, height, fullDepth, segments, radius);
    geometry.scale(1, 1, depth / fullDepth);
    return keepGeometry(geometry);
  }

  function part(
    parent: Group, name: string, geometry: BufferGeometry, material: Material,
    x: number, y: number, z: number,
  ) {
    const mesh = new Mesh(geometry, material);
    mesh.name = name;
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  function horizontalPlate(
    name: string, width: number, depth: number, thickness: number, radius: number,
    material: Material, x: number, y: number, z: number,
  ) {
    const mesh = part(base, name, plate(width, depth, thickness, radius), material, x, y, z);
    mesh.rotation.x = -Math.PI / 2;
    return mesh;
  }

  horizontalPlate('milled-aluminium-chassis', 4.8, 3.1, .19, .16, aluminium, 0, -.104, 0);
  horizontalPlate('polished-deck-edge', 4.775, 3.075, .019, .145, edgeMaterial, 0, -.006, 0);
  horizontalPlate('keyboard-deck', 4.748, 3.046, .013, .133, deckMaterial, 0, .0005, 0);
  horizontalPlate('keyboard-recess', 3.99, 1.695, .012, .095, graphite, 0, .009, -.31);

  // Narrow, physical details retain their highlights during the opening shot.
  horizontalPlate('trackpad-reveal', 1.75, .71, .01, .065, graphite, 0, .011, .93);
  horizontalPlate('glass-trackpad', 1.723, .683, .011, .054, trackpadMaterial, 0, .018, .93);
  const openingNotch = part(
    base, 'front-opening-recess', plate(.67, .051, .014, .023, 2),
    graphite, 0, -.021, 1.548,
  );
  openingNotch.rotation.x = -.13;

  const hingeGeometry = keepGeometry(new CylinderGeometry(.075, .075, .61, 18));
  for (const x of [-1.68, 1.68]) {
    const hinge = part(base, 'hinge-barrel', hingeGeometry, graphite, x, .069, -1.38);
    hinge.rotation.z = Math.PI / 2;
  }

  // Every cap has its own matrix; wider modifier keys share the same geometry.
  // The complete keyboard is one draw call, including a distinct function row.
  const keyPositions: Array<{ x: number; z: number; width: number; depth: number; label: string }> = [];
  const keyUnit = .255;
  const addKeyRow = (units: number[], labels: string[], z: number, depth: number) => {
    const total = units.reduce((sum, width) => sum + width, 0) * keyUnit;
    let x = -total / 2;
    for (const [index, width] of units.entries()) {
      keyPositions.push({ x: x + width * keyUnit / 2, z, width: width * keyUnit - .024, depth, label: labels[index] });
      x += width * keyUnit;
    }
  };
  addKeyRow([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], ['esc', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 'ins', 'del'], -1.036, .118);
  addKeyRow([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2], ['º', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', "'", '¡', '⌫'], -.813, .204);
  addKeyRow([1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5], ['tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '`', '+', '↵'], -.562, .204);
  addKeyRow([1.75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.25], ['caps', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ñ', '´', 'enter'], -.311, .204);
  addKeyRow([2.25, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.75], ['shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '-', 'shift'], -.06, .204);
  addKeyRow([1.25, 1, 1.25, 1.25, 5, 1.25, 1, 1, 1, 1], ['ctrl', 'fn', '◆', 'alt', '', 'alt gr', '←', '↑', '↓', '→'], .191, .204);
  const keyGeometry = keepGeometry(new RoundedBoxGeometry(1, 1, 1, 2, .15));
  const keyboard = new InstancedMesh(keyGeometry, keysMaterial, keyPositions.length);
  keyboard.name = 'individual-keycaps';
  const matrix = new Object3D();
  keyPositions.forEach((key, index) => {
    matrix.position.set(key.x, .027, key.z);
    matrix.scale.set(key.width, .025, key.depth);
    matrix.rotation.set(0, 0, 0);
    matrix.updateMatrix();
    keyboard.setMatrixAt(index, matrix.matrix);
  });
  keyboard.instanceMatrix.needsUpdate = true;
  keyboard.computeBoundingSphere();
  instances.add(keyboard);
  base.add(keyboard);

  // One high-resolution atlas for the physical key legends only. Page content
  // remains HTML. All labels share a single mesh and respect chassis occlusion.
  const atlas = document.createElement('canvas'); atlas.width = 2048; atlas.height = 1024;
  const ctx = atlas.getContext('2d')!;
  ctx.fillStyle = '#dee6e8'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const labelPositions: number[] = [], labelUvs: number[] = [], labelIndices: number[] = [];
  keyPositions.forEach((key, index) => {
    const column = index % 16, row = Math.floor(index / 16);
    ctx.font = `500 ${key.label.length > 1 ? 27 : 50}px Arial`;
    ctx.fillText(key.label, column * 128 + 64, row * 128 + 66);
    const w = Math.min(key.width * .82, .28), d = key.depth * .88;
    const x = key.x, z = key.z, y = .0402, start = labelPositions.length / 3;
    labelPositions.push(x-w/2,y,z+d/2, x+w/2,y,z+d/2, x+w/2,y,z-d/2, x-w/2,y,z-d/2);
    const u = column/16, v = 1-(row+1)/8;
    labelUvs.push(u,v, u+1/16,v, u+1/16,v+1/8, u,v+1/8);
    labelIndices.push(start,start+1,start+2, start,start+2,start+3);
  });
  const legendTexture = new CanvasTexture(atlas);
  legendTexture.colorSpace = SRGBColorSpace; legendTexture.anisotropy = 4;
  const legendGeometry = keepGeometry(new BufferGeometry());
  legendGeometry.setAttribute('position', new BufferAttribute(new Float32Array(labelPositions),3));
  legendGeometry.setAttribute('uv', new BufferAttribute(new Float32Array(labelUvs),2));
  legendGeometry.setIndex(labelIndices);
  const legends = new Mesh(legendGeometry, keepMaterial(new MeshBasicMaterial({ map:legendTexture, transparent:true, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-1, toneMapped:false })));
  legends.name = 'qwerty-key-legends'; base.add(legends);
  // Tactile registration marks on the F and J keys.
  for (const label of ['F', 'J']) {
    const key = keyPositions.find(item => item.label === label)!;
    horizontalPlate(`home-row-${label}`, .055, .009, .004, .004, edgeMaterial, key.x, .042, key.z + .065);
  }

  // Small perforations are batched instead of allocating hundreds of meshes.
  const speakerGeometry = keepGeometry(new CircleGeometry(.008, 5));
  const speakerCount = 2 * 3 * 33;
  const speakers = new InstancedMesh(speakerGeometry, insetMaterial, speakerCount);
  speakers.name = 'speaker-perforations';
  let speakerIndex = 0;
  for (const side of [-1, 1]) {
    for (let column = 0; column < 3; column++) {
      for (let row = 0; row < 33; row++) {
        matrix.position.set(side * (2.115 + column * .035), .0082, -1.015 + row * .042);
        matrix.rotation.set(-Math.PI / 2, 0, 0);
        matrix.scale.set(1, 1, 1);
        matrix.updateMatrix();
        speakers.setMatrixAt(speakerIndex++, matrix.matrix);
      }
    }
  }
  speakers.instanceMatrix.needsUpdate = true;
  speakers.computeBoundingSphere();
  instances.add(speakers);
  base.add(speakers);

  const portGeometry = plate(.205, .055, .013, .024, 2);
  for (const side of [-1, 1]) {
    for (const z of [-.88, -.49]) {
      const port = part(base, 'usb-c-port', portGeometry, insetMaterial, side * 2.398, -.084, z);
      port.rotation.y = side * Math.PI / 2;
    }
  }

  const footGeometry = plate(.68, .106, .024, .045, 2);
  for (const x of [-1.64, 1.64]) {
    for (const z of [-1.15, 1.15]) {
      const foot = part(base, 'rubber-foot', footGeometry, graphite, x, -.204, z);
      foot.rotation.x = Math.PI / 2;
    }
  }

  const lid = new Group();
  lid.name = 'screen-hinge';
  lid.position.set(0, .13, -1.38);
  lid.rotation.x = Math.PI / 2;
  group.add(lid);
  part(lid, 'display-enclosure', plate(4.8, 3, .1, .12), aluminium, 0, 1.5, -.01);
  part(lid, 'display-polished-edge', plate(4.76, 2.96, .012, .106), edgeMaterial, 0, 1.5, .042);
  part(lid, 'display-black-bezel', plate(4.725, 2.925, .017, .098), glassMaterial, 0, 1.5, .053);

  const screenMaterial = keepMaterial(new MeshBasicMaterial({
    color: '#101815', toneMapped: false,
  }));
  const screen = new Mesh(keepGeometry(new PlaneGeometry(4.42, 2.65)), screenMaterial);
  screen.name = 'project-screen';
  screen.position.set(0, 1.5, .075);
  lid.add(screen);

  const webcamRing = keepGeometry(new CircleGeometry(.026, 20));
  const webcamLens = keepGeometry(new CircleGeometry(.012, 14));
  part(lid, 'camera-ring', webcamRing, graphite, 0, 2.89, .065);
  part(lid, 'camera-lens', webcamLens, lensMaterial, 0, 2.89, .066);
  const sensor = keepGeometry(new CircleGeometry(.006, 8));
  part(lid, 'camera-sensor', sensor, insetMaterial, -.11, 2.89, .065);
  part(lid, 'camera-indicator', sensor, graphite, .11, 2.89, .065);

  // The same mark as the interface, etched square onto the aluminium lid.
  // The block is a filled shape, not a stroke, so the letters and the accent
  // are painted as two passes over the shared 64-unit box.
  const EMBLEM = 256;
  const scale = EMBLEM / brandBlock.box;
  const emblemCanvas = document.createElement('canvas');
  emblemCanvas.width = EMBLEM; emblemCanvas.height = EMBLEM;
  const emblemContext = emblemCanvas.getContext('2d')!;
  const etch = (piece: BrandPath, tone: string) => {
    emblemContext.save();
    emblemContext.translate(piece.x * scale, piece.y * scale);
    emblemContext.scale(piece.s * scale, piece.s * scale);
    emblemContext.fillStyle = tone;
    emblemContext.fill(new Path2D(piece.d));
    emblemContext.restore();
  };
  brandBlock.letters.forEach(piece => etch(piece, '#6d7a70'));
  etch(brandBlock.accent, '#8fa07d');
  const emblemTexture = new CanvasTexture(emblemCanvas);
  emblemTexture.colorSpace = SRGBColorSpace;
  const emblemMaterial = keepMaterial(new MeshStandardMaterial({map:emblemTexture,transparent:true,depthWrite:false,roughness:.65,metalness:.25}));
  const emblem = part(lid, 'lid-brand-mark', keepGeometry(new PlaneGeometry(.44,.44)), emblemMaterial, 0, 1.5, -.062);
  emblem.rotation.x = Math.PI;

  let disposed = false;
  return {
    group,
    lid,
    screen,
    dispose() {
      if (disposed) return;
      disposed = true;
      group.removeFromParent();
      for (const instance of instances) instance.dispose();
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
      legendTexture.dispose();
      emblemTexture.dispose();
      // The caller owns any texture later assigned to screen.material.map.
      // Releasing the model must not dispose a texture shared by project panels.
      group.clear();
      base.clear();
      lid.clear();
    },
  };
}
