import { renderFlora03 } from './render';
import type { FlowerDefinition } from '../../engine/types';

export const flora03: FlowerDefinition = {
  id: 'flora03',
  label: '03',
  name: 'ASCII Bloom',
  targetBloom: .72,
  render: renderFlora03,
};
