# Pendientes de las fichas de proyectos

Revisión inicial del 7 de septiembre de 2026. Actualizado el 8 de septiembre de 2026 tras implementar las mejoras del portfolio.

## Prioridad alta

- [x] **Black Tides: aportar evidencia visual.** Sustituir o enriquecer la recreación principal, actualmente demasiado vacía, con una secuencia del proyecto o una escena representativa con movimiento. Mostrar la experiencia cinematográfica que describe la ficha. Mantener una alternativa estática para movimiento reducido.
- [x] **WiControl: compactar la demostración en móvil.** Mostrar primero indicadores esenciales y gráfico, evitando apilar todo el menú, filtros e indicadores. Permitir ampliar la vista completa del panel.

## Black Tides

- [x] Reorientar la ficha al trabajo frontend por indicación del usuario: retirado el vídeo del estudio, las imágenes aisladas del juego y las muestras de color. Incorporadas tres capturas reales de la web local (portada, Infection y comparador de producción), ampliables y con explicación de la aportación web. Actualizada la portada del listado. Esta selección sustituye la propuesta audiovisual anterior.

- [x] Traducir los detalles de implementación a beneficios para el cliente: fluidez, adaptación al dispositivo y accesibilidad. Conservar driver de scroll, registro de GSAP y demás detalles en un apartado técnico desplegable.
- [x] Resumir la presentación de los siete capítulos en tres momentos visuales: entrada, exploración y transformación. Reducir la longitud de la ficha, especialmente en móvil.
- [x] Simplificar la paleta: menos muestras y códigos, más ejemplos de aplicación visual.
- [x] Resolver la expectativa de interacción de «Watch teaser» y «View on Steam»: enlazar material real cuando esté disponible o cambiar su presentación para que no parezcan controles funcionales.
- Conservar el titular, el acento rojo y la identidad visual propia dentro del portfolio.

## WiControl

- [x] Sustituir el protocolo de peticiones y respuestas en el recorrido principal por un esquema comprensible: sensor → plataforma → análisis → acción. Dejar el código como detalle técnico opcional.
- [x] Añadir un caso de uso concreto que conecte funciones y utilidad: detectar una desviación de peso, revisar condiciones ambientales y comprobar el dispositivo. Usar datos de ejemplo identificados como tales, sin atribuir resultados reales no comprobados.
- Conservar la presentación del panel en escritorio y su integración visual con el portfolio.

## Taller ECU · JMReprocars

- [x] Añadir la parte web al caso del taller con una captura real de `web/src/pages/conceptos/reprogramacion-codex.astro`, obtenida del repositorio actualizado `taller-ecu` (commit `58909d4`). Sustituida la propuesta anterior también en la portada del proyecto.
- [x] Revisar la nueva implementación web y actualizar el estado del caso: Astro + React, acceso y resumen del panel privado; despliegue e integración completa pendientes según la documentación del repositorio.
- [ ] Confirmar el diseño definitivo cuando el usuario cierre su elección. Por ahora identifica este concepto como el probable diseño final; la ficha lo presenta como dirección visual en desarrollo.

## Ambas fichas

- [x] Revisar afirmaciones absolutas y ajustar su precisión. Ejemplo: sustituir «una pestaña de fondo no gasta batería» por «el render se pausa para reducir el consumo».
- [x] Tras implementar los cambios, revisar legibilidad, longitud e interacción en escritorio y móvil, así como las alternativas sin movimiento.

## Sección de proyectos en la portada

- [x] **Crear las portadas visuales de todos los proyectos.** Sustituir los marcadores tipográficos actuales de ECU, WiControl, Black Tides y Tagadona por composiciones o capturas representativas, manteniendo un sistema visual coherente y adaptado al formato de cada tarjeta.
- [x] Preparar también una portada específica para Bomberos que funcione como entrada visual a su ficha, además de la captura de calendario que se muestra actualmente.

## Tagadona Racing

- [x] **Revisar la ficha de proyecto de Tagadona Racing.** El resultado actual no convence visualmente; replantear su composición, jerarquía, presentación del catálogo y forma de explicar el trabajo antes de darla por terminada.

Implementación autorizada por el usuario el 8 de septiembre. Se conserva la identidad de cada proyecto y el panel de facturación de Tagadona. El bloque SEO y su figura se eliminaron del marcado, y se regeneraron las tres capturas de la web pública esperando fuentes e imágenes.

Validación: compilación correcta; revisión visual a 1440 y 390 px sin desbordamientos ni imágenes rotas. Reproducción de vídeo, estado pausado con movimiento reducido y ampliación del panel verificadas. Separación entre catálogo y ficha: unos 130 px en escritorio y 70 px en móvil.

Materiales: Black Tides utiliza derivados presentes en la carpeta local del proyecto (vídeo, póster, pasillo y crecimiento orgánico). Portadas creadas con composiciones HTML y capturas. ECU muestra una captura real del concepto web actualizado, conservando la demostración ilustrativa de automatización; WiControl emplea una vista demostrativa. Las capturas de Tagadona proceden del sitio público del 8 de septiembre.
