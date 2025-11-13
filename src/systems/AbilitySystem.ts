import { AbilityState, AbilityUpgrade, Stressor, Vector2, AbilityBranch, BranchEffect } from '../types';
import { GameConfig } from '../GameConfig';
import { distance } from '../utils/MathUtils';
import { getBreathMaxRadius, getBreathRadius as calculateBreathRadius } from '../utils/BreathUtils';
import { getCycleProgress, getCurrentPhase, justTransitionedToPhase, getPhaseProgress, createTwoPhaseCycle, CyclePhase } from '../utils/CycleUtils';
import { ISystem, SystemContext } from './ISystem';
import { AbilityBranchConfig } from './AbilityBranches';

/**
 * AbilitySystem - Core ability mechanics implementation
 * 
 * Manages all player abilities, their activation patterns, cooldowns, and effects.
 * 
 * Design Reference: docs/design/ABILITIES.md
 * Config Definitions: src/config/AbilityDefinitions.ts
 * Architecture Notes: docs/architecture/ABILITY_SYSTEM.md
 */
export class AbilitySystem implements ISystem {
  private abilities: AbilityState;
  private breatheHeld: boolean = false;
  private breatheHoldStart: number = 0;
  private breatheCooldown: number = 0;
  private recenterCooldown: number = 0;
  private affirmCooldown: number = 0;
  
  // Automatic breathing cycle
  // Start at end of inhale phase (smallest size) = half cycle duration
  private breatheCycleTime: number = GameConfig.BREATHE_CYCLE_DURATION * 0.5;
  private breatheCycleDuration: number = GameConfig.BREATHE_CYCLE_DURATION; // Cycle duration from config (updated each frame)
  private breatheCycleConfig = createTwoPhaseCycle('inhale', 0.5, 'exhale');
  private previousCycleProgress: number = 0.5; // Track previous progress for transition detection
  private isInhaling: boolean = false; // Start at exhale phase (smallest size)
  private justReachedPeak: boolean = false; // Track if breath just reached peak (max size)
  
  // Recenter - Pulse burst
  private recenterPulseActive: boolean = false;
  private recenterPulseTime: number = 0;
  private recenterPulseRadius: number = 0;
  
  // Affirm - Ability amplifier state
  private affirmActive: boolean = false;
  private affirmActiveTime: number = 0;
  private affirmCooldownTime: number = 0;
  
  // Exhale - Periodic projectile burst
  private exhaleCooldown: number = 0;
  private exhaleWaves: Array<{ radius: number; maxRadius: number; damage: number; slowFactor: number; slowDuration: number; timeRemaining: number }> = [];
  
  // Reflect - Reactive defensive barrier
  private reflectCooldown: number = 0;
  private reflectBarrierActive: boolean = false;
  private reflectBarrierDuration: number = 0;
  
  // Mantra - Sustained focus beam
  private mantraCooldown: number = 0;
  private mantraBeamActive: boolean = false;
  private mantraTargetId: string | null = null;
  private mantraBeamDuration: number = 0;
  
  // Ground - Area trap
  private groundCooldown: number = 0;
  private groundFieldActive: boolean = false;
  private groundFieldPosition: { x: number; y: number } | null = null;
  private groundFieldDuration: number = 0;
  
  // Release - Ultimate cleanse
  private releaseCooldown: number = 0;
  private releaseJustTriggered: boolean = false;
  
  // Align - Rhythmic modulator
  private alignCycleTimer: number = 0;
  private alignPhase: 'offense' | 'defense' = 'offense';

