import { useState } from 'react';
import { AsciiCanvas } from './components/AsciiCanvas';
import { BrandHeader } from './components/BrandHeader';
import { HintBar } from './components/HintBar';
import { ParameterPanel } from './components/ParameterPanel';
import { flowerRegistry, getFlower } from './flowers/registry';
import { useOpeningAnimation } from './hooks/useOpeningAnimation';
import { deserializeGiftLink } from './engine/shareLink';
import type { PaletteName, RenderState } from './engine/types';
import './styles/tokens.css';
import './styles/global.css';
import './styles/hud.css';

const gift = deserializeGiftLink();
const initialState: RenderState = { cell: 8, density: 1, bloom: 0, rise: 0, wind: .6, spin: .35, palette: 'botanical', color: true, yaw: .22, pitch: -.08, zoom: 1 };
export default function App() {
  const [selectedId, setSelectedId] = useState(gift?.flowerId ?? flowerRegistry[0].id);
  const [state, setState] = useState<RenderState>(() => gift ? { ...initialState, ...gift.state } : initialState);
  const flower = getFlower(selectedId);
  const opening = useOpeningAnimation(gift?.state.bloom ?? flower.targetBloom, selectedId);
  const currentState = { ...state, bloom: opening.bloom, rise: opening.rise };
  const change = (key: keyof RenderState, value: number | boolean | PaletteName) => {
    if (key === 'bloom') opening.setManualBloom(value as number);
    else setState(previous => ({ ...previous, [key]: value }));
  };
  const selectFlower = (id: string) => { setSelectedId(id); };
  return <><AsciiCanvas flower={flower} state={currentState} onOrbit={(yaw, pitch) => setState(previous => ({ ...previous, yaw, pitch }))} onZoom={zoom => setState(previous => ({ ...previous, zoom }))} /><div className="vignette" /><div className="hud"><BrandHeader flower={flower} />{!gift && <ParameterPanel state={currentState} flowers={flowerRegistry} selectedId={selectedId} isOpening={opening.isOpening} onChange={change} onFlowerChange={selectFlower} />}</div><HintBar /></>;
}
