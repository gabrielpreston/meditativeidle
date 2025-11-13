/**
 * Developer Panel Registry
 * 
 * Centralized registry for all developer panel settings.
 * Provides a single source of truth for all configurable game values.
 */

import { GameConfig } from '../../GameConfig';
import { SettingCategory, SettingDefinition, NumberSettingDefinition, BooleanSettingDefinition } from './DevPanelTypes';

export class DevPanelRegistry {
  private static categories: Map<string, SettingCategory> = new Map();
  private static initialized: boolean = false;

  /**
   * Initialize the registry with all settings.
   * Must be called before using the registry.
   */
  static initialize(): void {
    if (this.initialized) return;
    
    this.registerPlayerSettings();
    this.registerBreathSettings();
    this.registerAbilitySettings();
    this.registerStressorSettings();
    this.registerWaveSettings();
    this.registerDebugSettings();
    
    this.initialized = true;
  }

  /**
   * Get all categories.
   */
  static getCategories(): SettingCategory[] {
    if (!this.initialized) this.initialize();
    return Array.from(this.categories.values());
  }

  /**
   * Get a setting by key.
   */
  static getSetting(key: string): SettingDefinition | undefined {
    if (!this.initialized) this.initialize();
    
    for (const category of this.categories.values()) {
      const setting = category.settings.find(s => s.key === key);
      if (setting) return setting;
    }
    return undefined;
  }

  /**
   * Get default value for a setting from GameConfig.
   */
  static getDefaultValue(key: string): unknown {
    // Handle nested paths (e.g., 'ABILITY_ENABLED.breathe')
    const keys = key.split('.');
    let target: any = GameConfig;
    
    for (const k of keys) {
      if (!(k in target)) return undefined;
      target = target[k];
    }
    
    return target;
  }

  /**
   * Update a setting's current value (does not update GameConfig).
   */
  static updateSettingValue(key: string, value: unknown): boolean {
    if (!this.initialized) this.initialize();
    
    const setting = this.getSetting(key);
    if (!setting) return false;
    
    if (setting.type === 'number' && typeof value === 'number') {
      const numSetting = setting as NumberSettingDefinition;
      const clampedValue = Math.max(numSetting.min, Math.min(numSetting.max, value));
      numSetting.value = clampedValue;
      return true;
    } else if (setting.type === 'boolean' && typeof value === 'boolean') {
      const boolSetting = setting as BooleanSettingDefinition;
      boolSetting.value = value;
      return true;
    }
    
    return false;
  }

  // ============================================================================
  // Registration Methods
  // ============================================================================

  private static registerPlayerSettings(): void {
    const settings: SettingDefinition[] = [
      {
        key: 'MAX_SERENITY',
        label: 'Max Serenity',
        category: 'player',
        description: 'Maximum serenity value',
        type: 'number',
        value: GameConfig.MAX_SERENITY,
        min: 10,
        max: 500,
        step: 10,
        unit: ''
      },
      {
        key: 'PLAYER_RADIUS',
        label: 'Player Radius',
        category: 'player',
        description: 'Player circle radius in pixels',
        type: 'number',
        value: GameConfig.PLAYER_RADIUS,
        min: 10,
        max: 250,
        step: 5,
        unit: 'px'
      },
      {
        key: 'PLAYER_OPACITY',
        label: 'Player Opacity',
        category: 'player',
        description: 'Player circle opacity (0.0 to 1.0)',
        type: 'number',
        value: GameConfig.PLAYER_OPACITY,
        min: 0,
        max: 1,
        step: 0.05,
        unit: ''
      }
    ];

    this.categories.set('player', {
      id: 'player',
      label: 'Player',
      collapsed: false,
      settings
    });
  }