  constructor() {
    // Initialize ability state
    // Note: Ability definitions and design specs are in:
    // - src/config/AbilityDefinitions.ts (structured config)
    // - docs/design/ABILITIES.md (design specifications)
    this.abilities = {
      breathe: {
        name: 'Breathe',
        description: 'Area of Effect ability that pulses with breathing, dealing damage to stressors within range',
        cost: 0, // No cost - cooldown only
        level: 0,
        maxLevel: 10,
        branchPoints: [3, 6, 9],
        chosenBranches: new Map()
      },
      recenter: {
        name: 'Recenter',
        description: 'Pulse burst that slows stressors it passes through',
        cost: 0, // No cost - cooldown only
        level: 0,
        maxLevel: 10,
        branchPoints: [3, 6, 9],
        chosenBranches: new Map()
      },
      affirm: {
        name: 'Affirm',
        description: 'Amplifies effectiveness of Breathe and Recenter abilities',
        cost: 0, // No cost - cooldown only
        level: 0,
        maxLevel: 10,
        branchPoints: [3, 6, 9],
        chosenBranches: new Map()
      },
      exhale: {
        name: 'Exhale',
        description: 'Emits expanding waves of calming energy that damage and slow nearby stressors',
        cost: 0, // No cost - cooldown only
        level: 0,
        maxLevel: 10,
        branchPoints: [3, 6, 9],
        chosenBranches: new Map()
      },
      reflect: {
        name: 'Reflect',
        description: 'Generates a reflective barrier when Serenity drops too low, converting incoming stress into damage',
        cost: 0, // No cost - cooldown only
        level: 0,
        maxLevel: 10,
        branchPoints: [3, 6, 9],
        chosenBranches: new Map()
      },
      mantra: {
        name: 'Mantra',
        description: 'Focuses energy on a single stressor, burning through its turmoil over time',
        cost: 0, // No cost - cooldown only
        level: 0,
        maxLevel: 10,
        branchPoints: [3, 6, 9],
        chosenBranches: new Map()
      },
      ground: {
        name: 'Ground',
        description: 'Creates a calming field that slows and damages stressors that linger inside it',
        cost: 0, // No cost - cooldown only
        level: 0,
        maxLevel: 10,
        branchPoints: [3, 6, 9],
        chosenBranches: new Map()
      },
      release: {
        name: 'Release',
        description: 'A final act of letting go — unleashes a wave that clears all stressors and restores inner calm',
        cost: 0, // No cost - cooldown only
        level: 0,
        maxLevel: 10,
        branchPoints: [3, 6, 9],
        chosenBranches: new Map()
      },
      align: {
        name: 'Align',
        description: 'Periodically alternates between amplifying Breathe or Recenter to promote balance and rhythm',
        cost: 0, // No cost - cooldown only
        level: 0,
        maxLevel: 10,
        branchPoints: [3, 6, 9],
        chosenBranches: new Map()
      }
    };
  }

  startBreathe(): void {
    if (this.breatheCooldown > 0) return;
    this.breatheHeld = true;
    this.breatheHoldStart = Date.now();
  }

  releaseBreathe(): { slowFactor: number; auraBoost: number } | null {
    // Deprecated: Breathe now applies constant damage, not pulse-based slow
    // This method is kept for compatibility but returns null
    return null;
  }

  canBreathe(): boolean {
    // Breathe is automatic - no cost needed
    return true;
  }

  useRecenter(): { radius: number; force: number } | null {
    // Deprecated: Recenter is now always active (rotating cone), no manual activation
    // This method is kept for compatibility but returns null
    return null;
  }

  canRecenter(): boolean {
    return this.recenterCooldown <= 0;
  }

  useAffirm(): { maxTargets: number; insightMultiplier: number; serenityRestore: number } | null {
    // Deprecated: Affirm is now auto-triggered, no manual activation
    // This method is kept for compatibility but returns null
    return null;
  }
  
  isAffirmActive(): boolean {
    return this.affirmActive;
  }
  
  getAffirmAmplification(): number {
    if (!GameConfig.ABILITY_ENABLED.affirm || !this.affirmActive) return 1.0;
    const level = this.abilities.affirm.level;
    return 1 + (level * GameConfig.AFFIRM_AMPLIFICATION_SCALING);
  }
  
