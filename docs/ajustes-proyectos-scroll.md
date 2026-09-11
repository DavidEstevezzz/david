# Ajustes de proyectos, portátil y rueda — 9 de septiembre de 2026

Bomberos conserva sus PNG originales y su relación de aspecto: ancho del 75 % de la ventana, máximo 1440 px, centrado y altura automática. Las tres capturas se pueden ampliar. Tagadona acerca la columna de texto a la imagen, limita la medida del texto y iguala la altura de cada paso a la ventana para mejorar su alineación vertical.

El portátil móvil utiliza hasta DPR 3, curvas de cinco segmentos y reflejos menos duros en el borde. La calidad baja en pasos de 0,5 únicamente ante movimiento lento sostenido, con un mínimo de 1,5 o la densidad real del dispositivo si es inferior. No cambia el recorrido móvil.

La rueda de escritorio utiliza Lenis con `lerp: .1` y `smoothWheel: true`; el gesto táctil sigue siendo nativo. Lenis avanza antes del timeline de GSAP y la escena se dibuja después. El seguimiento del portátil pasa de 0,45 a 0,18 segundos para evitar acumular demasiado retraso. Los saltos a secciones y la navegación con teclado cancelan la inercia pendiente. La vista estática y la preferencia de movimiento reducido destruyen el controlador de scroll.

Referencias oficiales consultadas:

- [Lenis: integración con GSAP, estilos y opciones](https://github.com/darkroomengineering/lenis#gsap-scrolltrigger)
- [GSAP ScrollTrigger: scrub](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
- [Three.js: WebGLRenderer y resolución](https://threejs.org/docs/pages/WebGLRenderer.html)

Validación: comparación visual de las dos páginas y del portátil con emulación móvil de densidad 3. `check-wheel-scroll.mjs` comprueba interpolación de un impulso real de rueda, ausencia de retrocesos, cancelación al saltar a proyectos, vista estática, movimiento reducido y resolución móvil. Se conservan las comprobaciones de entrada en pantalla y capítulos móviles. La comprobación antigua del final móvil esperaba una pausa de media pantalla que ya no existía en el recorrido; ahora exige que proyectos acompañe al scroll nativo píxel a píxel.

La medición de contenido también se actualiza a los textos y correo ya presentes en la web (Taller ECU, Granada y dominio .es), en lugar de esperar referencias antiguas. La comprobación móvil se realiza con emulación en Edge; no sustituye una revisión de rendimiento en un teléfono físico.

## Segunda revisión móvil

Las flechas diagonales de navegación, llamadas a la acción y servicios usan un componente SVG de trazo, con color heredado y oculto a lectores de pantalla, para evitar la representación emoji del sistema. En el recorrido móvil de Tagadona se oculta el pie que acompañaba a la ventana fija; permanecen la captura, la URL y los tres círculos superiores.

Se elimina el margen final del 5 % de la altura que mantenía los proyectos quietos al llegar a la parte superior. El desplazamiento continúa ahora píxel a píxel a ambos lados del relevo, comprobado desde 20 píxeles antes hasta 50 después, además de la salida completa y el recorrido inverso. Comparación visual a 360, 390, 768 y 1440 píxeles; pruebas de capítulos móviles, entrada en pantalla, scroll móvil y rueda de escritorio correctas.

## Distribución entre los cinco proyectos

- Ventana centrada al 75 % con imagen completa: Bomberos y WiControl.
- Ventana que acompaña al scroll: Taller ECU, Black Tides y Tagadona.

El segundo diseño comparte el componente CaseStory. El marco ajusta su altura a la relación de aspecto de cada captura, incluida la imagen más alta del catálogo de Tagadona, y se vuelve a medir al cambiar el ancho. Los pies de imagen permanecen ocultos en móvil. Sin JavaScript se muestran todas las capturas y con movimiento reducido se desactivan las transiciones. Las imágenes inactivas no reciben foco de teclado.

Taller ECU combina su captura real de reprogramación con una captura de la recreación explicativa que ya tenía la ficha, identificada como ejemplo con datos ficticios. WiControl presenta la imagen completa y conserva la recreación HTML dentro de un desplegable. Black Tides reúne las tres capturas existentes en un recorrido por portada, infección y producción.

`check-project-layouts.mjs` verifica los cinco proyectos a 390, 768, 1440 y 1920 píxeles: cambio de captura, proporciones, ausencia de hueco bajo la imagen, pies móviles ocultos y ausencia de desbordamiento horizontal.