  private static registerBreathSettings(): void {
    const settings: SettingDefinition[] = [
      {
        key: 'BREATHE_AOE_BUFFER',
        label: 'Min Buffer',
        category: 'breath',
        description: 'Minimum defensive zone buffer around player',
        type: 'number',
        value: GameConfig.BREATHE_AOE_BUFFER,
        min: 0,
        max: 100,
        step: 1,
        unit: 'px'
      },
      {
        key: 'BREATHE_CYCLE_DURATION',
        label: 'Cycle Length',
        category: 'breath',
        description: 'Total cycle duration in seconds',
        type: 'number',
        value: GameConfig.BREATHE_CYCLE_DURATION,
        min: 1,
        max: 10,
        step: 0.1,
        unit: 's'
      },
      {
        key: 'BREATHE_AOE_GROWTH',
        label: 'Max Growth',
        category: 'breath',
        description: 'Maximum amount of growth during exhale cycle',
        type: 'number',
        value: GameConfig.BREATHE_AOE_GROWTH,
        min: 0,
        max: 500,
        step: 5,
        unit: 'px'
      },
      {
        key: 'BREATHE_BASE_DAMAGE_PER_SECOND',
        label: 'Base Damage/sec',
        category: 'breath',
        description: 'Base damage dealt per second',
        type: 'number',
        value: GameConfig.BREATHE_BASE_DAMAGE_PER_SECOND,
        min: 0,
        max: 50,
        step: 0.5,
        unit: '/s'
      },
      {
        key: 'BREATHE_DAMAGE_SCALING',
        label: 'Damage Scaling',
        category: 'breath',
        description: 'Per-level damage multiplier',
        type: 'number',
        value: GameConfig.BREATHE_DAMAGE_SCALING,
        min: 0,
        max: 1,
        step: 0.01,
        unit: ''
      },
      {
        key: 'BREATHE_SLOW_STRENGTH',
        label: 'Slow Strength',
        category: 'breath',
        description: 'Speed multiplier applied while in breath AoE',
        type: 'number',
        value: GameConfig.BREATHE_SLOW_STRENGTH,
        min: 0,
        max: 1,
        step: 0.05,
        unit: ''
      }
    ];

    this.categories.set('breath', {
      id: 'breath',
      label: 'Breath Ability',
      collapsed: false,
      settings
    });
  }

