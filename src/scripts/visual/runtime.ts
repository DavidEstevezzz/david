import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { SurfaceRenderer } from './renderer';
import { mountMorph, type MorphStudy } from './morph';
import { mountHome } from './home';

export function createRuntime() {
  const canvas = document.querySelector<HTMLCanvasElement>('#visual-canvas')!;
  const surface = new SurfaceRenderer(canvas);
  // Native wheel/touch/keyboard/scrollbar. Scrub smooths the artwork, not input.
  const lenis = new Lenis({ autoRaf: false, smoothWheel: false, syncTouch: false });
  let study: MorphStudy | null = null;
  let mounting: Promise<void> = Promise.resolve();
  let disposed = false;
  let revision = 0;
  const inputTick = (time: number) => { lenis.raf(time * 1000); ScrollTrigger.update(); };
  const renderTick = (_time: number, delta: number) => { study?.draw(delta); };
  gsap.ticker.lagSmoothing(0);
  // Input before GSAP's root timeline; rendering after its DOM/uniform updates.
  gsap.ticker.add(inputTick, false, true);
  gsap.ticker.add(renderTick);

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
        lenis.resize();
      });
      // Report this failure to the caller without poisoning future lifecycle work.
      mounting = operation.catch(() => {});
      return operation;
    },
    async unmount() {
      ++revision;
      study?.destroy(); study = null;
      surface.canvas.style.opacity = '0';
      surface.clear();
      await mounting;
      if (!disposed) lenis.resize();
    },
    dispose() {
      disposed = true; ++revision;
      study?.destroy(); study = null;
      gsap.ticker.remove(inputTick); gsap.ticker.remove(renderTick);
      lenis.destroy(); surface.dispose();
    },
  };
  return api;
}
