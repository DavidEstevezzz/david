# Identidad — propuesta

Diagnóstico de la marca actual (`dem`) y cuatro direcciones para sustituirla.
La versión leíble, con las piezas aplicadas a la web, está en `propuesta.html`
(y publicada como artifact).

**Nada de esto está aplicado al sitio todavía.** Son candidatas.

## Las direcciones

| | Dirección | Idea | Icono |
|---|---|---|---|
| **A** | El acento | La É de Estévez con la tilde crecida, más el nombre | sí, a 16 px |
| **B** | La firma | Solo el nombre, en versales y con las tildes en color | no |
| **C** | El acento solo | La tilde suelta, sin la letra | sí, a 16 px |
| **D** | Monograma DE | D y E superpuestas, con el cruce vaciado | se empasta bajo 24 px |

Recomendada: **A** como marca, con **C** para avatar y movimiento y la firma
larga para contacto y presupuestos. Salen las tres de la misma raíz.

## Cómo están hechas

Curvas reales de Archivo —la misma fuente que ya sirve la web— extraídas con
fontTools y compuestas con HarfBuzz para que el kerning sea el de la fuente.
Lo único dibujado a mano es la proporción de la tilde: pasa del 19 % de la
altura de mayúscula que tiene en Archivo al 34 %, y se separa un 15 % más.

## Regla de color

El acento cambia con el fondo. Contrastes WCAG 2.1 medidos:

| Combinación | Contraste | |
|---|---|---|
| Lima `#dcf89c` sobre tinta `#17231c` | 13,88:1 | AAA |
| Lima sobre papel `#edf0e7` | 1,01:1 | invisible — nunca |
| Oliva `#526f3c` sobre papel | 4,93:1 | AA |
| Oliva sobre tinta | 2,86:1 | falla — nunca |

## Pendiente, y no es de dibujo

- `--color-accent` se declara dos veces en `:root`: `#b94326` en `tokens.css` y
  `#526f3c` en `identity.css`. Gana identity por orden de importación en
  `Shell.astro`, así que el terracota del archivo de tokens no se aplica en
  ningún sitio.
- 207 colores distintos escritos a mano entre las hojas de `src/styles`.
- `site.ts` → `ogImageAlt` empieza por «dem».
- 9 `aria-label="dem…"` en portada, fichas, laboratorio y 404.
