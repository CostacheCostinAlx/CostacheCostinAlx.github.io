import { flora03 } from './flora03';
import { flora04 } from './flora04';
import type { FlowerDefinition } from '../engine/types';

export const flowerRegistry: FlowerDefinition[] = [flora03, flora04];
export const getFlower = (id: string): FlowerDefinition => flowerRegistry.find(flower => flower.id === id) ?? flowerRegistry[0];
