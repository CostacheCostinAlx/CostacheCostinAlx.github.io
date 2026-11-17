export type Vec3 = { x: number; y: number; z: number };
export type PaletteName = 'botanical' | 'neon' | 'matrix' | 'amber';
export type RGB = [number, number, number];

export type RenderState = {
  cell: number;
  density: number;
  bloom: number;
  rise: number;
  wind: number;
  spin: number;
  palette: PaletteName;
  color: boolean;
  yaw: number;
  pitch: number;
  zoom: number;
};

export type RenderSurface = {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  buffer: HTMLCanvasElement;
  bufferContext: CanvasRenderingContext2D;
  depth: HTMLCanvasElement;
  depthContext: CanvasRenderingContext2D;
  normal: HTMLCanvasElement;
  normalContext: CanvasRenderingContext2D;
};

export type FlowerDefinition = {
  id: string;
  label: string;
  name: string;
  targetBloom: number;
  render: (surface: RenderSurface, state: RenderState, time: number) => void;
};
