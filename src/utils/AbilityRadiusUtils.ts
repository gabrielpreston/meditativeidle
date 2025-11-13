/**
 * Ability Radius Utilities
 * 
 * Generic utilities for calculating ability AoE radii with min/max bounds
 * and progress-based interpolation. Follows the pattern established by BreathUtils.
 */

/**
 * Configuration for radius calculation
 */
export interface RadiusConfig {
  baseRadius: number;    // Base radius (e.g., player radius)
  buffer: number;         // Minimum buffer added to base
  growth: number;         // Maximum growth amount
}

/**
 * Calculate minimum radius (base + buffer)
 */
export function getMinRadius(config: RadiusConfig): number {
  return config.baseRadius + config.buffer;
}

/**
 * Calculate maximum radius (min + growth)
 */
export function getMaxRadius(config: RadiusConfig): number {
  return getMinRadius(config) + config.growth;
}

/**
 * Interpolation function type for custom radius curves
 */
export type RadiusInterpolationFn = (progress: number, minRadius: number, maxRadius: number, growth: number) => number;

/**
 * Linear interpolation between min and max based on progress.
 * 
 * @param progress - Progress from 0.0 to 1.0
 * @param minRadius - Minimum radius
 * @param maxRadius - Maximum radius
 * @returns Interpolated radius
 */
export function linearRadiusInterpolation(
  progress: number,
  minRadius: number,
  maxRadius: number
): number {
  return minRadius + (maxRadius - minRadius) * progress;
}

/**
 * Two-phase interpolation: shrink during first phase, expand during second phase.
 * Used for breath-like abilities that pulse between min and max.
 * 
 * @param progress - Overall progress from 0.0 to 1.0
 * @param minRadius - Minimum radius
 * @param maxRadius - Maximum radius
 * @param growth - Growth amount (for phase-specific calculation)
 * @param phaseThreshold - Progress threshold between phases (default 0.5)
 * @returns Current radius based on phase
 */
export function twoPhaseRadiusInterpolation(
  progress: number,
  minRadius: number,
  maxRadius: number,
  growth: number,
  phaseThreshold: number = 0.5
): number {
  if (progress < phaseThreshold) {
    // First phase: shrink from max to min
    const phaseProgress = progress / phaseThreshold; // 0.0 to 1.0 during first phase
    return maxRadius - (growth * phaseProgress);
  } else {
    // Second phase: expand from min to max
    const phaseProgress = (progress - phaseThreshold) / (1.0 - phaseThreshold); // 0.0 to 1.0 during second phase
    return minRadius + (growth * phaseProgress);
  }
}

/**
 * Get current radius based on cycle progress.
 * 
 * @param progress - Cycle progress from 0.0 to 1.0
 * @param config - Radius configuration
 * @param interpolationFn - Function to interpolate radius (default: twoPhaseRadiusInterpolation)
 * @returns Current radius
 */
export function getRadius(
  progress: number,
  config: RadiusConfig,
  interpolationFn: RadiusInterpolationFn = twoPhaseRadiusInterpolation
): number {
  const minRadius = getMinRadius(config);
  const maxRadius = getMaxRadius(config);
  return interpolationFn(progress, minRadius, maxRadius, config.growth);
}

/**
 * Clamp radius to valid range.
 * 
 * @param radius - Radius to clamp
 * @param config - Radius configuration
 * @returns Clamped radius
 */
export function clampRadius(radius: number, config: RadiusConfig): number {
  const minRadius = getMinRadius(config);
  const maxRadius = getMaxRadius(config);
  return Math.max(minRadius, Math.min(maxRadius, radius));
}

