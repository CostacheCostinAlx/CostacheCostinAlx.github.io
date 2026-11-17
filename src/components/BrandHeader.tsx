import type { FlowerDefinition } from '../engine/types';

type Props = { flower: FlowerDefinition };
export function BrandHeader({ flower }: Props) {
  return <div className="brand"><b>FLORA / {flower.label}</b><span>{flower.name.toUpperCase()} · ASCII BOTANICAL OBSERVATORY</span></div>;
}
