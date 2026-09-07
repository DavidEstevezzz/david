import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AmbientLight, Color, DirectionalLight, DoubleSide, Mesh, PerspectiveCamera, PlaneGeometry, Quaternion, Scene, ShaderMaterial, Vector3 } from 'three';
import { CSS3DObject, CSS3DRenderer } from 'three/addons/renderers/CSS3DRenderer.js';
import { createLaptop } from './laptop';
import type { SurfaceRenderer } from './renderer';
import type { MorphStudy } from './morph';

gsap.registerPlugin(ScrollTrigger);
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const phase = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const smooth = (n: number) => n * n * (3 - 2 * n);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function projectSurface(color: string) {
  return new Mesh(new PlaneGeometry(1, 1, 48, 24), new ShaderMaterial({
    transparent: true, side: DoubleSide,
    uniforms: { uBend: { value: 0 }, uColor: { value: new Color(color) }, uOpacity: { value: 1 } },
    vertexShader: `
      uniform float uBend; varying vec2 vUv; varying float vSlope;
      void main() {
        vUv = uv; vec3 p = position;
        p.z += sin(uv.x * 3.14159265) * sin(uv.y * 3.14159265) * uBend;
        vSlope = cos(uv.x * 3.14159265) * uBend;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
      }`,
    fragmentShader: `
      uniform vec3 uColor; uniform float uOpacity; varying vec2 vUv; varying float vSlope;
      void main() {
        vec2 q = abs(vUv - .5) - vec2(.482);
        float d = length(max(q, 0.)) + min(max(q.x,q.y),0.) - .018;
        float alpha = 1. - smoothstep(-.001, .001, d);
        if (alpha < .001) discard;
        vec3 col = uColor * (1. + vSlope * .15);
        gl_FragColor = vec4(col, alpha * uOpacity);
        #include <colorspace_fragment>
      }`,
  }));
}

