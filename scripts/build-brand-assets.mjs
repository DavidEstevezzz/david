import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {brandMark} from '../src/lib/brand.ts';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const strokes=brandMark.paths.map(d=>`<path d="${d}"/>`).join('');
const mark=(ink='#17231c')=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${brandMark.viewBox}" fill="none" stroke="${ink}" stroke-width="${brandMark.strokeWidth}" stroke-linecap="square" stroke-linejoin="round">${strokes}</svg>`;
await mkdir('public/brand',{recursive:true});
await writeFile('public/brand/dem.svg',mark());
await writeFile('public/brand/dem-light.svg',mark('#dcf89c'));
const favicon=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#17231c"/><path transform="translate(12 5) scale(1.2)" d="${brandMark.paths[0]}" fill="none" stroke="#dcf89c" stroke-width="3.5" stroke-linecap="square" stroke-linejoin="round"/></svg>`;
await writeFile('public/favicon.svg',favicon);
const signature=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 60"><g transform="translate(0 6)" fill="none" stroke="#17231c" stroke-width="3.5" stroke-linecap="square" stroke-linejoin="round">${strokes}</g><path d="M138 12v36" stroke="#b7c5ad"/><text x="158" y="29" fill="#17231c" font-family="Arial,sans-serif" font-size="14">David Estévez Martínez</text><text x="158" y="46" fill="#617452" font-family="Arial,sans-serif" font-size="10">Ingeniería digital independiente</text></svg>`;
await writeFile('public/brand/dem-signature.svg',signature);
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
  const page=await browser.newPage({viewport:{width:1200,height:630},deviceScaleFactor:1});
  const font=(await readFile('public/fonts/archivo-latin-wght-normal.woff2')).toString('base64');
  await page.setContent(`<!doctype html><html><head><style>@font-face{font-family:Archivo;src:url(data:font/woff2;base64,${font})}*{box-sizing:border-box}body{margin:0;background:#17231c;color:#edf0e7;font-family:Archivo,Arial}main{height:630px;padding:50px 64px;position:relative;overflow:hidden}.top{display:flex;align-items:center;justify-content:space-between;padding-bottom:28px;border-bottom:1px solid #ffffff25;font-size:13px;color:#bdcbb2}.top svg{width:88px;height:35px}h1{position:relative;z-index:1;font-size:84px;font-weight:450;line-height:1.03;letter-spacing:-5px;margin:50px 0 40px}h1 span{color:#dcf89c}footer{display:flex;justify-content:space-between;position:absolute;bottom:48px;left:64px;right:64px;font-size:14px;color:#bdcbb2}.motif{position:absolute;width:480px;right:-155px;bottom:90px;opacity:.07;transform:rotate(-20deg)}.motif svg{width:100%}</style></head><body><main><div class="top">${mark('#dcf89c')}<span>Ingeniería digital independiente</span></div><div class="motif">${mark('#dcf89c')}</div><h1>De la idea<br/>a <span>lo real.</span></h1><footer><span>Web · Software · Automatización</span><span>estevezmartinez.es</span></footer></main></body></html>`);
  await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:'public/og-default.jpg',type:'jpeg',quality:92});
  await page.setViewportSize({width:180,height:180});
  await page.setContent(`<html><style>*{margin:0}svg{display:block;width:180px;height:180px}</style>${favicon}</html>`);
  await page.screenshot({path:'public/apple-touch-icon.png'});
} finally {await browser.close();}
console.log('Brand SVGs, favicon, touch icon and social card generated.');
