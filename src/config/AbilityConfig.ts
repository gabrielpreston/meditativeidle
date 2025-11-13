/**
 * Ability Config Bridge
 * 
 * Bridges AbilityDefinitions with GameConfig, providing runtime configuration
 * values that can be derived from AbilityDefinitions or fall back to GameConfig.
 * 
 * This allows gradual migration from GameConfig to AbilityDefinitions.
 */

import { AbilityDefinitions, getAbilityDefinition, AbilityType } from './AbilityDefinitions';
import { GameConfig } from '../GameConfig';
import { getBreathMaxRadius } from '../utils/BreathUtils';

/**
 * Get base damage for an ability at a given level
 */
export function getAbilityDamage(ability: AbilityType, level: number): number {
  const def = getAbilityDefinition(ability);
  if (!def.baseStats.damage) return 0;
  
  const scaling = def.scaling.damagePerLevel || 0;
  return def.baseStats.damage * (1 + level * scaling);
}

/**
 * Get base radius for an ability at a given level
 */
export function getAbilityRadius(ability: AbilityType, level: number): number {
  const def = getAbilityDefinition(ability);
  if (!def.baseStats.radius) return 0;
  
  const scaling = def.scaling.radiusPerLevel || 0;
  // If scaling is a multiplier (0-1), use multiplier; otherwise use additive pixels
  if (scaling < 1) {
    return def.baseStats.radius * (1 + level * scaling);
  } else {
    return def.baseStats.radius + (level * scaling);
  }
}

/**
 * Get cooldown for an ability at a given level
 */
export function getAbilityCooldown(ability: AbilityType, level: number): number {
  const def = getAbilityDefinition(ability);
  if (!def.baseStats.cooldown) return 0;
  
  const scaling = def.scaling.cooldownPerLevel || 0;
  return Math.max(0.1, def.baseStats.cooldown + (level * scaling));
}

/**
 * Get duration for an ability at a given level
 */
export function getAbilityDuration(ability: AbilityType, level: number): number {
  const def = getAbilityDefinition(ability);
  if (!def.baseStats.duration) return 0;
  
  const scaling = def.scaling.durationPerLevel || 0;
  return def.baseStats.duration + (level * scaling);
}

/**
 * Get slow strength for an ability at a given level
 */
export function getAbilitySlowStrength(ability: AbilityType, level: number): number {
  const def = getAbilityDefinition(ability);
  if (!def.baseStats.slowStrength) return 1.0;
  
  const scaling = def.scaling.slowPerLevel || 0;
  return def.baseStats.slowStrength + (level * scaling);
}

/**
 * Runtime config values that bridge AbilityDefinitions with GameConfig
 * 
 * Some values are still in GameConfig for compatibility. This object provides
 * a unified interface that prefers AbilityDefinitions but falls back to GameConfig.
 */