export async function mountHome(surface: SurfaceRenderer): Promise<MorphStudy | null> {
  const candidate = document.querySelector<HTMLElement>('[data-home]');
  if (!candidate) return null;
  const root: HTMLElement = candidate;
  const stage = root.querySelector<HTMLElement>('[data-story-stage]')!;
  const source = root.querySelector<HTMLElement>('[data-scene-source]')!;
  const screenElement = source.querySelector<HTMLElement>('[data-laptop-screen]')!;
  const cardElements = Array.from(source.querySelectorAll<HTMLElement>('[data-project-surface]'));
  const hero = root.querySelector<HTMLElement>('[data-hero-copy]')!;
  const nav = root.querySelector<HTMLElement>('.home-nav')!;
  const intro = root.querySelector<HTMLElement>('[data-opening-copy]')!;
  const labels = Array.from(root.querySelectorAll<HTMLElement>('[data-story-label]'));
  const progressBar = root.querySelector<HTMLElement>('[data-story-progress]')!;
  const scene = new Scene(), domScene = new Scene();
  const camera = new PerspectiveCamera(38, 1, .06, 80);
  const laptop = createLaptop(); scene.add(laptop.group);
  scene.add(new AmbientLight('#c4d3e2', 2.1));
  const key = new DirectionalLight('#f7f3e5', 5); key.position.set(-4, 7, 5); scene.add(key);
  const rim = new DirectionalLight('#b6d9ff', 3.8); rim.position.set(4, 3, -3); scene.add(rim);
  const fill = new DirectionalLight('#d9edb8', 1.1); fill.position.set(0, 1, 6); scene.add(fill);

  const dom = new CSS3DRenderer();
  dom.domElement.className = 'projected-content';
  dom.domElement.style.position = 'absolute';
  dom.domElement.style.top = '0'; dom.domElement.style.left = '0';
  dom.domElement.style.pointerEvents = 'none';
  // Keep the source HTML in document order. CSS3D only moves its real elements.
  source.append(dom.domElement);
  const originals = [screenElement, ...cardElements].map(element => {
    const marker = document.createComment('scene-content'); element.before(marker);
    return { element, marker };
  });
  const display = new CSS3DObject(screenElement); domScene.add(display);
  display.scale.setScalar(4.42 / 1100);
  const colors = ['#edf0e7', '#cfdeb9', '#d7e3eb'];
  const cards = cardElements.map((element, i) => {
    const mesh = projectSurface(colors[i]); scene.add(mesh);
    const object = new CSS3DObject(element); domScene.add(object);
    return { element, mesh, object };
  });
  const flatViewport = document.createElement('div');
  flatViewport.className = 'flat-scene-content'; source.append(flatViewport);
  let flatElement: HTMLElement | null = null, projectedTransform = '';
  const releaseFlat = () => {
    if (!flatElement) return;
    flatElement.style.transform = projectedTransform; flatElement.style.zoom = '';
    flatElement.classList.remove('surface--settled'); flatElement = null;
  };
  display.visible = false;
  cards.forEach(({ object, mesh }) => { object.visible = false; mesh.visible = false; });
  // Hide unprojected 1100px surfaces before any mobile viewport measurements.
  dom.render(domScene, camera);
  const materialResources = () => {
    laptop.dispose(); cards.forEach(({ mesh }) => { mesh.geometry.dispose(); mesh.material.dispose(); });
  };
  camera.position.set(0, 4, 11); camera.lookAt(0, 0, 0);
  try { await surface.renderer.compileAsync(scene, camera); }
  catch (error) {
    originals.forEach(({ element, marker }) => { marker.replaceWith(element); });
    dom.domElement.remove(); flatViewport.remove(); materialResources(); throw error;
  }
  if (!root.isConnected) {
    originals.forEach(({ element, marker }) => marker.replaceWith(element));
    dom.domElement.remove(); flatViewport.remove(); materialResources(); return null;
  }
  const media = gsap.matchMedia();
  const state = { p: 0 };
  let active = false, mobile = false, trigger: ScrollTrigger | undefined;
  let last = '', lastStep = -1;
  let width = 0, height = 0, pad = 0, viewportWorldHeight = 0, zoomDistance = 0;
  const screenCenter = new Vector3(), screenRotation = new Quaternion(), screenScale = new Vector3();
  const portalCenter = new Vector3(0, 1.63, -1.305);
  const aspect = () => {
    width = document.documentElement.clientWidth; height = document.documentElement.clientHeight; pad = Math.round(height * .15);
    camera.aspect = width / (height + pad * 2); camera.updateProjectionMatrix();
    dom.setSize(width, height + pad * 2);
    viewportWorldHeight = 4.42 * height / width;
    zoomDistance = 4.42 / (2 * Math.tan(camera.fov * Math.PI / 360) * camera.aspect);
    last = '';
  };
  aspect();
  const restoreContent = () => originals.forEach(({ element, marker }) => {
    marker.after(element); element.removeAttribute('style');
    element.classList.remove('display--portrait', 'surface--expanded', 'surface--portrait');
    element.querySelectorAll<HTMLElement>('[style]').forEach(child => child.removeAttribute('style'));
  });
  media.add({ mobile: '(max-width: 700px)', desktop: '(min-width: 701px)', reduced: '(prefers-reduced-motion: reduce)', short: '(max-height: 579px)' }, context => {
    if (context.conditions?.reduced || context.conditions?.short) { restoreContent(); return; }
    mobile = Boolean(context.conditions?.mobile);
    root.dataset.enhanced = '';
    originals.forEach(({ element }) => { element.style.position = 'absolute'; element.style.pointerEvents = 'none'; element.style.userSelect = 'text'; element.style.left = '0'; element.style.top = '0'; });
    // The stage owns the scroll duration; native wheel, touch and keyboard remain.
    const timeline = gsap.timeline({ scrollTrigger: {
      id: 'laptop-story', trigger: stage, start: 'top top',
      end: () => `+=${document.documentElement.clientHeight * (mobile ? 4.8 : 5.6)}`,
      pin: true, scrub: .45, anticipatePin: 1, invalidateOnRefresh: true,
      onRefresh: aspect,
    } });
    timeline.to(state, { p: 1, duration: 1, ease: 'none' });
    trigger = timeline.scrollTrigger;
    active = true; surface.canvas.style.opacity = '1';
    source.classList.add('scene-source--projected');
    surface.canvas.dataset.context = 'ready';
    ScrollTrigger.refresh();
    return () => {
      active = false; releaseFlat(); trigger?.kill(true); timeline.kill();
      root.removeAttribute('data-enhanced'); root.removeAttribute('data-chapter');
      source.classList.remove('scene-source--projected');
      gsap.set([hero, intro, nav], { clearProps: 'all' });
      surface.canvas.style.opacity = '0'; dom.domElement.style.visibility = 'hidden';
      surface.clear(); restoreContent(); last = ''; lastStep = -1;
    };
  });
  const onResize = () => { aspect(); };
  addEventListener('resize', onResize);
  const jump = (event: Event) => {
    if (!active || !trigger) return;
    event.preventDefault();
    const anchor = event.currentTarget as HTMLAnchorElement;
    const target = document.querySelector<HTMLElement>(anchor.hash);
    if (!target) return;
    window.scrollTo({ top: trigger.end + height, behavior: 'instant' });
    ScrollTrigger.update(); trigger.getTween()?.progress(1); state.p = 1;
    target.scrollIntoView({ behavior: 'instant' }); target.focus({ preventScroll: true });
  };
  const jumpers = Array.from(root.querySelectorAll<HTMLAnchorElement>('[data-skip-story]'));
  jumpers.forEach(anchor => anchor.addEventListener('click', jump));

  function render(delta: number) {
    if (!active || document.hidden) return;
    const stageRect = stage.getBoundingClientRect();
    if (stageRect.bottom <= 0 || stageRect.top >= height) {
      dom.domElement.style.visibility = 'hidden'; surface.canvas.style.opacity = '0'; last = ''; return;
    }
    const p = state.p;
    const renderKey = `${p.toFixed(5)}|${scrollY}|${width}|${height}`;
    if (renderKey === last) return;
    last = renderKey;
    releaseFlat();
    const open = smooth(phase(p, .015, .25));
    const zoom = smooth(phase(p, .25, .48));
    const expand = smooth(phase(p, .39, .49));
    const unfold = smooth(phase(p, .53, .71));
    const select = smooth(phase(p, .78, .95));
    const step = p < .25 ? 0 : p < .53 ? 1 : 2;
    if (step !== lastStep) {
      lastStep = step; root.dataset.chapter = String(step);
      labels.forEach((label, i) => label.toggleAttribute('data-active', i === step));
    }
    progressBar.style.transform = `scaleX(${p})`;
    hero.style.opacity = String(1 - smooth(phase(p, .015, .12)));
    hero.style.visibility = p >= .12 ? 'hidden' : 'visible';
    nav.style.opacity = String(1 - smooth(phase(p, .12, .24)));
    nav.style.visibility = p >= .24 ? 'hidden' : 'visible';
    intro.style.opacity = String(smooth(phase(p, .08, .15)) * (1 - smooth(phase(p, .23, .31))));
    intro.style.visibility = p > .08 && p < .31 ? 'visible' : 'hidden';

    laptop.group.position.set(lerp(mobile ? 0 : 1.35, 0, open), lerp(mobile ? -.9 : -.5, 0, open), 0);
    laptop.group.rotation.set(0, lerp(-.36, 0, open), 0);
    laptop.lid.rotation.x = lerp(Math.PI / 2, 0, open);
    laptop.group.visible = p < .505;
    const startCamera = mobile ? new Vector3(0, 8, 29) : new Vector3(0, 4.8, 11.8);
    const openCamera = new Vector3(0, 2.2, mobile ? 25 : 8.7);
    camera.position.copy(startCamera).lerp(openCamera, open);
    camera.position.lerp(new Vector3(0, portalCenter.y, portalCenter.z + zoomDistance), zoom);
    const look = new Vector3(mobile ? 0 : -.2, mobile ? 1.2 : .45, 0).lerp(portalCenter, open);
    camera.lookAt(look);
    scene.updateMatrixWorld(true);
    laptop.screen.matrixWorld.decompose(screenCenter, screenRotation, screenScale);
    display.position.copy(screenCenter);
    display.quaternion.copy(screenRotation);
    // The same HTML plane grows into a full viewport, including portrait layouts.
    const displayHeight = lerp(660, 1100 * height / width, expand);
    screenElement.style.height = `${displayHeight}px`;
    screenElement.classList.toggle('display--portrait', mobile && expand > .5);
    screenElement.style.opacity = String(1 - smooth(phase(p, .525, .575)));
    display.visible = open > .07 && p < .58;
    display.scale.setScalar(4.42 / 1100);
    if (p >= .48) { display.position.copy(portalCenter); display.quaternion.identity(); }

    const cardW = mobile ? 3.65 : 1.34;
    const cardH = mobile ? Math.min(viewportWorldHeight * .68, 5.3) : Math.min(viewportWorldHeight * .7, 1.75);
    cards.forEach(({ element, mesh, object }, i) => {
      const offset = i - 1;
      const startX = offset * 1.47;
      const targetX = mobile ? -.2 + i * .25 : offset * 1.52;
      const targetY = mobile ? -.15 * i : Math.abs(offset) * -.1;
      const chosen = i === 0;
      const w = lerp(1.47, cardW, unfold);
      const h = lerp(viewportWorldHeight, cardH, unfold);
      mesh.position.set(lerp(startX, targetX, unfold), portalCenter.y + targetY * unfold, portalCenter.z - (mobile ? i * .35 : Math.abs(offset) * .35) * unfold);
      mesh.rotation.set(0, lerp(0, mobile ? offset * -.07 : offset * -.16, unfold), offset * -.055 * unfold);
      mesh.scale.set(w, h, 1);
      if (chosen) {
        mesh.position.lerp(portalCenter, select); mesh.rotation.x *= 1 - select; mesh.rotation.y *= 1 - select; mesh.rotation.z *= 1 - select;
        mesh.scale.x = lerp(w, 4.42, select); mesh.scale.y = lerp(h, viewportWorldHeight, select);
      } else {
        mesh.position.x += offset === 0 ? select * 6 : select * 8;
        mesh.position.z -= select * 2;
      }
      mesh.material.uniforms.uBend.value = Math.sin(unfold * Math.PI) * .7 * (i % 2 ? -1 : 1) + Math.sin(select * Math.PI) * (chosen ? .35 : 0);
      mesh.visible = p > .53;
      object.visible = p > .60 && (!mobile || chosen);
      object.position.copy(mesh.position); object.position.z += .008;
      object.quaternion.copy(mesh.quaternion);
      // Only reveal readable HTML once the underlying curved surface has settled.
      element.style.opacity = String(smooth(phase(p, .64, .71)));
      const cssWidth = chosen ? lerp(420, 1100, select) : 420;
      const worldToCss = mesh.scale.x / cssWidth;
      element.style.width = `${cssWidth}px`;
      element.style.height = `${mesh.scale.y / worldToCss}px`;
      element.classList.toggle('surface--expanded', chosen && select > .5);
      element.classList.toggle('surface--portrait', mobile);
      if (chosen) {
        element.style.padding = `${lerp(26, mobile ? 80 : 65, select)}px`;
        element.querySelector<HTMLElement>('h2')!.style.fontSize = `${lerp(mobile ? 40 : 46, mobile ? 130 : 96, select)}px`;
        element.querySelector<HTMLElement>('p')!.style.fontSize = `${lerp(15, mobile ? 44 : 22, select)}px`;
      }
      object.scale.setScalar(worldToCss);
    });

    dom.domElement.style.visibility = 'visible';
    const sourceTop = source.getBoundingClientRect().top + scrollY;
    dom.domElement.style.transform = `translate3d(0, ${scrollY - sourceTop - pad}px, 0)`;
    surface.canvas.style.opacity = '1';
    surface.drawScene(scene, camera, delta);
    dom.render(domScene, camera);
    // At the two flat endpoints the exact same element leaves CSS perspective.
    // Browser layout (zoom, not a bitmap/transform) keeps the final text sharp.
    const settled = p >= .49 && p <= .525 ? screenElement : p >= .95 ? cardElements[0] : null;
    if (settled) {
      flatElement = settled; projectedTransform = settled.style.transform;
      flatViewport.style.width = `${width}px`; flatViewport.style.height = `${height}px`;
      flatViewport.style.transform = `translate3d(0, ${scrollY - sourceTop}px, 0)`;
      flatViewport.append(settled);
      settled.style.transform = 'none'; settled.style.zoom = String(width / 1100);
      settled.classList.add('surface--settled');
    }
  }

  return {
    draw: render,
    finish() { document.getElementById('proyectos')?.scrollIntoView(); },
    destroy() {
      releaseFlat(); media.revert(); removeEventListener('resize', onResize);
      jumpers.forEach(anchor => anchor.removeEventListener('click', jump));
      originals.forEach(({ element, marker }) => {
        element.removeAttribute('style'); element.classList.remove('display--portrait', 'surface--expanded', 'surface--portrait');
        element.querySelectorAll<HTMLElement>('[style]').forEach(child => child.removeAttribute('style'));
        marker.replaceWith(element);
      });
      dom.domElement.remove(); flatViewport.remove(); materialResources(); surface.clear();
    },
  };
}
