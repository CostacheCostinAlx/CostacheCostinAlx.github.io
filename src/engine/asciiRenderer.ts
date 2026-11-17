import { palettes } from './palettes';
import { rotate } from './math3d';
import type { RGB, RenderState, RenderSurface, Vec3 } from './types';

const glyphs = ' .:-=+*#%@';
type Point = { x: number; y: number; z: number; s: number };
type Primitive = { p: Point[]; col: RGB; glow: number; averageZ: number };
export type DepthDrawable = {
  z: number;
  draw: (surface: RenderSurface) => void;
};

export class DepthQueue {
  private readonly drawables: DepthDrawable[] = [];

  add(z: number, draw: DepthDrawable['draw']): void {
    this.drawables.push({ z, draw });
  }

  flush(surface: RenderSurface): void {
    this.drawables.sort((a, b) => a.z - b.z);
    for (const drawable of this.drawables) drawable.draw(surface);
    this.drawables.length = 0;
  }
}

export class AsciiRenderer {
  private readonly surface: RenderSurface;
  private dragging = false;
  private fontCell = -1;
  private fontWidth = -1;
  private fontHeight = -1;

  constructor(canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d', { alpha: false });
    const buffer = document.createElement('canvas');
    const bufferContext = buffer.getContext('2d', { alpha: false, willReadFrequently: true });
    const depth = document.createElement('canvas');
    const depthContext = depth.getContext('2d', { alpha: true, willReadFrequently: true });
    const normal = document.createElement('canvas');
    const normalContext = normal.getContext('2d', { alpha: true, willReadFrequently: true });
    if (!context || !bufferContext || !depthContext || !normalContext) throw new Error('Canvas rendering is unavailable.');
    this.surface = { canvas, context, buffer, bufferContext, depth, depthContext, normal, normalContext };
  }

  resize(): void {
    const { canvas, buffer, depth, normal } = this.surface;
    canvas.width = innerWidth; canvas.height = innerHeight;
    const scale = Math.min(1, 480 / innerWidth);
    buffer.width = Math.max(1, Math.round(innerWidth * scale)); buffer.height = Math.max(1, Math.round(innerHeight * scale));
    depth.width = normal.width = buffer.width; depth.height = normal.height = buffer.height;
    this.fontCell = -1; this.fontWidth = -1; this.fontHeight = -1;
  }

  setDragging(value: boolean): void { this.dragging = value; }
  isDragging(): boolean { return this.dragging; }

  draw(flower: (surface: RenderSurface, state: RenderState, time: number) => void, state: RenderState, time: number): void {
    flower(this.surface, state, time);
    this.ascii(state);
  }

  private ascii(state: RenderState): void {
    const { canvas, context: ctx, buffer, bufferContext: bctx, depth, normal } = this.surface;
    const W = canvas.width, H = canvas.height, cell = state.cell;
    ctx.fillStyle = rgb(palettes[state.palette].bg); ctx.fillRect(0, 0, W, H);
    if (this.fontCell !== cell || this.fontWidth !== W || this.fontHeight !== H) {
      ctx.font = `${Math.max(8, cell * 1.18)}px ui-monospace,monospace`;
      ctx.textBaseline = 'top';
      this.fontCell = cell; this.fontWidth = W; this.fontHeight = H;
    }
    const colorPixels = bctx.getImageData(0, 0, buffer.width, buffer.height).data;
    const depthPixels = this.surface.depthContext.getImageData(0, 0, depth.width, depth.height).data;
    const normalPixels = this.surface.normalContext.getImageData(0, 0, normal.width, normal.height).data;
    const sx = buffer.width / W, sy = buffer.height / H, pal = palettes[state.palette];
    for (let y = 0; y < H; y += cell) for (let x = 0; x < W; x += cell) {
      const bx = Math.min(buffer.width - 1, Math.floor(x * sx + cell * sx * .5));
      const by = Math.min(buffer.height - 1, Math.floor(y * sy + cell * sy * .5));
      const offset = (by * buffer.width + bx) * 4;
      const pix = colorPixels.subarray(offset, offset + 4);
      const lum = (pix[0] * .2126 + pix[1] * .7152 + pix[2] * .0722) / 255;
      const d = depthPixels[offset + 3] / 255, nPix = normalPixels.subarray(offset, offset + 4);
      if (lum < .025 || d < .05) continue;
      const left = colorPixels.subarray((by * buffer.width + Math.max(0, bx - 2)) * 4, (by * buffer.width + Math.max(0, bx - 2)) * 4 + 4);
      const right = colorPixels.subarray((by * buffer.width + Math.min(buffer.width - 1, bx + 2)) * 4, (by * buffer.width + Math.min(buffer.width - 1, bx + 2)) * 4 + 4);
      const normalBoost = (nPix[3] / 255) * (.72 + nPix[1] / 255 * .48) + Math.abs(right[1] - left[1]) * .004;
      const v = Math.max(0, Math.min(1, (lum * .72 + normalBoost * .08 + d * .25) * state.density));
      const ch = glyphs[Math.min(glyphs.length - 1, Math.floor(v * glyphs.length))];
      const color: RGB = state.color ? [pix[0], pix[1], pix[2]] : [Math.round(lerp(pal.low[0], pal.high[0], v)), Math.round(lerp(pal.low[1], pal.high[1], v)), Math.round(lerp(pal.low[2], pal.high[2], v))];
      ctx.fillStyle = rgb(color, Math.min(1, .52 + v * .65)); ctx.fillText(ch, x, y);
    }
    ctx.fillStyle = rgb(pal.high, .035);
    for (let y = 0; y < H; y += cell * 2) ctx.fillRect(0, y, W, 1);
  }
}

export function project(p: Vec3, state: RenderState, width: number, height: number): Point {
  const q = rotate(p, state.yaw, state.pitch);
  const scale = Math.min(width, height) * .34 * state.zoom, cam = 5.8, f = cam / (cam - q.z);
  return { x: width / 2 + q.x * scale * f, y: height * .57 - q.y * scale * f, z: q.z, s: f };
}
export function rgb(c: RGB, a = 1): string { return `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`; }
export function drawPrimitive(target: CanvasRenderingContext2D, points: Point[], col: RGB, alpha: number, depthValue: number, kind: 'color' | 'depth' | 'normal'): void {
  target.beginPath(); target.moveTo(points[0].x, points[0].y);
  target.quadraticCurveTo(points[1].x, points[1].y, points[2].x, points[2].y);
  target.quadraticCurveTo(points[3].x, points[3].y, points[0].x, points[0].y); target.closePath();
  target.fillStyle = kind === 'color' ? rgb(col, alpha) : kind === 'depth' ? `rgba(${depthValue},255,255,.92)` : 'rgba(180,220,255,.72)';
  target.fill();
}
export function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }
export type { Point, Primitive };
