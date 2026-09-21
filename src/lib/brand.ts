// ============================================================
//  LA MARCA — FUENTE ÚNICA DE VERDAD DE LA GEOMETRÍA
// ============================================================
//  DÉM: las tres iniciales en dos filas de idéntica anchura de
//  mancha, con la tilde de Estévez como único elemento en color.
//
//  Las letras vienen de Anybody (SIL OFL) ya convertidas a
//  trazado, así que el sitio NO carga ninguna tipografía extra
//  por la marca. El nombre que acompaña al bloque se compone
//  como texto vivo en Archivo: pesa menos y se puede seleccionar,
//  traducir e indexar.
//
//  Regenerar con  docs/identidad/v3/marks4.py  si cambia el dibujo.
// ============================================================

/** Un trazado con su posición y escala dentro de la caja del bloque. */
export interface BrandPath {
  x: number;
  y: number;
  s: number;
  d: string;
}

/**
 * El bloque, en una caja de 64×64.
 * `letters` son las dos filas (DÉ arriba, M abajo); van del color de la
 * marca. `accent` es la tilde y va siempre del color de realce.
 */
export const brandBlock = {
  box: 64,
  radius: 13.12,
  viewBox: '0 0 64 64',
  letters: [
    { x: 14.654, y: 32.973, s: 1.0,
      d: 'M1.05 0.00H11.09Q15.10 0.00 16.58 -2.15Q18.06 -4.30 18.06 -9.61Q18.06 -14.92 16.59 -17.06Q15.11 -19.20 11.09 -19.20H1.05Z M6.33 -3.60V-15.59H9.63Q11.26 -15.59 12.02 -14.71Q12.77 -13.83 12.77 -9.61Q12.77 -5.39 12.02 -4.49Q11.26 -3.60 9.63 -3.60Z M19.84 0.00H33.66V-3.60H25.14V-7.98H33.02V-11.42H25.14V-15.59H33.66V-19.20H19.84Z' },
    { x: 13.794, y: 53.323, s: 1.0,
      d: 'M1.91 0.00H8.34V-14.88H8.39L14.29 -0.42H22.11L28.01 -14.88H28.07V0.00H34.50V-19.20H23.95L18.22 -4.84H18.18L12.45 -19.20H1.91Z' },
  ] as BrandPath[],
  accent: { x: 2.637, y: 41.125, s: 1.45,
    d: 'M23.82 -19.79H26.19L29.59 -22.89H26.10Z' } as BrandPath,
};

/**
 * La tilde suelta: el nivel más pequeño del sistema. Un trazo macizo sin
 * contraforma, legible donde el bloque ya sería una mancha.
 */
export const brandTilde = {
  viewBox: '18.350 -80.630 20.800 11.030',
  d: 'M18.35 -69.60H26.80L39.15 -80.63H26.63Z',
};

/** Las dos tejas. Se elige por el fondo que haya detrás, no por gusto. */
export const brandTiles = {
  /** Sobre fondo oscuro o de color. La que más se ve. */
  lima: { tile: '#dcf89c', ink: '#17231c', accent: '#526f3c' },
  /** Sobre fondo claro y neutro. La sobria. */
  tinta: { tile: '#17231c', ink: '#edf0e7', accent: '#dcf89c' },
} as const;

export type BrandTile = keyof typeof brandTiles;
