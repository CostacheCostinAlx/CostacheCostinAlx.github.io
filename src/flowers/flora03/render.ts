import { add, V, mul } from '../../engine/math3d';
import { DepthQueue, drawPrimitive, lerp, project, rgb } from '../../engine/asciiRenderer';
import { palettes } from '../../engine/palettes';
import type { RGB, RenderState, RenderSurface } from '../../engine/types';

export function renderFlora03(surface: RenderSurface, state: RenderState, time: number): void {
  const { bufferContext: bctx, depthContext: dctx, normalContext: nctx, buffer } = surface;
  const pal = palettes[state.palette], W = buffer.width, H = buffer.height;
  bctx.fillStyle = rgb(pal.bg); bctx.fillRect(0, 0, W, H);
  dctx.clearRect(0, 0, W, H); nctx.clearRect(0, 0, W, H);
  const g = bctx.createRadialGradient(W / 2, H * .48, 5, W / 2, H * .48, H * .55);
  g.addColorStop(0, rgb(pal.low, .35)); g.addColorStop(1, rgb(pal.bg, 0));
  bctx.fillStyle = g; bctx.fillRect(0, 0, W, H);
  bctx.strokeStyle = rgb(pal.leaf, .12); dctx.strokeStyle = 'rgba(90,180,120,.32)'; nctx.strokeStyle = 'rgba(180,220,255,.22)';
  bctx.lineWidth = dctx.lineWidth = nctx.lineWidth = 1;
  for (let i = -5; i <= 5; i++) {
    const a = project(V(i * .42, -1.47, -1.8), state, W, H), z = project(V(i * .42, -1.47, 1.8), state, W, H);
    for (const target of [bctx, dctx, nctx]) { target.beginPath(); target.moveTo(a.x, a.y); target.lineTo(z.x, z.y); target.stroke(); }
  }
  for (let i = 0; i < 8; i++) {
    const a = project(V(-2.2, -1.47, -1.8 + i * .5), state, W, H), z = project(V(2.2, -1.47, -1.8 + i * .5), state, W, H);
    for (const target of [bctx, dctx, nctx]) { target.beginPath(); target.moveTo(a.x, a.y); target.lineTo(z.x, z.y); target.stroke(); }
  }
  const sway = Math.sin(time * .001 * state.wind * 1.7) * .11 + Math.sin(time * .001 * state.wind * .73) * .055;
  const pose = (p: ReturnType<typeof V>) => {
    const height = Math.max(0, Math.min(1, (p.y + 1.45) / 2.15));
    const bend = (1 - state.rise) * .95 * height, relativeY = p.y + 1.45;
    return V(p.x, -1.45 + relativeY * Math.cos(bend), p.z + relativeY * Math.sin(bend));
  };
  const flowerProject = (p: ReturnType<typeof V>) => project(pose(p), state, W, H);
  const queue = new DepthQueue();
  const line = (from: ReturnType<typeof project>, to: ReturnType<typeof project>, color: RGB, width: number, alpha: number, glow = 0) => {
    queue.add((from.z + to.z) / 2, ({ bufferContext, depthContext, normalContext }) => {
      bufferContext.lineCap = depthContext.lineCap = normalContext.lineCap = 'round';
      bufferContext.lineWidth = depthContext.lineWidth = normalContext.lineWidth = width;
      bufferContext.strokeStyle = rgb(color, alpha); depthContext.strokeStyle = `rgba(100,210,130,${alpha})`; normalContext.strokeStyle = `rgba(180,220,255,${alpha})`;
      if (glow) { bufferContext.shadowColor = rgb(color, .55); bufferContext.shadowBlur = glow; }
      for (const target of [bufferContext, depthContext, normalContext]) { target.beginPath(); target.moveTo(from.x, from.y); target.lineTo(to.x, to.y); target.stroke(); }
      bufferContext.shadowBlur = 0;
    });
  };
  const root = V(0, -1.45, 0), top = V(sway, .55, 0), a = flowerProject(root), b = flowerProject(top);
  const stemControl = V((root.x + top.x) / 2 + .08, -.45, 0), control = flowerProject(stemControl);
  queue.add((a.z + control.z + b.z) / 3, ({ bufferContext, depthContext, normalContext }) => {
    for (const target of [bufferContext, depthContext, normalContext]) {
      target.lineCap = 'round'; target.lineWidth = target === bufferContext ? 12 : 12;
      target.strokeStyle = target === bufferContext ? rgb(pal.leaf, .75) : 'rgba(100,210,130,.75)';
      target.beginPath(); target.moveTo(a.x, a.y); target.quadraticCurveTo(control.x, control.y, b.x, b.y); target.stroke();
      target.lineWidth = 4; target.strokeStyle = target === bufferContext ? rgb(pal.high, .45) : 'rgba(180,220,255,.5)'; target.stroke();
    }
  });
  const petal = (points: ReturnType<typeof project>[], col: RGB, glow = 0) => {
    const z = points.reduce((sum, point) => sum + point.z, 0) / points.length;
    queue.add(z, ({ bufferContext, depthContext, normalContext }) => {
      bufferContext.shadowColor = rgb(col, .55); bufferContext.shadowBlur = glow;
      drawPrimitive(bufferContext, points, col, 1, 128 + z * 35, 'color');
      bufferContext.shadowBlur = 0;
      drawPrimitive(depthContext, points, col, 1, 128 + z * 35, 'depth');
      drawPrimitive(normalContext, points, [180, 220, 255], .72, 128 + z * 35, 'normal');
    });
  };
  for (const side of [-1, 1]) {
    const base = V(sway * .5, -.35, 0), tip = V(sway + side * .8, .02, side * .1);
    const mid = add(base, mul(add(tip, mul(base, -1)), .5));
    petal([base, add(mid, V(0, .15, side * .15)), tip, add(mid, V(0, -.08, -side * .1))].map(flowerProject), pal.leaf, 8);
  }
  for (const side of [-1, 1]) {
    const base = V(sway * .7, -.85, 0), tip = V(sway + side * .55, -.56, -.1);
    petal([base, add(base, V(side * .25, .23, 0)), tip, add(base, V(side * .2, -.03, .15))].map(flowerProject), pal.leaf, 5);
  }
  const center = V(sway, .62, 0), n = state.bloom;
  const layers = [{ count: 12, r: .62, len: 1.04, w: .42 }, { count: 10, r: .4, len: .9, w: .34 }, { count: 8, r: .18, len: .66, w: .27 }];
  for (let li = 0; li < layers.length; li++) {
    const L = layers[li];
    for (let i = 0; i < L.count; i++) {
      const ang = i / L.count * Math.PI * 2 + li * .2, tilt = (1 - n) * .72;
      const radial = V(Math.cos(ang), 0, Math.sin(ang)), base = add(center, mul(radial, L.r));
      const end = add(base, mul(V(radial.x * Math.cos(tilt), Math.sin(tilt) + .05, radial.z * Math.cos(tilt)), L.len));
      const side = V(-radial.z * L.w, 0, radial.x * L.w);
      const col: RGB = [lerp(pal.petal[0], pal.high[0], li / 4), lerp(pal.petal[1], pal.high[1], li / 4), lerp(pal.petal[2], pal.high[2], li / 4)];
      petal([add(base, side), add(end, mul(side, .15)), add(end, mul(side, -.15)), add(base, mul(side, -1))].map(flowerProject), col, li === 2 ? 14 : 7);
    }
  }
  const cp = flowerProject(center), diskRadius = Math.max(4, Math.min(W, H) * .34 * state.zoom * .14 * cp.s);
  queue.add(cp.z, ({ bufferContext, depthContext, normalContext }) => {
    bufferContext.fillStyle = rgb(pal.gold, .95); depthContext.fillStyle = 'rgba(230,190,70,.95)'; normalContext.fillStyle = 'rgba(230,190,70,.95)';
    bufferContext.shadowColor = rgb(pal.gold, .8); bufferContext.shadowBlur = 14;
    for (const target of [bufferContext, depthContext, normalContext]) { target.beginPath(); target.arc(cp.x, cp.y, diskRadius, 0, 7); target.fill(); }
    bufferContext.shadowBlur = 0;
  });
  for (let i = 0; i < 30; i++) {
    const an = i * 2.399, rr = (.14 + (i % 5) * .045) * n, st = add(center, V(Math.cos(an) * rr, .12 + (i % 3) * .035, Math.sin(an) * rr));
    const ep = add(st, V(Math.cos(an) * .12, .16, Math.sin(an) * .12)), u = flowerProject(st), v = flowerProject(ep);
    line(u, v, pal.high, 1, .85);
    queue.add(v.z, ({ bufferContext, depthContext, normalContext }) => {
      bufferContext.fillStyle = rgb(pal.gold); depthContext.fillStyle = 'rgba(255,205,75,.9)'; normalContext.fillStyle = 'rgba(255,205,75,.9)';
      for (const target of [bufferContext, depthContext, normalContext]) target.fillRect(v.x - 1, v.y - 1, 3, 3);
    });
  }
  for (let i = 0; i < 24; i++) {
    const an = i * 2.618, radius = .7 + (i % 6) * .16, y = .55 + Math.sin(time * .001 * state.wind + i) * .32 + (i % 4) * .12;
    const p = flowerProject(add(center, V(Math.cos(an + time * .00015) * radius, y - .62, Math.sin(an + time * .00015) * radius))), r = 1 + (i % 3);
    queue.add(p.z, ({ bufferContext, depthContext, normalContext }) => {
      bufferContext.fillStyle = rgb(pal.gold, .7); depthContext.fillStyle = 'rgba(255,220,100,.72)'; normalContext.fillStyle = 'rgba(255,220,100,.72)';
      for (const target of [bufferContext, depthContext, normalContext]) { target.beginPath(); target.arc(p.x, p.y, r, 0, 7); target.fill(); }
    });
  }
  queue.flush(surface);
}
