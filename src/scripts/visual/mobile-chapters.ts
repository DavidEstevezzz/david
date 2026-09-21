const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const phase = (p: number, a: number, b: number) => {
  const t = Math.max(0, Math.min(1, (p - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function mobileCardRects(width: number, height: number) {
  const compact = height <= 720;
  const top = compact ? 64 : 74, side = compact ? 12 : 16;
  const bottom = compact ? 46 : 34, gap = compact ? 8 : 12;
  const h = (height - top - bottom - gap * 2) / 3;
  return Array.from({ length: 3 }, (_, i) => ({ x: side, y: top + i * (h + gap), w: width - side * 2, h }));
}

/** Continue the real screen's content in 2D after the perspective handoff. */
export function createMobileChapters(screen: HTMLElement, host: HTMLElement) {
  const body = screen.querySelector<HTMLElement>('.display-body')!;
  const services = screen.querySelector<HTMLElement>('.display-services')!;
  const items = [...services.children] as HTMLElement[];
  const details = ['Gestión y herramientas adaptadas a tu equipo.', 'Webs, tiendas y experiencias digitales.', 'Servicios conectados. Menos tareas manuales.'];
  let rectangles: { x: number; y: number; w: number; h: number }[] = [];
  let restore: (() => void) | undefined;
  let boxes: { x: number; y: number; w: number; h: number }[] = [];
  let shift = 0, contentEnd = 0, measured = '';
  const reset = () => { restore?.(); restore = undefined; measured = ''; };
  function spread(p: number, width: number, height: number) {
    if (p <= .49 || p >= .85) { reset(); return; }
    const key = `${width}/${height}`;
    if (measured !== key) reset();
    if (!restore) {
      const scale = width / 1100;
      const origin = screen.getBoundingClientRect();
      boxes = items.map(e => { const r = e.getBoundingClientRect(); return { x: (r.x-origin.x)/scale, y: (r.y-origin.y)/scale, w: r.width/scale, h: r.height/scale }; });
      const eyebrow = body.querySelector<HTMLElement>('.display-eyebrow')!;
      const toolbar = screen.querySelector<HTMLElement>('.display-toolbar')!;
      shift = (eyebrow.getBoundingClientRect().top - toolbar.getBoundingClientRect().bottom) / scale - 48;
      contentEnd = (body.querySelector('p')!.getBoundingClientRect().bottom - origin.top) / scale - shift;
      const markers = items.map(e => { const marker = document.createComment('screen-service'); e.before(marker); return marker; });
      const oldBody = body.getAttribute('style'), oldServices = services.getAttribute('style');
      const chrome = [...screen.querySelectorAll<HTMLElement>('.display-toolbar, .display-footer')];
      const chromeStyles = chrome.map(e => e.getAttribute('style'));
      services.style.height = `${services.offsetHeight}px`;
      services.style.flexShrink = '0';
      const old = items.map(e => e.getAttribute('style'));
      items.forEach((e, i) => {
        screen.append(e); e.classList.add('screen-service-row');
        const detail = document.createElement('p'); detail.className = 'service-detail'; detail.textContent = details[i]; e.append(detail);
      });
      restore = () => {
        chrome.forEach((e, i) => { if (chromeStyles[i] === null) e.removeAttribute('style'); else e.setAttribute('style', chromeStyles[i]!); });
        items.forEach((e, i) => { markers[i].replaceWith(e); e.classList.remove('screen-service-row'); e.querySelector('.service-detail')?.remove(); if (old[i] === null) e.removeAttribute('style'); else e.setAttribute('style', old[i]!); });
        if (oldBody === null) body.removeAttribute('style'); else body.setAttribute('style', oldBody);
        if (oldServices === null) services.removeAttribute('style'); else services.setAttribute('style', oldServices);
      };
      measured = key;
    }
    const t = phase(p, .50, .64), h = height * 1100 / width;
    const rowStart = Math.max(h * .40, contentEnd + 60);
    const gap = h * .015;
    const rowHeight = (h * .915 - rowStart - gap * 2) / 3;
    const grow = phase(p, .66, .81), fade = phase(p, .67, .75);
    body.style.transform = `translateY(${-shift * t - grow * 140}px)`;
    body.style.opacity = String(1 - fade);
    screen.querySelectorAll<HTMLElement>('.display-toolbar, .display-footer').forEach(e => e.style.opacity = String(1 - fade));
    const scale = width / 1100;
    const targets = mobileCardRects(width, height);
    rectangles = [];
    items.forEach((e, i) => {
      const b = boxes[i];
      const target = targets[i];
      const x = mix(mix(b.x, 70, t), target.x / scale, grow);
      const y = mix(mix(b.y, rowStart + i * (rowHeight + gap), t), target.y / scale, grow);
      const w = mix(mix(b.w, 960, t), target.w / scale, grow);
      const rh = mix(mix(b.h, rowHeight, t), target.h / scale, grow);
      rectangles.push({ x: x * scale, y: y * scale, w: w * scale, h: rh * scale });
      e.style.left = `${x}px`; e.style.top = `${y}px`;
      e.style.width = `${w}px`; e.style.height = `${rh}px`;
      e.style.borderRadius = `${mix(24 * t, 18 / scale, grow)}px`;
      e.style.setProperty('--handoff', String(phase(p, .70, .72)));
      e.style.padding = `${mix(18, Math.min(28, h * .014), t)}px ${mix(i ? 24 : 0, 36, t)}px`;
      e.style.setProperty('--spread', String(t));
      e.style.setProperty('--row-font', `${mix(36, Math.min(50, h * .022), t)}px`);
      e.style.setProperty('--detail-font', `${Math.min(32, h * .016)}px`);
    });
  }
  const rows = document.createElement('div'); rows.className = 'mobile-service-cards'; rows.style.visibility = 'hidden'; host.append(rows);
  return { spread, rows, reset, get rectangles() { return rectangles; }, dispose() { reset(); rows.remove(); } };
}
