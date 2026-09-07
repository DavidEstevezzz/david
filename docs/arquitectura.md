# Decisiones de arquitectura

Actualizado: 7 de septiembre de 2026.

## Alcance acordado

Web pública de servicios y proyectos de un ingeniero informático especializado en desarrollo web, software a medida y automatizaciones. La experiencia debe demostrar calidad técnica, favorecer la exploración y facilitar el contacto comercial.

Los proyectos aportados por el propietario incluyen software para la gestión integral del parque de bomberos de Granada, una web de taller, automatizaciones de WhatsApp y una web de un videojuego de próximo lanzamiento en Estados Unidos. Antes de publicar fichas se concretarán nombres, materiales, responsabilidad y resultados verificables.

No se ha definido un área privada de clientes como parte de la primera versión.

## Base tecnológica aceptada

- Astro para páginas públicas y composición de componentes.
- TypeScript para la lógica de la web.
- CSS propio y sistema de diseño a medida.
- React disponible para componentes con interacción compleja; se incorporará al implementar una pieza que lo requiera.
- Markdown/MDX como propuesta de contenido versionado para las fichas de proyectos.

La generación de HTML permite añadir JavaScript interactivo: las páginas públicas se pueden generar durante la compilación y sus componentes interactivos se ejecutan en el navegador. No presupone una experiencia visual estática.

## Desarrollo e infraestructura

- Trabajar en local durante esta fase.
- Usar Git y una rama de trabajo conectada a GitHub; el repositorio remoto aún está pendiente de identificar.
- Destino previsto: VPS del propietario. Se descarta la propuesta anterior de Cloudflare como alojamiento.
- Dominio, DNS, HTTPS, correo profesional y configuración del VPS se decidirán más adelante.
- Mantener la aplicación sin dependencias obligatorias de un proveedor de alojamiento.
- Primera opción para el VPS: servir los archivos generados con el servidor web que corresponda a su configuración.
- Si el formulario u otras funciones requieren ejecución en servidor, concretar un servicio de backend o el adaptador Node de Astro en ese momento.
- Correo del formulario y buzón profesional son necesidades distintas que se configurarán al abordar contacto e infraestructura.

## Experiencias interactivas propuestas, pendientes de selección

1. Navegación con continuidad visual entre el listado y la ficha de un proyecto. Mantener enlaces reales, historial y comportamiento correcto al volver atrás.
2. Demostración de una automatización: el visitante modifica una entrada y observa las etapas y el resultado. Los datos de ejemplo y las simulaciones se identificarán como tales.
3. Explorador de proyectos por problema resuelto o servicio, con transiciones y acceso directo a cada caso.

Priorizar una primera experiencia bien terminada para validar la dirección. Incorporar bibliotecas de animación o gráficos cuando la interacción elegida las justifique.

## Criterios de calidad propuestos

- Navegación clara, enlaces compartibles y funcionamiento por teclado y en dispositivos táctiles.
- Respetar la preferencia de movimiento reducido y mantener el control del desplazamiento en manos del visitante.
- Mantener accesible el contenido principal aunque falle una experiencia interactiva.
- Cargar las demostraciones costosas cuando se necesiten y liberar sus recursos al salir.
- Medir rendimiento en móvil y ajustar imágenes, fuentes y JavaScript según los resultados.
- Comprobar navegación, filtros, historial y formulario cuando existan.
- Validar datos y proteger credenciales en el servidor cuando se implemente el contacto.
- Publicar únicamente afirmaciones y resultados de proyectos que se puedan respaldar.

## Referencias técnicas

- [Arquitectura de islas de Astro](https://docs.astro.build/en/concepts/islands/)
- [Transiciones de navegación de Astro](https://docs.astro.build/en/guides/view-transitions/)

## Decisiones abiertas

- Repositorio y cuenta de GitHub.
- Estructura de páginas e idiomas de lanzamiento.
- Dirección visual y primera interacción a desarrollar.
- Material publicable de cada proyecto.
- Formulario, proveedor de correo y eventual backend.
- Especificaciones del VPS, dominio y configuración de publicación.
