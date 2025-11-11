import { ISystem, SystemContext } from './ISystem';
import { GameConfig } from '../GameConfig';
import { distance } from '../utils/MathUtils';
import { Stressor, AbilityState, Vector2 } from '../types';

export class AbilityEffectSystem implements ISystem {
  update(deltaTime: number, context: SystemContext): void {
    const stressors = context.getStressors();
    const abilities = context.getAbilities();
    const center = context.center;
    
    // Get Affirm amplification and Align bonus/phase
    const affirmAmplification = context.getAffirmAmplification();
    const alignBonus = context.getAlignBonus();
    const alignPhase = context.getAlignPhase();
    
    // Apply all ability effects
    this.applyBreatheEffects(stressors, abilities, center, deltaTime, context, affirmAmplification, alignBonus, alignPhase);
    this.applyRecenterEffects(stressors, abilities, center, context, affirmAmplification, alignBonus, alignPhase);
    this.applyExhaleEffects(stressors, abilities, center, context, affirmAmplification);
    this.applyReflectEffects(stressors, abilities, center, context, affirmAmplification);
    this.applyMantraEffects(stressors, abilities, center, deltaTime, context, affirmAmplification);
    this.applyGroundEffects(stressors, abilities, center, deltaTime, context, affirmAmplification);
    this.applyReleaseEffects(stressors, abilities, center, context, affirmAmplification);
  }
  
  private applyBreatheEffects(
    stressors: Stressor[],
    abilities: AbilityState,
    center: Vector2,
    deltaTime: number,
    context: SystemContext,
    affirmAmplification: number,
    alignBonus: number,
    alignPhase: 'offense' | 'defense'
  ): void {
    const breatheLevel = abilities.breathe.level;
    const breatheDamageBase = GameConfig.BREATHE_BASE_DAMAGE_PER_SECOND * 
                              (1 + breatheLevel * GameConfig.BREATHE_DAMAGE_SCALING) * 
                              deltaTime;
    // Apply Affirm amplification to damage
    let breatheDamage = breatheDamageBase * affirmAmplification;
    // Apply Align bonus if in offense phase
    if (alignPhase === 'offense') {
      breatheDamage *= (1 + alignBonus);
    }
    // Apply Affirm amplification to aura radius (for damage calculation only)
    const effectiveAuraRadius = context.getAuraRadius() * affirmAmplification;
    
    for (const stressor of stressors) {
      const dist = distance(stressor.position, center);
      if (dist < effectiveAuraRadius) {
        // Breathe deals constant damage per second (stacks with passive aura damage)
        context.damageStressor(stressor.id, breatheDamage);
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
          // Apply persistent slow debuff (only set once, persists until stressor dies)
          if (stressor.slowDebuff === undefined) {
            stressor.slowDebuff = slowFactor;
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
    affirmAmplification: number
  ): void {
    // Exhale - Expanding waves
    const exhaleWaves = context.getExhaleWaves();
    for (const wave of exhaleWaves) {
      for (const stressor of stressors) {
        const dist = distance(stressor.position, center);
        // Hit if stressor is within wave ring (wave expands, so check if just passed through)
        const waveThickness = 50; // Thickness of the wave ring
        if (dist <= wave.radius && dist > wave.radius - waveThickness) {
          const damage = wave.damage * affirmAmplification;
          context.damageStressor(stressor.id, damage);
          // Apply slow debuff (persistent for slowDuration)
          if (!stressor.slowDebuff || stressor.slowDebuff > wave.slowFactor / affirmAmplification) {
            stressor.slowDebuff = wave.slowFactor / affirmAmplification;
          }
        }
      }
    }
  }
  
  private applyReflectEffects(
    stressors: Stressor[],
    abilities: AbilityState,
    center: Vector2,
    context: SystemContext,
    affirmAmplification: number
  ): void {
    // Reflect - Barrier collision damage
    if (context.isReflectBarrierActive()) {
      const reflectLevel = abilities.reflect.level;
      const reflectDamage = (GameConfig.REFLECT_BASE_DAMAGE + (reflectLevel * GameConfig.REFLECT_DAMAGE_SCALING)) * affirmAmplification;
      const barrierRadius = context.getReflectBarrierRadius();
      
      for (const stressor of stressors) {
        const dist = distance(stressor.position, center);
        if (dist < barrierRadius) {
          const damage = stressor.health * reflectDamage;
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
    affirmAmplification: number
  ): void {
    // Mantra - Focus beam
    if (context.isMantraBeamActive()) {
      const targetId = context.getMantraTargetId();
      const target = stressors.find(s => s.id === targetId);
      
      if (target) {
        const beamDamage = context.getMantraBeamDamage() * affirmAmplification * deltaTime;
        context.damageStressor(target.id, beamDamage);
        // Apply slow
        target.slowDebuff = GameConfig.MANTRA_SLOW_STRENGTH / affirmAmplification;
      }
    }
  }
  
  private applyGroundEffects(
    stressors: Stressor[],
    abilities: AbilityState,
    center: Vector2,
    deltaTime: number,
    context: SystemContext,
    affirmAmplification: number
  ): void {
    // Ground - Area field
    if (context.isGroundFieldActive()) {
      const fieldPos = context.getGroundFieldPosition();
      const fieldRadius = context.getGroundFieldRadius();
      
      if (fieldPos) {
        const groundLevel = abilities.ground.level;
        const groundDamage = GameConfig.GROUND_BASE_DAMAGE * (1 + groundLevel * GameConfig.GROUND_DAMAGE_SCALING) * affirmAmplification * deltaTime;
        
        for (const stressor of stressors) {
          const dist = distance(stressor.position, fieldPos);
          if (dist < fieldRadius) {
            context.damageStressor(stressor.id, groundDamage);
            // Apply slow (persistent while in field)
            stressor.slowDebuff = GameConfig.GROUND_SLOW_STRENGTH / affirmAmplification;
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
    affirmAmplification: number
  ): void {
    // Release - Ultimate cleanse
    if (context.wasReleaseJustTriggered()) {
      const releaseLevel = abilities.release.level;
      const releaseDamage = GameConfig.RELEASE_BASE_DAMAGE * (1 + releaseLevel * GameConfig.RELEASE_DAMAGE_SCALING) * affirmAmplification;
      const releaseRadius = GameConfig.RELEASE_RADIUS * affirmAmplification;
      const serenityRestore = GameConfig.RELEASE_BASE_SERENITY_RESTORE * (1 + releaseLevel * GameConfig.RELEASE_SERENITY_SCALING) * affirmAmplification;
      
      // Damage all stressors in radius
      for (const stressor of stressors) {
        const dist = distance(stressor.position, center);
        if (dist < releaseRadius) {
          context.damageStressor(stressor.id, releaseDamage);
        }
      }
      
      // Restore Serenity
      context.modifyState({
        serenity: Math.min(GameConfig.MAX_SERENITY, context.state.serenity + serenityRestore)
      });
    }
  }
}
