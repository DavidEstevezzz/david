import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AmbientLight, Color, DirectionalLight, DoubleSide, Mesh, PerspectiveCamera, PlaneGeometry, Quaternion, Scene, ShaderMaterial, Vector3 } from 'three';
import { CSS3DObject, CSS3DRenderer } from 'three/addons/renderers/CSS3DRenderer.js';
import { createLaptop } from './laptop';
import { createMobileChapters, mobileCardRects } from './mobile-chapters';
import { createScramble } from './scramble';
import type { SurfaceRenderer } from './renderer';
import type { MorphStudy } from './morph';

gsap.registerPlugin(ScrollTrigger);
// A collapsing mobile address bar must not re-measure the pin mid-scroll.
ScrollTrigger.config({ ignoreMobileResize: true });
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const phase = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const smooth = (n: number) => n * n * (3 - 2 * n);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function projectSurface(color: string) {
  return new Mesh(new PlaneGeometry(1, 1, 48, 24), new ShaderMaterial({
    transparent: true, side: DoubleSide,
    uniforms: { uBend: { value: 0 }, uColor: { value: new Color(color) }, uOpacity: { value: 1 }, uRadius: { value: .018 } },
    vertexShader: `
      uniform float uBend; varying vec2 vUv; varying float vSlope;
      void main() {
        vUv = uv; vec3 p = position;
        p.z += sin(uv.x * 3.14159265) * sin(uv.y * 3.14159265) * uBend;
        vSlope = cos(uv.x * 3.14159265) * uBend;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
      }`,
    fragmentShader: `
      uniform vec3 uColor; uniform float uOpacity; uniform float uRadius; varying vec2 vUv; varying float vSlope;
      void main() {
        vec2 q = abs(vUv - .5) - vec2(.5 - uRadius);
        float d = length(max(q, 0.)) + min(max(q.x,q.y),0.) - uRadius;
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
  const work = root.querySelector<HTMLElement>('#proyectos')!;
  const source = root.querySelector<HTMLElement>('[data-scene-source]')!;
  const screenElement = source.querySelector<HTMLElement>('[data-laptop-screen]')!;
  const cardElements = Array.from(source.querySelectorAll<HTMLElement>('[data-project-surface]'));
  const hero = root.querySelector<HTMLElement>('[data-hero-copy]')!;
  const nav = root.querySelector<HTMLElement>('.home-nav')!;
  const intro = root.querySelector<HTMLElement>('[data-opening-copy]')!;
  const labels = Array.from(root.querySelectorAll<HTMLElement>('[data-story-label]'));
  const progressBar = root.querySelector<HTMLElement>('[data-story-progress]')!;
  const shell = surface.canvas.parentElement!;
  let track: HTMLElement | undefined;
  let travel = 1, start = 0;
  let storyTravel = 1, exitStart = 0;
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
  const scrambles = cardElements.map((element, i) => createScramble(element.querySelector('h2')!, i));
  const flatViewport = document.createElement('div');
  flatViewport.className = 'flat-scene-content'; source.append(flatViewport);
  const chapters = createMobileChapters(screenElement, source);
  let flatCards = false;
  const releaseCards = () => {
    scrambles.forEach(effect => effect.reset());
    if (!flatCards) return;
    flatCards = false;
    cards.forEach(({ element, object }) => { domScene.add(object); element.removeAttribute('style'); });
    chapters.rows.style.visibility = 'hidden';
  };
  let mobileFlat = false, mobileProjectedTransform = '';
  const releaseMobileFlat = () => {
    if (!mobileFlat) return;
    chapters.reset();
    mobileFlat = false;
    domScene.add(display);
    screenElement.style.transform = mobileProjectedTransform;
    screenElement.classList.remove('display--entry');
    screenElement.style.removeProperty('--entry');
    screenElement.style.removeProperty('transform-origin');
    screenElement.style.removeProperty('border-radius');
  };
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
    dom.domElement.remove(); flatViewport.remove(); chapters.dispose(); materialResources(); throw error;
  }
  if (!root.isConnected) {
    originals.forEach(({ element, marker }) => marker.replaceWith(element));
    dom.domElement.remove(); flatViewport.remove(); chapters.dispose(); materialResources(); return null;
  }
  const media = gsap.matchMedia();
  const state = { p: 0 };
  let active = false, mobile = false, trigger: ScrollTrigger | undefined;
  let last = '', lastStep = -1;
  let width = 0, height = 0, pad = 0, viewportWorldHeight = 0, zoomDistance = 0;
  const screenCenter = new Vector3(), screenRotation = new Quaternion(), screenScale = new Vector3();
  const screenNormal = new Vector3(), toCamera = new Vector3();
  const surfaceColors = colors.map(color => new Color(color));
  const workColor = new Color('#edf0e7');
  const portalCenter = new Vector3(0, 1.63, -1.305);
  const aspect = () => {
    width = document.documentElement.clientWidth; height = document.documentElement.clientHeight; pad = Math.round(height * .15);
    camera.aspect = width / (height + pad * 2); camera.updateProjectionMatrix();
    dom.setSize(width, height + pad * 2);
    viewportWorldHeight = 4.42 * height / width;
    zoomDistance = 4.42 / (2 * Math.tan(camera.fov * Math.PI / 360) * camera.aspect);
    if (track) {
      storyTravel = stage.clientHeight * 3.2;
      exitStart = storyTravel * .89;
      // One pixel of native scroll moves the departing scene one pixel. The exit
      // ramp consumes exactly one viewport; anything past that is scroll that
      // moves nothing, so the landing is only a rounding buffer.
      travel = exitStart + height * 1.05;
      track.style.height = `${stage.clientHeight + travel}px`;
      track.dataset.storyTravel = String(storyTravel);
      track.dataset.exitStart = String(exitStart);
      track.dataset.exitTravel = String(height);
      start = track.getBoundingClientRect().top + scrollY;
    }
    last = '';
  };
  aspect();
  const restoreContent = () => originals.forEach(({ element, marker }) => {
    marker.after(element); element.removeAttribute('style');
    element.classList.remove('display--portrait', 'surface--expanded', 'surface--portrait');
    element.querySelectorAll<HTMLElement>('[style]').forEach(child => child.removeAttribute('style'));
  });
  media.add({ mobile: '(max-width: 820px)', desktop: '(min-width: 821px)', reduced: '(prefers-reduced-motion: reduce)', short: '(max-height: 579px)' }, context => {
    if (context.conditions?.reduced || context.conditions?.short) { restoreContent(); return; }
    mobile = Boolean(context.conditions?.mobile);
    root.dataset.enhanced = '';
    originals.forEach(({ element }) => { element.style.position = 'absolute'; element.style.pointerEvents = 'none'; element.style.userSelect = 'text'; element.style.left = '0'; element.style.top = '0'; });
    // The stage owns the scroll duration; native wheel, touch and keyboard remain.
    if (mobile) {
      track = document.createElement('div');
      track.className = 'native-story-track';
      stage.before(track); track.append(stage);
      root.dataset.nativeStory = '';
      shell.style.position = 'fixed';
      surface.viewportFixed = true;
      dom.domElement.style.position = 'fixed';
      flatViewport.style.position = 'fixed';
      aspect();
    }
    const timeline = mobile ? undefined : gsap.timeline({ scrollTrigger: {
      id: 'laptop-story', trigger: stage, start: 'top top',
      end: () => `+=${document.documentElement.clientHeight * (mobile ? 4.8 : 5.6)}`,
      pin: true, scrub: .45, anticipatePin: 1, invalidateOnRefresh: true,
      onRefresh: aspect,
    } });
    timeline?.to(state, { p: 1, duration: 1, ease: 'none' });
    trigger = timeline?.scrollTrigger;
    active = true; surface.canvas.style.opacity = '1';
    source.classList.add('scene-source--projected');
    surface.canvas.dataset.context = 'ready';
    ScrollTrigger.refresh();
    return () => {
      active = false; releaseFlat(); releaseMobileFlat(); releaseCards(); trigger?.kill(true); timeline?.kill();
      if (track) { track.before(stage); track.remove(); track = undefined; }
      delete root.dataset.nativeStory;
      delete root.dataset.lightStory;
      shell.style.removeProperty('position'); surface.viewportFixed = false;
      dom.domElement.style.position = 'absolute'; flatViewport.style.position = 'absolute';
      root.removeAttribute('data-enhanced'); root.removeAttribute('data-chapter');
      source.classList.remove('scene-source--projected');
      gsap.set([hero, intro, nav, work], { clearProps: 'all' });
      surface.canvas.style.opacity = '0'; dom.domElement.style.visibility = 'hidden';
      surface.clear(); restoreContent(); last = ''; lastStep = -1;
    };
  });
  // A retracting address bar changes only the height. Re-measuring the track
  // mid-scroll would move the story clock and the parked section under the finger.
  const onResize = () => { if (mobile && track && document.documentElement.clientWidth === width) return; aspect(); };
  addEventListener('resize', onResize);
  const jump = (event: Event) => {
    if (!active) return;
    event.preventDefault();
    const anchor = event.currentTarget as HTMLAnchorElement;
    const target = document.querySelector<HTMLElement>(anchor.hash);
    if (!target) return;
    window.scrollTo({ top: (mobile ? start + travel : trigger!.end) + height, behavior: 'instant' });
    ScrollTrigger.update(); trigger?.getTween()?.progress(1); state.p = 1;
    target.scrollIntoView({ behavior: 'instant' }); target.focus({ preventScroll: true });
  };
  const jumpers = Array.from(root.querySelectorAll<HTMLAnchorElement>('[data-skip-story]'));
  jumpers.forEach(anchor => anchor.addEventListener('click', jump));

  function render(delta: number) {
    if (!active || document.hidden) return;
    const stageRect = stage.getBoundingClientRect();
    if (stageRect.bottom <= 0 || stageRect.top >= height) {
      dom.domElement.style.visibility = 'hidden'; flatViewport.style.visibility = 'hidden'; surface.canvas.style.opacity = '0';
      chapters.rows.style.visibility = 'hidden';
      work.style.transform = ''; work.style.visibility = ''; work.style.opacity = stageRect.bottom <= 0 ? '1' : '0';
      last = ''; return;
    }
    const distance = scrollY - start;
    const mobileExit = clamp((distance - exitStart) / height);
    const p = mobile ? (distance <= exitStart ? clamp(distance / storyTravel) : .89 + .11 * mobileExit) : state.p;
    if (mobile) root.toggleAttribute('data-light-story', p >= .49);
    const renderKey = `${p.toFixed(5)}|${scrollY}|${width}|${height}`;
    if (renderKey === last) return;
    last = renderKey;
    releaseFlat();
    const opening = phase(p, mobile ? 0 : .015, .25);
    const open = mobile ? lerp(opening, smooth(opening), .35) : smooth(opening);
    // Reach a front-facing screen before handing its exact rectangle to 2D.
    const zoom = smooth(phase(p, .25, mobile ? .36 : .48));
    const entry = smooth(phase(p, .36, .49));
    const useMobileFlat = mobile && p >= .36 && p < .85;
    const useCards = mobile && p >= .66 && p < 1;
    if (!useCards) releaseCards();
    if (!useMobileFlat) releaseMobileFlat();
    const expand = smooth(phase(p, .39, .49));
    const unfold = smooth(phase(p, .53, .71));
    const merge = smooth(phase(p, .78, .94));
    const reveal = smooth(phase(p, .93, .985));
    const step = p < .25 ? 0 : p < (mobile ? .68 : .53) ? 1 : 2;
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
    laptop.group.visible = p < (mobile ? .43 : .505);
    const startCamera = mobile ? new Vector3(0, 8, 29) : new Vector3(0, 4.8, 11.8);
    const openCamera = new Vector3(0, 2.2, mobile ? 25 : 8.7);
    camera.position.copy(startCamera).lerp(openCamera, open);
    const entryDistance = mobile ? zoomDistance / lerp(.9, 1, smooth(phase(p, .49, .53))) : zoomDistance;
    camera.position.lerp(new Vector3(0, portalCenter.y, portalCenter.z + entryDistance), zoom);
    const look = new Vector3(mobile ? 0 : -.2, mobile ? 1.2 : .45, 0).lerp(portalCenter, open);
    camera.lookAt(look);
    scene.updateMatrixWorld(true);
    laptop.screen.matrixWorld.decompose(screenCenter, screenRotation, screenScale);
    // CSS3D does not share WebGL's depth buffer: explicitly cull the screen
    // when the camera sees the back of the lid, including grazing angles.
    screenNormal.set(0, 0, 1).applyQuaternion(screenRotation);
    const facing = screenNormal.dot(toCamera.copy(camera.position).sub(screenCenter).normalize());
    display.position.copy(screenCenter);
    display.quaternion.copy(screenRotation);
    // The same HTML plane grows into a full viewport, including portrait layouts.
    const displayHeight = mobile ? lerp(660, 1100 * height / width, entry) : lerp(660, 1100 * height / width, expand);
    screenElement.style.height = `${displayHeight}px`;
    screenElement.classList.remove('display--portrait');
    screenElement.style.opacity = String(smooth(phase(facing, .06, .18)) * (1 - smooth(phase(p, mobile ? .80 : .525, mobile ? .85 : .575))));
    display.visible = facing > .06 && p < (mobile ? .85 : .58);
    display.scale.setScalar(4.42 / 1100);
    if (!mobile && p >= .48) { display.position.copy(portalCenter); display.quaternion.identity(); }

    const cardW = mobile ? 3.65 : 1.34;
    const cardH = mobile ? Math.min(viewportWorldHeight * .68, 5.3) : Math.min(viewportWorldHeight * .7, 1.75);
    cards.forEach(({ element, mesh, object }, i) => {
      if (mobile) {
        mesh.visible = false; object.visible = false;
        return;
      }
      const offset = i - 1;
      const startX = offset * 1.47;
      const targetX = mobile ? -.2 + i * .25 : offset * 1.52;
      const targetY = mobile ? -.15 * i : Math.abs(offset) * -.1;
      const w = lerp(1.47, cardW, unfold);
      const h = lerp(viewportWorldHeight, cardH, unfold);
      mesh.position.set(lerp(startX, targetX, unfold), portalCenter.y + targetY * unfold, portalCenter.z - (mobile ? i * .35 : Math.abs(offset) * .35) * unfold);
      mesh.rotation.set(0, lerp(0, mobile ? offset * -.07 : offset * -.16, unfold), offset * -.055 * unfold);
      mesh.scale.set(w, h, 1);
      // Each service becomes an equal third of the next section. No card wins
      // the camera: the three surfaces join edge-to-edge in the centre.
      mesh.position.lerp(new Vector3(offset * 4.42 / 3, portalCenter.y, portalCenter.z), merge);
      mesh.rotation.x *= 1-merge; mesh.rotation.y *= 1-merge; mesh.rotation.z *= 1-merge;
      mesh.scale.x = lerp(w, 4.42 / 3 + .006, merge);
      mesh.scale.y = lerp(h, viewportWorldHeight, merge);
      mesh.material.uniforms.uBend.value = Math.sin(unfold * Math.PI) * .7 * (i % 2 ? -1 : 1) + Math.sin(merge * Math.PI) * .35 * (i-1);
      mesh.material.uniforms.uRadius.value = .018 * (1-merge);
      mesh.material.uniforms.uColor.value.copy(surfaceColors[i]).lerp(workColor, merge);
      mesh.material.uniforms.uOpacity.value = 1-reveal;
      mesh.visible = p > .53 && reveal < 1;
      object.visible = p > .60 && p < .835 && (!mobile || i === 0);
      object.position.copy(mesh.position); object.position.z += .008;
      object.quaternion.copy(mesh.quaternion);
      // Only reveal readable HTML once the underlying curved surface has settled.
      element.style.opacity = String(smooth(phase(p, .64, .71)) * (1-smooth(phase(p, .78, .825))));
      // Rasterize the projected HTML at twice its display size, so perspective
      // and fractional scroll positions downsample text instead of enlarging it.
      const cssWidth = 840;
      const worldToCss = mesh.scale.x / cssWidth;
      element.style.width = `${cssWidth}px`;
      element.style.height = `${mesh.scale.y / worldToCss}px`;
      element.classList.toggle('surface--portrait', mobile);
      object.scale.setScalar(worldToCss);
    });

    dom.domElement.style.visibility = 'visible';
    flatViewport.style.visibility = 'visible';
    const sourceTop = mobile ? 0 : source.getBoundingClientRect().top + scrollY;
    const layerY = mobile ? 0 : scrollY - sourceTop;
    dom.domElement.style.transform = `translate3d(0, ${layerY - pad}px, 0)`;
    surface.canvas.style.opacity = String(mobile && p < .53 ? 1 - smooth(phase(p, .36, .43)) : 1);
    surface.drawScene(scene, camera, delta);
    if (useMobileFlat && !mobileFlat) {
      mobileFlat = true;
      mobileProjectedTransform = screenElement.style.transform;
      domScene.remove(display);
      flatViewport.append(screenElement);
      screenElement.classList.add('display--entry');
    }
    dom.render(domScene, camera);
    if (useCards) {
      if (!flatCards) {
        flatCards = true;
        cards.forEach(({ element, object }) => { domScene.remove(object); element.removeAttribute('style'); chapters.rows.append(element); });
      }
      chapters.rows.style.visibility = 'visible';
      chapters.rows.style.opacity = '1';
      chapters.rows.style.width = `${width}px`;
      chapters.rows.style.height = `${height}px`;
      chapters.rows.style.backgroundColor = `rgba(233,237,222,${smooth(phase(p, .80, .85))})`;
      chapters.rows.style.transform = `translate3d(0, ${-height * mobileExit}px, 0)`;
    }
    if (useMobileFlat) {
      // Same 1100px element, same glyphs, same scale at the handoff. No clone,
      // crossfade of headings or portrait class that can change line breaks.
      const scale = width / 1100 * lerp(.9, 1, entry);
      const x = width * .05 * (1 - entry);
      const y = (height - width * .9 * 660 / 1100) / 2 * (1 - entry);
      flatViewport.style.width = `${width}px`; flatViewport.style.height = `${height}px`;
      flatViewport.style.transform = 'none';
      screenElement.style.display = '';
      screenElement.style.transformOrigin = '0 0';
      screenElement.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
      screenElement.style.setProperty('--entry', String(entry));
      screenElement.style.borderRadius = `${8 * (1 - entry)}px`;
      chapters.spread(p, width, height);
    }
    if (useCards) {
      cards.forEach(({ element }, i) => {
        // Both surfaces follow the same rectangle throughout the expansion.
        // Content changes inside that surface, rather than arriving from below.
        const rect = p < .81 ? chapters.rectangles[i] : mobileCardRects(width, height)[i];
        const grow = smooth(phase(p, .70, .72));
        element.style.opacity = String(grow);
        scrambles[i].update(p < .70 ? -1 : (p - .70) / .10);
        element.style.setProperty('--copy-reveal', String(smooth(phase(p, .74, .80))));
        if (rect) {
          element.style.position = 'absolute';
          element.style.left = `${rect.x}px`; element.style.top = `${rect.y}px`;
          element.style.width = `${rect.w}px`; element.style.height = `${rect.h}px`;
        }
      });
    }
    // At the two flat endpoints the exact same element leaves CSS perspective.
    // Browser layout (zoom, not a bitmap/transform) keeps the final text sharp.
    const settled = !mobile && p >= .49 && p <= .525 ? screenElement : null;
    if (settled) {
      flatElement = settled; projectedTransform = settled.style.transform;
      flatViewport.style.width = `${width}px`; flatViewport.style.height = `${height}px`;
      flatViewport.style.transform = `translate3d(0, ${layerY}px, 0)`;
      flatViewport.append(settled);
      settled.style.transform = 'none'; settled.style.zoom = String(width / 1100);
      settled.classList.add('surface--settled');
    }
    // Reveal the actual following section at its final font size. It stays in
    // document flow, so scrolling past the pin continues without a duplicate.
    const remaining = Math.max(0, (mobile ? start + travel : trigger?.end ?? 0) - scrollY);
    // Before the exit the section already sits a full viewport below the fold on
    // its own. Compensating the scroll there would apply a transform a frame late
    // and flash its top edge at the bottom of the screen while the finger moves.
    if (mobile && mobileExit <= 0) {
      work.style.transform = ''; work.style.visibility = 'hidden';
    } else {
      // Park it past the lowest edge the screen can reach: the layout box is the
      // small viewport, but a retracted address bar shows more than that.
      const parked = Math.max(height, innerHeight, visualViewport?.height ?? 0) + 2;
      const workOffset = mobile ? parked * (1 - mobileExit) - remaining : -remaining * reveal;
      work.style.visibility = '';
      work.style.transform = `translate3d(0, ${workOffset}px, 0)`;
    }
    work.style.opacity = mobile ? '1' : String(reveal);
  }

  return {
    draw: render,
    finish() { document.getElementById('proyectos')?.scrollIntoView(); },
    destroy() {
      releaseFlat(); releaseMobileFlat(); releaseCards(); media.revert(); removeEventListener('resize', onResize);
      jumpers.forEach(anchor => anchor.removeEventListener('click', jump));
      originals.forEach(({ element, marker }) => {
        element.removeAttribute('style'); element.classList.remove('display--portrait', 'surface--expanded', 'surface--portrait');
        element.querySelectorAll<HTMLElement>('[style]').forEach(child => child.removeAttribute('style'));
        marker.replaceWith(element);
      });
      dom.domElement.remove(); flatViewport.remove(); chapters.dispose(); materialResources(); surface.clear();
    },
  };
}
