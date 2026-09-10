import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
await mkdir('.astro/identity',{recursive:true});
try {
  for(const [width,height] of [[360,640],[390,844],[768,1024],[1440,900]]) {
    const context=await browser.newContext({viewport:{width,height},isMobile:width<=820,hasTouch:width<=820,permissions:['clipboard-read','clipboard-write']});
    const page=await context.newPage();const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto('http://127.0.0.1:4321/');
    await page.waitForFunction(()=>document.documentElement.dataset.runtime==='ready');
    await page.screenshot({path:`.astro/identity/home-${width}.png`});
    const nav=page.locator('.home-nav [data-contact-open]');
    await nav.click();
    const dialog=page.locator('.contact-dialog');
    await dialog.waitFor({state:'visible'});
    await page.waitForTimeout(400);
    const rect=await dialog.boundingBox();
    assert.ok(rect.x>=0&&rect.y>=0&&rect.x+rect.width<=width&&rect.y+rect.height<=height,`Dialog outside viewport: ${JSON.stringify(rect)}`);
    assert.equal(await dialog.locator('a').first().getAttribute('href'),'mailto:david@estevezmartinez.es');
    assert.equal(await dialog.locator('a').nth(1).getAttribute('href'),'https://wa.me/34609662376');
    await page.screenshot({path:`.astro/identity/contact-${width}.png`});
    for(let n=0;n<8;n++) {
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(()=>document.querySelector('dialog').contains(document.activeElement)),true,'Focus escaped the dialog');
    }
    await page.locator('[data-copy-email]').click();
    await page.waitForFunction(()=>document.querySelector('[data-copy-status]').textContent.includes('copiado'));
    assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),'david@estevezmartinez.es');
    await page.keyboard.press('Escape');
    await dialog.waitFor({state:'hidden'});
    assert.equal(await nav.evaluate(e=>document.activeElement===e),true,'Focus did not return to the opener');
    // Opening at the services must freeze both native and smoothed scrolling.
    await page.evaluate(y=>scrollTo(0,y),height*(width<=820?3.2*.84:5.6*.74));
    await page.waitForTimeout(500);
    await page.screenshot({path:`.astro/identity/services-${width}.png`});
    const tab=page.locator('.contact-tab');
    await tab.click();
    const before=await page.evaluate(()=>scrollY);
    await page.mouse.move(5,height/2);await page.mouse.wheel(0,600);
    await page.waitForTimeout(300);
    assert.ok(Math.abs(await page.evaluate(()=>scrollY)-before)<2,'Background scrolled while contact was open');
    await page.locator('[data-contact-close]').click();
    assert.ok(Math.abs(await page.evaluate(()=>scrollY)-before)<2,'Closing contact changed scroll position');
    await page.goto('http://127.0.0.1:4321/proyectos/tagadona/');
    await page.screenshot({path:`.astro/identity/case-${width}.png`});
    await page.locator('.case-nav [data-contact-open]').click();
    await page.waitForTimeout(400);
    await page.mouse.click(2,2);
    assert.equal(await page.locator('dialog').evaluate(e=>e.open),false,'Backdrop did not close dialog');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Horizontal overflow');
    assert.deepEqual(errors,[]);
    await context.close();
    console.log(JSON.stringify({width,height,contact:'open/close/copy/focus/backdrop OK',scroll:'preserved',overflow:false}));
  }
  const page=await browser.newPage({javaScriptEnabled:false,viewport:{width:390,height:844}});
  await page.goto('http://127.0.0.1:4321/');
  assert.equal(await page.locator('.contact-tab').getAttribute('href'),'mailto:david@estevezmartinez.es');
  assert.equal(await page.locator('dialog').isVisible(),false);
  await page.close();
  console.log('No-JavaScript contact fallback: OK');
}finally{await browser.close();}
