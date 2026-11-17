import { add, V, mul } from '../../engine/math3d';
import { DepthQueue, drawPrimitive, lerp, project, rgb } from '../../engine/asciiRenderer';
import { palettes } from '../../engine/palettes';
import type { RGB, RenderState, RenderSurface } from '../../engine/types';

export function renderFlora04(surface: RenderSurface, state: RenderState, time: number): void {
  const { bufferContext: bctx, depthContext: dctx, normalContext: nctx, buffer } = surface;
  const pal = palettes[state.palette], W = buffer.width, H = buffer.height;
  bctx.fillStyle = rgb(pal.bg); bctx.fillRect(0, 0, W, H);
  dctx.clearRect(0, 0, W, H); nctx.clearRect(0, 0, W, H);
  const glow = bctx.createRadialGradient(W / 2, H * .38, 4, W / 2, H * .42, H * .58);
  glow.addColorStop(0, rgb(pal.low, .38)); glow.addColorStop(1, rgb(pal.bg, 0));
  bctx.fillStyle = glow; bctx.fillRect(0, 0, W, H);
  const sway = Math.sin(time * .001 * state.wind * 1.4) * .1 + Math.sin(time * .00063 * state.wind) * .045;
  const pose = (p: ReturnType<typeof V>) => {
    const height = Math.max(0, Math.min(1, (p.y + 1.45) / 2.45));
    const bend = (1 - state.rise) * .85 * height, relativeY = p.y + 1.45;
    return V(p.x, -1.45 + relativeY * Math.cos(bend), p.z + relativeY * Math.sin(bend));
  };
  const fp = (p: ReturnType<typeof V>) => project(pose(p), state, W, H);
  const queue = new DepthQueue();
  const stroke = (from: ReturnType<typeof project>, to: ReturnType<typeof project>, color: RGB, width: number, alpha: number) => {
    queue.add((from.z + to.z) / 2, ({ bufferContext, depthContext, normalContext }) => {
      bufferContext.lineCap = depthContext.lineCap = normalContext.lineCap = 'round';
      bufferContext.lineWidth = depthContext.lineWidth = normalContext.lineWidth = width;
      bufferContext.strokeStyle = rgb(color, alpha); depthContext.strokeStyle = `rgba(100,210,130,${alpha})`; normalContext.strokeStyle = `rgba(180,220,255,${alpha})`;
      for (const target of [bufferContext, depthContext, normalContext]) { target.beginPath(); target.moveTo(from.x, from.y); target.lineTo(to.x, to.y); target.stroke(); }
    });
  };
  const petal = (points: ReturnType<typeof project>[], color: RGB, blur = 0) => {
    const z = points.reduce((sum, point) => sum + point.z, 0) / points.length;
    queue.add(z, ({ bufferContext, depthContext, normalContext }) => {
      bufferContext.shadowColor = rgb(color, .5); bufferContext.shadowBlur = blur;
      drawPrimitive(bufferContext, points, color, 1, 128 + z * 35, 'color');
      bufferContext.shadowBlur = 0;
      drawPrimitive(depthContext, points, color, 1, 128 + z * 35, 'depth');
      drawPrimitive(normalContext, points, [180, 220, 255], .72, 128 + z * 35, 'normal');
    });
  };
  const root = V(0, -1.45, 0), top = V(sway, .8, 0), a = fp(root), b = fp(top), c = fp(V((root.x + top.x) / 2 + .08, -.4, 0));
  queue.add((a.z + b.z + c.z) / 3, ({ bufferContext, depthContext, normalContext }) => {
    for (const target of [bufferContext, depthContext, normalContext]) {
      target.lineCap = 'round'; target.lineWidth = target === bufferContext ? 13 : 11;
      target.strokeStyle = target === bufferContext ? rgb(pal.leaf, .8) : 'rgba(100,210,130,.75)';
      target.beginPath(); target.moveTo(a.x, a.y); target.quadraticCurveTo(c.x, c.y, b.x, b.y); target.stroke();
      target.lineWidth = 3; target.strokeStyle = target === bufferContext ? rgb(pal.high, .4) : 'rgba(180,220,255,.5)'; target.stroke();
    }
  });
  for (const side of [-1, 1]) {
    const base = V(sway * .35, -.45, 0), tip = V(sway + side * .7, -.05, side * .12), mid = add(base, mul(add(tip, mul(base, -1)), .5));
    petal([base, add(mid, V(0, .18, side * .14)), tip, add(mid, V(0, -.1, -side * .12))].map(fp), pal.leaf, 7);
    const leafBase = V(sway * .55, -.95, 0), leafTip = V(sway + side * .52, -.65, side * .08);
    petal([leafBase, add(leafBase, V(side * .32, .2, .08)), leafTip, add(leafBase, V(side * .18, -.03, .18))].map(fp), pal.leaf, 5);
  }
  const center = V(sway, .76, 0), bloom = Math.max(0, Math.min(1, state.bloom));
  const calyx = 5;
  for (let i = 0; i < calyx; i++) {
    const ang = i / calyx * Math.PI * 2, radial = V(Math.cos(ang), 0, Math.sin(ang)), base = add(center, mul(radial, .12));
    const tip = add(center, V(radial.x * (.38 + bloom * .12), -.25 + bloom * .05, radial.z * (.38 + bloom * .12)));
    petal([base, add(base, V(radial.x * .08, -.08, radial.z * .08)), tip, add(base, V(-radial.x * .08, .02, -radial.z * .08))].map(fp), pal.leaf, 3);
  }
  for (const side of [-1, 1]) {
    const thornBase = V(sway + side * .15, -.2 + (side + 1) * .45, side * .02), thornTip = add(thornBase, V(side * .16, .08, side * .03));
    stroke(fp(thornBase), fp(thornTip), pal.leaf, 2, .8);
  }
  const layers = [
    { count: 10, radius: .68, height: .18, width: .56, lift: .45 },
    { count: 9, radius: .47, height: .12, width: .48, lift: .3 },
    { count: 7, radius: .29, height: .07, width: .4, lift: .16 },
    { count: 5, radius: .13, height: .04, width: .3, lift: .08 },
  ];
  for (let li = 0; li < layers.length; li++) {
    const layer = layers[li], openness = bloom * (1 - li * .08), tilt = .25 + openness * (li === 0 ? .8 : .58);
    for (let i = 0; i < layer.count; i++) {
      const angle = i / layer.count * Math.PI * 2 + li * .63 + bloom * li * .18;
      const radial = V(Math.cos(angle), 0, Math.sin(angle)), tangent = V(-radial.z, 0, radial.x);
      const base = add(center, mul(radial, layer.radius * (.72 + bloom * .28)));
      const tipRadius = layer.radius + openness * (li === 0 ? .55 : .32);
      const tip = add(center, V(radial.x * tipRadius, layer.height + Math.sin(angle * 2 + li) * .05 + tilt * .16, radial.z * tipRadius));
      const side = mul(tangent, layer.width * (.72 + bloom * .28));
      const col: RGB = [lerp(pal.petal[0], pal.high[0], li / 5), lerp(pal.petal[1], pal.high[1], li / 5), lerp(pal.petal[2], pal.high[2], li / 5)];
      petal([add(base, side), add(tip, mul(side, .45)), add(tip, mul(side, -.45)), add(base, mul(side, -1))].map(fp), col, li === 0 ? 9 : 12);
    }
  }
  const core = fp(center), coreSize = Math.max(3, Math.min(W, H) * .34 * state.zoom * (.06 + (1 - bloom) * .07) * core.s);
  queue.add(core.z, ({ bufferContext, depthContext, normalContext }) => {
    bufferContext.fillStyle = rgb(pal.petal, .95); depthContext.fillStyle = 'rgba(220,100,150,.95)'; normalContext.fillStyle = 'rgba(220,180,220,.8)';
    bufferContext.beginPath(); bufferContext.arc(core.x, core.y, coreSize, 0, 7); bufferContext.fill();
    depthContext.beginPath(); depthContext.arc(core.x, core.y, coreSize, 0, 7); depthContext.fill();
    normalContext.beginPath(); normalContext.arc(core.x, core.y, coreSize, 0, 7); normalContext.fill();
  });
  for (let i = 0; i < 4; i++) {
    const angle = i * Math.PI * .9 + bloom, radius = coreSize * (.8 + i * .35);
    queue.add(core.z + .001, ({ bufferContext, depthContext, normalContext }) => {
      const x = core.x + Math.cos(angle) * radius, y = core.y + Math.sin(angle) * radius;
      bufferContext.fillStyle = rgb(pal.gold, .7); depthContext.fillStyle = 'rgba(255,205,75,.7)'; normalContext.fillStyle = 'rgba(255,205,75,.7)';
      for (const target of [bufferContext, depthContext, normalContext]) { target.beginPath(); target.arc(x, y, 1.2, 0, 7); target.fill(); }
    });
  }
  queue.flush(surface);
}
