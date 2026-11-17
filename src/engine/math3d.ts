import type { Vec3 } from './types';

export const V = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
export const add = (a: Vec3, b: Vec3): Vec3 => V(a.x + b.x, a.y + b.y, a.z + b.z);
export const mul = (a: Vec3, n: number): Vec3 => V(a.x * n, a.y * n, a.z * n);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const rotate = (p: Vec3, yaw: number, pitch: number): Vec3 => {
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  const x = p.x * cy - p.z * sy;
  const z = p.x * sy + p.z * cy;
  return V(x, p.y * cp - z * sp, p.y * sp + z * cp);
};
