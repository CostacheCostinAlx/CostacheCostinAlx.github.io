import { paletteOptions } from '../engine/palettes';
import type { PaletteName, RenderState } from '../engine/types';
import { FlowerSelector } from './FlowerSelector';
import { serializeGiftLink } from '../engine/shareLink';
import { useState } from 'react';

type Props = { state: RenderState; flowers: import('../engine/types').FlowerDefinition[]; selectedId: string; isOpening: boolean; onChange: (key: keyof RenderState, value: number | boolean | PaletteName) => void; onFlowerChange: (id: string) => void };
export function ParameterPanel({ state, flowers, selectedId, isOpening, onChange, onFlowerChange }: Props) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = serializeGiftLink(selectedId, state);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement('textarea');
      input.value = url; input.style.position = 'fixed'; input.style.opacity = '0';
      document.body.appendChild(input); input.select();
      const copiedByFallback = document.execCommand('copy');
      input.remove();
      if (!copiedByFallback) return;
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };
  const range = (key: keyof Pick<RenderState, 'cell' | 'density' | 'bloom' | 'wind' | 'spin'>, label: string, min: string, max: string, step: string, value: string) => (
    <div className="row"><div className="rowhead"><span>{label}</span><span className="value">{value}</span></div><input aria-label={label} type="range" min={min} max={max} step={step} value={state[key]} onChange={event => onChange(key, Number(event.target.value))} /></div>
  );
  return <section className="panel">
    <h2>LIVE PARAMETERS {isOpening && <span aria-label="opening">· OPENING</span>}</h2>
    {range('cell', 'CELL RESOLUTION', '5', '18', '1', `${state.cell}px`)}
    {range('density', 'GLYPH DENSITY', '.45', '1.7', '.05', state.density.toFixed(2))}
    {range('bloom', 'BLOOM OPENNESS', '0', '1', '.01', `${Math.round(state.bloom * 100)}%`)}
    {range('wind', 'WIND VELOCITY', '0', '1.5', '.01', state.wind.toFixed(2))}
    {range('spin', 'ORBIT VELOCITY', '0', '1.5', '.01', state.spin.toFixed(2))}
    <FlowerSelector flowers={flowers} selectedId={selectedId} onChange={onFlowerChange} />
    <div className="selectrow"><label htmlFor="palette">CHROMA</label><select id="palette" value={state.palette} onChange={event => onChange('palette', event.target.value as PaletteName)}>{paletteOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
    <div className="toggle"><span>COLOR ENCODING</span><button className={state.color ? 'on' : ''} onClick={() => onChange('color', !state.color)}>{state.color ? '● ACTIVE' : '○ MONO'}</button></div>
    <button className="share" onClick={share}>{copied ? '✓ LINK COPIED' : 'SHARE GIFT LINK'}</button>
  </section>;
}
