# Web profesional de David

Portfolio local en Astro + TypeScript. Trabajo en `feat/base-web`; futuro alojamiento en VPS.

## Arranque

```sh
npm install
npm run dev
```

- `/`: portátil que se abre, entrada en su pantalla y despliegue de proyectos.
- `/lab/morph`: prueba independiente de curvatura y relevo a HTML.
- `/?render=html`: versión estática completa.

```sh
npm run build
npm run measure
```

La compilación incluye comprobación de tipos; la medición verifica JS gzip, assets y contenido presente en el HTML de ambas rutas.

## Experiencia y arquitectura

Portátil procedural Three.js con tapa articulada, teclado instanciado, trackpad y materiales propios. La pantalla contiene HTML real proyectado con CSS3D, sincronizado con la cámara del canvas. Al ocupar la ventana, el mismo elemento pasa a maquetación normal; no se sustituye por una captura. Tres superficies con curvatura presentan gestión, web y automatización. En móvil se apilan las superficies y solo se muestra el texto de la delantera; todas las fichas siguen disponibles debajo.

Un canvas persiste entre las rutas: se reemplaza solo `#page`, conservando el body. Cada escena libera recursos, eventos y ScrollTriggers al salir. GSAP y Lenis comparten ticker; entrada de scroll nativa. El renderer se carga después del primer contenido y deja de dibujar cuando la escena está quieta o fuera de pantalla. DPR máximo 2 en escritorio y 1,5 en móvil, con reducción a 1 ante ticks lentos sostenidos.

Sin WebGL, sin JavaScript, con movimiento reducido o en ventanas muy bajas, los textos y proyectos conservan una composición estática. En modo animado se puede saltar directamente a proyectos/contacto. No se prepara un interior de ordenador ni la opción 3.

Correo y WhatsApp reales facilitados por David. Capturas, métricas y permisos se revisarán más adelante proyecto por proyecto; las superficies actuales son presentaciones editoriales, no interfaces de clientes.

Sin publicación en esta fase. Se mantiene `noindex`.

Ver [guion visual](docs/guion-visual.md), [dirección de arte](docs/direccion-arte.md) y [validación](docs/validacion-portatil.md).
