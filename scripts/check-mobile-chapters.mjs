import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  for (const [width, height] of [[360, 640], [390, 844], [412, 915], [768, 1024]]) {
    const page = await browser.newPage({ viewport: { width, height }, isMobile: true, hasTouch: true });
    await page.goto('http://127.0.0.1:4321/');
    await page.waitForFunction(() => document.documentElement.dataset.runtime === 'ready');
    const go = async p => {
      const distance = p <= .89 ? height * 3.2 * p : height * 3.2 * .89 + height * (p - .89) / .11;
      await page.evaluate(y => scrollTo(0, y), distance);
      await page.waitForTimeout(80);
    };
    for (const progress of [.70, .75, .79, .805, .82, .805, .75]) {
      await go(progress);
      const geometry = await page.evaluate(() => {
        const rect = e => { const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; };
        return { small: [...document.querySelectorAll('.screen-service-row')].map(rect), large: [...document.querySelectorAll('.mobile-service-cards .project-surface')].map(rect) };
      });
      assert.equal(geometry.small.length, 3);
      assert.equal(geometry.large.length, 3);
      geometry.small.forEach((row, i) => row.forEach((n, j) => assert.ok(Math.abs(n - geometry.large[i][j]) < 1, `Surface mismatch at ${width}/${progress}`)));
    }
    for (const p of [.65, .84, .65, .84]) {
      await go(p);
      const selector = p === .65 ? '.screen-service-row' : '.mobile-service-cards .project-surface';
      const rows = await page.locator(selector).evaluateAll(elements => elements.map(e => {
        const r = e.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, height: e.clientHeight, contentHeight: e.scrollHeight };
      }));
      assert.equal(rows.length, 3);
      if (p === .65) {
        const bottom = await page.locator('.display-body > p').evaluate(e => e.getBoundingClientRect().bottom);
        assert.ok(bottom < rows[0].top, 'Services overlap the introduction');
      }
      rows.forEach((r, i) => {
        assert.ok(r.top >= 0 && r.bottom <= height, `Outside viewport: ${JSON.stringify(r)}`);
        assert.ok(r.contentHeight <= r.height + 1, `Clipped content: ${width}/${p}: ${JSON.stringify(r)}`);
        if (i) assert.ok(r.top >= rows[i - 1].bottom, 'Rows overlap');
      });
    }
    let stable;
    for (const p of [.81, .84, .86, .89]) {
      await go(p);
      const sizes = await page.locator('.mobile-service-cards .project-surface').evaluateAll(elements => elements.map(e => {
        const r = e.getBoundingClientRect(); return [r.top, r.height, r.bottom];
      }));
      if (stable) sizes.forEach((r, i) => r.forEach((n, j) => assert.ok(Math.abs(n-stable[i][j]) < 1, 'Cards grow after the handoff')));
      stable = sizes;
    }
    for (const p of [.9, .94, .98, .999, .94]) {
      await go(p);
      const gap = await page.evaluate(() => document.querySelector('#proyectos').getBoundingClientRect().top - document.querySelector('.mobile-service-cards').getBoundingClientRect().bottom);
      assert.ok(Math.abs(gap) < 2, `Gap/overlap before projects: ${gap}`);
    }
    await go(.84);
    for (const p of [.72, .75, .78]) {
      await go(p);
      assert.equal(await page.locator('[data-scrambling]').count(), 3);
      const before = await page.locator('.scramble-ink').allTextContents();
      assert.ok(before.every(text => text.length > 10), 'Scramble must fill the empty interval');
      await page.waitForTimeout(120);
      assert.deepEqual(await page.locator('.scramble-ink').allTextContents(), before, 'Effect runs without scrolling');
    }
    await go(.84);
    assert.equal(await page.locator('[data-scrambling]').count(), 0);
    assert.equal(await page.locator('.mobile-service-cards h2').first().textContent(), 'Software que encaja contigo.');
    // The project introduction stays in place through the landing, then joins
    // normal document scroll without a positional jump.
    const end = height * (3.2 * .89 + 1);
    for (const extra of [10, height * .3, height * .54]) {
      await page.evaluate(y => scrollTo(0, y), end + extra);
      await page.waitForTimeout(80);
      const top = await page.locator('#proyectos').evaluate(e => e.getBoundingClientRect().top);
      assert.ok(Math.abs(top) < 2, `Landing moved: ${top}`);
    }
    await page.evaluate(y => scrollTo(0, y), end + height * .55 + 100);
    await page.waitForTimeout(80);
    assert.ok(Math.abs((await page.locator('#proyectos').evaluate(e => e.getBoundingClientRect().top)) + 100) < 2);
    await go(.84);
    await page.screenshot({ path: `.astro/mobile-cards-${width}.png` });
    await go(.48);
    assert.equal(await page.locator('.screen-service-row').count(), 0);
    assert.equal(await page.locator('.display-services > div').count(), 3);
    await page.getByRole('button', { name: 'Usar vista estática' }).click();
    await page.waitForFunction(() => document.documentElement.dataset.runtime === 'html');
    assert.equal(await page.locator('[data-scene-source] > [data-project-surface]').count(), 3);
    console.log(JSON.stringify({ width, height, rows: 'fit', reverse: 'ok', static: 'ok' }));
    await page.close();
  }
} finally { await browser.close(); }
