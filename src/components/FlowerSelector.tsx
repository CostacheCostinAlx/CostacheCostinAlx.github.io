import type { FlowerDefinition } from '../engine/types';

type Props = { flowers: FlowerDefinition[]; selectedId: string; onChange: (id: string) => void };
export function FlowerSelector({ flowers, selectedId, onChange }: Props) {
  return <div className="selectrow"><label htmlFor="flower">FLOWER</label><select id="flower" value={selectedId} onChange={event => onChange(event.target.value)}>{flowers.map(flower => <option key={flower.id} value={flower.id}>FLORA / {flower.label} - {flower.name}</option>)}</select></div>;
}
