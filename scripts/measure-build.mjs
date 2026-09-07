import { readdir, readFile, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

async function walk(dir) {
  const files = [];
  for (const name of await readdir(dir)) {
    const path = join(dir, name);
    if ((await stat(path)).isDirectory()) files.push(...await walk(path));
    else files.push(path);
  }
  return files;
}
const files = await walk('dist');
const js = await Promise.all(files.filter(f => f.endsWith('.js')).map(async path => {
  const data = await readFile(path);
  return { file: path, bytes: data.length, gzip: gzipSync(data).length };
}));
const total = js.reduce((sum, file) => sum + file.gzip, 0);
const assets = files.filter(f => /\.(glb|gltf|ktx2|bin|hdr|exr)$/i.test(f));
const assetBytes = (await Promise.all(assets.map(f => stat(f)))).reduce((sum, s) => sum + s.size, 0);
const html = await readFile('dist/lab/morph/index.html', 'utf8');
const expected = ['De la forma,', 'Ahora puedes', 'Explorar el resultado', 'Notas del estudio'];
const contentComplete = expected.every(text => html.includes(text));
const home = await readFile('dist/index.html', 'utf8');
const homeComplete = ['La idea es tuya.', 'Lo que imaginas.', 'Bomberos', 'Taller de EQ', 'WhatsApp', 'Estados Unidos', 'mailto:david@estevezmartinez.com', 'https://wa.me/34609662376'].every(text => home.includes(text));
console.log(JSON.stringify({ javascript: js, totalGzipBytes: total, budgetGzipBytes: 350_000, modelAndTextureBytes: assetBytes, htmlContentComplete: contentComplete, homeHtmlComplete: homeComplete }, null, 2));
if (total > 350_000 || assetBytes > 3_000_000 || !contentComplete || !homeComplete) process.exitCode = 1;