  private static registerAbilitySettings(): void {
    const settings: SettingDefinition[] = [];

    // Recenter
    settings.push(
      {
        key: 'RECENTER_COOLDOWN',
        label: 'Recenter: Cooldown',
        category: 'abilities',
        description: 'Seconds between pulses',
        type: 'number',
        value: GameConfig.RECENTER_COOLDOWN,
        min: 1,
        max: 30,
        step: 0.5,
        unit: 's'
      },
      {
        key: 'RECENTER_PULSE_DURATION',
        label: 'Recenter: Pulse Duration',
        category: 'abilities',
        description: 'Seconds for pulse to expand',
        type: 'number',
        value: GameConfig.RECENTER_PULSE_DURATION,
        min: 0.5,
        max: 5,
        step: 0.1,
        unit: 's'
      },
      {
        key: 'RECENTER_BASE_MAX_RADIUS',
        label: 'Recenter: Base Max Radius',
        category: 'abilities',
        description: 'Base maximum radius in pixels',
        type: 'number',
        value: GameConfig.RECENTER_BASE_MAX_RADIUS,
        min: 100,
        max: 600,
        step: 10,
        unit: 'px'
      },
      {
        key: 'RECENTER_RADIUS_SCALING',
        label: 'Recenter: Radius Scaling',
        category: 'abilities',
        description: 'Pixels per level',
        type: 'number',
        value: GameConfig.RECENTER_RADIUS_SCALING,
        min: 0,
        max: 100,
        step: 5,
        unit: 'px'
      },
      {
        key: 'RECENTER_PULSE_SPEED',
        label: 'Recenter: Pulse Speed',
        category: 'abilities',
        description: 'Pixels per second expansion speed',
        type: 'number',
        value: GameConfig.RECENTER_PULSE_SPEED,
        min: 50,
        max: 500,
        step: 10,
        unit: 'px/s'
      },
      {
        key: 'RECENTER_BASE_SLOW',
        label: 'Recenter: Base Slow',
        category: 'abilities',
        description: 'Base speed multiplier',
        type: 'number',
        value: GameConfig.RECENTER_BASE_SLOW,
        min: 0,
        max: 1,
        step: 0.05,
        unit: ''
      },
      {
        key: 'RECENTER_SLOW_SCALING',
        label: 'Recenter: Slow Scaling',
        category: 'abilities',
        description: 'Per-level slow increase',
        type: 'number',
        value: GameConfig.RECENTER_SLOW_SCALING,
        min: 0,
        max: 0.2,
        step: 0.01,
        unit: ''
      }
    );

    // Affirm
    settings.push(
      {
        key: 'AFFIRM_DURATION',
        label: 'Affirm: Duration',
        category: 'abilities',
        description: 'Seconds active',
        type: 'number',
        value: GameConfig.AFFIRM_DURATION,
        min: 1,
        max: 30,
        step: 1,
        unit: 's'
      },
      {
        key: 'AFFIRM_COOLDOWN',
        label: 'Affirm: Cooldown',
        category: 'abilities',
        description: 'Seconds cooldown after duration ends',
        type: 'number',
        value: GameConfig.AFFIRM_COOLDOWN,
        min: 10,
        max: 120,
        step: 5,
        unit: 's'
      },
      {
        key: 'AFFIRM_AMPLIFICATION_SCALING',
        label: 'Affirm: Amplification Scaling',
        category: 'abilities',
        description: 'Per-level amplification increase',
        type: 'number',
        value: GameConfig.AFFIRM_AMPLIFICATION_SCALING,
        min: 0,
        max: 0.5,
        step: 0.01,
        unit: ''
      }
    );

    // Exhale
    settings.push(
      {
        key: 'EXHALE_COOLDOWN',
        label: 'Exhale: Cooldown',
        category: 'abilities',
        description: 'Seconds between bursts',
        type: 'number',
        value: GameConfig.EXHALE_COOLDOWN,
        min: 1,
        max: 60,
        step: 1,
        unit: 's'
      },
      {
        key: 'EXHALE_WAVE_COUNT',
        label: 'Exhale: Wave Count',
        category: 'abilities',
        description: 'Number of waves per burst',
        type: 'number',
        value: GameConfig.EXHALE_WAVE_COUNT,
        min: 1,
        max: 10,
        step: 1,
        unit: ''
      },
      {
        key: 'EXHALE_BASE_DAMAGE',
        label: 'Exhale: Base Damage',
        category: 'abilities',
        description: 'Base damage per wave',
        type: 'number',
        value: GameConfig.EXHALE_BASE_DAMAGE,
        min: 1,
        max: 100,
        step: 1,
        unit: ''
      },
      {
        key: 'EXHALE_WAVE_SPEED',
        label: 'Exhale: Wave Speed',
        category: 'abilities',
        description: 'Pixels per second',
        type: 'number',
        value: GameConfig.EXHALE_WAVE_SPEED,
        min: 100,
        max: 1000,
        step: 50,
        unit: 'px/s'
      },
      {
        key: 'EXHALE_SLOW_DURATION',
        label: 'Exhale: Slow Duration',
        category: 'abilities',
        description: 'Seconds slow lasts',
        type: 'number',
        value: GameConfig.EXHALE_SLOW_DURATION,
        min: 0.5,
        max: 5,
        step: 0.1,
        unit: 's'
      },
      {
        key: 'EXHALE_SLOW_STRENGTH',
        label: 'Exhale: Slow Strength',
        category: 'abilities',
        description: 'Speed multiplier',
        type: 'number',
        value: GameConfig.EXHALE_SLOW_STRENGTH,
        min: 0,
        max: 1,
        step: 0.05,
        unit: ''
      },
      {
        key: 'EXHALE_DAMAGE_SCALING',
        label: 'Exhale: Damage Scaling',
        category: 'abilities',
        description: 'Per-level damage increase',
        type: 'number',
        value: GameConfig.EXHALE_DAMAGE_SCALING,
        min: 0,
        max: 0.5,
        step: 0.01,
        unit: ''
      }
    );

    // Reflect
    settings.push(
      {
        key: 'REFLECT_TRIGGER_SERENITY',
        label: 'Reflect: Trigger Serenity',
        category: 'abilities',
        description: 'Auto-trigger if Serenity <= this %',
        type: 'number',
        value: GameConfig.REFLECT_TRIGGER_SERENITY,
        min: 0,
        max: 100,
        step: 5,
        unit: '%'
      },
      {
        key: 'REFLECT_BARRIER_RADIUS',
        label: 'Reflect: Barrier Radius',
        category: 'abilities',
        description: 'Barrier radius in pixels',
        type: 'number',
        value: GameConfig.REFLECT_BARRIER_RADIUS,
        min: 50,
        max: 400,
        step: 10,
        unit: 'px'
      },
      {
        key: 'REFLECT_BASE_DURATION',
        label: 'Reflect: Base Duration',
        category: 'abilities',
        description: 'Base duration in seconds',
        type: 'number',
        value: GameConfig.REFLECT_BASE_DURATION,
        min: 1,
        max: 20,
        step: 0.5,
        unit: 's'
      },
      {
        key: 'REFLECT_COOLDOWN',
        label: 'Reflect: Cooldown',
        category: 'abilities',
        description: 'Seconds cooldown',
        type: 'number',
        value: GameConfig.REFLECT_COOLDOWN,
        min: 10,
        max: 120,
        step: 5,
        unit: 's'
      },
      {
        key: 'REFLECT_BASE_DAMAGE',
        label: 'Reflect: Base Damage',
        category: 'abilities',
        description: 'Percentage of attacker\'s HP',
        type: 'number',
        value: GameConfig.REFLECT_BASE_DAMAGE,
        min: 0,
        max: 1,
        step: 0.05,
        unit: ''
      },
      {
        key: 'REFLECT_DURATION_SCALING',
        label: 'Reflect: Duration Scaling',
        category: 'abilities',
        description: 'Seconds per level',
        type: 'number',
        value: GameConfig.REFLECT_DURATION_SCALING,
        min: 0,
        max: 2,
        step: 0.1,
        unit: 's'
      },
      {
        key: 'REFLECT_DAMAGE_SCALING',
        label: 'Reflect: Damage Scaling',
        category: 'abilities',
        description: 'Per-level damage increase',
        type: 'number',
        value: GameConfig.REFLECT_DAMAGE_SCALING,
        min: 0,
        max: 0.2,
        step: 0.01,
        unit: ''
      }
    );

    // Mantra
    settings.push(
      {
        key: 'MANTRA_COOLDOWN',
        label: 'Mantra: Cooldown',
        category: 'abilities',
        description: 'Seconds cooldown',
        type: 'number',
        value: GameConfig.MANTRA_COOLDOWN,
        min: 5,
        max: 60,
        step: 1,
        unit: 's'
      },
      {
        key: 'MANTRA_BASE_DAMAGE',
        label: 'Mantra: Base Damage',
        category: 'abilities',
        description: 'Damage per second',
        type: 'number',
        value: GameConfig.MANTRA_BASE_DAMAGE,
        min: 1,
        max: 50,
        step: 1,
        unit: 'DPS'
      },
      {
        key: 'MANTRA_BASE_DURATION',
        label: 'Mantra: Base Duration',
        category: 'abilities',
        description: 'Base duration in seconds',
        type: 'number',
        value: GameConfig.MANTRA_BASE_DURATION,
        min: 1,
        max: 10,
        step: 0.1,
        unit: 's'
      },
      {
        key: 'MANTRA_SLOW_STRENGTH',
        label: 'Mantra: Slow Strength',
        category: 'abilities',
        description: 'Speed multiplier',
        type: 'number',
        value: GameConfig.MANTRA_SLOW_STRENGTH,
        min: 0,
        max: 1,
        step: 0.05,
        unit: ''
      },
      {
        key: 'MANTRA_DAMAGE_SCALING',
        label: 'Mantra: Damage Scaling',
        category: 'abilities',
        description: 'Per-level damage increase',
        type: 'number',
        value: GameConfig.MANTRA_DAMAGE_SCALING,
        min: 0,
        max: 0.5,
        step: 0.01,
        unit: ''
      },
      {
        key: 'MANTRA_DURATION_SCALING',
        label: 'Mantra: Duration Scaling',
        category: 'abilities',
        description: 'Seconds per level',
        type: 'number',
        value: GameConfig.MANTRA_DURATION_SCALING,
        min: 0,
        max: 2,
        step: 0.1,
        unit: 's'
      }
    );

    // Ground
    settings.push(
      {
        key: 'GROUND_COOLDOWN',
        label: 'Ground: Cooldown',
        category: 'abilities',
        description: 'Seconds cooldown',
        type: 'number',
        value: GameConfig.GROUND_COOLDOWN,
        min: 1,
        max: 60,
        step: 1,
        unit: 's'
      },
      {
        key: 'GROUND_FIELD_RADIUS',
        label: 'Ground: Field Radius',
        category: 'abilities',
        description: 'Field radius in pixels',
        type: 'number',
        value: GameConfig.GROUND_FIELD_RADIUS,
        min: 50,
        max: 400,
        step: 10,
        unit: 'px'
      },
      {
        key: 'GROUND_BASE_DAMAGE',
        label: 'Ground: Base Damage',
        category: 'abilities',
        description: 'Damage per second',
        type: 'number',
        value: GameConfig.GROUND_BASE_DAMAGE,
        min: 1,
        max: 20,
        step: 0.5,
        unit: 'DPS'
      },
      {
        key: 'GROUND_SLOW_STRENGTH',
        label: 'Ground: Slow Strength',
        category: 'abilities',
        description: 'Speed multiplier',
        type: 'number',
        value: GameConfig.GROUND_SLOW_STRENGTH,
        min: 0,
        max: 1,
        step: 0.05,
        unit: ''
      },
      {
        key: 'GROUND_BASE_DURATION',
        label: 'Ground: Base Duration',
        category: 'abilities',
        description: 'Base duration in seconds',
        type: 'number',
        value: GameConfig.GROUND_BASE_DURATION,
        min: 1,
        max: 20,
        step: 0.5,
        unit: 's'
      },
      {
        key: 'GROUND_DAMAGE_SCALING',
        label: 'Ground: Damage Scaling',
        category: 'abilities',
        description: 'Per-level damage increase',
        type: 'number',
        value: GameConfig.GROUND_DAMAGE_SCALING,
        min: 0,
        max: 0.5,
        step: 0.01,
        unit: ''
      },
      {
        key: 'GROUND_DURATION_SCALING',
        label: 'Ground: Duration Scaling',
        category: 'abilities',
        description: 'Seconds per level',
        type: 'number',
        value: GameConfig.GROUND_DURATION_SCALING,
        min: 0,
        max: 2,
        step: 0.1,
        unit: 's'
      }
    );

    // Release
    settings.push(
      {
        key: 'RELEASE_TRIGGER_SERENITY',
        label: 'Release: Trigger Serenity',
        category: 'abilities',
        description: 'Auto-trigger if Serenity <= this %',
        type: 'number',
        value: GameConfig.RELEASE_TRIGGER_SERENITY,
        min: 0,
        max: 100,
        step: 5,
        unit: '%'
      },
      {
        key: 'RELEASE_RADIUS',
        label: 'Release: Radius',
        category: 'abilities',
        description: 'Effect radius in pixels',
        type: 'number',
        value: GameConfig.RELEASE_RADIUS,
        min: 200,
        max: 1200,
        step: 50,
        unit: 'px'
      },
      {
        key: 'RELEASE_BASE_DAMAGE',
        label: 'Release: Base Damage',
        category: 'abilities',
        description: 'Base damage dealt',
        type: 'number',
        value: GameConfig.RELEASE_BASE_DAMAGE,
        min: 10,
        max: 200,
        step: 5,
        unit: ''
      },
      {
        key: 'RELEASE_BASE_SERENITY_RESTORE',
        label: 'Release: Base Serenity Restore',
        category: 'abilities',
        description: 'Percentage restored',
        type: 'number',
        value: GameConfig.RELEASE_BASE_SERENITY_RESTORE,
        min: 0,
        max: 100,
        step: 5,
        unit: '%'
      },
      {
        key: 'RELEASE_COOLDOWN',
        label: 'Release: Cooldown',
        category: 'abilities',
        description: 'Seconds cooldown',
        type: 'number',
        value: GameConfig.RELEASE_COOLDOWN,
        min: 30,
        max: 300,
        step: 10,
        unit: 's'
      },
      {
        key: 'RELEASE_DAMAGE_SCALING',
        label: 'Release: Damage Scaling',
        category: 'abilities',
        description: 'Per-level damage increase',
        type: 'number',
        value: GameConfig.RELEASE_DAMAGE_SCALING,
        min: 0,
        max: 0.5,
        step: 0.01,
        unit: ''
      },
      {
        key: 'RELEASE_SERENITY_SCALING',
        label: 'Release: Serenity Scaling',
        category: 'abilities',
        description: 'Per-level serenity restore increase',
        type: 'number',
        value: GameConfig.RELEASE_SERENITY_SCALING,
        min: 0,
        max: 0.2,
        step: 0.01,
        unit: ''
      }
    );

    // Align
    settings.push(
      {
        key: 'ALIGN_CYCLE_DURATION',
        label: 'Align: Cycle Duration',
        category: 'abilities',
        description: 'Total cycle duration in seconds',
        type: 'number',
        value: GameConfig.ALIGN_CYCLE_DURATION,
        min: 2,
        max: 20,
        step: 0.5,
        unit: 's'
      },
      {
        key: 'ALIGN_BASE_BONUS',
        label: 'Align: Base Bonus',
        category: 'abilities',
        description: 'Base bonus multiplier',
        type: 'number',
        value: GameConfig.ALIGN_BASE_BONUS,
        min: 0,
        max: 2,
        step: 0.05,
        unit: ''
      },
      {
        key: 'ALIGN_BONUS_SCALING',
        label: 'Align: Bonus Scaling',
        category: 'abilities',
        description: 'Per-level bonus increase',
        type: 'number',
        value: GameConfig.ALIGN_BONUS_SCALING,
        min: 0,
        max: 0.2,
        step: 0.01,
        unit: ''
      },
      {
        key: 'ALIGN_CYCLE_SCALING',
        label: 'Align: Cycle Scaling',
        category: 'abilities',
        description: 'Seconds per level',
        type: 'number',
        value: GameConfig.ALIGN_CYCLE_SCALING,
        min: 0,
        max: 2,
        step: 0.1,
        unit: 's'
      }
    );

    this.categories.set('abilities', {
      id: 'abilities',
      label: 'Abilities',
      collapsed: false,
      settings
    });
  }

