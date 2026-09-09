import '../styles/home-mobile.css';
type VisualRuntime = ReturnType<typeof import('./visual/runtime').createRuntime> | ReturnType<typeof import('./mobile-home').createMobileRuntime>;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const mobileViewport = matchMedia('(max-width: 820px)');
const shortViewport = matchMedia('(max-height: 499px)');
const canvas = document.querySelector<HTMLCanvasElement>('#visual-canvas')!;
const params = new URL(location.href).searchParams;
// Phase 2 flag: ?render=webgl runs the real story on a phone, ?render=html disables motion.
const renderMode = params.get('render');
let runtime: VisualRuntime | undefined;
let runtimeKind: 'mobile' | 'webgl' | undefined;
let disabled = renderMode === 'html';
let starting: Promise<void> | undefined;
let pendingFetch: AbortController | undefined;
let navigationId = 0;
let activationId = 0;
let navigating = false;
let disposed = false;
const listeners = new AbortController();
const options = { signal: listeners.signal };

function updateButton() {
  const button = document.querySelector<HTMLButtonElement>('[data-motion-toggle]');
  if (!button) return;
  button.hidden = false;
  button.textContent = runtime && !disabled && !reduceMotion.matches ? 'Usar vista estática' : 'Activar movimiento';
  button.disabled = reduceMotion.matches || canvas.dataset.context === 'lost';
  if (reduceMotion.matches) button.textContent = 'Movimiento reducido';
  else if (canvas.dataset.context === 'lost') button.textContent = 'Vista estática';
}

async function start() {
  if (disposed || disabled || reduceMotion.matches || canvas.dataset.context === 'lost') { updateButton(); return; }
  if (starting) return starting;
  // Case pages have no animated scene. Avoid creating an idle GPU renderer.
  const isHome = Boolean(document.querySelector('[data-home]'));
  if (!isHome && !document.querySelector('[data-morph-page]')) {
    runtime?.dispose(); runtime = undefined; runtimeKind = undefined;
    canvas.style.display = 'none'; updateButton(); return;
  }
  const activation = ++activationId;
  starting = (async () => {
    try {
      const kind = isHome && mobileViewport.matches && renderMode !== 'webgl' ? 'mobile' : 'webgl';
      document.documentElement.dataset.runtimeKind = kind;
      canvas.style.display = kind === 'mobile' ? 'none' : 'block';
      const createRuntime = kind === 'mobile'
        ? (await import('./mobile-home')).createMobileRuntime
        : (await import('./visual/runtime')).createRuntime;
      if (disposed || disabled || reduceMotion.matches || activation !== activationId) return;
      if (runtimeKind !== kind) { runtime?.dispose(); runtime = undefined; }
      runtime ??= createRuntime();
      runtimeKind = kind;
      await runtime.mount();
      if (disposed || disabled || reduceMotion.matches || activation !== activationId) return;
      document.documentElement.dataset.runtime = 'ready';
      performance.mark('morph-ready');
    } catch (error) {
      runtime?.dispose(); runtime = undefined;
      document.documentElement.dataset.runtime = 'html';
      disabled = true;
      console.warn('La página conserva su versión HTML.', error);
    } finally { starting = undefined; updateButton(); }
  })();
  return starting;
}

async function stop() {
  disabled = true; ++activationId;
  const unmounting = runtime?.unmount();
  await starting;
  await unmounting;
  document.documentElement.dataset.runtime = 'html';
  updateButton();
}

function onMotionChange() {
  if (reduceMotion.matches) {
    ++activationId;
    void runtime?.unmount();
    document.documentElement.dataset.runtime = 'html';
    updateButton();
  } else if (!disabled) {
    // A previous activation may still be compiling when the preference changes.
    void (async () => { await starting; if (!disabled && !navigating) await start(); })();
  }
}
reduceMotion.addEventListener('change', onMotionChange, options);
function onViewportModeChange() {
  if (disabled || reduceMotion.matches || navigating || disposed) return;
  void (async () => {
    const activation = ++activationId;
    await starting;
    if (activation !== activationId) return;
    runtime?.dispose(); runtime = undefined; runtimeKind = undefined;
    document.documentElement.dataset.runtime = 'html';
    if (!disabled && !navigating && !disposed) await start();
  })();
}
mobileViewport.addEventListener('change', onViewportModeChange, options);
shortViewport.addEventListener('change', onViewportModeChange, options);
canvas.addEventListener('surface-unavailable', () => { void stop(); }, options);
canvas.addEventListener('surface-error', () => { void stop(); }, options);
canvas.addEventListener('surface-restored', () => {
  // Do not unexpectedly restart movement while the reader is using the fallback.
  document.documentElement.dataset.runtime = 'html'; updateButton();
}, options);

function rememberScroll() {
  history.replaceState({ ...history.state, scroll: scrollY }, '', location.href);
}

