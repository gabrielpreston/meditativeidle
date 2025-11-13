import { AbilityType } from '../../config/AbilityDefinitions';
import { StressorType } from '../../types';

/**
 * InteractionCalculator - Unified damage calculation with all modifiers
 * 
 * Calculates final damage values with industry-standard modifier stacking:
 * - Base damage with level scaling (additive or multiplicative)
 * - Affirm amplification (multiplicative)
 * - Align bonus (conditional multiplicative)
 * - Stressor resistance (multiplicative reduction)
 * - Stressor vulnerability (multiplicative increase)
 * - Aura reduction (multiplicative reduction)
 * 
 * Formula: scaledBase × affirm × align × (1 - resistance) × vulnerability × (1 - auraReduction)
 */
export class InteractionCalculator {
  /**
   * Calculate final damage with all modifiers applied
   * 
   * @param baseDamage - Base damage value
   * @param abilityLevel - Current ability level
   * @param levelScaling - Scaling value per level
   * @param scalingType - 'additive' or 'multiplicative' scaling
   * @param affirmAmplification - Affirm ability amplification multiplier
   * @param alignBonus - Align ability bonus multiplier
   * @param alignPhase - Current Align phase ('offense' or 'defense')
   * @param stressorResistance - Stressor resistance (0-1 multiplier)
   * @param stressorVulnerability - Stressor vulnerability (>1 multiplier)
   * @param auraReduction - Aura reduction (0-1 multiplier)
   * @returns Final calculated damage
   */
  calculateDamage(params: {
    baseDamage: number;
    abilityLevel: number;
    levelScaling: number;
    scalingType: 'additive' | 'multiplicative';
    affirmAmplification: number;
    alignBonus: number;
    alignPhase: 'offense' | 'defense';
    stressorResistance: number;
    stressorVulnerability: number;
    auraReduction: number;
  }): number {
    const {
      baseDamage,
      abilityLevel,
      levelScaling,
      scalingType,
      affirmAmplification,
      alignBonus,
      alignPhase,
      stressorResistance,
      stressorVulnerability,
      auraReduction
    } = params;

    // Step 1: Apply level scaling
    let scaledBase: number;
    if (scalingType === 'additive') {
      // Additive: base + (level * scaling) - used by Reflect
      scaledBase = baseDamage + (abilityLevel * levelScaling);
    } else {
      // Multiplicative: base * (1 + level * scaling) - used by Ground, Release, Breath
      scaledBase = baseDamage * (1 + abilityLevel * levelScaling);
    }

    // Step 2: Apply Affirm amplification (multiplicative)
    let damage = scaledBase * affirmAmplification;

    // Step 3: Apply Align bonus (conditional multiplicative, only for offense phase)
    if (alignPhase === 'offense') {
      damage *= (1 + alignBonus);
    }

    // Step 4: Apply stressor resistance (multiplicative reduction)
    damage *= (1 - stressorResistance);

    // Step 5: Apply stressor vulnerability (multiplicative increase)
    damage *= stressorVulnerability;

    // Step 6: Apply aura reduction (multiplicative reduction)
    damage *= (1 - auraReduction);

    // Ensure non-negative
    return Math.max(0, damage);
  }

  /**
   * Get stressor resistance to specific ability
   * 
   * @param stressorType - Type of stressor
   * @param abilityType - Type of ability
   * @param interactionConfigs - Array of interaction configurations
   * @returns Resistance value (0-1 multiplier)
   */
  getStressorResistance(
    stressorType: StressorType,
    abilityType: AbilityType,
    interactionConfigs: Array<{ stressorType: StressorType; abilityType: AbilityType; resistance?: number }>
  ): number {
    const config = interactionConfigs.find(
      c => c.stressorType === stressorType && c.abilityType === abilityType
    );
    return config?.resistance || 0;
  }

  /**
   * Get stressor vulnerability to specific ability
   * 
   * @param stressorType - Type of stressor
   * @param abilityType - Type of ability
   * @param interactionConfigs - Array of interaction configurations
   * @returns Vulnerability multiplier (>1 for increased damage)
   */
  getStressorVulnerability(
    stressorType: StressorType,
    abilityType: AbilityType,
    interactionConfigs: Array<{ stressorType: StressorType; abilityType: AbilityType; vulnerability?: number }>
  ): number {
    const config = interactionConfigs.find(
      c => c.stressorType === stressorType && c.abilityType === abilityType
    );
    return config?.vulnerability || 1.0;
  }

  /**
   * Calculate aura reduction from nearby stressors
   * 
   * @param stressor - The stressor being affected
   * @param allStressors - All stressors in the game
   * @param interactionConfigs - Array of interaction configurations
   * @returns Total aura reduction (0-1 multiplier)
   */
  calculateAuraReduction(
    stressor: { id: string; type: StressorType; position: { x: number; y: number } },
    allStressors: Array<{ id: string; type: StressorType; position: { x: number; y: number } }>,
    interactionConfigs: Array<{ stressorType: StressorType; specialEffects?: string[] }>
  ): number {
    let totalReduction = 0;

    // Fatigue exhaustion aura: reduces ability effectiveness by 5% per nearby Fatigue
    const fatigueConfig = interactionConfigs.find(
      c => c.stressorType === StressorType.Fatigue && c.specialEffects?.includes('exhaustion_aura')
    );
    if (fatigueConfig) {
      const nearbyFatigue = allStressors.filter(s =>
        s.type === StressorType.Fatigue &&
        s.id !== stressor.id &&
        this.distance(s.position, stressor.position) < 200
      ).length;
      totalReduction += nearbyFatigue * 0.05; // 5% per Fatigue
    }

    // Self-Doubt self-sabotage aura: reduces ability effectiveness by 10% per nearby Self-Doubt
    const selfDoubtConfig = interactionConfigs.find(
      c => c.stressorType === StressorType.SelfDoubt && c.specialEffects?.includes('self_sabotage_aura')
    );
    if (selfDoubtConfig) {
      const nearbySelfDoubt = allStressors.filter(s =>
        s.type === StressorType.SelfDoubt &&
        s.id !== stressor.id &&
        this.distance(s.position, stressor.position) < 200
      ).length;
      totalReduction += nearbySelfDoubt * 0.10; // 10% per Self-Doubt
    }

    // Cap at 25% reduction
    return Math.min(totalReduction, 0.25);
  }

  /**
   * Calculate distance between two points
   */
  private distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

