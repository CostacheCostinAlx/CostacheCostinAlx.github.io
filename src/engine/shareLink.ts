import type { PaletteName, RenderState } from './types';
import { palettes } from './palettes';

export type GiftState = {
  flowerId: string;
  state: Pick<RenderState, 'cell' | 'density' | 'bloom' | 'wind' | 'spin' | 'palette' | 'color'>;
};

const number = (value: string | null, min: number, max: number, fallback: number) => {
  const parsed = value === null ? NaN : Number(value);
  return Number.isFinite(parsed) ? Math.max(min, Math.min(max, parsed)) : fallback;
};

export function serializeGiftLink(flowerId: string, state: RenderState): string {
  const params = new URLSearchParams({
    gift: '1', flower: flowerId, cell: String(state.cell), density: String(state.density),
    bloom: String(state.bloom), wind: String(state.wind), spin: String(state.spin),
    palette: state.palette, color: state.color ? '1' : '0',
  });
  return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
}

export function deserializeGiftLink(search = window.location.search): GiftState | null {
  const params = new URLSearchParams(search);
  if (params.get('gift') !== '1' || !params.get('flower')) return null;
  const palette = params.get('palette') as PaletteName | null;
  return {
    flowerId: params.get('flower')!,
    state: {
      cell: number(params.get('cell'), 5, 18, 8),
      density: number(params.get('density'), .45, 1.7, 1),
      bloom: number(params.get('bloom'), 0, 1, .72),
      wind: number(params.get('wind'), 0, 1.5, .6),
      spin: number(params.get('spin'), 0, 1.5, .35),
      palette: palette && palette in palettes ? palette : 'botanical',
      color: params.get('color') !== '0',
    },
  };
}
