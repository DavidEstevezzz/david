# Respuesta al scroll móvil — 9 septiembre 2026

## Final de las tarjetas y entrada a proyectos

Las capturas del usuario muestran crecimiento al terminar el relevo. Se elimina
el cambio de medidas explícitas a una cuadrícula fixed con inset:0: todas las
tarjetas usan mobileCardRects hasta salir y la capa conserva la altura medida
de la escena. Así no adopta otra altura cuando cambian las barras del navegador.

El fondo claro continúa detrás de las tarjetas. Entre p=0,89 y 1, el conjunto
sube y proyectos entra por su borde inferior; ambos comparten el mismo avance.
Se elimina el fundido de salida y las esquinas oscuras del siguiente bloque.
Pruebas en cuatro tamaños: medidas estables de 0,81 a 0,89 y bordes contiguos
durante la salida, también al retroceder. Capturas revisadas a 390×844.

## Continuidad entre filas y tarjetas

El orden del contenido es software, web y automatización desde la pantalla del
portátil. Entre p=0,66 y 0,81 las filas amplían su rectángulo hasta coincidir con
las tarjetas finales. Ambas representaciones usan las mismas coordenadas y
colores. El título se retira; los textos breves salen antes de entrar los textos
completos, evitando superponer letras diferentes. La superficie permanece visible.
No se añade recorrido de scroll ni se modifica la apertura del portátil.

La prueba de capítulos compara los rectángulos de filas y tarjetas en siete
puntos, avanzando y retrocediendo, en cuatro tamaños: diferencia menor de 1 px.

## Continuación del contenido y tarjetas en filas

Se conserva la entrada hasta p=0,49. Entre 0,50 y 0,64 el contenido original
sube y los tres servicios pasan a filas con una breve descripción. Se miden
sus posiciones al entrar y se interpolan, sin sustituir el título. El inicio
de las filas respeta el final del párrafo, también en tabletas.

Entre 0,68 y 0,81 entran las tres tarjetas originales en una cuadrícula de
tres filas. En móvil se desactivan sus planos y textos CSS3D para evitar
duplicados o tarjetas superpuestas. Entre 0,93 y 0,985 ceden paso a proyectos.
Escritorio conserva sus tarjetas proyectadas. No se aumenta el recorrido total.

`check-mobile-chapters.mjs` comprueba cuatro tamaños (360×640, 390×844,
412×915 y 768×1024), separación respecto al título, filas sin solapamiento,
contenido sin recorte, retroceso y restauración estática. Compilación correcta.

Chrome: el usuario confirma que el descuadre y la menor fluidez aparecen en
Chrome del mismo iPhone. No se han aplicado cambios de suavizado ni correcciones
geométricas sin reproducción. El comportamiento específico de ese dispositivo
queda sin verificar. CSS3DRenderer documenta soporte solo de zoom al 100 %:
https://threejs.org/docs/pages/CSS3DRenderer.html

## Estado definitivo tras la revisión de la transición

WebGL es ahora la única experiencia animada, también sin parámetros. Se ha
retirado `mobile-home.ts` y su CSS de portátil alternativo. `?render=webgl`
abre la misma experiencia; `?render=html` conserva la alternativa accesible.

La posición, cámara y apertura hasta p=0,25 se conservan tal como estaban en
WebGL. Solo cambia la entrada móvil: entre 0,25 y 0,36 la cámara llega de frente
a una pantalla que ocupa el 90 % del ancho. En 0,36 el mismo elemento HTML pasa
a una capa plana con el rectángulo exacto de la proyección. Entre 0,36 y 0,49
se amplían la superficie y la tipografía mediante valores continuos. El marco
se desvanece entre 0,36 y 0,43. No hay cambio a la clase de layout portrait,
clones de títulos ni traslado repetido entre capas en cada fotograma.

`scripts/check-screen-entry.mjs` verifica el relevo y la vuelta a 3D: desviación
inferior a 0,006 px en el título en 360×640, 390×844 y 768×1024, un único elemento
y sin desbordamiento del título. Capturas revisadas en móvil. Estas mediciones
son geométricas en Edge emulado, no una valoración de fluidez en Safari físico.

Lo siguiente documenta la primera iteración, anterior a unificar las versiones.

El usuario confirma que la pesadez aparece tanto en la home normal como con
`?render=webgl`. Este checkout no contiene los documentos `movil-acto2-ritmo.md`
y `movil-plan-y-fase1.md` mencionados en el resumen; se parte del código presente.

## Cambios

- Home normal: recorrido de 1,6 a 1,2 alturas de pantalla (track de 260 a
  220 svh). La apertura empieza en progreso cero y combina una respuesta lineal
  del 65 % con smoothstep del 35 %, evitando la respuesta casi nula inicial.
- WebGL hasta 820 px: wrapper de recorrido con stage sticky nativo, sin pin ni
  tween de scrub. Se lee el progreso directamente del scroll en el render.
  Recorrido de 4,8 a 3,2 alturas del stage, con la misma curva de apertura que
  la home móvil normal. Se conserva el resto de fases y composición.
- Canvas, proyección HTML y punto de lectura plano anclados al viewport en esa
  rama. Se restaura su posición al desmontar o cambiar de modo.
- La cámara de la historia conserva la proyección calculada junto a CSS3D;
  drawScene ya no la recalcula por separado.

No se intercepta el gesto táctil ni se activa normalizeScroll. Estos cambios
son una propuesta funcional, no una demostración de la causa del problema en
Safari. No se ha eliminado CSS3D ni se atribuye a él un coste medido.

## Verificación

`npm run build` y `scripts/check-mobile-scroll.mjs` contra el preview de producción.
El script acepta PLAYWRIGHT_MODULE con la URL de una instalación de Playwright.
Prueba 390×844 en ambas variantes, 768×1024 WebGL y 1440×900 escritorio;
muestrea avance y retroceso, anclaje, desbordamiento, llegada a proyectos,
desmontaje y reactivación, orientación y movimiento reducido.

La comprobación automatizada usa Edge con emulación móvil. No mide el scroll
del compositor de Safari ni sustituye la prueba del gesto en el iPhone físico.
Comparar allí la home normal y `?render=webgl`, especialmente con movimientos
cortos durante la apertura y al invertir la dirección. El diseño del acto 3
sigue pendiente.
