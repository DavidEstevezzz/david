import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
await mkdir('.astro/project-layouts', { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  for (const width of [390, 768, 1440, 1920]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, isMobile: width < 821, hasTouch: width < 821 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const project of ['bomberos', 'taller-ecu', 'wicontrol', 'black-tides', 'tagadona']) {
      await page.goto(`http://127.0.0.1:4321/proyectos/${project}/`);
      await page.evaluate(() => document.fonts.ready);
      if (['bomberos', 'wicontrol'].includes(project)) {
        const img = page.locator('.case-hero img');
        await img.scrollIntoViewIfNeeded();
        await img.evaluate(el => el.decode());
        const rect = await img.evaluate(el => ({ w: el.getBoundingClientRect().width, h: el.getBoundingClientRect().height, ratio: el.naturalHeight / el.naturalWidth }));
        assert.ok(rect.w <= width * .75 + 1, 'Browser design width');
        assert.ok(Math.abs(rect.h - rect.w * rect.ratio) < 1, 'Full image without crop');
      } else {
        const steps = page.locator('.story-step');
        const heights = [];
        for (let i = 0; i < await steps.count(); i++) {
          await steps.nth(i).evaluate(el => el.scrollIntoView({ block: 'center' }));
          await page.waitForTimeout(800);
          const active = page.locator('.story-shot.is-active');
          assert.equal(await active.getAttribute('data-step'), String(i));
          await active.locator('img').evaluate(el => el.decode());
          const geometry = await active.evaluate(el => {
            const img = el.querySelector('img');
            const image = img.getBoundingClientRect();
            const frame = el.closest('.story-shots__window').getBoundingClientRect();
            return { gap: frame.bottom - image.bottom, top: image.top - frame.top, h: frame.height, ratioError: image.height - image.width * img.naturalHeight / img.naturalWidth };
          });
          assert.ok(Math.abs(geometry.gap) < 1.5, `${project}/${width}/${i}: empty space under image: ${geometry.gap}`);
          assert.ok(Math.abs(geometry.ratioError) < 1.5, 'Image retains its proportions');
          assert.ok(Math.abs(geometry.top - 40) < 1, 'Only the browser bar sits above the image');
          heights.push(geometry.h);
          assert.equal(await page.locator('.story-shots__foot').isVisible(), width > 900);
          if (project === 'tagadona' && [390, 1440].includes(width)) await page.screenshot({ path: `.astro/project-layouts/${project}-${width}-${i}.png` });
        }
        if (project === 'tagadona') assert.ok(heights[1] > heights[0] && heights[1] > heights[2], 'Frame follows the taller catalogue');
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${project}: horizontal overflow`);
      if ([390, 1440].includes(width)) await page.screenshot({ path: `.astro/project-layouts/${project}-${width}.png` });
      console.log(`${project} / ${width}: OK`);
    }
    assert.deepEqual(errors, []);
    await page.close();
  }
} finally { await browser.close(); }
