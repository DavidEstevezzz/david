// Run against npm run preview. PLAYWRIGHT_MODULE can point at a bundled install.
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  for (const [width, height, query] of [[390, 844, ''], [390, 844, '?render=webgl'], [768, 1024, '?render=webgl'], [1440, 900, '?render=webgl']]) {
    const page = await browser.newPage({ viewport: { width, height }, isMobile: width < 821, hasTouch: width < 821 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:4321/${query}`);
    await page.waitForFunction(() => document.documentElement.dataset.runtime === 'ready');
    const geometry = await page.evaluate(() => {
      const stage = document.querySelector('[data-story-stage]');
      const track = stage.parentElement;
      return { start: track.getBoundingClientRect().top + scrollY, travel: track.offsetHeight - stage.offsetHeight, storyTravel: Number(track.dataset.storyTravel), exitStart: Number(track.dataset.exitStart), exitTravel: Number(track.dataset.exitTravel), position: getComputedStyle(stage).position };
    });
    if (width < 821) assert.equal(geometry.position, 'sticky');
    const samples = [];
    for (const progress of [0, .01, .1, .25, .4, .5, .65, .8, .94, 1, .5, .1, 0]) {
      const distance = width < 821 ? (progress <= .89 ? geometry.storyTravel * progress : geometry.exitStart + geometry.exitTravel * (progress - .89) / .11) : geometry.travel * progress;
      await page.evaluate(y => scrollTo(0, y), geometry.start + distance);
      await page.waitForTimeout(width < 821 ? 80 : 600);
      const sample = await page.evaluate(() => ({
        y: scrollY,
        progress: Number(getComputedStyle(document.querySelector('[data-story-progress]')).transform.split('(')[1].split(',')[0]),
        stageTop: document.querySelector('[data-story-stage]').getBoundingClientRect().top,
        overflow: document.documentElement.scrollWidth > innerWidth,
        canvas: document.querySelector('canvas').style.transform,
      }));
      assert.ok(!sample.overflow, `Overflow at ${width} / ${progress}`);
      if (width < 821) {
        assert.ok(Math.abs(sample.progress - progress) < .003, `Scroll response: ${JSON.stringify(sample)}`);
        assert.ok(Math.abs(sample.stageTop) < 2, `Sticky drift: ${JSON.stringify(sample)}`);
      }
      samples.push(sample);
    }
    if (width < 821) assert.equal(new Set(samples.map(sample => sample.canvas)).size, 1, 'Canvas must stay anchored');
    if (width < 821) {
      await page.evaluate(y => scrollTo(0, y), geometry.start + geometry.travel + 100);
      await page.waitForTimeout(80);
      const contentTop = await page.locator('#proyectos').evaluate(element => element.getBoundingClientRect().top);
      assert.ok(contentTop < height, 'Following content must enter the viewport at the end');
    }
    await page.getByRole('button', { name: 'Usar vista estática' }).click();
    await page.waitForFunction(() => document.documentElement.dataset.runtime === 'html');
    assert.equal(await page.locator('.native-story-track, .mobile-story-track, .pin-spacer').count(), 0);
    assert.equal(await page.locator('[data-laptop-screen]').count(), 1);
    await page.getByRole('button', { name: 'Activar movimiento' }).click();
    await page.waitForFunction(() => document.documentElement.dataset.runtime === 'ready');
    if (width < 821) {
      await page.setViewportSize({ width: 844, height: 390 });
      await page.waitForTimeout(500);
      assert.equal(await page.locator('.native-story-track, .mobile-story-track').count(), 0);
      await page.setViewportSize({ width, height });
      await page.waitForTimeout(500);
      assert.equal(await page.locator('.native-story-track, .mobile-story-track').count(), 1);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.waitForFunction(() => document.documentElement.dataset.runtime === 'html');
      assert.equal(await page.locator('.native-story-track, .mobile-story-track, .pin-spacer').count(), 0);
    }
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ width, height, query, geometry, samples: samples.length, lifecycle: 'ok' }));
    await page.close();
  }
} finally { await browser.close(); }
