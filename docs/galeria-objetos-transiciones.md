# Galería editorial, entradas visuales y objetos de servicio

La portada presenta Bomberos como pieza principal, ECU y WiControl en una pareja escalonada, Black Tides en una imagen panorámica y Tagadona en una composición con la imagen a la derecha. En móvil se conserva el orden de lectura y todas las imágenes son enlaces accesibles. Las capturas de las aplicaciones mantienen sus proporciones.

Al pulsar una imagen se abre la captura correspondiente de la ficha. Ambas imágenes comparten un nombre de transición nativa del navegador. El enlace de texto sigue abriendo la introducción del proyecto. La navegación carga el documento completo para conservar sus estilos, scripts y metadatos. Al volver, una referencia al proyecto recupera su posición en la galería sin reproducir la introducción. Los navegadores que no admiten la transición conservan los enlaces normales; la preferencia de movimiento reducido desactiva el efecto.

Los servicios tienen ilustraciones vectoriales con volumen: tres módulos que encajan, capas de una interfaz web y nodos conectados. Comparten aluminio verdoso, cantos oscuros y acentos lima con el portátil. Las piezas se ensamblan con el progreso del scroll, sin bucles de animación adicionales. En pantallas móviles altas ocupan el espacio inferior libre; en las pequeñas se reducen junto a la cabecera.

Referencia técnica: [transiciones entre documentos, documentación de Chrome](https://developer.chrome.com/docs/web-platform/view-transitions/cross-document) y [View Transition API, MDN](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API).

Comprobaciones: `check-editorial-entry.mjs` recorre los cinco proyectos en móvil y escritorio, verifica la transición real, la captura activa, la vuelta a la tarjeta, la composición y la preferencia de movimiento reducido. Incluye un recorrido de ida y vuelta desde la portada animada. `check-mobile-chapters.mjs` comprueba el encaje de las tarjetas a 360, 390, 412 y 768 px. Revisión visual de las capturas generadas en `.astro/editorial`. Compilación y presupuesto de peso con `npm run build` y `npm run measure`.
