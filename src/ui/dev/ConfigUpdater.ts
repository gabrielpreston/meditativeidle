/**
 * Config Updater
 * 
 * Type-safe updater for GameConfig values.
 * Supports both flat keys ('MAX_SERENITY') and nested paths ('ABILITY_ENABLED.breathe').
 */

import { GameConfig } from '../../GameConfig';

export class ConfigUpdater {
  private static validators: Map<string, (value: unknown) => boolean> = new Map();
  private static defaults: Map<string, unknown> = new Map();
  private static initialized: boolean = false;

  /**
   * Initialize validators and defaults for all settings.
   * Must be called before using the updater.
   */
  static initialize(): void {
    if (this.initialized) return;

    // Player settings
    this.registerValidator('MAX_SERENITY', (v) => typeof v === 'number' && v >= 10 && v <= 500);
    this.registerDefault('MAX_SERENITY', GameConfig.MAX_SERENITY);
    
    this.registerValidator('PLAYER_RADIUS', (v) => typeof v === 'number' && v >= 10 && v <= 250);
    this.registerDefault('PLAYER_RADIUS', GameConfig.PLAYER_RADIUS);
    
    this.registerValidator('PLAYER_OPACITY', (v) => typeof v === 'number' && v >= 0 && v <= 1);
    this.registerDefault('PLAYER_OPACITY', GameConfig.PLAYER_OPACITY);

    // Breath settings
    this.registerValidator('BREATHE_AOE_BUFFER', (v) => typeof v === 'number' && v >= 0 && v <= 100);
    this.registerDefault('BREATHE_AOE_BUFFER', GameConfig.BREATHE_AOE_BUFFER);
    
    this.registerValidator('BREATHE_CYCLE_DURATION', (v) => typeof v === 'number' && v >= 1 && v <= 10);
    this.registerDefault('BREATHE_CYCLE_DURATION', GameConfig.BREATHE_CYCLE_DURATION);
    
    this.registerValidator('BREATHE_AOE_GROWTH', (v) => typeof v === 'number' && v >= 0 && v <= 500);
    this.registerDefault('BREATHE_AOE_GROWTH', GameConfig.BREATHE_AOE_GROWTH);
    
    this.registerValidator('BREATHE_BASE_DAMAGE_PER_SECOND', (v) => typeof v === 'number' && v >= 0 && v <= 50);
    this.registerDefault('BREATHE_BASE_DAMAGE_PER_SECOND', GameConfig.BREATHE_BASE_DAMAGE_PER_SECOND);
    
    this.registerValidator('BREATHE_DAMAGE_SCALING', (v) => typeof v === 'number' && v >= 0 && v <= 1);
    this.registerDefault('BREATHE_DAMAGE_SCALING', GameConfig.BREATHE_DAMAGE_SCALING);
    
    this.registerValidator('BREATHE_SLOW_STRENGTH', (v) => typeof v === 'number' && v >= 0 && v <= 1);
    this.registerDefault('BREATHE_SLOW_STRENGTH', GameConfig.BREATHE_SLOW_STRENGTH);

    // Ability settings - Recenter
    this.registerValidator('RECENTER_COOLDOWN', (v) => typeof v === 'number' && v >= 1 && v <= 30);
    this.registerDefault('RECENTER_COOLDOWN', GameConfig.RECENTER_COOLDOWN);
    this.registerValidator('RECENTER_PULSE_DURATION', (v) => typeof v === 'number' && v >= 0.5 && v <= 5);
    this.registerDefault('RECENTER_PULSE_DURATION', GameConfig.RECENTER_PULSE_DURATION);
    this.registerValidator('RECENTER_BASE_MAX_RADIUS', (v) => typeof v === 'number' && v >= 100 && v <= 600);
    this.registerDefault('RECENTER_BASE_MAX_RADIUS', GameConfig.RECENTER_BASE_MAX_RADIUS);
    this.registerValidator('RECENTER_RADIUS_SCALING', (v) => typeof v === 'number' && v >= 0 && v <= 100);
    this.registerDefault('RECENTER_RADIUS_SCALING', GameConfig.RECENTER_RADIUS_SCALING);
    this.registerValidator('RECENTER_PULSE_SPEED', (v) => typeof v === 'number' && v >= 50 && v <= 500);
    this.registerDefault('RECENTER_PULSE_SPEED', GameConfig.RECENTER_PULSE_SPEED);
    this.registerValidator('RECENTER_BASE_SLOW', (v) => typeof v === 'number' && v >= 0 && v <= 1);
    this.registerDefault('RECENTER_BASE_SLOW', GameConfig.RECENTER_BASE_SLOW);
    this.registerValidator('RECENTER_SLOW_SCALING', (v) => typeof v === 'number' && v >= 0 && v <= 0.2);
    this.registerDefault('RECENTER_SLOW_SCALING', GameConfig.RECENTER_SLOW_SCALING);

    // Ability settings - Affirm
    this.registerValidator('AFFIRM_DURATION', (v) => typeof v === 'number' && v >= 1 && v <= 30);
    this.registerDefault('AFFIRM_DURATION', GameConfig.AFFIRM_DURATION);
    this.registerValidator('AFFIRM_COOLDOWN', (v) => typeof v === 'number' && v >= 10 && v <= 120);
    this.registerDefault('AFFIRM_COOLDOWN', GameConfig.AFFIRM_COOLDOWN);
    this.registerValidator('AFFIRM_AMPLIFICATION_SCALING', (v) => typeof v === 'number' && v >= 0 && v <= 0.5);
    this.registerDefault('AFFIRM_AMPLIFICATION_SCALING', GameConfig.AFFIRM_AMPLIFICATION_SCALING);

    // Ability settings - Exhale
    this.registerValidator('EXHALE_COOLDOWN', (v) => typeof v === 'number' && v >= 1 && v <= 60);
    this.registerDefault('EXHALE_COOLDOWN', GameConfig.EXHALE_COOLDOWN);
    this.registerValidator('EXHALE_WAVE_COUNT', (v) => typeof v === 'number' && v >= 1 && v <= 10);
    this.registerDefault('EXHALE_WAVE_COUNT', GameConfig.EXHALE_WAVE_COUNT);
    this.registerValidator('EXHALE_BASE_DAMAGE', (v) => typeof v === 'number' && v >= 1 && v <= 100);
    this.registerDefault('EXHALE_BASE_DAMAGE', GameConfig.EXHALE_BASE_DAMAGE);
    this.registerValidator('EXHALE_WAVE_SPEED', (v) => typeof v === 'number' && v >= 100 && v <= 1000);
    this.registerDefault('EXHALE_WAVE_SPEED', GameConfig.EXHALE_WAVE_SPEED);
    this.registerValidator('EXHALE_SLOW_DURATION', (v) => typeof v === 'number' && v >= 0.5 && v <= 5);
    this.registerDefault('EXHALE_SLOW_DURATION', GameConfig.EXHALE_SLOW_DURATION);
    this.registerValidator('EXHALE_SLOW_STRENGTH', (v) => typeof v === 'number' && v >= 0 && v <= 1);
    this.registerDefault('EXHALE_SLOW_STRENGTH', GameConfig.EXHALE_SLOW_STRENGTH);
    this.registerValidator('EXHALE_DAMAGE_SCALING', (v) => typeof v === 'number' && v >= 0 && v <= 0.5);
    this.registerDefault('EXHALE_DAMAGE_SCALING', GameConfig.EXHALE_DAMAGE_SCALING);

    // Ability settings - Reflect
    this.registerValidator('REFLECT_TRIGGER_SERENITY', (v) => typeof v === 'number' && v >= 0 && v <= 100);
    this.registerDefault('REFLECT_TRIGGER_SERENITY', GameConfig.REFLECT_TRIGGER_SERENITY);
    this.registerValidator('REFLECT_BARRIER_RADIUS', (v) => typeof v === 'number' && v >= 50 && v <= 400);
    this.registerDefault('REFLECT_BARRIER_RADIUS', GameConfig.REFLECT_BARRIER_RADIUS);
    this.registerValidator('REFLECT_BASE_DURATION', (v) => typeof v === 'number' && v >= 1 && v <= 20);
    this.registerDefault('REFLECT_BASE_DURATION', GameConfig.REFLECT_BASE_DURATION);
    this.registerValidator('REFLECT_COOLDOWN', (v) => typeof v === 'number' && v >= 10 && v <= 120);
    this.registerDefault('REFLECT_COOLDOWN', GameConfig.REFLECT_COOLDOWN);
    this.registerValidator('REFLECT_BASE_DAMAGE', (v) => typeof v === 'number' && v >= 0 && v <= 1);
    this.registerDefault('REFLECT_BASE_DAMAGE', GameConfig.REFLECT_BASE_DAMAGE);
    this.registerValidator('REFLECT_DURATION_SCALING', (v) => typeof v === 'number' && v >= 0 && v <= 2);
    this.registerDefault('REFLECT_DURATION_SCALING', GameConfig.REFLECT_DURATION_SCALING);
    this.registerValidator('REFLECT_DAMAGE_SCALING', (v) => typeof v === 'number' && v >= 0 && v <= 0.2);
    this.registerDefault('REFLECT_DAMAGE_SCALING', GameConfig.REFLECT_DAMAGE_SCALING);

    // Ability settings - Mantra
    this.registerValidator('MANTRA_COOLDOWN', (v) => typeof v === 'number' && v >= 5 && v <= 60);
    this.registerDefault('MANTRA_COOLDOWN', GameConfig.MANTRA_COOLDOWN);
    this.registerValidator('MANTRA_BASE_DAMAGE', (v) => typeof v === 'number' && v >= 1 && v <= 50);
    this.registerDefault('MANTRA_BASE_DAMAGE', GameConfig.MANTRA_BASE_DAMAGE);
    this.registerValidator('MANTRA_BASE_DURATION', (v) => typeof v === 'number' && v >= 1 && v <= 10);
    this.registerDefault('MANTRA_BASE_DURATION', GameConfig.MANTRA_BASE_DURATION);
    this.registerValidator('MANTRA_SLOW_STRENGTH', (v) => typeof v === 'number' && v >= 0 && v <= 1);
    this.registerDefault('MANTRA_SLOW_STRENGTH', GameConfig.MANTRA_SLOW_STRENGTH);
    this.registerValidator('MANTRA_DAMAGE_SCALING', (v) => typeof v === 'number' && v >= 0 && v <= 0.5);
    this.registerDefault('MANTRA_DAMAGE_SCALING', GameConfig.MANTRA_DAMAGE_SCALING);
    this.registerValidator('MANTRA_DURATION_SCALING', (v) => typeof v === 'number' && v >= 0 && v <= 2);
    this.registerDefault('MANTRA_DURATION_SCALING', GameConfig.MANTRA_DURATION_SCALING);

    // Ability settings - Ground
    this.registerValidator('GROUND_COOLDOWN', (v) => typeof v === 'number' && v >= 1 && v <= 60);
    this.registerDefault('GROUND_COOLDOWN', GameConfig.GROUND_COOLDOWN);
    this.registerValidator('GROUND_FIELD_RADIUS', (v) => typeof v === 'number' && v >= 50 && v <= 400);
    this.registerDefault('GROUND_FIELD_RADIUS', GameConfig.GROUND_FIELD_RADIUS);
    this.registerValidator('GROUND_BASE_DAMAGE', (v) => typeof v === 'number' && v >= 1 && v <= 20);
    this.registerDefault('GROUND_BASE_DAMAGE', GameConfig.GROUND_BASE_DAMAGE);
    this.registerValidator('GROUND_SLOW_STRENGTH', (v) => typeof v === 'number' && v >= 0 && v <= 1);
    this.registerDefault('GROUND_SLOW_STRENGTH', GameConfig.GROUND_SLOW_STRENGTH);
    this.registerValidator('GROUND_BASE_DURATION', (v) => typeof v === 'number' && v >= 1 && v <= 20);
    this.registerDefault('GROUND_BASE_DURATION', GameConfig.GROUND_BASE_DURATION);
    this.registerValidator('GROUND_DAMAGE_SCALING', (v) => typeof v === 'number' && v >= 0 && v <= 0.5);
    this.registerDefault('GROUND_DAMAGE_SCALING', GameConfig.GROUND_DAMAGE_SCALING);
    this.registerValidator('GROUND_DURATION_SCALING', (v) => typeof v === 'number' && v >= 0 && v <= 2);
    this.registerDefault('GROUND_DURATION_SCALING', GameConfig.GROUND_DURATION_SCALING);

    // Ability settings - Release
    this.registerValidator('RELEASE_TRIGGER_SERENITY', (v) => typeof v === 'number' && v >= 0 && v <= 100);
    this.registerDefault('RELEASE_TRIGGER_SERENITY', GameConfig.RELEASE_TRIGGER_SERENITY);
    this.registerValidator('RELEASE_RADIUS', (v) => typeof v === 'number' && v >= 200 && v <= 1200);
    this.registerDefault('RELEASE_RADIUS', GameConfig.RELEASE_RADIUS);
    this.registerValidator('RELEASE_BASE_DAMAGE', (v) => typeof v === 'number' && v >= 10 && v <= 200);
    this.registerDefault('RELEASE_BASE_DAMAGE', GameConfig.RELEASE_BASE_DAMAGE);
    this.registerValidator('RELEASE_BASE_SERENITY_RESTORE', (v) => typeof v === 'number' && v >= 0 && v <= 100);
    this.registerDefault('RELEASE_BASE_SERENITY_RESTORE', GameConfig.RELEASE_BASE_SERENITY_RESTORE);
    this.registerValidator('RELEASE_COOLDOWN', (v) => typeof v === 'number' && v >= 30 && v <= 300);
    this.registerDefault('RELEASE_COOLDOWN', GameConfig.RELEASE_COOLDOWN);
    this.registerValidator('RELEASE_DAMAGE_SCALING', (v) => typeof v === 'number' && v >= 0 && v <= 0.5);
    this.registerDefault('RELEASE_DAMAGE_SCALING', GameConfig.RELEASE_DAMAGE_SCALING);
    this.registerValidator('RELEASE_SERENITY_SCALING', (v) => typeof v === 'number' && v >= 0 && v <= 0.2);
    this.registerDefault('RELEASE_SERENITY_SCALING', GameConfig.RELEASE_SERENITY_SCALING);

    // Ability settings - Align
    this.registerValidator('ALIGN_CYCLE_DURATION', (v) => typeof v === 'number' && v >= 2 && v <= 20);
    this.registerDefault('ALIGN_CYCLE_DURATION', GameConfig.ALIGN_CYCLE_DURATION);
    this.registerValidator('ALIGN_BASE_BONUS', (v) => typeof v === 'number' && v >= 0 && v <= 2);
    this.registerDefault('ALIGN_BASE_BONUS', GameConfig.ALIGN_BASE_BONUS);
    this.registerValidator('ALIGN_BONUS_SCALING', (v) => typeof v === 'number' && v >= 0 && v <= 0.2);
    this.registerDefault('ALIGN_BONUS_SCALING', GameConfig.ALIGN_BONUS_SCALING);
    this.registerValidator('ALIGN_CYCLE_SCALING', (v) => typeof v === 'number' && v >= 0 && v <= 2);
    this.registerDefault('ALIGN_CYCLE_SCALING', GameConfig.ALIGN_CYCLE_SCALING);

    // Stressor settings
    this.registerValidator('STRESSOR_COLLISION_DAMAGE', (v) => typeof v === 'number' && v >= 1 && v <= 50);
    this.registerDefault('STRESSOR_COLLISION_DAMAGE', GameConfig.STRESSOR_COLLISION_DAMAGE);
    this.registerValidator('STRESSOR_BASE_COUNT', (v) => typeof v === 'number' && v >= 1 && v <= 20);
    this.registerDefault('STRESSOR_BASE_COUNT', GameConfig.STRESSOR_BASE_COUNT);
    this.registerValidator('STRESSOR_COUNT_MULTIPLIER', (v) => typeof v === 'number' && v >= 1 && v <= 2);
    this.registerDefault('STRESSOR_COUNT_MULTIPLIER', GameConfig.STRESSOR_COUNT_MULTIPLIER);
    this.registerValidator('STRESSOR_BASE_HEALTH', (v) => typeof v === 'number' && v >= 1 && v <= 50);
    this.registerDefault('STRESSOR_BASE_HEALTH', GameConfig.STRESSOR_BASE_HEALTH);
    this.registerValidator('STRESSOR_HEALTH_MULTIPLIER', (v) => typeof v === 'number' && v >= 1 && v <= 2);
    this.registerDefault('STRESSOR_HEALTH_MULTIPLIER', GameConfig.STRESSOR_HEALTH_MULTIPLIER);
    this.registerValidator('STRESSOR_BASE_SPEED', (v) => typeof v === 'number' && v >= 50 && v <= 500);
    this.registerDefault('STRESSOR_BASE_SPEED', GameConfig.STRESSOR_BASE_SPEED);
    this.registerValidator('STRESSOR_SPEED_MULTIPLIER', (v) => typeof v === 'number' && v >= 1 && v <= 2);
    this.registerDefault('STRESSOR_SPEED_MULTIPLIER', GameConfig.STRESSOR_SPEED_MULTIPLIER);

    // Wave settings
    this.registerValidator('WAVE_DURATION', (v) => typeof v === 'number' && v >= 10 && v <= 300);
    this.registerDefault('WAVE_DURATION', GameConfig.WAVE_DURATION);
    this.registerValidator('WAVE_15_TARGET_DEFEAT', (v) => typeof v === 'boolean');
    this.registerDefault('WAVE_15_TARGET_DEFEAT', GameConfig.WAVE_15_TARGET_DEFEAT);

    // Debug settings
    this.registerValidator('DEBUG_SHOW_RINGS', (v) => typeof v === 'boolean');
    this.registerDefault('DEBUG_SHOW_RINGS', GameConfig.DEBUG_SHOW_RINGS === 1);

    this.initialized = true;
  }