  getAffirmCooldownRemaining(): number {
    if (this.affirmActive) return 0;
    return this.affirmCooldownTime;
  }
  
  getAffirmActiveTimeRemaining(): number {
    if (!this.affirmActive) return 0;
    return this.affirmActiveTime;
  }

  canAffirm(): boolean {
    return this.affirmCooldown <= 0;
  }

  private lastInhalingState: boolean = true;
  
  // New ISystem-compliant update method
  update(deltaTime: number, context: SystemContext): void {
    // Extract values from context
    const stressors = context.getStressors();
    const serenity = context.state.serenity;
    const center = context.center;
    
    // Call existing update logic with extracted values
    this.updateLegacy(deltaTime, serenity, stressors, center, context);
  }
  
  // Legacy update method - kept for backward compatibility during transition
  // Will be removed once Game is fully migrated to use ISystem interface
  updateLegacy(deltaTime: number, serenity: number, stressors: Stressor[], center: Vector2, context: SystemContext): void {
    this.breatheCooldown = Math.max(0, this.breatheCooldown - deltaTime);
    this.recenterCooldown = Math.max(0, this.recenterCooldown - deltaTime);
    this.affirmCooldown = Math.max(0, this.affirmCooldown - deltaTime);
    this.exhaleCooldown = Math.max(0, this.exhaleCooldown - deltaTime);
    this.reflectCooldown = Math.max(0, this.reflectCooldown - deltaTime);
    this.mantraCooldown = Math.max(0, this.mantraCooldown - deltaTime);
    this.groundCooldown = Math.max(0, this.groundCooldown - deltaTime);
    this.releaseCooldown = Math.max(0, this.releaseCooldown - deltaTime);
    
    // Recenter pulse burst management (auto-trigger when cooldown ends)
    if (GameConfig.ABILITY_ENABLED.recenter) {
      if (!this.recenterPulseActive && this.recenterCooldown <= 0) {
        // Auto-trigger: start pulse
        this.recenterPulseActive = true;
        this.recenterPulseTime = GameConfig.RECENTER_PULSE_DURATION;
        this.recenterPulseRadius = 0;
      }
      
      if (this.recenterPulseActive) {
        this.recenterPulseTime -= deltaTime;
        const level = this.abilities.recenter.level;
        const maxRadius = GameConfig.RECENTER_BASE_MAX_RADIUS + (level * GameConfig.RECENTER_RADIUS_SCALING);
        // Expand pulse radius
        this.recenterPulseRadius = Math.min(maxRadius, this.recenterPulseRadius + GameConfig.RECENTER_PULSE_SPEED * deltaTime);
        
        if (this.recenterPulseTime <= 0) {
          // Pulse finished, start cooldown
          this.recenterPulseActive = false;
          this.recenterPulseRadius = 0;
          this.recenterCooldown = GameConfig.RECENTER_COOLDOWN;
        }
      } else {
        // Update cooldown
        this.recenterCooldown = Math.max(0, this.recenterCooldown - deltaTime);
      }
    }
    
    // Affirm state management (auto-trigger when cooldown ends)
    if (GameConfig.ABILITY_ENABLED.affirm) {
      if (!this.affirmActive && this.affirmCooldownTime <= 0) {
        // Auto-trigger: start active period
        this.affirmActive = true;
        this.affirmActiveTime = GameConfig.AFFIRM_DURATION;
        this.affirmCooldownTime = 0;
      }
      
      if (this.affirmActive) {
        this.affirmActiveTime -= deltaTime;
        if (this.affirmActiveTime <= 0) {
          // Active period ended, start cooldown
          this.affirmActive = false;
          this.affirmCooldownTime = GameConfig.AFFIRM_COOLDOWN;
        }
      } else {
        this.affirmCooldownTime = Math.max(0, this.affirmCooldownTime - deltaTime);
      }
    }
    
    // Exhale - Periodic projectile burst
    if (GameConfig.ABILITY_ENABLED.exhale) {
      const exhaleLevel = this.abilities.exhale.level;
      const exhaleCooldownBase = GameConfig.EXHALE_COOLDOWN - (exhaleLevel * GameConfig.EXHALE_COOLDOWN_SCALING);
      const shouldTriggerEarly = serenity <= GameConfig.EXHALE_EARLY_TRIGGER_SERENITY;
      
      if (this.exhaleCooldown <= 0 && (shouldTriggerEarly || this.exhaleCooldown <= -0.1)) {
        // Trigger Exhale - create 3 waves
        const damage = GameConfig.EXHALE_BASE_DAMAGE * (1 + exhaleLevel * GameConfig.EXHALE_DAMAGE_SCALING);
        const slowDuration = GameConfig.EXHALE_SLOW_DURATION + (exhaleLevel * GameConfig.EXHALE_SLOW_DURATION_SCALING);
        const slowFactor = GameConfig.EXHALE_SLOW_STRENGTH;
        
        for (let i = 0; i < GameConfig.EXHALE_WAVE_COUNT; i++) {
          const waveDelay = i * GameConfig.EXHALE_WAVE_INTERVAL;
          const maxRadius = GameConfig.EXHALE_WAVE_RADII[i];
          this.exhaleWaves.push({
            radius: 0,
            maxRadius,
            damage,
            slowFactor,
            slowDuration,
            timeRemaining: (maxRadius / GameConfig.EXHALE_WAVE_SPEED) + waveDelay
          });
        }
        
        this.exhaleCooldown = Math.max(1, exhaleCooldownBase); // Minimum 1s cooldown
      }
      
      // Update Exhale waves
      for (let i = this.exhaleWaves.length - 1; i >= 0; i--) {
        const wave = this.exhaleWaves[i];
        wave.timeRemaining -= deltaTime;
        
        if (wave.timeRemaining > 0) {
          // Expand wave
          wave.radius = Math.min(wave.maxRadius, wave.radius + GameConfig.EXHALE_WAVE_SPEED * deltaTime);
        } else {
          // Wave expired
          this.exhaleWaves.splice(i, 1);
        }
      }
    }
    
    // Reflect - Reactive defensive barrier
    if (GameConfig.ABILITY_ENABLED.reflect) {
      if (!this.reflectBarrierActive && this.reflectCooldown <= 0 && serenity <= GameConfig.REFLECT_TRIGGER_SERENITY) {
        const reflectLevel = this.abilities.reflect.level;
        this.reflectBarrierActive = true;
        this.reflectBarrierDuration = GameConfig.REFLECT_BASE_DURATION + (reflectLevel * GameConfig.REFLECT_DURATION_SCALING);
        this.reflectCooldown = 0; // Will be set after barrier ends
      }
      
      if (this.reflectBarrierActive) {
        this.reflectBarrierDuration -= deltaTime;
        if (this.reflectBarrierDuration <= 0) {
          this.reflectBarrierActive = false;
          this.reflectCooldown = GameConfig.REFLECT_COOLDOWN;
        }
      }
    }
    
    // Mantra - Sustained focus beam
    if (GameConfig.ABILITY_ENABLED.mantra) {
      if (!this.mantraBeamActive && this.mantraCooldown <= 0 && stressors.length > 0) {
        // Find nearest stressor to center
        let nearestStressor: Stressor | null = null;
        let nearestDistance = Infinity;
        
        for (const stressor of stressors) {
          const dist = distance(stressor.position, center);
          if (dist < nearestDistance) {
            nearestDistance = dist;
            nearestStressor = stressor;
          }
        }
        
        if (nearestStressor) {
          const mantraLevel = this.abilities.mantra.level;
          this.mantraBeamActive = true;
          this.mantraTargetId = nearestStressor.id;
          this.mantraBeamDuration = GameConfig.MANTRA_BASE_DURATION + (mantraLevel * GameConfig.MANTRA_DURATION_SCALING);
          this.mantraCooldown = 0; // Will be set after beam ends
        }
      }
      
      if (this.mantraBeamActive) {
        // Check if target still exists
        const targetExists = stressors.some(s => s.id === this.mantraTargetId);
        
        if (!targetExists && stressors.length > 0) {
          // Target died, reassign to nearest
          let nearestStressor: Stressor | null = null;
          let nearestDistance = Infinity;
          
          for (const stressor of stressors) {
            const dist = distance(stressor.position, center);
            if (dist < nearestDistance) {
              nearestDistance = dist;
              nearestStressor = stressor;
            }
          }
          
          if (nearestStressor) {
            this.mantraTargetId = nearestStressor.id;
          }
        }
        
        this.mantraBeamDuration -= deltaTime;
        if (this.mantraBeamDuration <= 0) {
          // Clear mantra slow effect when beam ends
          if (this.mantraTargetId) {
            context.getStatusEffectManager().removeBySource('mantra', this.mantraTargetId);
          }
          this.mantraBeamActive = false;
          this.mantraTargetId = null;
          this.mantraCooldown = GameConfig.MANTRA_COOLDOWN;
        }
      }
    }
    
    // Ground - Area trap
    if (GameConfig.ABILITY_ENABLED.ground) {
      if (!this.groundFieldActive && this.groundCooldown <= 0) {
        const groundLevel = this.abilities.ground.level;
        // Spawn field at random position 300-500px from center
        const angle = Math.random() * Math.PI * 2;
        const distance = GameConfig.GROUND_SPAWN_DISTANCE_MIN + 
                        Math.random() * (GameConfig.GROUND_SPAWN_DISTANCE_MAX - GameConfig.GROUND_SPAWN_DISTANCE_MIN);
        this.groundFieldPosition = {
          x: center.x + Math.cos(angle) * distance,
          y: center.y + Math.sin(angle) * distance
        };
        this.groundFieldActive = true;
        this.groundFieldDuration = GameConfig.GROUND_BASE_DURATION + (groundLevel * GameConfig.GROUND_DURATION_SCALING);
        this.groundCooldown = 0; // Will be set after field ends
      }
      
      if (this.groundFieldActive) {
        this.groundFieldDuration -= deltaTime;
        if (this.groundFieldDuration <= 0) {
          // Clear ground slow effects from all stressors when field ends
          const stressors = context.getStressors();
          for (const stressor of stressors) {
            context.getStatusEffectManager().removeBySource('ground', stressor.id);
          }
          this.groundFieldActive = false;
          this.groundFieldPosition = null;
          this.groundCooldown = GameConfig.GROUND_COOLDOWN;
        }
      }
    }
    
    // Release - Ultimate cleanse
    if (GameConfig.ABILITY_ENABLED.release) {
      this.releaseJustTriggered = false;
      if (this.releaseCooldown <= 0 && serenity <= GameConfig.RELEASE_TRIGGER_SERENITY) {
        this.releaseJustTriggered = true;
        this.releaseCooldown = GameConfig.RELEASE_COOLDOWN;
      }
    }
    
    // Align - Rhythmic modulator (always active when enabled)
    if (GameConfig.ABILITY_ENABLED.align) {
      const alignLevel = this.abilities.align.level;
      const cycleDuration = GameConfig.ALIGN_CYCLE_DURATION + (alignLevel * GameConfig.ALIGN_CYCLE_SCALING);
      this.alignCycleTimer += deltaTime;
      
      if (this.alignCycleTimer >= cycleDuration) {
        this.alignCycleTimer = 0;
        this.alignPhase = this.alignPhase === 'offense' ? 'defense' : 'offense';
      }
    }
    
    // Automatic breathing cycle (read duration from config to allow runtime changes)
    this.breatheCycleDuration = GameConfig.BREATHE_CYCLE_DURATION;
    this.breatheCycleTime += deltaTime;
    
    // Use CycleUtils for progress calculation
    const cycleProgress = getCycleProgress(this.breatheCycleTime, this.breatheCycleDuration);
    
    // Determine current phase using CycleUtils
    const currentPhase = getCurrentPhase(cycleProgress, this.breatheCycleConfig.phases);
    const inhalePhase = this.breatheCycleConfig.phases[0];
    const exhalePhase = this.breatheCycleConfig.phases[1];
    
    // Update inhaling state
    this.lastInhalingState = this.isInhaling;
    this.isInhaling = currentPhase === inhalePhase;
    
    // Track breathing state for visual/effect purposes
    if (this.isInhaling) {
      // During inhale, build up
      this.breatheHeld = true;
      const inhaleProgress = getPhaseProgress(cycleProgress, inhalePhase); // 0 to 1 during inhale
      this.breatheHoldStart = Date.now() - (inhaleProgress * this.breatheCycleDuration * 0.5 * 1000);
    } else {
      // During exhale, ready to release
      this.breatheHeld = true;
      this.breatheHoldStart = Date.now() - (this.breatheCycleDuration * 0.5 * 1000); // Simulate full inhale
    }
    
    // Detect if breath just reached peak (maximum size)
    // Peak occurs at progress 1.0 (end of exhale) or wrap-around from 1.0 to 0.0
    // Reset flag at start of update, then set if condition is met (ensures flag is only true for one frame)
    this.justReachedPeak = false;
    if (this.detectBreathPeak(this.previousCycleProgress, cycleProgress)) {
      this.justReachedPeak = true;
    }
    
    // Store progress for transition detection
    this.previousCycleProgress = cycleProgress;
  }
  
