# Identidad — tercera vuelta · DÉM

Decisión tomada por David: **se quedan las iniciales DEM y se queda la paleta
verde actual**. Esta vuelta no discute eso; arregla lo único que `dem` hacía mal
de verdad —morirse a tamaño pequeño— y le pone encima la tilde.

La versión leíble está en `propuesta.html`.

**Nada de esto está aplicado al sitio.** Faltan dos decisiones (ver abajo).

## Estado: el bloque, afinado

La primera versión del bloque justificaba las filas por su **avance tipográfico**,
que incluye los espacios laterales del glifo. Dos filas con el mismo avance tienen
manchas distintas: DÉ y M se llevaban 11,95 px de ancho sobre 141 (un 8,5 %), y el
bloque quedaba descentrado 12,8 px. Ahora todo se mide sobre la tinta:
`fit_ink()` busca el valor del eje de anchura que hace que la mancha de cada fila
mida exactamente lo mismo. Medido sobre el SVG a 1024 px: 0,29 px de diferencia
entre filas y 0,24 px de desviación horizontal.

En vertical las letras van un 4,8 % por debajo del centro matemático, a propósito:
la tilde añade masa arriba y el ojo lo compensa. El desplazamiento es un tercio del
alto de la tilde.

**El bloque solo sale en Anybody.** Para que la M mida lo mismo que la DÉ hay que
estirarla por el eje de anchura, y:

| Fuente | Eje wdth | La M alcanza | |
|---|---|---|---|
| Anybody | 50–150 | 1,76:1 | llega |
| Bricolage Grotesque | 75–100 | 1,12:1 | se queda corta |
| Archivo (la que ya sirves) | no tiene | 1,03:1 | la DÉ se comprime y las letras se solapan |

Cuesta un `woff2` más. Y como la M no pasa de 1,76:1 y dos filas apiladas piden
2,1:1, el bloque es un rectángulo vertical, no un cuadrado a sangre: hay más aire
a los lados que arriba y abajo. Forzarlo sería deformar la M.

## Las dos tejas

| Teja | Fondo | Teja | Letras | Tilde |
|---|---|---|---|---|
| **Lima** | oscuro o de color | `#dcf89c` | `#17231c` | `#526f3c` |
| **Tinta** | claro y neutro | `#17231c` | `#edf0e7` | `#dcf89c` |

Sobre papel funcionan las dos: la lima cuando la marca lleva la voz, la tinta
cuando acompaña a un texto. Sobre tinta y sobre oliva, siempre la lima.

## Las tres piezas

| Pieza | Qué es | Dónde |
|---|---|---|
| **Bloque** | DÉ sobre M, las dos filas al mismo ancho: un cuadrado hecho de letras | Icono, avatar, cabecera, a partir de 32 px |
| **Línea** | DÉM de corrido, la tilde ampliada | Cabeceras anchas, papelería, tarjeta social |
| **Tilde** | El acento suelto | Favicon, cursor, viñetas, indicador de scroll |

El bloque sustituye a las tres letras en fila, que es donde estaba el fallo: tres
letras anchas se empastan a 16 px, y por eso `build-brand-assets.mjs` tenía que
recortar la marca y dejar una `d` suelta. Apiladas y justificadas al mismo ancho
dan un cuadrado, que es la forma que pide un favicon.

Honestidad sobre el tamaño: a 32 px se leen las tres letras; a 16 px se ve el
bloque pero no se lee «DÉM». Ninguna marca de tres letras se libra de eso. Ese es
el motivo de que exista el nivel de la tilde.

## Regla de color

El acento cambia con el fondo: lima `#dcf89c` sobre tinta `#17231c` (13,88:1),
oliva `#526f3c` sobre papel `#edf0e7` (4,93:1). **Nunca lima sobre papel**: 1,01:1,
invisible.

## Pendiente de decidir

1. **Qué va en el favicon.** El bloque (se ve a 24 px, a 16 px es silueta) o la
   tilde sola (legible a cualquier tamaño, pero no dice «DÉM»).
2. **Si se acepta el `woff2` de Anybody.** Sin él no hay bloque.

## Pendiente en el código, independiente de lo anterior

- `--color-accent` declarado dos veces en `:root`; gana `identity.css` sobre
  `tokens.css`, así que el terracota `#b94326` no se aplica en ninguna parte.
- `site.ts` → `ogImageAlt` empieza por «dem».
- 9 `aria-label="dem…"`.
