import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { SurfaceRenderer } from './renderer';
import { mountMorph, type MorphStudy } from './morph';
import { mountHome } from './home';

export function createRuntime() {
  const canvas = document.querySelector<HTMLCanvasElement>('#visual-canvas')!;
  const surface = new SurfaceRenderer(canvas);
  const createScroll = () => new Lenis({
    autoRaf: false,
    smoothWheel: matchMedia('(min-width: 821px) and (prefers-reduced-motion: no-preference)').matches,
    syncTouch: false,
    lerp: .1,
  });
  let lenis: Lenis | undefined;
  let study: MorphStudy | null = null;
  let mounting: Promise<void> = Promise.resolve();
  let disposed = false;
  let contactOpen = document.documentElement.classList.contains('contact-is-open');
  let revision = 0;
  const inputTick = (time: number) => { lenis?.raf(time * 1000); ScrollTrigger.update(); };
  const renderTick = (_time: number, delta: number) => { if (!contactOpen) study?.draw(delta); };
  gsap.ticker.lagSmoothing(0);
  // Input before GSAP's root timeline; rendering after its DOM/uniform updates.
  gsap.ticker.add(inputTick, false, true);
  gsap.ticker.add(renderTick);

  // Cancel wheel momentum before native anchor jumps or keyboard navigation.
  // Otherwise the next tick can pull the page back toward an old wheel target.
  const resetScroll = () => { lenis?.scrollTo(window.scrollY, { immediate: true }); };
  const onClick = (event: MouseEvent) => {
    const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
    if (anchor?.hash && anchor.origin === location.origin && anchor.pathname === location.pathname) resetScroll();
  };
  const onKey = (event: KeyboardEvent) => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) resetScroll();
  };
  document.addEventListener('click', onClick, true);
  document.addEventListener('keydown', onKey, true);
  const onContact = (event:Event) => {
    contactOpen = Boolean((event as CustomEvent<{open:boolean}>).detail.open);
    if (contactOpen) lenis?.stop(); else lenis?.start();
  };
  document.addEventListener('contact-visibility', onContact);

  const api = {
    mount() {
      const request = ++revision;
      const operation = mounting.then(async () => {
        if (disposed || request !== revision) return;
        study?.destroy(); study = null;
        const next = document.querySelector('[data-home]') ? await mountHome(surface) : await mountMorph(surface);
        // Navigation or a motion preference can change during shader compilation.
        if (disposed || request !== revision) { next?.destroy(); return; }
        study = next;
        lenis ??= createScroll();
        if (contactOpen) lenis.stop();
        lenis.resize();
      });
      // Report this failure to the caller without poisoning future lifecycle work.
      mounting = operation.catch(() => {});
      return operation;
    },
    async unmount() {
      ++revision;
      lenis?.destroy(); lenis = undefined;
      study?.destroy(); study = null;
      surface.canvas.style.opacity = '0';
      surface.clear();
      await mounting;
    },
    dispose() {
      disposed = true; ++revision;
      study?.destroy(); study = null;
      gsap.ticker.remove(inputTick); gsap.ticker.remove(renderTick);
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('contact-visibility', onContact);
      lenis?.destroy(); surface.dispose();
    },
  };
  return api;
}