  /**
   * Detect when breath reaches maximum size (peak of exhale).
   * Breath reaches max size at progress 1.0 (end of exhale - peak expansion).
   */
  private detectBreathPeak(previousProgress: number, currentProgress: number): boolean {
    // Check if we crossed the threshold approaching 1.0 (end of exhale - max size)
    // Use a threshold to catch the transition even with frame timing variations
    const crossedThreshold = previousProgress < 0.95 && currentProgress >= 0.95;
    
    // Also check if we wrapped around from near 1.0 to 0.0 (cycle reset at same peak moment)
    // This handles the case where progress goes from 0.99+ to 0.0+ in one frame
    const wrappedAround = previousProgress > 0.95 && currentProgress < 0.05;
    
    // Only trigger once per cycle - prefer the wrap-around detection to avoid double-triggering
    // since 0.0 and 1.0 represent the same moment (peak size)
    return wrappedAround || (crossedThreshold && previousProgress > 0.5); // Only trigger if coming from exhale phase
  }
  
  justTransitionedToExhale(): boolean {
    // Use CycleUtils to detect transition to exhale phase
    const currentProgress = getCycleProgress(this.breatheCycleTime, this.breatheCycleDuration);
    const exhalePhase = this.breatheCycleConfig.phases[1];
    return justTransitionedToPhase(currentProgress, this.previousCycleProgress, exhalePhase);
  }
  
