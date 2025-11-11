import { Vector2 } from '../types';

export function distance(a: Vector2, b: Vector2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function normalize(v: Vector2): Vector2 {
  const mag = Math.sqrt(v.x * v.x + v.y * v.y);
  if (mag === 0) return { x: 0, y: 0 };
  return { x: v.x / mag, y: v.y / mag };
}

export function multiply(v: Vector2, scalar: number): Vector2 {
  return { x: v.x * scalar, y: v.y * scalar };
}

export function add(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function subtract(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function angleTo(a: Vector2, b: Vector2): number {
  return Math.atan2(b.y - a.y, b.x - a.x);
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export function isPointInCone(
  point: Vector2,
  center: Vector2,
  coneAngle: number,
  coneDirection: number,
  extent: number
): boolean {
  // Calculate distance from center to point
  const dist = distance(center, point);
  if (dist > extent || dist === 0) return false;
  
  // Calculate angle from center to point
  const pointAngle = angleTo(center, point);
  
  // Normalize angles to [0, 2π] range
  const normalizedDirection = ((coneDirection % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2);
  const normalizedPointAngle = ((pointAngle % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2);
  
  // Calculate half cone angle
  const halfCone = coneAngle / 2;
  
  // Calculate angle difference
  let angleDiff = Math.abs(normalizedPointAngle - normalizedDirection);
  
  // Handle wrap-around (shortest angle)
  if (angleDiff > Math.PI) {
    angleDiff = (Math.PI * 2) - angleDiff;
  }
  
  // Check if point is within cone
  return angleDiff <= halfCone;
}

