/** On-screen performance probe, loaded only for ?probe=1.
 *
 * iOS Safari cannot be inspected from Windows, so the frame times are painted
 * into the page instead of logged. Scroll the story by hand and read the panel:
 * the sample window is the last ~15 seconds. Tap the panel to restart it. */
export function mountProbe() {
  const style = document.createElement('style');
  style.textContent = '.probe{position:fixed;z-index:9999;left:8px;bottom:8px;padding:8px 10px;border-radius:6px;background:#0b120eee;color:#dfe7d8;font:11px/1.5 ui-monospace,SFMono-Regular,monospace;white-space:pre;letter-spacing:.02em;touch-action:manipulation}';
  document.head.append(style);
  const box = document.createElement('div');
  box.className = 'probe';
  box.setAttribute('role', 'status');
  document.body.append(box);

  const started = performance.now();
  let frames: number[] = [];
  let ready = 0;
  let last = started;
  let painted = 0;

  const paint = () => {
    const head = `${document.documentElement.dataset.runtimeKind ?? '—'} · ${document.documentElement.dataset.runtime ?? '—'} · ${ready ? `${ready}ms` : '…'}`;
    if (!frames.length) { box.textContent = `${head}\nesperando fotogramas…`; return; }
    const sorted = [...frames].sort((a, b) => a - b);
    const q = (at: number) => sorted[Math.round((sorted.length - 1) * at)];
    const slow = frames.reduce((count, ms) => count + (ms > 33 ? 1 : 0), 0);
    box.textContent = [
      head,
      `${(1000 / q(.5)).toFixed(0)} fps · med ${q(.5).toFixed(1)} · p90 ${q(.9).toFixed(1)}`,
      `peor ${q(1).toFixed(0)}ms · >33ms ${Math.round(100 * slow / frames.length)}%`,
      `y ${Math.round(scrollY)} · ${frames.length} muestras`,
    ].join('\n');
  };

  const loop = (now: number) => {
    const delta = now - last;
    last = now;
    if (!ready) {
      // Sampling starts once the scene is mounted: its cost is the `ready` figure,
      // and mixing it into the window would hide what scrolling actually costs.
      if (document.documentElement.dataset.runtime === 'ready') ready = Math.round(now - started);
    } else if (delta < 1000) {
      // Anything longer is a backgrounded tab, not a dropped frame.
      frames.push(delta);
      // Roughly the last 15 seconds at 60Hz.
      if (frames.length > 900) frames.shift();
    }
    if (now - painted > 250) { painted = now; paint(); }
    requestAnimationFrame(loop);
  };

  paint();
  requestAnimationFrame(loop);
  box.addEventListener('pointerdown', () => { frames = []; painted = 0; });
}