  justReachedBreathPeak(): boolean {
    // Returns true if breath just reached maximum size (peak of exhale)
    return this.justReachedPeak;
  }
  
  getBreatheCycleProgress(): number {
    // Returns intensity: 0-1 during inhale, 1-0 during exhale (for progress bars)
    const cycleProgress = getCycleProgress(this.breatheCycleTime, this.breatheCycleDuration);
    const inhalePhase = this.breatheCycleConfig.phases[0];
    const exhalePhase = this.breatheCycleConfig.phases[1];
    
    if (this.isInhaling) {
      // During inhale: return phase progress (0 to 1)
      return getPhaseProgress(cycleProgress, inhalePhase);
    } else {
      // During exhale: return inverted phase progress (1 to 0)
      return 1 - getPhaseProgress(cycleProgress, exhalePhase);
    }
  }
  
  getBreatheRawCycleProgress(): number {
    // Returns raw cycle progress: 0-1 for full cycle (0 = start inhale, 0.5 = start exhale, 1 = end exhale)
    return getCycleProgress(this.breatheCycleTime, this.breatheCycleDuration);
  }
  
  isInhalingPhase(): boolean {
    return this.isInhaling;
  }
  
  forceReleaseBreathe(): void {
    // Force release breathe (for recovery from stuck state)
    this.breatheHeld = false;
  }

