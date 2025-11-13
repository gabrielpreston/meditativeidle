import { ISystem, SystemContext } from './ISystem';
import { GameConfig } from '../GameConfig';
import { distance } from '../utils/MathUtils';
import { Stressor, AbilityState, Vector2, StressorType } from '../types';
import { InteractionCalculator } from './interactions/InteractionCalculator';
import { InteractionConfigs, InteractionConfig } from '../config/InteractionConfigs';
import { AbilityType } from '../config/AbilityDefinitions';
import { getBreathRadius } from '../utils/BreathUtils';
import { dev } from '../utils/dev';
import { StatusEffect, StatusEffectType, StackingRule } from './effects/StatusEffect';

export class AbilityEffectSystem implements ISystem {
  private interactionCalculator: InteractionCalculator;

  constructor() {
    this.interactionCalculator = new InteractionCalculator();
  }
  update(deltaTime: number, context: SystemContext): void {
    const stressors = context.getStressors();
    const abilities = context.getAbilities();
    const center = context.center;
    
    // Get Affirm amplification and Align bonus/phase
    const affirmAmplification = context.getAffirmAmplification();
    const alignBonus = context.getAlignBonus();
    const alignPhase = context.getAlignPhase();
    
    // Apply all ability effects (checking enable/disable configuration)
    if (GameConfig.ABILITY_ENABLED.breathe) {
      this.applyBreathEffects(stressors, abilities, center, context, deltaTime, affirmAmplification, alignBonus, alignPhase);
    }
    if (GameConfig.ABILITY_ENABLED.recenter) {
      this.applyRecenterEffects(stressors, abilities, center, context, affirmAmplification, alignBonus, alignPhase);
    }
    if (GameConfig.ABILITY_ENABLED.exhale) {
      this.applyExhaleEffects(stressors, abilities, center, context, affirmAmplification, alignBonus, alignPhase);
    }
    if (GameConfig.ABILITY_ENABLED.reflect) {
      this.applyReflectEffects(stressors, abilities, center, context, affirmAmplification, alignBonus, alignPhase);
    }
    if (GameConfig.ABILITY_ENABLED.mantra) {
      this.applyMantraEffects(stressors, abilities, center, deltaTime, context, affirmAmplification, alignBonus, alignPhase);
    }
    if (GameConfig.ABILITY_ENABLED.ground) {
      this.applyGroundEffects(stressors, abilities, center, deltaTime, context, affirmAmplification, alignBonus, alignPhase);
    }
    if (GameConfig.ABILITY_ENABLED.release) {
      this.applyReleaseEffects(stressors, abilities, center, context, affirmAmplification, alignBonus, alignPhase);
    }
  }

  /**
   * Get stressor resistance to specific ability
   */
  private getStressorResistance(stressor: Stressor, abilityType: AbilityType): number {
    return this.interactionCalculator.getStressorResistance(
      stressor.type,
      abilityType,
      InteractionConfigs
    );
  }

  /**
   * Get stressor vulnerability to specific ability
   */
  private getStressorVulnerability(stressor: Stressor, abilityType: AbilityType): number {
    // Check for conditional vulnerability: SelfDoubt takes 2x damage from Affirm
    if (stressor.type === StressorType.SelfDoubt && abilityType === 'affirm') {
      return 2.0;
    }
    
    return this.interactionCalculator.getStressorVulnerability(
      stressor.type,
      abilityType,
      InteractionConfigs
    );
  }

  /**
   * Calculate aura reduction for a stressor
   */
  private calculateAuraReduction(stressor: Stressor, context: SystemContext): number {
    return this.interactionCalculator.calculateAuraReduction(
      stressor,
      context.getStressors(),
      InteractionConfigs
    );
  }