export const AbilityConfig = {
          // Breathe - Core attributes only (no damage, no scaling)
          get BREATHE_BASE_RADIUS() {
            // Return max radius (player + buffer + growth) for compatibility
            return AbilityDefinitions.breathe.baseStats.radius || getBreathMaxRadius();
          },
  
  // Recenter
  get RECENTER_COOLDOWN() {
    return AbilityDefinitions.recenter.baseStats.cooldown || GameConfig.RECENTER_COOLDOWN;
  },
  get RECENTER_PULSE_DURATION() {
    return AbilityDefinitions.recenter.baseStats.duration || GameConfig.RECENTER_PULSE_DURATION;
  },
  get RECENTER_BASE_MAX_RADIUS() {
    return AbilityDefinitions.recenter.baseStats.radius || GameConfig.RECENTER_BASE_MAX_RADIUS;
  },
  get RECENTER_RADIUS_SCALING() {
    return AbilityDefinitions.recenter.scaling.radiusPerLevel || GameConfig.RECENTER_RADIUS_SCALING;
  },
  get RECENTER_PULSE_SPEED() {
    return GameConfig.RECENTER_PULSE_SPEED; // Still in GameConfig
  },
  get RECENTER_BASE_SLOW() {
    return AbilityDefinitions.recenter.baseStats.slowStrength || GameConfig.RECENTER_BASE_SLOW;
  },
  get RECENTER_SLOW_SCALING() {
    return AbilityDefinitions.recenter.scaling.slowPerLevel || GameConfig.RECENTER_SLOW_SCALING;
  },
  
  // Affirm
  get AFFIRM_DURATION() {
    return AbilityDefinitions.affirm.baseStats.duration || GameConfig.AFFIRM_DURATION;
  },
  get AFFIRM_COOLDOWN() {
    return AbilityDefinitions.affirm.baseStats.cooldown || GameConfig.AFFIRM_COOLDOWN;
  },
  get AFFIRM_AMPLIFICATION_SCALING() {
    // Note: AbilityDefinitions uses a different structure, but we maintain compatibility
    return GameConfig.AFFIRM_AMPLIFICATION_SCALING;
  },
  
  // Exhale
  get EXHALE_COOLDOWN() {
    return AbilityDefinitions.exhale.baseStats.cooldown || GameConfig.EXHALE_COOLDOWN;
  },
  get EXHALE_BASE_DAMAGE() {
    return AbilityDefinitions.exhale.baseStats.damage || GameConfig.EXHALE_BASE_DAMAGE;
  },
  get EXHALE_WAVE_SPEED() {
    return GameConfig.EXHALE_WAVE_SPEED; // Still in GameConfig
  },
  get EXHALE_WAVE_RADII() {
    return GameConfig.EXHALE_WAVE_RADII; // Still in GameConfig
  },
  get EXHALE_SLOW_DURATION() {
    return GameConfig.EXHALE_SLOW_DURATION; // Still in GameConfig
  },
  get EXHALE_SLOW_STRENGTH() {
    return AbilityDefinitions.exhale.baseStats.slowStrength || GameConfig.EXHALE_SLOW_STRENGTH;
  },
  get EXHALE_WAVE_INTERVAL() {
    return GameConfig.EXHALE_WAVE_INTERVAL; // Still in GameConfig
  },
  get EXHALE_DAMAGE_SCALING() {
    return AbilityDefinitions.exhale.scaling.damagePerLevel || GameConfig.EXHALE_DAMAGE_SCALING;
  },
  get EXHALE_COOLDOWN_SCALING() {
    return AbilityDefinitions.exhale.scaling.cooldownPerLevel || GameConfig.EXHALE_COOLDOWN_SCALING;
  },
  get EXHALE_EARLY_TRIGGER_SERENITY() {
    return GameConfig.EXHALE_EARLY_TRIGGER_SERENITY; // Still in GameConfig
  },
  
  // Reflect
  get REFLECT_TRIGGER_SERENITY() {
    return GameConfig.REFLECT_TRIGGER_SERENITY; // Still in GameConfig
  },
  get REFLECT_BARRIER_RADIUS() {
    return AbilityDefinitions.reflect.baseStats.radius || GameConfig.REFLECT_BARRIER_RADIUS;
  },
  get REFLECT_BASE_DURATION() {
    return AbilityDefinitions.reflect.baseStats.duration || GameConfig.REFLECT_BASE_DURATION;
  },
  get REFLECT_COOLDOWN() {
    return AbilityDefinitions.reflect.baseStats.cooldown || GameConfig.REFLECT_COOLDOWN;
  },
  get REFLECT_DURATION_SCALING() {
    return AbilityDefinitions.reflect.scaling.durationPerLevel || GameConfig.REFLECT_DURATION_SCALING;
  },
  
  // Mantra
  get MANTRA_COOLDOWN() {
    return AbilityDefinitions.mantra.baseStats.cooldown || GameConfig.MANTRA_COOLDOWN;
  },
  get MANTRA_BASE_DAMAGE() {
    return AbilityDefinitions.mantra.baseStats.damage || GameConfig.MANTRA_BASE_DAMAGE;
  },
  get MANTRA_BASE_DURATION() {
    return AbilityDefinitions.mantra.baseStats.duration || GameConfig.MANTRA_BASE_DURATION;
  },
  get MANTRA_DAMAGE_SCALING() {
    return AbilityDefinitions.mantra.scaling.damagePerLevel || GameConfig.MANTRA_DAMAGE_SCALING;
  },
  get MANTRA_DURATION_SCALING() {
    return AbilityDefinitions.mantra.scaling.durationPerLevel || GameConfig.MANTRA_DURATION_SCALING;
  },
  
  // Ground
  get GROUND_COOLDOWN() {
    return AbilityDefinitions.ground.baseStats.cooldown || GameConfig.GROUND_COOLDOWN;
  },
  get GROUND_FIELD_RADIUS() {
    return AbilityDefinitions.ground.baseStats.radius || GameConfig.GROUND_FIELD_RADIUS;
  },
  get GROUND_BASE_DAMAGE() {
    return AbilityDefinitions.ground.baseStats.damage || GameConfig.GROUND_BASE_DAMAGE;
  },
  get GROUND_SLOW_STRENGTH() {
    return AbilityDefinitions.ground.baseStats.slowStrength || GameConfig.GROUND_SLOW_STRENGTH;
  },
  get GROUND_BASE_DURATION() {
    return AbilityDefinitions.ground.baseStats.duration || GameConfig.GROUND_BASE_DURATION;
  },
  get GROUND_DAMAGE_SCALING() {
    return AbilityDefinitions.ground.scaling.damagePerLevel || GameConfig.GROUND_DAMAGE_SCALING;
  },
  get GROUND_DURATION_SCALING() {
    return AbilityDefinitions.ground.scaling.durationPerLevel || GameConfig.GROUND_DURATION_SCALING;
  },
  get GROUND_SPAWN_DISTANCE_MIN() {
    return GameConfig.GROUND_SPAWN_DISTANCE_MIN; // Still in GameConfig
  },
  get GROUND_SPAWN_DISTANCE_MAX() {
    return GameConfig.GROUND_SPAWN_DISTANCE_MAX; // Still in GameConfig
  },
  
  // Release
  get RELEASE_TRIGGER_SERENITY() {
    return GameConfig.RELEASE_TRIGGER_SERENITY; // Still in GameConfig
  },
  get RELEASE_RADIUS() {
    return AbilityDefinitions.release.baseStats.radius || GameConfig.RELEASE_RADIUS;
  },
  get RELEASE_BASE_DAMAGE() {
    return AbilityDefinitions.release.baseStats.damage || GameConfig.RELEASE_BASE_DAMAGE;
  },
  get RELEASE_COOLDOWN() {
    return AbilityDefinitions.release.baseStats.cooldown || GameConfig.RELEASE_COOLDOWN;
  },
  get RELEASE_DAMAGE_SCALING() {
    return AbilityDefinitions.release.scaling.damagePerLevel || GameConfig.RELEASE_DAMAGE_SCALING;
  },
  
  // Align
  get ALIGN_CYCLE_DURATION() {
    return AbilityDefinitions.align.baseStats.cycleDuration || GameConfig.ALIGN_CYCLE_DURATION;
  },
  get ALIGN_BASE_BONUS() {
    return AbilityDefinitions.align.baseStats.bonusStrength || GameConfig.ALIGN_BASE_BONUS;
  },
  get ALIGN_BONUS_SCALING() {
    return AbilityDefinitions.align.scaling.bonusStrength || GameConfig.ALIGN_BONUS_SCALING;
  },
  get ALIGN_CYCLE_SCALING() {
    return GameConfig.ALIGN_CYCLE_SCALING; // Still in GameConfig
  },
};