  private static registerStressorSettings(): void {
    const settings: SettingDefinition[] = [
      {
        key: 'STRESSOR_COLLISION_DAMAGE',
        label: 'Collision Damage',
        category: 'stressors',
        description: 'Damage dealt to serenity when stressor reaches player',
        type: 'number',
        value: GameConfig.STRESSOR_COLLISION_DAMAGE,
        min: 1,
        max: 50,
        step: 1,
        unit: ''
      },
      {
        key: 'STRESSOR_BASE_COUNT',
        label: 'Base Count',
        category: 'stressors',
        description: 'Base number of stressors per wave',
        type: 'number',
        value: GameConfig.STRESSOR_BASE_COUNT,
        min: 1,
        max: 20,
        step: 1,
        unit: ''
      },
      {
        key: 'STRESSOR_COUNT_MULTIPLIER',
        label: 'Count Multiplier',
        category: 'stressors',
        description: 'Multiplier per wave',
        type: 'number',
        value: GameConfig.STRESSOR_COUNT_MULTIPLIER,
        min: 1,
        max: 2,
        step: 0.05,
        unit: ''
      },
      {
        key: 'STRESSOR_BASE_HEALTH',
        label: 'Base Health',
        category: 'stressors',
        description: 'Base health value',
        type: 'number',
        value: GameConfig.STRESSOR_BASE_HEALTH,
        min: 1,
        max: 50,
        step: 1,
        unit: ''
      },
      {
        key: 'STRESSOR_HEALTH_MULTIPLIER',
        label: 'Health Multiplier',
        category: 'stressors',
        description: 'Multiplier per wave',
        type: 'number',
        value: GameConfig.STRESSOR_HEALTH_MULTIPLIER,
        min: 1,
        max: 2,
        step: 0.05,
        unit: ''
      },
      {
        key: 'STRESSOR_BASE_SPEED',
        label: 'Base Speed',
        category: 'stressors',
        description: 'Base speed in pixels per second',
        type: 'number',
        value: GameConfig.STRESSOR_BASE_SPEED,
        min: 50,
        max: 500,
        step: 10,
        unit: 'px/s'
      },
      {
        key: 'STRESSOR_SPEED_MULTIPLIER',
        label: 'Speed Multiplier',
        category: 'stressors',
        description: 'Multiplier per wave',
        type: 'number',
        value: GameConfig.STRESSOR_SPEED_MULTIPLIER,
        min: 1,
        max: 2,
        step: 0.05,
        unit: ''
      }
    ];

    this.categories.set('stressors', {
      id: 'stressors',
      label: 'Stressors',
      collapsed: false,
      settings
    });
  }

