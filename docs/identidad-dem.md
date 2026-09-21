# Identidad dem

La firma principal es **dem**: David Estévez Martínez. Son tres letras dibujadas como trazados vectoriales, con una altura común, curvas abiertas y terminales rectos. Se usan a tamaño pequeño para que la identidad acompañe a los proyectos. La «d» del mismo dibujo es la versión mínima para el favicon y el icono del móvil.

El nombre completo aparece discretamente en el pie de la tarjeta de contacto y en los datos de identidad del sitio. Existe también una firma extendida para usos que necesiten identificar a la persona; no ocupa las cabeceras de la web.

## Archivos

- `public/brand/dem.svg`: monograma oscuro, fondo transparente.
- `public/brand/dem-light.svg`: monograma lima, fondo transparente.
- `public/brand/dem-signature.svg`: firma con nombre completo.
- `public/favicon.svg` y `public/apple-touch-icon.png`: versión mínima «d».
- `public/og-default.jpg`: tarjeta al compartir la portada.

El origen del dibujo está en `src/lib/brand.ts`. El componente de marca, el grabado del portátil y las exportaciones usan esos mismos trazados. Las versiones principales no dependen de ninguna tipografía instalada. `scripts/build-brand-assets.mjs` regenera los archivos exportados y las imágenes sociales.

## Lenguaje visual

Verde tinta `#17231c`, papel `#edf0e7`, lima `#dcf89c` y gris salvia. La tipografía Archivo continúa el lenguaje de la web. Las flechas, controles y pictogramas comparten una cuadrícula de 24 unidades y un trazo de 1,5. El signo «+» abre contacto; la flecha diagonal acompaña accesos; las flechas rectas indican avance, regreso y desplazamiento. Los pictogramas de servicios describen su función. Las marcas de los proyectos conservan sus propios colores y dibujos.

## Contacto

«Hablemos» funciona como una pestaña en el borde: lateral en escritorio e inferior en móvil. Abre una tarjeta con correo, WhatsApp y copia del correo. La página mantiene su posición. Se puede cerrar con Escape, el control de cierre o el fondo; el foco vuelve al acceso que la abrió. Sin JavaScript, los enlaces siguen abriendo el correo. La animación respeta la preferencia de movimiento reducido.

Referencias consultadas: [Pentagram, sistema de identidad Serif](https://www.pentagram.com/work/serif), [W3C, patrón de diálogo modal](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) y [Lenis, integración y control del scroll](https://github.com/darkroomengineering/lenis).

Revisión visual y funcional con emulación a 360, 390, 768 y 1440 px: navegación, teclado, copia, cierre, ausencia de desbordamiento y conservación del scroll. Las capturas de revisión están en `.astro/identity`. La comprobación está en `scripts/check-identity-contact.mjs`.
