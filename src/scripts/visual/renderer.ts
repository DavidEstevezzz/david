import { Color, DoubleSide, Mesh, NoToneMapping, PerspectiveCamera, PlaneGeometry, Scene, ShaderMaterial, SRGBColorSpace, Vector2, WebGLRenderer } from 'three';
import { morphFragment, morphVertex } from './shaders';

export interface SurfaceState { bend: number; flat: number; radius: number; }

/** iOS Safari shrinks innerHeight as its toolbar collapses mid-scroll, while the
 *  layout viewport stays put. The CSS3D layer is sized and offset from the layout
 *  viewport, so the canvas has to read the same box or the two drift apart every
 *  frame: the projected screen sits off its 3D frame and the scene trembles. */
const viewportWidth = () => document.documentElement.clientWidth;
const viewportHeight = () => document.documentElement.clientHeight;

export class SurfaceRenderer {
  viewportFixed = false;
  readonly canvas: HTMLCanvasElement;
  readonly renderer: WebGLRenderer;
  private scene = new Scene();
  private camera = new PerspectiveCamera();
  private mesh?: Mesh<PlaneGeometry, ShaderMaterial>;
  private pad = 0;
  private last = '';
  private applied = '';
  private lost = false;
  private cleared = true;
  private disposed = false;
  private draws = 0;
  private telemetryTime = 0;
  private slowTicks = 0;
  private pixelRatio: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    // Small high-density screens need their native samples for the closed lid's
    // shallow diagonals. Desktop keeps a lower cap for its much larger buffer.
    this.pixelRatio = Math.min(devicePixelRatio, viewportWidth() <= 820 ? 3 : 2);
    this.renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = NoToneMapping;
    this.renderer.setClearColor(0, 0);
    this.renderer.debug.onShaderError = (_gl, _program, _vertex, _fragment) => {
      this.canvas.dispatchEvent(new CustomEvent('surface-error'));
    };
    canvas.addEventListener('webglcontextlost', this.onLost);
    canvas.addEventListener('webglcontextrestored', this.onRestored);
    addEventListener('resize', this.resize);
    this.resize();
  }

  private onLost = (event: Event) => {
    event.preventDefault();
    this.lost = true;
    this.canvas.style.opacity = '0';
    this.canvas.dataset.context = 'lost';
    this.canvas.dispatchEvent(new CustomEvent('surface-unavailable'));
  };

  private onRestored = () => {
    this.lost = false;
    this.last = ''; this.applied = '';
    this.resize();
    this.canvas.dataset.context = 'restored';
    // Content remains HTML until a new mount compiles and restores the surface.
    this.canvas.dispatchEvent(new CustomEvent('surface-restored'));
  };

  private resize = () => {
    if (this.disposed || this.lost) return;
    const width = viewportWidth();
    const viewport = viewportHeight();
    // iOS fires resize continuously while the toolbar collapses. Re-allocating the
    // drawing buffer mid-scroll is expensive and visibly shimmers, so bail when
    // the layout box has not actually moved.
    const applied = `${width}x${viewport}x${this.pixelRatio}`;
    if (applied === this.applied) return;
    this.applied = applied;
    this.pad = Math.round(viewport * 0.15);
    const height = viewport + 2 * this.pad;
    const distance = viewport * 1.6;
    this.camera.fov = 2 * Math.atan(height / (2 * distance)) * 180 / Math.PI;
    this.camera.aspect = width / height;
    this.camera.near = 1;
    this.camera.far = distance * 4;
    this.camera.position.z = distance;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.setSize(width, height);
    this.last = '';
    this.canvas.dataset.pixelRatio = String(this.pixelRatio);
  };

  async attach() {
    this.release();
    const material = new ShaderMaterial({
      vertexShader: morphVertex, fragmentShader: morphFragment,
      transparent: true, side: DoubleSide, depthTest: false, depthWrite: false,
      uniforms: {
        uSize: { value: new Vector2(1, 1) }, uRadius: { value: 24 },
        uBend: { value: 0 }, uFlat: { value: 0 },
        uColor: { value: new Color(getComputedStyle(document.documentElement).getPropertyValue('--color-surface').trim()) },
      },
    });
    this.mesh = new Mesh(new PlaneGeometry(1, 1, 64, 32), material);
    this.mesh.frustumCulled = false;
    this.scene.add(this.mesh);
    // Uses KHR_parallel_shader_compile when available; this is not a worker.
    await this.renderer.compileAsync(this.scene, this.camera);
    this.canvas.dataset.context = 'ready';
  }

  draw(frame: HTMLElement, state: SurfaceState, deltaMs: number) {
    if (this.lost || this.disposed || !this.mesh || document.hidden) return;
    // Read DOM geometry before writing canvas styles. DOM is the layout authority.
    const rect = frame.getBoundingClientRect();
    if (rect.bottom < -this.pad || rect.top > viewportHeight() + this.pad) { this.clear(); return; }
    const scroll = scrollY;
    const key = [rect.x, rect.y, rect.width, rect.height, scroll, state.bend, state.flat, state.radius].map(v => v.toFixed(3)).join('|');
    if (key === this.last) return;
    this.last = key;
    this.cleared = false;

    // An absolute canvas scrolls with the document between compositor updates.
    // Rebase its origin every tick; overscan absorbs the inter-frame movement.
    this.canvas.style.transform = `translate3d(0, ${scroll - this.pad}px, 0)`;
    this.mesh.position.set(rect.left + rect.width / 2 - viewportWidth() / 2, viewportHeight() / 2 - rect.top - rect.height / 2, 0);
    const u = this.mesh.material.uniforms;
    u.uSize.value.set(rect.width, rect.height);
    u.uRadius.value = state.radius;
    u.uBend.value = state.bend;
    u.uFlat.value = state.flat;
    this.renderer.render(this.scene, this.camera);
    this.draws++;

    this.adaptQuality(deltaMs);
    if (performance.now() - this.telemetryTime > 1000) {
      this.telemetryTime = performance.now();
      this.canvas.dataset.draws = String(this.draws);
      this.canvas.dataset.triangles = String(this.renderer.info.render.triangles);
    }
  }

  clear() {
    if (!this.cleared && !this.lost && !this.disposed) this.renderer.clear();
    this.cleared = true; this.last = '';
  }

  drawScene(scene: Scene, camera: PerspectiveCamera, deltaMs: number) {
    if (this.lost || this.disposed || document.hidden) return;
    // The story owns the projection shared with CSS3D. Do not change it here.
    this.canvas.style.transform = `translate3d(0, ${(this.viewportFixed ? 0 : scrollY) - this.pad}px, 0)`;
    this.renderer.render(scene, camera);
    this.cleared = false;
    this.adaptQuality(deltaMs);
  }

  private adaptQuality(deltaMs: number) {
    this.slowTicks = deltaMs > 28 && deltaMs < 150 ? this.slowTicks + 1 : Math.max(0, this.slowTicks - 1);
    // Step down gradually only during sustained slow movement. Retain enough
    // samples for the thin chassis instead of dropping straight to DPR 1.
    const floor = Math.min(devicePixelRatio, 1.5);
    if (this.slowTicks > 90 && this.pixelRatio > floor) {
      this.pixelRatio = Math.max(floor, this.pixelRatio - .5);
      this.slowTicks = 0; this.resize();
      this.canvas.dataset.quality = 'adaptive';
    }
  }

  release() {
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose(); this.mesh.material.dispose(); this.mesh = undefined;
    }
    this.clear();
  }

  dispose() {
    this.release(); this.disposed = true;
    removeEventListener('resize', this.resize);
    this.canvas.removeEventListener('webglcontextlost', this.onLost);
    this.canvas.removeEventListener('webglcontextrestored', this.onRestored);
    this.renderer.dispose();
  }
}
