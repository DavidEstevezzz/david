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
    await page.goto('http://127.0.0.1:4321/#proyectos');
    await page.waitForFunction(()=>document.documentElement.dataset.runtime==='ready');
    await page.locator('.work-card-art img').evaluateAll(images=>Promise.all(images.map(img=>{img.loading='eager';return img.decode();})));
    await page.locator('.work-section').screenshot({path:`.astro/editorial/gallery-${width}.png`});
    const cards = await page.locator('.work-card').evaluateAll(elements=>elements.map(e=>{
      const r=e.getBoundingClientRect();
      const art=e.querySelector('.work-card-art').getBoundingClientRect();
      const img=e.querySelector('img'); const image=img.getBoundingClientRect();
      return {x:r.x,w:r.width,top:r.top,bottom:r.bottom,artX:art.x,artW:art.width,artH:art.height,ratioError:image.height-image.width*img.naturalHeight/img.naturalWidth};
    }));
    cards.forEach((card,index)=>{
      assert.ok(Math.abs(card.w-cards[0].w)<1 && Math.abs(card.x-cards[0].x)<1, 'All projects share one aligned column');
      assert.ok(Math.abs(card.artW-cards[0].artW)<1 && Math.abs(card.artH-cards[0].artH)<1, 'Every preview has the same size');
      assert.ok(Math.abs(card.ratioError)<1, 'Screenshots retain their original proportions');
      if(index) assert.ok(card.top>=cards[index-1].bottom-1, 'Projects follow a continuous reading order');
      if(width>820) assert.ok(card.artW<=440, 'Previews remain compact on desktop');
    });
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
      assert.equal(await page.locator('.case figure a[href^="/projects/"]').count(),0,'Project screenshots are not links');
      const beforeImageClick=page.url();
      await page.locator('[data-project-image]').click();
      assert.equal(page.url(),beforeImageClick,'Clicking a screenshot keeps the project open');
      await page.goBack();
      await page.waitForURL(`**/#proyecto-${slug}`);
      await page.waitForFunction(()=>document.documentElement.dataset.runtime==='ready' && document.querySelector('.home[data-enhanced]'));
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
  await page.waitForFunction(()=>document.documentElement.dataset.runtime==='ready' && document.querySelector('.home[data-enhanced]'));
  await page.waitForTimeout(1200);
  const restored=await page.locator('.work-card-art').last().boundingBox();
  assert.ok(restored.y<1000 && restored.y+restored.height>0,`Back lost the selected project: ${JSON.stringify(restored)}`);
  await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
  await page.waitForTimeout(500);
  assert.ok(await page.locator('#visual-canvas').evaluate(el=>Number(getComputedStyle(el).opacity)>0),'Animation is available again at the top after returning');
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForTimeout(300);
  assert.equal(await page.locator('[data-project-image]').first().evaluate(e=>getComputedStyle(e).viewTransitionName),'none');
  console.log('Service objects and reduced motion: OK');
} finally { await browser.close(); }
