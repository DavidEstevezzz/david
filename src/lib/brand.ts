// Shared geometry for the site signature, exported assets and laptop engraving.
// The bowls and arches are true elliptical quadrants (control handles at
// 0.5523 of each radius) instead of the hand-rounded curves they replace: same
// extremes, same rhythm, but round where the mark reads roundest — at the size
// the lid engraving is inspected, the old two-handle approximations flattened
// visibly at the sides.
export const brandMark = {
  viewBox: '0 0 116 46',
  paths: [
    'M28 6v32M28 25.5C28 18.6 22.63 13 16 13S4 18.6 4 25.5s5.37 12.5 12 12.5 12-6.9 12-12.5',
    'M40 25.5h23C63 18.6 57.85 13 51.5 13S40 18.6 40 25.5s5.15 12.5 11.5 12.5c3.4 0 6.67-1.69 8.81-4.46',
    'M75 38V14m0 8C75 17.03 79.03 13 84 13s9 4.03 9 9v16m0-16C93 17.03 97.03 13 102 13s9 4.03 9 9v16',
  ],
  strokeWidth: 3.5,
};
