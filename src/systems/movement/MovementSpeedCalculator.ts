import { StatusEffectManager } from '../effects/StatusEffectManager';
import { StatusEffectType } from '../effects/StatusEffect';
import { StressorType } from '../../types';

/**
 * MovementSpeedCalculator - Calculates final movement speed for stressors
 * 
 * Applies status effects (slow, etc.) to base speed to determine effective speed.
 * Provides single source of truth for movement speed calculation.
 */
export class MovementSpeedCalculator {
  constructor(private statusEffectManager: StatusEffectManager) {}

  /**
   * Calculate final movement speed for a stressor
   * Applies all active speed modifiers according to stacking rules
   * 
   * @param baseSpeed - Base speed (includes wave scaling, type modifiers)
   * @param stressorId - Unique identifier for the stressor
   * @param stressorType - Type of stressor (for potential type-specific modifiers)
   * @returns Final calculated speed (never negative)
   */
  calculateSpeed(
    baseSpeed: number,
    stressorId: string,
    stressorType: StressorType
  ): number {
    // Get base speed (includes wave scaling, type modifiers)
    let finalSpeed = baseSpeed;

    // Apply slow effects (multiplicative stacking)
    const slowMultiplier = this.statusEffectManager.getEffectiveValue(
      StatusEffectType.SLOW,
      stressorId
    );

    // Default to 1.0 if no slow effects (no change)
    finalSpeed *= slowMultiplier;

    // Apply other speed modifiers (e.g., haste, stun) - future expansion
    // ...

    // Prevent negative speed
    return Math.max(0, finalSpeed);
  }
}

