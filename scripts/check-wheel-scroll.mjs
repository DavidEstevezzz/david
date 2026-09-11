// Run against npm run preview; PLAYWRIGHT_MODULE may point to a bundled install.
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4321/');
  await page.waitForFunction(() => document.documentElement.dataset.runtime === 'ready');
  await page.mouse.move(700, 450);
  // Sample actual wheel input frame by frame, including its settling tail.
  await page.evaluate(() => {
    window.wheelSamples = [];
    const start = performance.now();
    const sample = () => {
      window.wheelSamples.push(scrollY);
      if (performance.now() - start < 1400) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
  await page.mouse.wheel(0, 120);
  await page.waitForTimeout(1500);
  const samples = await page.evaluate(() => window.wheelSamples);
  const intermediate = new Set(samples.filter(y => y > 0 && y < 119));
  assert.ok(intermediate.size >= 6, `Wheel must interpolate, got ${intermediate.size} positions`);
  assert.ok(Math.abs(samples.at(-1) - 120) <= 1, 'Wheel must settle at its requested distance');
  assert.ok(samples.every((y, i) => !i || y >= samples[i - 1]), 'No backwards jitter');

  await page.mouse.wheel(0, 200);
  await page.waitForTimeout(50);
  await page.locator('.home-nav a[href="#proyectos"]').click();
  await page.waitForTimeout(200);
  const jumped = await page.evaluate(() => scrollY);
  await page.waitForTimeout(1000);
  assert.ok(Math.abs(await page.evaluate(() => scrollY) - jumped) <= 1, 'Anchor must cancel wheel momentum');
  assert.ok(await page.locator('#proyectos').evaluate(el => Math.abs(el.getBoundingClientRect().top) < 2));

  await page.locator('[data-motion-toggle]').click();
  await page.waitForFunction(() => document.documentElement.dataset.runtime === 'html');
  assert.equal(await page.evaluate(() => document.documentElement.classList.contains('lenis')), false);
  await page.locator('[data-motion-toggle]').click();
  await page.waitForFunction(() => document.documentElement.dataset.runtime === 'ready');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => document.documentElement.dataset.runtime === 'html');
  assert.equal(await page.evaluate(() => document.documentElement.classList.contains('lenis')), false);
  assert.deepEqual(errors, []);
  console.log(`Desktop: ${intermediate.size} intermediate wheel positions; anchor, static toggle and reduced motion passed.`);
  await page.close();

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await mobile.goto('http://127.0.0.1:4321/');
  await mobile.waitForFunction(() => document.documentElement.dataset.runtime === 'ready');
  assert.equal(await mobile.locator('canvas').getAttribute('data-pixel-ratio'), '3');
  await mobile.evaluate(() => scrollTo(0, 120));
  await mobile.waitForTimeout(100);
  assert.equal(await mobile.evaluate(() => scrollY), 120);
  assert.equal(await mobile.evaluate(() => document.documentElement.classList.contains('lenis-smooth')), false);
  console.log('Mobile: DPR 3 and native scrolling passed.');
  await mobile.close();
} finally {
  await browser.close();
}