  upgradeAbility(abilityName: keyof AbilityState, insight: number): boolean {
    const ability = this.abilities[abilityName];
    if (ability.level >= ability.maxLevel) return false;
    
    const cost = this.getUpgradeCost(abilityName);
    if (insight < cost) return false;
    
    ability.level++;
    return true;
  }

  getUpgradeCost(abilityName: keyof AbilityState): number {
    const ability = this.abilities[abilityName];
    return Math.floor(
      GameConfig.UPGRADE_COST_BASE * 
      Math.pow(GameConfig.UPGRADE_COST_MULTIPLIER, ability.level)
    );
  }

  getAbilities(): AbilityState {
    return { ...this.abilities };
  }
  
  getAbilityLevel(ability: keyof AbilityState): number {
    return this.abilities[ability].level;
  }
  
  getBreathMaxRadius(): number {
    // Returns the maximum breath AoE radius
    return getBreathMaxRadius();
  }
  
  isAuraActive(): boolean {
    // DEPRECATED: Legacy method for compatibility - breath ability is always active
    return true;
  }
  
          /**
           * Get current pulsing breath Area of Effect radius based on breathing cycle.
           * Uses buffer amount (added to player radius), growth amount, and cycle duration.
           */
          getBreathRadius(rawProgress: number): number {
            return calculateBreathRadius(rawProgress);
          }

