import { useEffect, useRef } from 'react';
import { AsciiRenderer } from '../engine/asciiRenderer';
import type { FlowerDefinition, RenderState } from '../engine/types';

type Props = { flower: FlowerDefinition; state: RenderState; onOrbit: (yaw: number, pitch: number) => void; onZoom: (zoom: number) => void };
export function AsciiCanvas({ flower, state, onOrbit, onZoom }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(state); stateRef.current = state;
  const cameraRef = useRef({ yaw: state.yaw, pitch: state.pitch, zoom: state.zoom });
  const propCameraRef = useRef({ yaw: state.yaw, pitch: state.pitch, zoom: state.zoom });
  if (state.yaw !== propCameraRef.current.yaw || state.pitch !== propCameraRef.current.pitch || state.zoom !== propCameraRef.current.zoom) {
    cameraRef.current = { yaw: state.yaw, pitch: state.pitch, zoom: state.zoom };
    propCameraRef.current = cameraRef.current;
  }
  const flowerRef = useRef(flower); flowerRef.current = flower;
  const onOrbitRef = useRef(onOrbit); onOrbitRef.current = onOrbit;
  const onZoomRef = useRef(onZoom); onZoomRef.current = onZoom;
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const renderer = new AsciiRenderer(canvas); renderer.resize();
    let frame = 0, last = performance.now(), dragging = false, px = 0, py = 0;
    const resize = () => renderer.resize();
    const down = (event: PointerEvent) => { dragging = true; px = event.clientX; py = event.clientY; canvas.classList.add('dragging'); canvas.setPointerCapture(event.pointerId); renderer.setDragging(true); };
    const move = (event: PointerEvent) => { if (!dragging) return; const camera = cameraRef.current; camera.yaw += (event.clientX - px) * .008; camera.pitch = Math.max(-.8, Math.min(.6, camera.pitch + (event.clientY - py) * .006)); propCameraRef.current = { ...camera }; onOrbitRef.current(camera.yaw, camera.pitch); px = event.clientX; py = event.clientY; };
    const up = () => { dragging = false; renderer.setDragging(false); canvas.classList.remove('dragging'); };
    const wheel = (event: WheelEvent) => { event.preventDefault(); cameraRef.current.zoom = Math.max(.65, Math.min(1.7, cameraRef.current.zoom - event.deltaY * .0007)); propCameraRef.current = { ...cameraRef.current }; onZoomRef.current(cameraRef.current.zoom); };
    addEventListener('resize', resize); canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointermove', move); canvas.addEventListener('pointerup', up); canvas.addEventListener('wheel', wheel, { passive: false });
    const animate = (time: number) => { const delta = Math.min(50, time - last); last = time; const camera = cameraRef.current; if (!dragging) camera.yaw += stateRef.current.spin * delta * .00042; renderer.draw(flowerRef.current.render, { ...stateRef.current, ...camera }, time); frame = requestAnimationFrame(animate); };
    const visibility = () => {
      if (document.hidden) cancelAnimationFrame(frame);
      else { last = performance.now(); frame = requestAnimationFrame(animate); }
    };
    document.addEventListener('visibilitychange', visibility);
    frame = requestAnimationFrame(animate);
    return () => { cancelAnimationFrame(frame); document.removeEventListener('visibilitychange', visibility); removeEventListener('resize', resize); canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerup', up); canvas.removeEventListener('wheel', wheel); };
  }, []);
  return <canvas ref={canvasRef} id="screen" aria-label="Interactive ASCII flower" />;
}
