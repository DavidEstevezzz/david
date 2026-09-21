# Revisión móvil — 8 septiembre 2026

- Portada hasta 820 px: apertura del portátil con capas CSS, scroll nativo y una actualización por frame solicitado. No descarga ni crea el renderizador WebGL de escritorio.
- Pantalla del portátil adaptada al formato vertical; tres servicios completos en flujo normal, sin proyección ni superposición.
- Se mantienen el recorrido 3D de escritorio, la vista estática y la preferencia de movimiento reducido.
- Proyectos y contacto: una columna hasta 820 px, enlaces táctiles de al menos 44 px y ajustes de lectura.
- Fichas: mejoras de tipografía, capturas, demos, tablas y gráficas en móvil.
- Laboratorio: altura natural en pantallas cortas y salto al resultado también sin animación.

Validado sobre la compilación de producción: 320×568, 360×640, 390×844, 412×915, 768×1024, 915×412 y 1440×900. Sin desbordamientos horizontales ni errores JavaScript en la portada. Las cinco fichas revisadas a 320 y 390 px. Verificados ida y vuelta al laboratorio, cambio de orientación, cambio móvil/escritorio, movimiento reducido, botón de vista estática y acceso sin JavaScript.

Pruebas con Edge en emulación móvil. Pendiente la valoración de fluidez en el teléfono físico del usuario; no se atribuye una tasa de FPS medida en hardware móvil.
