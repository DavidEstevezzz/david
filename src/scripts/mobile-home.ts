const clamp = (value: number) => Math.max(0, Math.min(1, value));
const phase = (value: number, start: number, end: number) => clamp((value - start) / (end - start));
const smooth = (value: number) => value * value * (3 - 2 * value);

/** Native sticky scroll and compositor transforms. No WebGL, pin spacers or
 * perspective-projected service text on a narrow viewport. */
export function createMobileRuntime() {
  let cleanup: (() => void) | undefined;
  const unmount = async () => { cleanup?.(); cleanup = undefined; };
  return {
    async mount() {
      await unmount();
      const root = document.querySelector<HTMLElement>('[data-home]');
      if (!root || innerHeight < 500) return;
      const stage = root.querySelector<HTMLElement>('[data-story-stage]')!;
      const source = root.querySelector<HTMLElement>('[data-scene-source]')!;
      const screen = source.querySelector<HTMLElement>('[data-laptop-screen]')!;
      const hero = root.querySelector<HTMLElement>('[data-hero-copy]')!;
      const nav = stage.querySelector<HTMLElement>('.home-nav')!;
      const intro = stage.querySelector<HTMLElement>('[data-opening-copy]')!;
      const progress = stage.querySelector<HTMLElement>('[data-story-progress]')!;
      const labels = [...stage.querySelectorAll<HTMLElement>('[data-story-label]')];
      const track = document.createElement('div');
      track.className = 'mobile-story-track';
      stage.before(track); track.append(stage);
      const screenMarker = document.createComment('mobile-screen');
      screen.before(screenMarker);

      const hardware = document.createElement('div');
      hardware.className = 'mobile-laptop';
      hardware.setAttribute('aria-hidden', 'true');
      hardware.innerHTML = `<div class="mobile-laptop-unit"><div class="mobile-laptop-deck"><div class="mobile-keyboard"></div><div class="mobile-trackpad"></div></div><div class="mobile-laptop-lid"><div class="mobile-laptop-back"><span>||</span></div><div class="mobile-laptop-face"><i class="mobile-webcam"></i><div class="mobile-laptop-glass"></div></div></div></div>`;
      const keyboard = hardware.querySelector('.mobile-keyboard')!;
      const rows = [
        ['esc','1','2','3','4','5','6','7','8','9','0','⌫'],
        ['tab','Q','W','E','R','T','Y','U','I','O','P','↵'],
        ['⇧','A','S','D','F','G','H','J','K','L','Ñ','⇧'],
        ['ctrl','Z','X','C','V','B','N','M',',','.','↑','alt'],
      ];
      rows.forEach(keys => {
        const row = document.createElement('div');
        keys.forEach(label => { const key = document.createElement('span'); key.textContent = label; row.append(key); });
        keyboard.append(row);
      });
      const space = document.createElement('div'); space.className = 'mobile-spacebar'; keyboard.append(space);
      const miniature = screen.cloneNode(true) as HTMLElement;
      miniature.removeAttribute('data-laptop-screen');
      miniature.classList.add('mobile-screen-miniature');
      hardware.querySelector('.mobile-laptop-glass')!.append(miniature);
      const portal = document.createElement('div');
      portal.className = 'mobile-screen-portal';
      portal.setAttribute('aria-hidden', 'true');
      portal.append(screen);
      stage.append(hardware, portal);
      const unit = hardware.querySelector<HTMLElement>('.mobile-laptop-unit')!;
      const lid = hardware.querySelector<HTMLElement>('.mobile-laptop-lid')!;
      const deck = hardware.querySelector<HTMLElement>('.mobile-laptop-deck')!;
      const face = hardware.querySelector<HTMLElement>('.mobile-laptop-face')!;
      root.dataset.mobileStory = '';
      let frame = 0, active = true, previous = -1;
      let start = 0, travel = 1, viewport = 0, deviceWidth = 0, viewportWidth = 0;
      const measure = () => {
        // svh stays stable as mobile browser chrome collapses during a swipe.
        start = track.getBoundingClientRect().top + scrollY;
        viewport = stage.clientHeight;
        travel = track.offsetHeight - viewport;
        deviceWidth = hardware.clientWidth;
        viewportWidth = document.documentElement.clientWidth;
        previous = -1;
      };
      const render = () => {
        frame = 0;
        if (!active || document.hidden) return;
        const p = clamp((scrollY - start) / Math.max(1, travel));
        if (Math.abs(p - previous) < .00001) return;
        previous = p;
        const open = smooth(phase(p, .015, .4));
        const zoom = smooth(phase(p, .43, .8));
        const transfer = smooth(phase(p, .6, .83));
        const heroOpacity = 1 - smooth(phase(p, .02, .21));
        hero.style.opacity = String(heroOpacity);
        hero.style.visibility = heroOpacity ? 'visible' : 'hidden';
        nav.style.opacity = String(1 - smooth(phase(p, .16, .29)));
        nav.style.visibility = p >= .29 ? 'hidden' : 'visible';
        const introOpacity = smooth(phase(p, .2, .29)) * (1 - smooth(phase(p, .46, .56)));
        intro.style.opacity = String(introOpacity);
        intro.style.visibility = introOpacity ? 'visible' : 'hidden';
        lid.style.transform = `rotateX(${-105 * (1 - open)}deg)`;
        // Explicit culling also prevents WebKit compositing a screen through its lid.
        face.style.visibility = open > .15 ? 'visible' : 'hidden';
        const scale = 1 + zoom * (viewportWidth / Math.max(1, deviceWidth - 24) - 1);
        unit.style.transform = `translate3d(0, ${-viewport * .09 * open - viewport * .13 * zoom}px, 0) scale(${scale})`;
        deck.style.opacity = String(1 - zoom);
        hardware.style.opacity = String(1 - transfer);
        hardware.style.visibility = transfer === 1 ? 'hidden' : 'visible';
        portal.style.opacity = String(transfer);
        portal.style.visibility = transfer > 0 ? 'visible' : 'hidden';
        portal.style.transform = `translate3d(0, ${18 * (1 - transfer)}px, 0)`;
        progress.style.transform = `scaleX(${p})`;
        labels.forEach((label, index) => label.toggleAttribute('data-active', index === (p < .4 ? 0 : p < .8 ? 1 : 2)));
        root.dataset.mobilePhase = String(p < .4 ? 0 : p < .8 ? 1 : 2);
      };
      const requestFrame = () => { if (!frame && active && !document.hidden) frame = requestAnimationFrame(render); };
      const resize = () => { measure(); requestFrame(); };
      const visibility = () => { if (!document.hidden) { previous = -1; requestFrame(); } };
      measure(); render();
      addEventListener('scroll', requestFrame, { passive: true });
      addEventListener('resize', resize, { passive: true });
      document.addEventListener('visibilitychange', visibility);
      cleanup = () => {
        active = false; cancelAnimationFrame(frame);
        removeEventListener('scroll', requestFrame); removeEventListener('resize', resize);
        document.removeEventListener('visibilitychange', visibility);
        track.before(stage); track.remove(); screenMarker.replaceWith(screen);
        hardware.remove(); portal.remove();
        hero.style.removeProperty('opacity'); hero.style.removeProperty('visibility');
        nav.style.removeProperty('opacity'); nav.style.removeProperty('visibility');
        intro.style.removeProperty('opacity'); intro.style.removeProperty('visibility');
        progress.style.removeProperty('transform');
        delete root.dataset.mobileStory; delete root.dataset.mobilePhase;
      };
    },
    unmount,
    dispose() { void unmount(); },
  };
}
