import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  for (const [width, height] of [[360, 640], [390, 844], [768, 1024]]) {
    const page = await browser.newPage({ viewport: { width, height }, isMobile: true, hasTouch: true });
    await page.goto('http://127.0.0.1:4321/');
    await page.waitForFunction(() => document.documentElement.dataset.runtime === 'ready');
    const travel = await page.locator('[data-story-stage]').evaluate(e => e.clientHeight * 3.2);
    const boundary = Math.ceil(travel * .36);
    const read = async y => {
      await page.evaluate(y => scrollTo(0, y), y);
      await page.waitForTimeout(70);
      return page.locator('[data-laptop-screen]').evaluate(e => {
        const h = e.querySelector('h2');
        const r = h.getBoundingClientRect();
        return { rect: [r.x, r.y, r.width, r.height], flat: e.classList.contains('display--entry'), count: document.querySelectorAll('[data-laptop-screen]').length };
      });
    };
    const before = await read(boundary - 1), after = await read(boundary);
    assert.equal(before.flat, false); assert.equal(after.flat, true);
    const drift = Math.max(...after.rect.map((n, i) => Math.abs(n - before.rect[i])));
    assert.ok(drift < 1, `Handoff moves heading ${drift}px`);
    await read(travel * .51);
    const reverse = await read(boundary - 1);
    assert.ok(reverse.rect.every((n, i) => Math.abs(n - before.rect[i]) < 1), `Reverse handoff: ${JSON.stringify(reverse)}`);
    for (const p of [.37, .4, .44, .48, .51]) {
      const sample = await read(travel * p);
      assert.equal(sample.count, 1);
      const fits = await page.locator('[data-laptop-screen] h2').evaluate(e => e.scrollWidth <= e.clientWidth);
      assert.ok(fits, `Heading overflows at ${width}/${p}`);
    }
    await page.screenshot({ path: `.astro/screen-entry-${width}.png` });
    console.log(JSON.stringify({ width, height, handoffDrift: drift, reverse: 'ok', heading: 'fits' }));
    await page.close();
  }
} finally { await browser.close(); }
