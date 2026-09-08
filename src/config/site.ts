// ============================================================
//  DATOS DEL SITIO — FUENTE ÚNICA DE VERDAD
// ============================================================
//  Dominio, nombre, contacto, redes y textos por defecto viven
//  AQUÍ y solo aquí. Shell.astro, el sitemap, los datos
//  estructurados y las etiquetas para redes sociales los leen
//  de este archivo.
//
//  ⚠ SI CAMBIAS DE DOMINIO: edita `url` y también la línea
//    `site:` de astro.config.mjs. Son los dos únicos sitios.
// ============================================================

export const site = {
  url: 'https://estevezmartinez.es',
  name: 'David Estévez',
  jobTitle: 'Ingeniero informático',
  // Título por defecto de la portada y sufijo del resto de páginas.
  titleSuffix: 'David Estévez',
  email: 'david@estevezmartinez.es',
  whatsapp: '34609662376',
  telefonoE164: '+34609662376',
  ciudad: 'Granada',
  region: 'Andalucía',
  pais: 'ES',
  idioma: 'es',
  // Imagen que se ve al compartir un enlace en WhatsApp, LinkedIn, X…
  ogImage: '/og-default.jpg',
  ogImageAlt: 'David Estévez — desarrollo web, software a medida y automatización en Granada',
  github: 'https://github.com/DavidEstevezzz',
  // Servicios: alimentan los datos estructurados de la portada.
  servicios: [
    'Desarrollo web',
    'Aplicaciones web a medida',
    'Software de gestión',
    'Automatización de procesos',
  ],
} as const;

/** URL absoluta a partir de una ruta del sitio. */
export function abs(path: string): string {
  return new URL(path, site.url).href;
}
