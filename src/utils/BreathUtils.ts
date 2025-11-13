import { GameConfig } from '../GameConfig';
import { 
  RadiusConfig, 
  getMinRadius, 
  getMaxRadius, 
  getRadius, 
  clampRadius,
  twoPhaseRadiusInterpolation 
} from './AbilityRadiusUtils';

/**
 * Breath Ability Utilities
 * 
 * Centralized calculations for breath AoE radius and related values.
 * All breath radius calculations should use these functions.
 * 
 * Uses generic AbilityRadiusUtils for calculations, following established patterns.
 */

/**
 * Get breath ability radius configuration
 */
function getBreathRadiusConfig(): RadiusConfig {
  return {
    baseRadius: GameConfig.PLAYER_RADIUS,
    buffer: GameConfig.BREATHE_AOE_BUFFER,
    growth: GameConfig.BREATHE_AOE_GROWTH
  };
}

/**
 * Calculate the minimum breath AoE radius (player radius + buffer)
 */
export function getBreathMinRadius(): number {
  return getMinRadius(getBreathRadiusConfig());
}

/**
 * Calculate the maximum breath AoE radius (min radius + growth)
 */
export function getBreathMaxRadius(): number {
  return getMaxRadius(getBreathRadiusConfig());
}

/**
 * Get current pulsing breath Area of Effect radius based on breathing cycle progress.
 * 
 * @param rawProgress - Cycle progress from 0.0 to 1.0
 *   - 0.0 = start of inhale (max radius)
 *   - 0.5 = start of exhale (min radius)
 *   - 1.0 = end of exhale (max radius)
 * @returns Current breath AoE radius in pixels
 */
export function getBreathRadius(rawProgress: number): number {
  const config = getBreathRadiusConfig();
  return getRadius(rawProgress, config, twoPhaseRadiusInterpolation);
}

/**
 * Clamp a radius value to valid breath AoE range
 */
export function clampBreathRadius(radius: number): number {
  return clampRadius(radius, getBreathRadiusConfig());
}

