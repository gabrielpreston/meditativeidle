import { RGB } from '../../types';

/**
 * LiquidCell - Represents a single cell in the grid-based fluid field
 * 
 * Each cell stores pigment RGB values, flow vectors, and turbulence.
 * This provides a simple, debuggable representation of fluid state.
 */
export interface LiquidCell {
  /** Red pigment concentration (0-1) */
  pigmentR: number;
  /** Green pigment concentration (0-1) */
  pigmentG: number;
  /** Blue pigment concentration (0-1) */
  pigmentB: number;
  /** Flow velocity X component */
  flowX: number;
  /** Flow velocity Y component */
  flowY: number;
  /** Turbulence scalar (0-1, affects flow randomness) */
  turbulence: number;
}

/**
 * Create a new empty cell (no pigment, no flow)
 */
export function createEmptyCell(): LiquidCell {
  return {
    pigmentR: 0,
    pigmentG: 0,
    pigmentB: 0,
    flowX: 0,
    flowY: 0,
    turbulence: 0
  };
}

/**
 * Mix two colors additively (for pigment blending)
 * Result is clamped to [0, 1] range
 */
export function mixColors(color1: RGB, color2: RGB, weight1: number = 0.5, weight2: number = 0.5): RGB {
  const totalWeight = weight1 + weight2;
  if (totalWeight === 0) {
    return { r: 0, g: 0, b: 0 };
  }
  
  return {
    r: Math.max(0, Math.min(1, (color1.r * weight1 + color2.r * weight2) / totalWeight)),
    g: Math.max(0, Math.min(1, (color1.g * weight1 + color2.g * weight2) / totalWeight)),
    b: Math.max(0, Math.min(1, (color1.b * weight1 + color2.b * weight2) / totalWeight))
  };
}

/**
 * Convert RGB color to LiquidCell pigment values
 */
export function rgbToPigment(color: RGB): { r: number; g: number; b: number } {
  return {
    r: Math.max(0, Math.min(1, color.r)),
    g: Math.max(0, Math.min(1, color.g)),
    b: Math.max(0, Math.min(1, color.b))
  };
}

/**
 * Calculate flow vector magnitude
 */
export function flowMagnitude(flowX: number, flowY: number): number {
  return Math.sqrt(flowX * flowX + flowY * flowY);
}

/**
 * Normalize flow vector to unit length
 */
export function normalizeFlow(flowX: number, flowY: number): { x: number; y: number } {
  const mag = flowMagnitude(flowX, flowY);
  if (mag === 0) {
    return { x: 0, y: 0 };
  }
  return {
    x: flowX / mag,
    y: flowY / mag
  };
}

