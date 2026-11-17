import { renderFlora04 } from './render';
import type { FlowerDefinition } from '../../engine/types';

export const flora04: FlowerDefinition = {
  id: 'flora04',
  label: '04',
  name: 'ASCII Rose',
  targetBloom: .78,
  render: renderFlora04,
};
