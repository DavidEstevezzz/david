import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({channel:'msedge',headless:true});
await mkdir('.astro/editorial', {recursive:true});
try {
  if (!process.env.ONLY_RETURN) for (const width of [390, 1440]) {
    const page = await browser.newPage({viewport:{width,height:900},isMobile:width<820,hasTouch:width<820});
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.addInitScript(() => {
      addEventListener('pagereveal', event => {
        if (!event.viewTransition) return;
        window.entryTransition='pending';
        event.viewTransition.ready.then(()=>{window.entryTransition='ready';},error=>{window.entryTransition=error.message;});
        event.viewTransition.finished.then(()=>{if(window.entryTransition==='ready') window.entryTransition='finished';});
      });
    });
    await page.goto('http://127.0.0.1:4321/?render=html#proyectos');
    await page.locator('.work-card-art img').evaluateAll(images=>Promise.all(images.map(img=>{img.loading='eager';return img.decode();})));
    await page.locator('.work-section').screenshot({path:`.astro/editorial/gallery-${width}.png`});
    const cards = await page.locator('.work-card').evaluateAll(elements=>elements.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,w:r.width,y:e.querySelector('.work-card-art').getBoundingClientRect().y};}));
    if(width>820) {
      assert.ok(cards[0].w > cards[1].w*1.8, 'Lead must have a stronger hierarchy');
      assert.ok(cards[2].y > cards[1].y+60, 'Secondary pair should be staggered');
      assert.ok(cards[3].w > cards[2].w*1.8, 'Cinematic project must span the gallery');
    }
    for(const slug of ['bomberos','taller-ecu','wicontrol','black-tides','tagadona']) {
      const link=page.locator(`.work-card-art[href="/proyectos/${slug}/#vista-proyecto"]`);
      await link.scrollIntoViewIfNeeded();
      const oldName=await link.locator('img').evaluate(img=>getComputedStyle(img).viewTransitionName);
      await link.click();
      await page.waitForURL(`**/proyectos/${slug}/#vista-proyecto`);
      await page.locator('[data-project-image]').evaluate(img=>img.decode());
      await page.waitForTimeout(1000);
      const state=await page.evaluate(()=>{
        const img=document.querySelector('[data-project-image]'); const r=img.getBoundingClientRect();
        return {name:getComputedStyle(img).viewTransitionName,top:r.top,bottom:r.bottom,active:img.closest('.story-shot')?.classList.contains('is-active')??true,transition:window.entryTransition,overflow:document.documentElement.scrollWidth>innerWidth};
      });
      assert.equal(state.name,oldName);
      assert.ok(state.top>=0 && state.top<700 && state.bottom>0, `Entry image offscreen: ${JSON.stringify(state)}`);
      assert.ok(state.active, `Entry switched from the selected photo: ${slug}`);
      assert.equal(state.overflow,false);
      assert.equal(state.transition,'finished',`Native transition failed: ${JSON.stringify(state)}`);
      await page.screenshot({path:`.astro/editorial/entry-${slug}-${width}.png`});
      await page.goBack();
      await page.waitForURL(`**/?render=html#proyecto-${slug}`);
      await page.waitForTimeout(750);
      assert.equal(await page.locator('.work-card-art').count(),5);
      const returned=await page.locator(`.work-card-art[href="/proyectos/${slug}/#vista-proyecto"]`).boundingBox();
      assert.ok(returned.y<900 && returned.y+returned.height>0, `Return anchor offscreen: ${slug}`);
      console.log(JSON.stringify({width,slug,...state}));
    }
    assert.deepEqual(errors,[]);
    await page.close();
  }
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  await page.goto('http://127.0.0.1:4321/');
  await page.waitForFunction(()=>document.documentElement.dataset.runtime==='ready');
  await page.evaluate(()=>scrollTo(0,1000*5.6*.74));
  await page.waitForTimeout(1200);
  await page.screenshot({path:'.astro/editorial/service-objects-desktop.png'});
  assert.equal(await page.locator('.service-object').count(),3);
  const states=await page.locator('.project-surface').evaluateAll(elements=>elements.map(e=>({height:e.clientHeight,content:e.scrollHeight,progress:Number(e.style.getPropertyValue('--object-progress'))})));
  states.forEach(state=>{assert.ok(state.content<=state.height+1,`Service content clipped: ${JSON.stringify(state)}`);assert.ok(state.progress>.5);});
  const projectLink=page.locator('.work-card-art').last();
  await projectLink.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await projectLink.click();
  await page.waitForURL('**/proyectos/tagadona/#vista-proyecto');
  await page.waitForTimeout(750);
  await page.goBack();
  await page.waitForTimeout(1200);
  const restored=await page.locator('.work-card-art').last().boundingBox();
  assert.ok(restored.y<1000 && restored.y+restored.height>0,`Back lost the selected project: ${JSON.stringify(restored)}`);
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForTimeout(300);
  assert.equal(await page.locator('[data-project-image]').first().evaluate(e=>getComputedStyle(e).viewTransitionName),'none');
  console.log('Service objects and reduced motion: OK');
} finally { await browser.close(); }
