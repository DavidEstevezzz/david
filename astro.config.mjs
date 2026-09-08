import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// El dominio también vive en src/config/site.ts — cambia los dos a la vez.
export default defineConfig({
  site: 'https://estevezmartinez.es',
  trailingSlash: 'always',
  integrations: [
    mdx(),
    sitemap({
      // El laboratorio no se indexa: no aporta nada a un cliente.
      filter: (page) => !page.includes('/lab/'),
    }),
  ],
  output: 'static',
  build: { format: 'directory' },
  // Sin sourcemaps en producción: no publican el código fuente y pesan menos.
  vite: { build: { sourcemap: false } },
});