async function navigate(url: URL, pop = false, restore = 0) {
  const id = ++navigationId;
  if (!pop && !navigating) rememberScroll();
  navigating = true;
  clearTimeout(historyTimer); historyTimer = undefined;
  pendingFetch?.abort(); pendingFetch = new AbortController();
  try {
    const response = await fetch(url, { signal: pendingFetch.signal, headers: { Accept: 'text/html' } });
    if (!response.ok) throw new Error(`Navigation ${response.status}`);
    const html = new DOMParser().parseFromString(await response.text(), 'text/html');
    const next = html.querySelector<HTMLElement>('#page[data-app-page]');
    const current = document.querySelector<HTMLElement>('#page')!;
    if (!next || response.url && new URL(response.url).origin !== location.origin) throw new Error('Unsupported page');
    if (id !== navigationId) return;
    ++activationId;
    const unmounting = runtime?.unmount();
    await starting;
    await unmounting;
    if (id !== navigationId) return;
    if (!pop) history.pushState({ scroll: 0 }, '', url);
    // Only #page is replaced. The body, shared styles, script and canvas stay put.
    current.replaceWith(next);
    document.title = html.title;
    const description = html.querySelector('meta[name="description"]')?.getAttribute('content') ?? '';
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (!disabled && !reduceMotion.matches) await start();
    if (id !== navigationId) return;
    window.scrollTo({ top: restore, behavior: 'instant' });
    if (url.hash) document.getElementById(decodeURIComponent(url.hash.slice(1)))?.scrollIntoView();
    next.focus({ preventScroll: true });
    document.querySelector('#route-announcement')!.textContent = html.title;
    updateButton();
  } catch (error) {
    if (id !== navigationId || (error instanceof DOMException && error.name === 'AbortError')) return;
    location.assign(url.href);
  } finally {
    if (id === navigationId) { navigating = false; pendingFetch = undefined; }
  }
}

document.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target : null;
  if (target?.closest('[data-motion-toggle]')) {
    if (runtime && !disabled) void stop();
    else {
      disabled = false;
      scrollTo({ top: 0, behavior: 'instant' });
      void (async () => { await starting; if (!disabled && !navigating) await start(); })();
    }
    return;
  }
  const link = target?.closest<HTMLAnchorElement>('a[data-nav]');
  if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target || link.download) return;
  const url = new URL(link.href);
  if (url.origin !== location.origin) return;
  event.preventDefault(); void navigate(url);
}, options);

addEventListener('popstate', (event) => { void navigate(new URL(location.href), true, event.state?.scroll ?? 0); }, options);
// Keep scroll snapshots outside the renderer and throttled to avoid history churn.
let historyTimer: ReturnType<typeof setTimeout> | undefined;
addEventListener('scroll', () => {
  if (historyTimer || navigating) return;
  historyTimer = setTimeout(() => { historyTimer = undefined; if (!navigating) rememberScroll(); }, 180);
}, { ...options, passive: true });

let idleHandle: number | undefined;
let fallbackTimer: ReturnType<typeof setTimeout> | undefined;
let queued = false;
const paintObserver = typeof PerformanceObserver !== 'undefined' ? new PerformanceObserver((list) => {
  if (list.getEntries().length) { performance.mark('morph-first-lcp-observed'); queueVisual(); }
}) : undefined;

function queueVisual() {
  if (queued || disposed) return;
  queued = true; paintObserver?.disconnect();
  void document.fonts.ready.then(() => {
    if (disposed) return;
    const load = () => {
      if (disposed || navigating) return;
      // Avoid turning a static document into a pinned one after the user moved on.
      if (scrollY > 80) { disabled = true; updateButton(); return; }
      void start();
    };
    if ('requestIdleCallback' in window) idleHandle = window.requestIdleCallback(load, { timeout: 1800 });
    else fallbackTimer = setTimeout(load, 100);
  });
}
try { paintObserver?.observe({ type: 'largest-contentful-paint', buffered: true }); } catch { /* Unsupported: use the load fallback. */ }
if (document.readyState === 'complete') fallbackTimer = setTimeout(queueVisual, 150);
else addEventListener('load', () => { fallbackTimer = setTimeout(queueVisual, 150); }, { ...options, once: true });
// iOS Safari has no remote console from Windows: ?probe=1 paints the numbers instead.
if (params.get('probe') === '1') void import('./probe').then(module => module.mountProbe());
updateButton();
history.scrollRestoration = 'manual';
rememberScroll();

if (import.meta.hot) import.meta.hot.dispose(() => {
  disposed = true; ++activationId; ++navigationId;
  listeners.abort(); pendingFetch?.abort(); paintObserver?.disconnect();
  if (idleHandle !== undefined) cancelIdleCallback(idleHandle);
  clearTimeout(fallbackTimer); clearTimeout(historyTimer);
  runtime?.dispose();
});
