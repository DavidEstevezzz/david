# Identidad — segunda vuelta

Tres caminos distintos, después de que la primera vuelta no convenciera por dos
motivos concretos: el montaje (icono en caja + nombre al lado) y la tipografía.
La versión leíble está en `propuesta.html`.

**Nada de esto está aplicado al sitio.** Son candidatas.

| | Camino | Idea | Tipografía | Icono a 16 px |
|---|---|---|---|---|
| **1** | Placa | El nombre entero en tres líneas de anchura idéntica | Anybody | E cuadrada |
| **2** | ÉM | Iniciales del dominio, E y M compartiendo asta | Anybody 780 | sí |
| **3** | Acento | «Estévez» con la tilde crecida ×1,55 dentro | Bricolage Grotesque | flojo |

Si hay que elegir una: **Placa**. Es la única que no pide descifrar nada y la que
menos se parece a lo que hace todo el mundo.

## Lo que se tiró de la primera vuelta

- **La caja redondeada.** Un cuadrado con esquinas redondeadas y una letra dentro
  es el envase por defecto. Ahora solo aparece en el favicon.
- **El icono con el nombre al lado.** Son dos cosas pegadas, no una. Cada camino
  es ahora una sola composición.
- **Archivo para el logotipo.** Se queda como tipografía de interfaz, pero compone
  un logotipo neutro.

## Cómo se generan

`marks2.py` dibuja las tres marcas con las curvas reales de cada fuente:
`fontlab.py` instancia la variable, compone con HarfBuzz (kerning de la fuente) y
separa la tilde en su propia capa para poder colorearla; `pathutil.py` calcula
cajas envolventes de paths con comandos `H`/`V`.

Dependencias: `fonttools`, `uharfbuzz`, `brotli`. Las fuentes se bajan del
repositorio de Google Fonts a `fonts/` (OFL, redistribuibles).

La placa usa `fit_width()`: una búsqueda binaria sobre el eje de anchura que
estira cada línea hasta una medida exacta. DAVID acaba en anchura 141 y MARTÍNEZ
en 86. No es texto deformado; es el eje que la fuente trae diseñado.

## Pendiente, igual que en la primera vuelta

- `--color-accent` declarado dos veces en `:root`; gana `identity.css`.
- `site.ts` → `ogImageAlt` empieza por «dem».
- 9 `aria-label="dem…"`.