  /**
   * Apply Breath ability effects - continuous damage to stressors in range
   */
  private applyBreathEffects(
    stressors: Stressor[],
    abilities: AbilityState,
    center: Vector2,
    context: SystemContext,
    deltaTime: number,
    affirmAmplification: number,
    alignBonus: number,
    alignPhase: 'offense' | 'defense'
  ): void {
    const breatheLevel = abilities.breathe.level;
    const rawProgress = context.getBreatheRawCycleProgress();
    const breathRadius = getBreathRadius(rawProgress);

    // Calculate base damage per frame (DPS * deltaTime)
    const baseDPS = GameConfig.BREATHE_BASE_DAMAGE_PER_SECOND;
    const baseDamagePerFrame = baseDPS * deltaTime;
    
    // Calculate breath slow factor (affected by Affirm amplification)
    const breathSlowFactor = GameConfig.BREATHE_SLOW_STRENGTH / affirmAmplification;

    for (const stressor of stressors) {
      // Check if stressor is within breath AoE radius
      const dist = distance(stressor.position, center);
      if (dist <= breathRadius) {
        // Calculate final damage with all modifiers
        const finalDamage = this.interactionCalculator.calculateDamage({
          baseDamage: baseDamagePerFrame,
          abilityLevel: breatheLevel,
          levelScaling: GameConfig.BREATHE_DAMAGE_SCALING,
          scalingType: 'multiplicative',
          affirmAmplification,
          alignBonus,
          alignPhase,
          stressorResistance: this.getStressorResistance(stressor, 'breathe'),
          stressorVulnerability: this.getStressorVulnerability(stressor, 'breathe'),
          auraReduction: this.calculateAuraReduction(stressor, context)
        });

        context.damageStressor(stressor.id, finalDamage);
        
        // Apply slow effect (50% slow) while in breath AoE
        const effect: StatusEffect = {
          id: `breathe-${stressor.id}`,
          type: StatusEffectType.SLOW,
          source: 'breathe',
          value: breathSlowFactor,
          duration: undefined, // Persistent while in AoE
          startTime: Date.now(),
          stackingRule: StackingRule.MULTIPLICATIVE
        };
        context.getStatusEffectManager().apply(effect, stressor.id);
      } else {
        // Clear slow effect when stressor leaves the AoE
        context.getStatusEffectManager().removeBySource('breathe', stressor.id);
      }
    }
  }
  
  private applyRecenterEffects(
    stressors: Stressor[],
    abilities: AbilityState,
    center: Vector2,
    context: SystemContext,
    affirmAmplification: number,
    alignBonus: number,
    alignPhase: 'offense' | 'defense'
  ): void {
    // Automatic Recenter - pulse burst
    if (context.isRecenterPulseActive()) {
      const recenterLevel = abilities.recenter.level;
      const slowFactorBase = GameConfig.RECENTER_BASE_SLOW * (1 - recenterLevel * GameConfig.RECENTER_SLOW_SCALING);
      // Apply Affirm amplification to slow strength (divide: higher amplification = stronger slow = lower multiplier)
      let slowFactor = slowFactorBase / affirmAmplification;
      // Apply Affirm amplification to pulse radius
      let pulseRadius = context.getRecenterPulseRadius() * affirmAmplification;
      // Apply Align bonus if in defense phase
      if (alignPhase === 'defense') {
        slowFactor /= (1 + alignBonus);
        pulseRadius *= (1 + alignBonus);
      }
      
      for (const stressor of stressors) {
        // Check if stressor is within pulse radius
        const dist = distance(stressor.position, center);
        if (dist <= pulseRadius) {
          // Apply persistent slow effect (only set once, persists until stressor dies)
          // Check if effect already exists to avoid re-applying
          const existingEffects = context.getStatusEffectManager().getEffects(StatusEffectType.SLOW, stressor.id);
          const hasRecenterSlow = existingEffects.some(e => e.source === 'recenter');
          
          if (!hasRecenterSlow) {
            const effect: StatusEffect = {
              id: `recenter-${stressor.id}`,
              type: StatusEffectType.SLOW,
              source: 'recenter',
              value: slowFactor,
              duration: undefined, // Persistent until death
              startTime: Date.now(),
              stackingRule: StackingRule.MULTIPLICATIVE
            };
            context.getStatusEffectManager().apply(effect, stressor.id);
          }
        }
      }
    }
  }
  
