# Validación de la portada

## Comprobado

- `npm run check`: Astro y TypeScript sin errores, avisos ni sugerencias.
- `npm run build`: las rutas `/` y `/lab/morph` generan HTML estático correctamente.
- `npm run measure`: JavaScript gzip `199585` bytes, por debajo de `350000`; no hay assets 3D descargados; el contenido de las dos rutas está presente en el HTML servido.
- La portada mantiene una única etiqueta `canvas` entre `/` y `/lab/morph` mediante el router interno.
- El HTML de servicios, proyectos, correo y WhatsApp permanece disponible sin depender del canvas.
- La composición no produce desbordamiento horizontal en 1440 px ni en 390 px en el recorrido probado.
- En móvil se reduce la densidad de partículas de la escena y, durante el despliegue, queda visible una sola superficie legible para evitar solapamientos.
- La preferencia `prefers-reduced-motion`, una ventana horizontal muy baja y la ausencia de WebGL conservan la versión estática.

## Pendiente de validar en dispositivos reales

- FPS sostenidos en un móvil de gama media y en un escritorio de referencia.
- Safari, especialmente después de recuperar un contexto WebGL perdido.
- LCP real con datos de campo y el comportamiento de la fuente en una conexión lenta.
- Contraste y escala final cuando se incorporen capturas y fichas completas de cada proyecto.

La prueba de navegador local sirve para detectar fallos de recorrido y layout; no se presenta como medición de 60/30 FPS en hardware físico.
