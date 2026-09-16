# Ilustraciones de los servicios

## Referencias y decisión

Referencias consultadas el 16 de septiembre de 2026:

- [Linear · Features](https://linear.app/features): tarjetas con diagramas y una jerarquía clara entre ilustración y mensaje. Referencia para el trazo técnico y la consistencia entre las tres composiciones.
- [Stripe · Payments](https://stripe.com/en-es/payments): interfaces que representan la función del producto. Referencia para comunicar software y desarrollo web con elementos reconocibles.
- [Vercel · Design Engineer Principles](https://vercel.com/design/engineer): utilidad, atención al contexto y cuidado del rendimiento. Referencia para decidir el alcance de la animación.

Se valoraron tres vías: símbolos lineales (claros, pero con poca presencia en este espacio), objetos 3D (más protagonismo visual y mayor complejidad) y diagramas de interfaces (significado concreto, detalle técnico y continuidad con la pantalla del portátil). Se implementa la tercera, con dibujos originales adaptados a la paleta de la página.

## Sistema visual

- **Software:** una interfaz modular, con una pieza destacada que se aproxima a su posición al avanzar por la escena.
- **Web:** un navegador y un móvil con una misma composición gráfica, para representar adaptación entre pantallas.
- **Automatización:** mensajes y datos que pasan por un nodo de conexión hacia correo y calendario. Las conexiones se trazan con el desplazamiento.

Tinta verde/gris, fondos claros, acentos lima y pequeñas guías de dibujo. Los gráficos son conceptuales: no muestran estadísticas de clientes ni prometen resultados medidos.

## Integración

SVG inline y CSS, sin imágenes externas, librerías nuevas, bucles de animación ni renderizadores adicionales. Se reutiliza `--object-progress` de la escena existente para que el movimiento acompañe el scroll y se invierta al retroceder.

Las tarjetas compactas de la escena móvil muestran versiones simplificadas de los tres dibujos. La vista estática conserva las ilustraciones completas. Los gráficos son decorativos y quedan fuera del árbol de accesibilidad; el contenido del servicio permanece en los títulos y párrafos. Con movimiento reducido, las piezas y conexiones se muestran en su estado final.