  private applyExhaleEffects(
    stressors: Stressor[],
    abilities: AbilityState,
    center: Vector2,
    context: SystemContext,
    affirmAmplification: number,
    alignBonus: number,
    alignPhase: 'offense' | 'defense'
  ): void {
    // Exhale - Expanding waves
    // Note: wave.damage is pre-calculated with level scaling, so we treat it as base damage
    // and only apply modifiers (affirm, align, resistance, vulnerability, aura)
    const exhaleWaves = context.getExhaleWaves();
    for (let waveIndex = 0; waveIndex < exhaleWaves.length; waveIndex++) {
      const wave = exhaleWaves[waveIndex];
      for (const stressor of stressors) {
        const dist = distance(stressor.position, center);
        // Hit if stressor is within wave ring (wave expands, so check if just passed through)
        const waveThickness = 50; // Thickness of the wave ring
        if (dist <= wave.radius && dist > wave.radius - waveThickness) {
          // wave.damage already includes level scaling, so pass level 0 to avoid double-scaling
          const finalDamage = this.interactionCalculator.calculateDamage({
            baseDamage: wave.damage,
            abilityLevel: 0, // Level scaling already applied in wave.damage
            levelScaling: 0, // No additional scaling
            scalingType: 'multiplicative',
            affirmAmplification,
            alignBonus,
            alignPhase,
            stressorResistance: this.getStressorResistance(stressor, 'exhale'),
            stressorVulnerability: this.getStressorVulnerability(stressor, 'exhale'),
            auraReduction: this.calculateAuraReduction(stressor, context)
          });

          context.damageStressor(stressor.id, finalDamage);
          
          // Apply duration-based slow effect
          const effect: StatusEffect = {
            id: `exhale-${stressor.id}-${waveIndex}-${Date.now()}`, // Unique per wave instance
            type: StatusEffectType.SLOW,
            source: 'exhale',
            value: wave.slowFactor / affirmAmplification,
            duration: wave.slowDuration, // From wave data
            startTime: Date.now(),
            stackingRule: StackingRule.MULTIPLICATIVE
          };
          context.getStatusEffectManager().apply(effect, stressor.id);
        }
      }
    }
  }
  
  private applyReflectEffects(
    stressors: Stressor[],
    abilities: AbilityState,
    center: Vector2,
    context: SystemContext,
    affirmAmplification: number,
    alignBonus: number,
    alignPhase: 'offense' | 'defense'
  ): void {
    // Reflect - Barrier collision damage
    if (context.isReflectBarrierActive()) {
      const reflectLevel = abilities.reflect.level;
      const barrierRadius = context.getReflectBarrierRadius();
      
      for (const stressor of stressors) {
        const dist = distance(stressor.position, center);
        if (dist < barrierRadius) {
          // Reflect uses percentage of health, so base damage is the percentage multiplier
          const basePercentage = GameConfig.REFLECT_BASE_DAMAGE;
          const finalPercentage = this.interactionCalculator.calculateDamage({
            baseDamage: basePercentage,
            abilityLevel: reflectLevel,
            levelScaling: GameConfig.REFLECT_DAMAGE_SCALING,
            scalingType: 'additive', // Reflect uses additive scaling
            affirmAmplification,
            alignBonus,
            alignPhase,
            stressorResistance: this.getStressorResistance(stressor, 'reflect'),
            stressorVulnerability: this.getStressorVulnerability(stressor, 'reflect'),
            auraReduction: this.calculateAuraReduction(stressor, context)
          });

          const damage = stressor.health * finalPercentage;
          context.damageStressor(stressor.id, damage);
        }
      }
    }
  }
  
  private applyMantraEffects(
    stressors: Stressor[],
    abilities: AbilityState,
    center: Vector2,
    deltaTime: number,
    context: SystemContext,
    affirmAmplification: number,
    alignBonus: number,
    alignPhase: 'offense' | 'defense'
  ): void {
    // Mantra - Focus beam
    if (context.isMantraBeamActive()) {
      const targetId = context.getMantraTargetId();
      const target = stressors.find(s => s.id === targetId);
      
      if (target) {
        // Mantra beam DPS is pre-calculated with level scaling, so we treat it as base DPS
        // and only apply modifiers (affirm, align, resistance, vulnerability, aura)
        const baseDPS = context.getMantraBeamDamage();
        const baseDamagePerFrame = baseDPS * deltaTime;

        const finalDamage = this.interactionCalculator.calculateDamage({
          baseDamage: baseDamagePerFrame,
          abilityLevel: 0, // Level scaling already applied in getMantraBeamDamage()
          levelScaling: 0, // No additional scaling
          scalingType: 'multiplicative',
          affirmAmplification,
          alignBonus,
          alignPhase,
          stressorResistance: this.getStressorResistance(target, 'mantra'),
          stressorVulnerability: this.getStressorVulnerability(target, 'mantra'),
          auraReduction: this.calculateAuraReduction(target, context)
        });

        context.damageStressor(target.id, finalDamage);
        
        // Apply slow effect (persistent while beam active, cleared when beam ends in AbilitySystem)
        const effect: StatusEffect = {
          id: `mantra-${target.id}`,
          type: StatusEffectType.SLOW,
          source: 'mantra',
          value: GameConfig.MANTRA_SLOW_STRENGTH / affirmAmplification,
          duration: undefined, // Persistent while beam active
          startTime: Date.now(),
          stackingRule: StackingRule.MULTIPLICATIVE
        };
        context.getStatusEffectManager().apply(effect, target.id);
      }
    }
  }
  