  private static registerWaveSettings(): void {
    const settings: SettingDefinition[] = [
      {
        key: 'WAVE_DURATION',
        label: 'Wave Duration',
        category: 'wave',
        description: 'Duration of each wave in seconds',
        type: 'number',
        value: GameConfig.WAVE_DURATION,
        min: 10,
        max: 300,
        step: 5,
        unit: 's'
      },
      {
        key: 'WAVE_15_TARGET_DEFEAT',
        label: 'Wave 15 Target Defeat',
        category: 'wave',
        description: 'Must be defeated by wave 15',
        type: 'boolean',
        value: GameConfig.WAVE_15_TARGET_DEFEAT
      }
    ];

    this.categories.set('wave', {
      id: 'wave',
      label: 'Wave',
      collapsed: false,
      settings
    });
  }

  private static registerDebugSettings(): void {
    const settings: SettingDefinition[] = [
      {
        key: 'DEBUG_SHOW_RINGS',
        label: 'Show Debug Rings',
        category: 'debug',
        description: 'Show concentric debug rings every 50px',
        type: 'boolean',
        value: GameConfig.DEBUG_SHOW_RINGS === 1
      }
    ];

    this.categories.set('debug', {
      id: 'debug',
      label: 'Debug',
      collapsed: false,
      settings
    });
  }
}

