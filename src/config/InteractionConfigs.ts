import { AbilityType } from './AbilityDefinitions';
import { StressorType } from '../types';

/**
 * Interaction Configuration
 * 
 * Defines how abilities interact with stressors:
 * - Resistance: Stressor resists ability effects (0-1 multiplier, e.g., 0.5 = 50% resistance)
 * - Vulnerability: Stressor takes extra damage/effects (>1 multiplier, e.g., 2.0 = 2x damage)
 * - Special effects: Unique interactions (e.g., aura debuffs)
 */
export interface InteractionConfig {
  abilityType: AbilityType;
  stressorType: StressorType;
  resistance?: number;      // 0-1, e.g., 0.5 = 50% resistance
  vulnerability?: number;  // >1, e.g., 2.0 = 2x damage
  specialEffects?: string[]; // e.g., 'exhaustion_aura', 'self_sabotage_aura'
}

/**
 * Complete interaction configuration matching design specifications.
 * 
 * Reference: docs/design/STRESSORS.md - "Ability-Stressor Interactions"
 * 
 * Note: Self-Doubt and Overwhelm interactions are deferred until these stressor types
 * are implemented in the codebase.
 */
export const InteractionConfigs: InteractionConfig[] = [
  // Fatigue: 50% resistance to Breath ability
  {
    abilityType: 'breathe',
    stressorType: StressorType.Fatigue,
    resistance: 0.5,
    specialEffects: ['exhaustion_aura']
  },
  
  // Self-Doubt: 2x vulnerability to Affirm
  {
    abilityType: 'affirm',
    stressorType: StressorType.SelfDoubt,
    vulnerability: 2.0,
    specialEffects: ['self_sabotage_aura']
  },
  
  // Overwhelm interactions (deferred - stressor type not implemented)
  // Add when Overwhelm stressor type is added to StressorType enum
];

/**
 * Get interaction config for ability-stressor pair
 */
export function getInteractionConfig(
  abilityType: AbilityType,
  stressorType: StressorType
): InteractionConfig | undefined {
  return InteractionConfigs.find(
    config => config.abilityType === abilityType && config.stressorType === stressorType
  );
}

