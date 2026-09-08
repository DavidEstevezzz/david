// ============================================================
//  Datos estructurados (JSON-LD)
//  Google los usa para entender quién eres y qué hay en cada
//  página. Se serializan en Shell.astro con set:html.
// ============================================================
import { site, abs } from '../config/site';

/** Identidad del sitio y de la persona. Va en la portada. */
export function homeSchema() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': abs('/#david'),
        name: site.name,
        jobTitle: site.jobTitle,
        email: `mailto:${site.email}`,
        telephone: site.telefonoE164,
        url: site.url,
        image: abs(site.ogImage),
        sameAs: [site.github],
        address: {
          '@type': 'PostalAddress',
          addressLocality: site.ciudad,
          addressRegion: site.region,
          addressCountry: site.pais,
        },
        knowsAbout: [...site.servicios],
      },
      {
        '@type': 'ProfessionalService',
        '@id': abs('/#negocio'),
        name: site.name,
        description:
          'Desarrollo web, software de gestión y automatización de procesos a medida para empresas.',
        url: site.url,
        image: abs(site.ogImage),
        email: `mailto:${site.email}`,
        telephone: site.telefonoE164,
        priceRange: '€€',
        founder: { '@id': abs('/#david') },
        areaServed: [
          { '@type': 'City', name: 'Granada' },
          { '@type': 'Country', name: 'España' },
        ],
        address: {
          '@type': 'PostalAddress',
          addressLocality: site.ciudad,
          addressRegion: site.region,
          addressCountry: site.pais,
        },
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Servicios',
          itemListElement: site.servicios.map((s) => ({
            '@type': 'Offer',
            itemOffered: { '@type': 'Service', name: s },
          })),
        },
      },
      {
        '@type': 'WebSite',
        '@id': abs('/#web'),
        url: site.url,
        name: site.name,
        inLanguage: 'es-ES',
        publisher: { '@id': abs('/#david') },
      },
    ],
  };
}

/** Ficha de proyecto: miga de pan + obra. */
export function projectSchema(opts: {
  name: string;
  description: string;
  path: string;
  image: string;
  categoria: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: site.url },
          { '@type': 'ListItem', position: 2, name: 'Proyectos', item: abs('/#proyectos') },
          { '@type': 'ListItem', position: 3, name: opts.name, item: abs(opts.path) },
        ],
      },
      {
        '@type': 'CreativeWork',
        name: opts.name,
        headline: opts.name,
        description: opts.description,
        url: abs(opts.path),
        image: abs(opts.image),
        genre: opts.categoria,
        inLanguage: 'es-ES',
        author: { '@type': 'Person', '@id': abs('/#david'), name: site.name },
        creator: { '@type': 'Person', '@id': abs('/#david'), name: site.name },
      },
    ],
  };
}
