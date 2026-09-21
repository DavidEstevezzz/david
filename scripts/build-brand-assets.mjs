// Genera los recursos de marca a partir de la geometría de src/lib/brand.ts.
//   · SVG y favicon: Node puro, sin dependencias.
//   · apple-touch-icon y tarjeta social: necesitan un navegador.
//     Playwright si está instalado; si no, el Chrome/Chromium que indique
//     CHROME_PATH. Sin ninguno de los dos, avisa y sale sin romper el build.
import { mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { brandBlock, brandTilde, brandTiles } from '../src/lib/brand.ts';

const run = promisify(execFile);
const { box, radius, viewBox } = brandBlock;

/** El bloque completo en una de las dos tejas. `tile:false` lo deja sin caja. */
const bloque = (teja = 'tinta', { tile = true } = {}) => {
  const c = brandTiles[teja];
  const fondo = tile ? `<rect width="${box}" height="${box}" rx="${radius}" fill="${c.tile}"/>` : '';
  const letras = brandBlock.letters
    .map(p => `<g transform="translate(${p.x} ${p.y}) scale(${p.s})"><path d="${p.d}" fill="${c.ink}"/></g>`)
    .join('');
  const a = brandBlock.accent;
  const tilde = `<g transform="translate(${a.x} ${a.y}) scale(${a.s})"><path d="${a.d}" fill="${c.accent}"/></g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${fondo}${letras}${tilde}</svg>`;
};

/** La tilde sola, encajada en la misma caja. */
const tildeSola = (teja = 'tinta') => {
  const c = brandTiles[teja];
  const [x0, y0, w, h] = brandTilde.viewBox.split(' ').map(Number);
  const s = Math.min((box * 0.46) / h, (box * 0.6) / w);
  const dx = (box - w * s) / 2 - x0 * s;
  const dy = (box - h * s) / 2 - y0 * s;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">`
    + `<rect width="${box}" height="${box}" rx="${radius}" fill="${c.tile}"/>`
    + `<g transform="translate(${dx.toFixed(3)} ${dy.toFixed(3)}) scale(${s.toFixed(5)})">`
    + `<path d="${brandTilde.d}" fill="${c.accent}"/></g></svg>`;
};

await mkdir('public/brand', { recursive: true });
// El favicon lleva la teja lima: en una tira de pestañas es la que se encuentra antes.
const favicon = bloque('lima');
await writeFile('public/favicon.svg', favicon);
await writeFile('public/brand/bloque-lima.svg', favicon);
await writeFile('public/brand/bloque-tinta.svg', bloque('tinta'));
await writeFile('public/brand/bloque-sin-caja.svg', bloque('tinta', { tile: false }));
await writeFile('public/brand/tilde.svg', tildeSola('lima'));

// ── recursos de mapa de bits ───────────────────────────────────────────────
const shots = [
  { path: 'public/apple-touch-icon.png', width: 180, height: 180, type: 'png',
    html: `<style>*{margin:0}svg{display:block;width:180px;height:180px}</style>${favicon}` },
];

const font = (await readFile('public/fonts/archivo-latin-wght-normal.woff2')).toString('base64');
shots.push({ path: 'public/og-default.jpg', width: 1200, height: 630, type: 'jpeg', quality: 92,
  html: `<style>
@font-face{font-family:Archivo;src:url(data:font/woff2;base64,${font}) format('woff2')}
*{box-sizing:border-box}body{margin:0;background:#17231c;color:#edf0e7;font-family:Archivo,Arial}
main{height:630px;padding:52px 64px;position:relative;overflow:hidden;display:flex;flex-direction:column}
.top{display:flex;align-items:center;gap:20px;padding-bottom:30px;border-bottom:1px solid #ffffff25}
.top svg{width:64px;height:64px;display:block}
.who{display:flex;flex-direction:column;gap:5px;margin-right:auto}
.who b{font-size:23px;font-weight:520;letter-spacing:-.02em}
.who span{font-size:14px;color:#bdcbb2}
.claim{font-size:15px;color:#bdcbb2}
h1{margin:auto 0;font-size:86px;font-weight:450;line-height:1.03;letter-spacing:-.05em}
h1 span{color:#dcf89c}
footer{display:flex;justify-content:space-between;font-size:15px;color:#bdcbb2}
.motif{position:absolute;right:-90px;bottom:70px;width:420px;opacity:.06}
.motif svg{width:100%;height:auto;display:block}
</style><main>
<div class="motif">${bloque('tinta', { tile: false })}</div>
<div class="top">${favicon}<span class="who"><b>David Estévez Martínez</b><span>Ingeniero de software</span></span><span class="claim">Ingeniería digital independiente</span></div>
<h1>De la idea<br/>a <span>lo real.</span></h1>
<footer><span>Web · Software · Automatización</span><span>estevezmartinez.es</span></footer>
</main>` });

async function conPlaywright() {
  const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    for (const s of shots) {
      await page.setViewportSize({ width: s.width, height: s.height });
      await page.setContent(s.html);
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: s.path, type: s.type, ...(s.quality ? { quality: s.quality } : {}) });
    }
  } finally { await browser.close(); }
}

async function conChrome(bin) {
  for (const s of shots) {
    const tmp = join(tmpdir(), `brand-${Date.now()}-${Math.random().toString(36).slice(2)}.html`);
    await writeFile(tmp, s.html);
    const out = s.type === 'jpeg' ? s.path.replace(/\.jpe?g$/, '.png') : s.path;
    await run(bin, ['--headless', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
      `--window-size=${s.width},${s.height}`, `--screenshot=${out}`, `file://${tmp}`]);
    await rm(tmp, { force: true });
    if (s.type === 'jpeg') {
      console.warn(`  ⚠ ${s.path} se ha generado como PNG en ${out}: Chrome solo captura PNG.`);
    }
  }
}

try {
  await conPlaywright();
  console.log('SVG, favicon, icono táctil y tarjeta social generados.');
} catch {
  const bin = process.env.CHROME_PATH;
  if (!bin) {
    console.warn('SVG y favicon generados. Los mapas de bits se han saltado:');
    console.warn('instala playwright o define CHROME_PATH con la ruta de Chrome o Chromium.');
  } else {
    await conChrome(bin);
    console.log('SVG, favicon y mapas de bits generados con CHROME_PATH.');
  }
}