  /**
   * Update a config value by key.
   * Supports nested paths (e.g., 'ABILITY_ENABLED.breathe').
   */
  static update(key: string, value: unknown): boolean {
    if (!this.initialized) this.initialize();

    const validator = this.validators.get(key);
    if (!validator || !validator(value)) {
      return false;
    }

    // Handle nested paths (e.g., 'ABILITY_ENABLED.breathe')
    const keys = key.split('.');
    let target: any = GameConfig;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in target)) return false;
      target = target[keys[i]];
    }

    const finalKey = keys[keys.length - 1];
    if (!(finalKey in target)) return false;

    // Special handling for DEBUG_SHOW_RINGS (stored as 0/1 in GameConfig)
    if (key === 'DEBUG_SHOW_RINGS' && typeof value === 'boolean') {
      (GameConfig as any)[finalKey] = value ? 1 : 0;
    } else {
      target[finalKey] = value;
    }

    return true;
  }

  /**
   * Get default value for a setting.
   */
  static getDefault(key: string): unknown {
    if (!this.initialized) this.initialize();
    return this.defaults.get(key);
  }

  /**
   * Reset a setting or all settings to defaults.
   */
  static reset(key?: string): void {
    if (!this.initialized) this.initialize();

    if (key) {
      // Reset single setting
      const defaultValue = this.getDefault(key);
      if (defaultValue !== undefined) {
        this.update(key, defaultValue);
      }
    } else {
      // Reset all settings to defaults
      for (const [k, defaultValue] of this.defaults.entries()) {
        this.update(k, defaultValue);
      }
    }
  }

  private static registerValidator(key: string, validator: (value: unknown) => boolean): void {
    this.validators.set(key, validator);
  }

  private static registerDefault(key: string, defaultValue: unknown): void {
    this.defaults.set(key, defaultValue);
  }
}

