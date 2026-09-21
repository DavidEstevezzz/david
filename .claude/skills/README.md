# Skills del proyecto

Skills de diseño, marca, SEO y frontend disponibles en este repositorio.
Se cargan solas: Claude las activa cuando la tarea encaja con su `description`.

| Skill | Para qué | Estado |
|---|---|---|
| `brand` | Identidad de marca, voz, mensajes, uso del logotipo, paleta, tipografía | Guía completa · scripts ausentes |
| `design` | Logotipo, identidad corporativa, iconos, banners, imágenes sociales | Guía completa · scripts ausentes |
| `design-system` | Tokens en tres capas (primitivo → semántico → componente) | Guía completa · scripts ausentes |
| `ui-styling` | Tailwind, shadcn/ui, temas, accesibilidad de componentes | Guía completa · scripts ausentes |
| `ui-ux-pro-max` | Criterio de UI/UX: retícula, tipografía, color, movimiento, gráficos | Guía completa · datos ausentes |
| `banner-design` | Banners para redes, anuncios, héroes de web e impresión | Guía completa · scripts ausentes |
| `slides` | Presentaciones en HTML con Chart.js y tokens | Guía completa · datos ausentes |
| `frontend-design` | Dirección estética al construir o rehacer una interfaz | Autónoma |
| `high-end-visual-design` | Detalle visual de gama alta: espaciado, sombras, animación | Autónoma |
| `seo-audit` | Auditoría de SEO técnico y de contenido | Autónoma |
| `site-architecture` | Arquitectura de la información, navegación, enlazado interno | Autónoma |
| `web-design-guidelines` | Revisión de UI contra las Web Interface Guidelines | Autónoma |

## Sobre los scripts ausentes

Estas skills vienen de un volcado en Markdown que incluía solo la documentación.
Los `scripts/` (Python y Node) y los `data/` (CSV, JSON) del paquete original no
venían dentro, así que los pasos que invocan `search.py`, `generate.py`,
`inject-brand-context.cjs` o generación de imágenes con Gemini no se pueden
ejecutar aquí. El criterio de diseño —que es la mayor parte del contenido— sí
está entero y es lo que se usa al trabajar.

Si en algún momento se quieren esos pasos automáticos, hay que copiar las
carpetas `scripts/`, `data/` y `assets/` de cada skill desde el paquete original.