  private applyGroundEffects(
    stressors: Stressor[],
    abilities: AbilityState,
    center: Vector2,
    deltaTime: number,
    context: SystemContext,
    affirmAmplification: number,
    alignBonus: number,
    alignPhase: 'offense' | 'defense'
  ): void {
    // Ground - Area field
    if (context.isGroundFieldActive()) {
      const fieldPos = context.getGroundFieldPosition();
      const fieldRadius = context.getGroundFieldRadius();
      
      if (fieldPos) {
        const groundLevel = abilities.ground.level;
        const baseDPS = GameConfig.GROUND_BASE_DAMAGE;
        const baseDamagePerFrame = baseDPS * deltaTime;
        
        for (const stressor of stressors) {
          const dist = distance(stressor.position, fieldPos);
          if (dist < fieldRadius) {
            const finalDamage = this.interactionCalculator.calculateDamage({
              baseDamage: baseDamagePerFrame,
              abilityLevel: groundLevel,
              levelScaling: GameConfig.GROUND_DAMAGE_SCALING,
              scalingType: 'multiplicative',
              affirmAmplification,
              alignBonus,
              alignPhase,
              stressorResistance: this.getStressorResistance(stressor, 'ground'),
              stressorVulnerability: this.getStressorVulnerability(stressor, 'ground'),
              auraReduction: this.calculateAuraReduction(stressor, context)
            });

            context.damageStressor(stressor.id, finalDamage);
            
            // Apply slow effect (persistent while in field, cleared when leaving in AbilitySystem)
            const effect: StatusEffect = {
              id: `ground-${stressor.id}`,
              type: StatusEffectType.SLOW,
              source: 'ground',
              value: GameConfig.GROUND_SLOW_STRENGTH / affirmAmplification,
              duration: undefined, // Persistent while in field
              startTime: Date.now(),
              stackingRule: StackingRule.MULTIPLICATIVE
            };
            context.getStatusEffectManager().apply(effect, stressor.id);
          } else {
            // Clear slow effect when stressor leaves the field
            context.getStatusEffectManager().removeBySource('ground', stressor.id);
          }
        }
      }
    }
  }
  
  private applyReleaseEffects(
    stressors: Stressor[],
    abilities: AbilityState,
    center: Vector2,
    context: SystemContext,
    affirmAmplification: number,
    alignBonus: number,
    alignPhase: 'offense' | 'defense'
  ): void {
    // Release - Ultimate cleanse
    if (context.wasReleaseJustTriggered()) {
      const releaseLevel = abilities.release.level;
      const releaseRadius = GameConfig.RELEASE_RADIUS * affirmAmplification;
      const serenityRestore = GameConfig.RELEASE_BASE_SERENITY_RESTORE * (1 + releaseLevel * GameConfig.RELEASE_SERENITY_SCALING) * affirmAmplification;
      
      // Damage all stressors in radius
      for (const stressor of stressors) {
        const dist = distance(stressor.position, center);
        if (dist < releaseRadius) {
          const finalDamage = this.interactionCalculator.calculateDamage({
            baseDamage: GameConfig.RELEASE_BASE_DAMAGE,
            abilityLevel: releaseLevel,
            levelScaling: GameConfig.RELEASE_DAMAGE_SCALING,
            scalingType: 'multiplicative',
            affirmAmplification,
            alignBonus,
            alignPhase,
            stressorResistance: this.getStressorResistance(stressor, 'release'),
            stressorVulnerability: this.getStressorVulnerability(stressor, 'release'),
            auraReduction: this.calculateAuraReduction(stressor, context)
          });

          context.damageStressor(stressor.id, finalDamage);
        }
      }
      
      // Restore Serenity
      context.modifyState({
        serenity: Math.min(GameConfig.MAX_SERENITY, context.state.serenity + serenityRestore)
      });
    }
  }
}
