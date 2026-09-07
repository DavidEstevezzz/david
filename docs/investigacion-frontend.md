# Investigación de navegación avanzada

Fecha de consulta: 7 de septiembre de 2026.

Este documento recoge referencias y propuestas. Ninguna de las experiencias descritas está implementada ni constituye una decisión de diseño aprobada.

## Conclusión propuesta

Desarrollar una portada narrativa con recorrido 3D guiado por el scroll y estaciones interactivas para mostrar proyectos. Conservar las fichas de proyectos y el contacto como páginas y enlaces accesibles directamente.

La base Astro + TypeScript sigue siendo válida. Three.js y GSAP con ScrollTrigger son las incorporaciones propuestas para una experiencia de este tipo. React es una opción de composición, no un requisito para dibujar una escena 3D.

## Referencias y alcance de la revisión

Se consultaron páginas originales, documentación técnica y casos publicados por sus autores. Se inspeccionaron también estados visuales de Lusion, Apple Vision Pro e Igloo en el navegador. Esto no constituye una auditoría de rendimiento o accesibilidad. Parte del vídeo de Apple no se reprodujo en este entorno; las conclusiones sobre técnicas no atribuidas por sus autores se presentan como propuestas de implementación.

| Referencia | Qué estudiar | Fuente |
| --- | --- | --- |
| Apple Vision Pro | Presentación por capítulos, jerarquía visual, grandes imágenes y relación entre explicación y detalle del producto. No se da por verificada una biblioteca concreta ni una implementación basada en secuencias de imágenes. | [Página original](https://www.apple.com/apple-vision-pro/) |
| Igloo Inc, por Abeto y Bureaux | Recorrido de cámara, transiciones entre escenas y partículas que forman objetos. Abeto documenta animación en tiempo real y herramientas como Three.js y GSAP. | [Experiencia](https://www.igloo.inc/) · [Caso escrito por Abeto, 2024](https://www.awwwards.com/igloo-inc-case-study.html) |
| Lusion | Composición de contenido editorial con una presentación 3D. La portada inspeccionada usa formas volumétricas y conserva navegación y contacto visibles. | [Página original](https://lusion.co/) |
| Devin AI, por Lusion | Presentar un producto de software complejo mediante narrativa, animación e interacción. Lusion confirma trabajo de WebGL y diseño 3D. La versión de referencia se encuentra archivada. | [Caso del estudio](https://lusion.co/projects/devin_ai/) · [Versión archivada](https://archive-devin-ai.lusion.co/) |
| Bruno Simon | Portfolio explorable conduciendo un vehículo; el autor explica el uso de Three.js y ofrece el código y los archivos de Blender. Es una referencia de navegación libre, diferente del recorrido guiado por scroll. | [Portfolio y explicación técnica](https://bruno-simon.com/) |
| Of The Oak, por Lusion | Geometría compleja entregada al navegador mediante exportación y compresión específicas e instancias WebGL. Referencia técnica para optimizar escenas. | [Caso del estudio](https://lusion.co/projects/of_the_oak/) |

## Técnicas que podríamos implementar

### 1. Cámara que sigue un recorrido tridimensional

La posición de scroll se transforma en un progreso entre cero y uno. Ese progreso controla la posición de la cámara a lo largo de una curva. Otra trayectoria o una secuencia de orientaciones define hacia dónde mira. El movimiento permite acercamientos, órbitas, cambios de altura y pasos entre escenarios.

Propuesta: Three.js para la escena, curvas Catmull-Rom para el recorrido y GSAP ScrollTrigger para sincronizarlo con capítulos del documento. Usar muestreo por longitud de curva y orientar la cámara cuidadosamente para evitar cambios bruscos. Establecer zonas donde la cámara se estabiliza mientras se lee.

Aplicación: viajar entre tres estaciones dedicadas a software de gestión, desarrollo web y automatización. En cada una se presenta un proyecto real y un acceso a su ficha.

Dificultad relativa: alta. El trabajo incluye guion, composición, modelos, movimiento de cámara y optimización.

Referencias: [Curvas de Three.js](https://threejs.org/docs/pages/CatmullRomCurve3.html), [muestreo por longitud](https://threejs.org/docs/pages/Curve.html), [ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/).

### 2. Presentación cinematográfica controlada por scroll

Una escena permanece en pantalla mientras los textos y el objeto avanzan por distintas fases. Podemos realizarla con 3D en tiempo real o con imágenes prerenderizadas, dibujando el fotograma correspondiente al progreso de scroll en un canvas.

Las imágenes prerenderizadas permiten un acabado visual controlado, pero fijan el punto de vista y requieren presupuestar descarga y memoria. El vídeo es otra alternativa, aunque la precisión y fluidez de los saltos dependen de su codificación y del dispositivo; no debe asumirse que equivale a una secuencia de imágenes.

Aplicación: presentar un sistema que se construye por capas, desde la necesidad inicial hasta una interfaz terminada y una demostración.

Dificultad relativa: media-alta; puede aumentar considerablemente con la producción audiovisual.

Referencia: [Secuencia de imágenes vinculada al scroll, GSAP](https://gsap.com/docs/v3/HelperFunctions/helpers/imageSequenceScrub/).

### 3. Portales entre proyectos

Una miniatura se convierte en un acceso a otra escena: crece, ocupa la pantalla y revela el proyecto. La versión más sencilla combina escalado, máscaras y continuidad entre elementos. La versión más compleja renderiza dos escenas y las mezcla mediante una máscara o un shader.

Aplicación: cada proyecto tiene su propio ambiente visual, unido a los demás mediante una transición común. El fondo puede cambiar mientras la tipografía y los controles mantienen coherencia.

Dificultad relativa: media-alta con HTML/CSS; alta con dos escenas 3D. Las dos escenas simultáneas aumentan el trabajo de la GPU durante el cruce.

### 4. Partículas y geometría que se transforman

Un conjunto de puntos cambia de distribución para formar distintos objetos. El movimiento puede responder a scroll, puntero o selección de un servicio. Una implementación posible interpola posiciones en la GPU y aplica perturbaciones mediante shaders.

Aplicación: puntos dispersos se organizan en conexiones, después en módulos de software y finalmente en una interfaz. La transformación representa el paso de procesos dispersos a una solución conectada.

Dificultad relativa: alta. Propuesta para un momento destacado de la portada o un cierre interactivo. La simulación no debe dificultar la lectura ni el contacto.

Referencia de una implementación real: [Caso de Igloo escrito por Abeto](https://www.awwwards.com/igloo-inc-case-study.html).

### 5. Profundidad con capas y perspectivas CSS

Tarjetas, pantallas y textos ocupan diferentes planos visuales. Se desplazan a velocidades distintas o giran para formar una composición espacial. Puede dar profundidad sin modelar un mundo completo.

Aplicación: la captura de un proyecto se divide en planos explicativos; una acción del usuario reúne las piezas y conduce a una demostración funcional.

Dificultad relativa: media. Es especialmente útil para una presentación donde las interfaces de software sean las protagonistas.

### 6. Un entorno libremente explorable

El visitante mueve un personaje, vehículo o cámara y descubre proyectos mediante zonas interactivas. Requiere resolver controles táctiles y de teclado, orientación, colisiones o límites, cámara y accesos rápidos.

Aplicación: un estudio virtual donde cada mesa o sala contiene una demostración.

Dificultad relativa: muy alta. Propuesta especialmente interesante como sección de laboratorio a la que se entra voluntariamente.

Referencia: [Portfolio de Bruno Simon](https://bruno-simon.com/).

## Cuatro direcciones para la web

### A. Recorrido por tus soluciones — recomendación principal

1. Entrada con nombre, servicio principal y una escena abstracta reconocible.
2. El scroll acerca la cámara a un conjunto de módulos que representa software de gestión. Aparece el caso de bomberos con contenido real pendiente de concretar.
3. La cámara cambia de perspectiva y llega a pantallas que presentan los proyectos web.
4. Un recorrido de conexiones conduce a una automatización que se puede probar con datos de ejemplo.
5. Las piezas se reúnen en una composición final con acceso claro al contacto.

Estética propuesta: espacio arquitectónico abstracto, materiales sobrios y un color de acento. La composición puede desarrollarse con geometría propia y pantallas, reduciendo la necesidad de modelar entornos realistas completos.

### B. Un sistema que se construye ante el visitante

Un único objeto o conjunto central evoluciona durante la visita. Primero muestra un proceso fragmentado; después aparecen conexiones, interfaz y automatización; finalmente se presentan proyectos que acreditan esa capacidad. El objeto puede descomponerse y girar mientras los textos permanecen legibles.

Combina secuencias fijadas al scroll, perspectivas, animación de ensamblado y demostraciones. Facilita una dirección visual cohesionada y orientada a empresas.

### C. Galería de proyectos con portales

Una galería visual conecta varios escenarios. Cada proyecto tiene una identidad propia y la transición lleva de la miniatura a una presentación inmersiva. Las fichas mantienen URL propia y pueden visitarse directamente.

Es la dirección más centrada en la diversidad del portfolio. Requiere trabajo artístico por proyecto y un sistema compartido de navegación.

### D. Estudio virtual explorable

Un pequeño entorno permite visitar zonas de software de gestión, webs y automatizaciones. Incluye un mapa o accesos directos a proyectos y contacto. Es la alternativa más cercana a un videojuego y la de mayor alcance de producción.

## Comparación orientativa

Las valoraciones son juicio de diseño para este proyecto; no son métricas medidas ni presupuestos.

| Dirección | Impacto visual potencial | Control del relato comercial | Producción y mantenimiento |
| --- | --- | --- | --- |
| A. Recorrido 3D guiado | Muy alto | Alto, mediante estaciones y capítulos | Altos |
| B. Sistema que se construye | Alto | Muy alto | Medios-altos |
| C. Galería con portales | Muy alto | Alto, centrado en proyectos | Altos; arte específico por caso |
| D. Estudio explorable | Muy alto | Depende de las decisiones del visitante | Muy altos |

## Arquitectura de implementación propuesta

- Astro entrega los títulos, textos, enlaces y fichas en HTML.
- Un componente controla el canvas 3D de la portada y su ciclo de vida.
- GSAP ScrollTrigger coordina cámara, objetos y transiciones con el desplazamiento.
- El modelo de capítulos permite saltar a un proyecto sin recorrer toda la introducción.
- Las demostraciones con estado pueden implementarse con React o TypeScript según su complejidad.
- Los modelos y texturas se preparan en Blender si la dirección requiere esos recursos.
- El runtime del navegador renderiza la escena; el VPS entrega los archivos y atiende las funciones de servidor que se incorporen.
- El suavizado del scroll sería una decisión posterior basada en pruebas, no una dependencia inicial obligatoria.

## Calidad que forma parte de la experiencia

- Mantener scroll y enlaces utilizables por teclado y táctil, con movimiento reducido cuando corresponda.
- Mantener a mano proyectos y contacto incluso durante la parte inmersiva.
- Presupuestar geometría, texturas, resolución del canvas, descarga y tiempo de renderizado.
- Cargar los capítulos próximos de manera progresiva y pausar animaciones fuera de vista.
- Diseñar una adaptación móvil con encuadres y densidad de efectos propios.
- Si no se dispone de renderizado 3D, mostrar una composición alternativa que conserve el contenido y los enlaces.
- Medir continuidad del recorrido, apertura de fichas y contactos: más permanencia por sí sola no demuestra mejores resultados comerciales.

## Siguiente decisión

Elegir una dirección y elaborar un guion visual de entre cuatro y seis escenas. Definir para cada escena qué ve el visitante, qué entiende, cómo cambia la cámara y qué puede hacer. El siguiente prototipo, cuando se autorice empezar a programar, debería validar una transición y su adaptación móvil antes de producir todos los escenarios.