  getBreatheHeld(): boolean {
    return this.breatheHeld;
  }

  getBreatheHoldDuration(): number {
    if (!this.breatheHeld) return 0;
    return (Date.now() - this.breatheHoldStart) / 1000;
  }
  
  getBreatheHoldStart(): number {
    return this.breatheHoldStart;
  }
  
  isRecenterPulseActive(): boolean {
    return this.recenterPulseActive;
  }
  
  getRecenterPulseRadius(): number {
    return this.recenterPulseRadius;
  }
  
  getRecenterCooldownRemaining(): number {
    return this.recenterCooldown;
  }
  
  // Exhale query methods
  getExhaleWaves(): Array<{ radius: number; maxRadius: number; damage: number; slowFactor: number; slowDuration: number }> {
    return this.exhaleWaves.map(w => ({
      radius: w.radius,
      maxRadius: w.maxRadius,
      damage: w.damage,
      slowFactor: w.slowFactor,
      slowDuration: w.slowDuration
    }));
  }
  
  // Reflect query methods
  isReflectBarrierActive(): boolean {
    return this.reflectBarrierActive;
  }
  
  getReflectBarrierRadius(): number {
    if (!this.reflectBarrierActive) return 0;
    return GameConfig.REFLECT_BARRIER_RADIUS;
  }
  
  // Mantra query methods
  isMantraBeamActive(): boolean {
    return this.mantraBeamActive;
  }
  
  getMantraTargetId(): string | null {
    return this.mantraTargetId;
  }
  
  getMantraBeamDamage(): number {
    if (!this.mantraBeamActive) return 0;
    const level = this.abilities.mantra.level;
    return GameConfig.MANTRA_BASE_DAMAGE * (1 + level * GameConfig.MANTRA_DAMAGE_SCALING);
  }
  
  // Ground query methods
  isGroundFieldActive(): boolean {
    return this.groundFieldActive;
  }
  
  getGroundFieldPosition(): Vector2 | null {
    return this.groundFieldPosition ? { ...this.groundFieldPosition } : null;
  }
  
