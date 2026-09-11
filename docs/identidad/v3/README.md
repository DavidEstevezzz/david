# Identidad — tercera vuelta · DÉM

Decisión tomada por David: **se quedan las iniciales DEM y se queda la paleta
verde actual**. Esta vuelta no discute eso; arregla lo único que `dem` hacía mal
de verdad —morirse a tamaño pequeño— y le pone encima la tilde.

La versión leíble está en `propuesta.html`.

**Nada de esto está aplicado al sitio.** Faltan dos decisiones (ver abajo).

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

1. **Qué corte.** Instrument Serif, Bricolage Grotesque o Anybody. Archivo también
   aguanta el bloque, y es la opción de no añadir ningún `woff2`.
2. **Qué va en el favicon.** El bloque o la tilde.

## Pendiente en el código, independiente de lo anterior

- `--color-accent` declarado dos veces en `:root`; gana `identity.css` sobre
  `tokens.css`, así que el terracota `#b94326` no se aplica en ninguna parte.
- `site.ts` → `ogImageAlt` empieza por «dem».
- 9 `aria-label="dem…"`.
