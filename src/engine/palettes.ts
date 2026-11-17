import type { PaletteName, RGB } from './types';

export type Palette = { bg: RGB; low: RGB; high: RGB; petal: RGB; leaf: RGB; gold: RGB };

export const palettes: Record<PaletteName, Palette> = {
  botanical: { bg: [2, 10, 8], low: [12, 56, 39], high: [214, 255, 177], petal: [255, 94, 173], leaf: [64, 208, 126], gold: [255, 205, 75] },
  neon: { bg: [3, 3, 18], low: [23, 10, 79], high: [240, 248, 255], petal: [255, 38, 151], leaf: [28, 255, 211], gold: [255, 221, 42] },
  matrix: { bg: [0, 5, 1], low: [2, 35, 13], high: [168, 255, 155], petal: [32, 207, 75], leaf: [26, 200, 75], gold: [144, 255, 50] },
  amber: { bg: [12, 7, 2], low: [57, 28, 8], high: [255, 232, 143], petal: [237, 104, 28], leaf: [192, 135, 31], gold: [255, 211, 74] },
};

export const paletteOptions: { value: PaletteName; label: string }[] = [
  { value: 'botanical', label: 'Botanical Bloom' },
  { value: 'neon', label: 'Cyberpunk Neon' },
  { value: 'matrix', label: 'Matrix Green' },
  { value: 'amber', label: 'Amber CRT' },
];