  getGroundFieldRadius(): number {
    if (!this.groundFieldActive) return 0;
    return GameConfig.GROUND_FIELD_RADIUS;
  }
  
  // Release query methods
  wasReleaseJustTriggered(): boolean {
    return this.releaseJustTriggered;
  }
  
  // Align query methods
  getAlignPhase(): 'offense' | 'defense' {
    return this.alignPhase;
  }
  
  getAlignBonus(): number {
    if (!GameConfig.ABILITY_ENABLED.align) return 0;
    const level = this.abilities.align.level;
    return GameConfig.ALIGN_BASE_BONUS * (1 + level * GameConfig.ALIGN_BONUS_SCALING);
  }

  // Branch system methods
  isAtBranchPoint(abilityName: keyof AbilityState): boolean {
    const ability = this.abilities[abilityName];
    if (!ability) return false;
    
    // Check if current level is a branch point and no branch has been chosen yet
    return ability.branchPoints.includes(ability.level) && 
           !ability.chosenBranches.has(ability.level);
  }

  getAvailableBranches(abilityName: keyof AbilityState): AbilityBranch[] {
    const ability = this.abilities[abilityName];
    if (!ability) return [];
    
    const level = ability.level;
    const config = AbilityBranchConfig[abilityName];
    if (!config || !config[level]) return [];
    
    return config[level];
  }

  chooseBranch(abilityName: keyof AbilityState, branchId: string): boolean {
    const ability = this.abilities[abilityName];
    if (!ability) return false;
    
    // Verify branch exists and is available
    const availableBranches = this.getAvailableBranches(abilityName);
    const branch = availableBranches.find(b => b.id === branchId);
    if (!branch) return false;
    
    // Verify we're at a branch point
    if (!this.isAtBranchPoint(abilityName)) return false;
    
    // Record the choice
    ability.chosenBranches.set(ability.level, branchId);
    return true;
  }

  getBranchEffects(abilityName: keyof AbilityState): BranchEffect[] {
    const ability = this.abilities[abilityName];
    if (!ability) return [];
    
    // Get all branch effects for all chosen branches (not just current level)
    const allEffects: BranchEffect[] = [];
    
    for (const [level, branchId] of ability.chosenBranches.entries()) {
      const config = AbilityBranchConfig[abilityName];
      if (!config || !config[level]) continue;
      
      const branch = config[level].find(b => b.id === branchId);
      if (branch) {
        allEffects.push(...branch.effects);
      }
    }
    
    return allEffects;
  }

  // Helper methods for applying branch modifiers
  getModifiedDamage(abilityName: keyof AbilityState, baseDamage: number): number {
    const effects = this.getBranchEffects(abilityName);
    let damage = baseDamage;
    
    for (const effect of effects) {
      if (effect.type === 'damage') {
        damage *= effect.modifier;
      }
    }
    
    return damage;
  }

  getModifiedRadius(abilityName: keyof AbilityState, baseRadius: number): number {
    const effects = this.getBranchEffects(abilityName);
    let radius = baseRadius;
    
    for (const effect of effects) {
      if (effect.type === 'radius') {
        radius *= effect.modifier;
      }
    }
    
    return radius;
  }

  getModifiedCooldown(abilityName: keyof AbilityState, baseCooldown: number): number {
    const effects = this.getBranchEffects(abilityName);
    let cooldown = baseCooldown;
    
    for (const effect of effects) {
      if (effect.type === 'cooldown') {
        cooldown *= effect.modifier;
      }
    }
    
    return cooldown;
  }

  getModifiedDuration(abilityName: keyof AbilityState, baseDuration: number): number {
    const effects = this.getBranchEffects(abilityName);
    let duration = baseDuration;
    
    for (const effect of effects) {
      if (effect.type === 'duration') {
        duration *= effect.modifier;
      }
    }
    
    return duration;
  }
}

