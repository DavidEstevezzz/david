import gsap from 'gsap';
import { Flip } from 'gsap/Flip';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { SurfaceRenderer, SurfaceState } from './renderer';

gsap.registerPlugin(ScrollTrigger, Flip);

export interface MorphStudy { draw(delta: number): void; destroy(): void; finish(): void; }

export async function mountMorph(surface: SurfaceRenderer): Promise<MorphStudy | null> {
  const candidate = document.querySelector<HTMLElement>('[data-morph-page]');
  if (!candidate) return null;
  const root: HTMLElement = candidate;
  const stage = root.querySelector<HTMLElement>('[data-morph-stage]')!;
  const frame = root.querySelector<HTMLElement>('[data-morph-frame]')!;
  const panel = root.querySelector<HTMLElement>('[data-result-panel]')!;
  const content = root.querySelector<HTMLElement>('[data-panel-content]')!;
  const caption = root.querySelector<HTMLElement>('[data-stage-caption]')!;
  const steps = Array.from(root.querySelectorAll<HTMLElement>('[data-step]'));
  const media = gsap.matchMedia();
  let trigger: ScrollTrigger | undefined;
  let timeline: gsap.core.Timeline | undefined;
  let flip: gsap.core.Timeline | undefined;
  let active = false;
  let handed = false;
  let lastStep = -1;
  const state: SurfaceState = { bend: 0, flat: 0, radius: 24 };
  await surface.attach();
  if (!root.isConnected) { surface.release(); return null; }

  function returnToSurface() {
    flip?.kill();
    handed = false;
    panel.inert = true;
    gsap.set(panel, { backgroundColor: 'transparent' });
    gsap.set(content, { opacity: 0 });
    surface.canvas.style.opacity = '1';
    root.dataset.handoff = 'webgl';
  }

  function handoff() {
    // Flip measures the real DOM panel. WebGL itself is never passed to Flip.
    // The plane is already flat and aligned before either surface is exchanged.
    const before = Flip.getState(panel);
    handed = true;
    panel.inert = false;
    gsap.set(panel, { backgroundColor: 'var(--color-surface)' });
    flip = Flip.from(before, { duration: 0.24, ease: 'power2.out', prune: true });
    gsap.to(content, { opacity: 1, duration: .28, overwrite: true });
    surface.canvas.style.opacity = '0';
    root.dataset.handoff = 'html';
  }

  media.add({ reduced: '(prefers-reduced-motion: reduce)', mobile: '(max-width: 700px)', desktop: '(min-width: 701px)' }, (context) => {
    if (context.conditions?.reduced) return;
    const mobile = Boolean(context.conditions?.mobile);
    // A landscape/zoomed viewport may not fit the readable panel: keep full HTML.
    if (innerHeight < 620) return;
    root.setAttribute('data-enhanced', '');
    const startScale = mobile ? .72 : .48;
    Object.assign(state, { bend: mobile ? -.22 : -.38, flat: 0, radius: mobile ? 18 : 28 });
    gsap.set(frame, { scaleX: startScale, scaleY: mobile ? .62 : .63 });
    returnToSurface();
    active = true;

    timeline = gsap.timeline({
      scrollTrigger: {
        id: 'morph-study', trigger: stage,
        start: 'top top', end: () => `+=${innerHeight * (mobile ? 1.45 : 2.2)}`,
        pin: true, scrub: .42, anticipatePin: 1, invalidateOnRefresh: true,
      },
      onUpdate: () => {
        const progress = timeline?.progress() ?? 0;
        if (progress >= .975 && !handed) handoff();
        if (progress < .975 && handed) returnToSurface();
        const step = progress < .24 ? 0 : progress < .975 ? 1 : 2;
        if (step !== lastStep) {
          lastStep = step;
          steps.forEach((item, i) => item.toggleAttribute('data-active', i === step));
          caption.textContent = ['Desplaza para transformar', 'La superficie encuentra su forma', 'El contenido ya es tuyo'][step];
        }
      },
    });
    trigger = timeline.scrollTrigger;
    timeline
      .to(state, { bend: mobile ? .45 : .9, duration: .38, ease: 'sine.inOut' }, 0)
      .to(frame, { scaleX: 1, scaleY: 1, duration: .84, ease: 'power2.inOut' }, .06)
      .to(state, { bend: 0, radius: 24, duration: .48, ease: 'sine.inOut' }, .38)
      .to(state, { flat: 1, duration: .18, ease: 'sine.inOut' }, .68)
      .to({}, { duration: .14 }, .86);
    ScrollTrigger.refresh();
    surface.draw(frame, state, 16.7);

    return () => {
      active = false;
      flip?.kill();
      gsap.killTweensOf(content);
      trigger?.kill(true); timeline?.kill();
      gsap.set([frame, panel, content], { clearProps: 'all' });
      root.removeAttribute('data-enhanced'); root.removeAttribute('data-handoff');
      panel.inert = false;
      surface.canvas.style.opacity = '0';
      surface.clear();
      handed = false;
    };
  });

  const finish = () => {
    if (active && trigger && timeline) {
      window.scrollTo({ top: trigger.end, behavior: 'instant' });
      ScrollTrigger.update();
      trigger.getTween()?.progress(1);
      timeline.progress(1);
      if (!handed) handoff();
    }
    panel.focus({ preventScroll: true });
  };
  const onJump = (event: Event) => { event.preventDefault(); finish(); };
  const jumpers = document.querySelectorAll<HTMLAnchorElement>('[data-jump-result], .skip-link');
  jumpers.forEach(link => link.addEventListener('click', onJump));

  return {
    draw(delta) { if (active && !handed) surface.draw(frame, state, delta); },
    finish,
    destroy() {
      jumpers.forEach(link => link.removeEventListener('click', onJump));
      media.revert(); surface.release();
    },
  };
}
