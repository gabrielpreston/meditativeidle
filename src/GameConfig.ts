export const GameConfig = {
  // Core System Values
  MAX_SERENITY: 100,
  AURA_RADIUS: 250, // Increased from 150 to 250
  AURA_DAMAGE_PER_SECOND: 5, // Damage stressors take per second when in aura
  
  // Wave Configuration
  WAVE_DURATION: 60, // seconds
  WAVE_15_TARGET_DEFEAT: true, // Must be defeated by wave 15
  
  // Stressor Scaling
  STRESSOR_BASE_COUNT: 3,
  STRESSOR_COUNT_MULTIPLIER: 1.15, // per wave
  STRESSOR_BASE_HEALTH: 10,
  STRESSOR_HEALTH_MULTIPLIER: 1.2, // per wave
  STRESSOR_BASE_SPEED: 180, // pixels per second (6x faster than original)
  STRESSOR_SPEED_MULTIPLIER: 1.1, // per wave
  
  // Stressor Type Specific
  STRESSOR_TYPES: {
    intrusive_thought: {
      speed: 1.0,
      health: 1.0,
      color: '#8B9DC3'
    },
    time_pressure: {
      speed: 1.8,
      health: 0.7,
      color: '#FFB347'
    },
    environmental_noise: {
      speed: 0.9,
      health: 0.8,
      color: '#C8A2C8',
      wobble: true
    },
    expectation: {
      speed: 0.6,
      health: 1.2,
      color: '#FF6B6B',
      orbit: true
    },
    fatigue: {
      speed: 0.4,
      health: 2.0,
      color: '#4A5568',
      auraResist: 0.5
    },
    impulse: {
      speed: 1.0,
      health: 0.9,
      color: '#FF4757',
      acceleration: true
    }
  },
  
  // Ability Configuration
  AFFIRM_MAX_TARGETS: 3,
  
  // Ability Effects
  BREATHE_BASE_DAMAGE_PER_SECOND: 5,
  BREATHE_DAMAGE_SCALING: 0.1, // per level multiplier
  
  // Recenter - Pulse Burst
  RECENTER_COOLDOWN: 8, // seconds between pulses
  RECENTER_PULSE_DURATION: 1.5, // seconds for pulse to expand
  RECENTER_BASE_MAX_RADIUS: 300, // pixels
  RECENTER_RADIUS_SCALING: 20, // pixels per level
  RECENTER_PULSE_SPEED: 200, // pixels per second expansion speed
  RECENTER_BASE_SLOW: 0.5, // 50% speed
  RECENTER_SLOW_SCALING: 0.05, // per level
  
  // Affirm - Ability Amplifier
  AFFIRM_DURATION: 10, // seconds active
  AFFIRM_COOLDOWN: 45, // seconds cooldown after duration ends, total cycle = 55s
  AFFIRM_AMPLIFICATION_SCALING: 0.1, // 10% per level
  
  // Exhale - Periodic projectile burst
  EXHALE_COOLDOWN: 12, // seconds
  EXHALE_WAVE_COUNT: 3,
  EXHALE_BASE_DAMAGE: 15,
  EXHALE_WAVE_SPEED: 600, // pixels/second
  EXHALE_WAVE_RADII: [400, 600, 800], // pixels
  EXHALE_SLOW_DURATION: 1.5, // seconds
  EXHALE_SLOW_STRENGTH: 0.3, // 0.7x speed = 30% slow
  EXHALE_WAVE_INTERVAL: 0.2, // seconds between waves
  EXHALE_DAMAGE_SCALING: 0.1, // +10% per level
  EXHALE_SLOW_DURATION_SCALING: 0.2, // +0.2s per level
  EXHALE_COOLDOWN_SCALING: 0.5, // -0.5s per level
  EXHALE_EARLY_TRIGGER_SERENITY: 50, // Auto-trigger if Serenity <= 50%
  
  // Reflect - Reactive defensive barrier
  REFLECT_TRIGGER_SERENITY: 25, // Auto-trigger if Serenity <= 25%
  REFLECT_BARRIER_RADIUS: 150, // pixels
  REFLECT_BASE_DURATION: 6, // seconds
  REFLECT_COOLDOWN: 45, // seconds
  REFLECT_BASE_DAMAGE: 0.5, // 50% of attacker's current HP
  REFLECT_DURATION_SCALING: 0.5, // +0.5s per level
  REFLECT_DAMAGE_SCALING: 0.05, // +5% per level
  
  // Mantra - Sustained focus beam
  MANTRA_COOLDOWN: 20, // seconds
  MANTRA_BASE_DAMAGE: 10, // DPS
  MANTRA_BASE_DURATION: 3, // seconds
  MANTRA_SLOW_STRENGTH: 0.8, // 0.8x speed = 20% slow
  MANTRA_DAMAGE_SCALING: 0.1, // +10% per level
  MANTRA_DURATION_SCALING: 0.3, // +0.3s per level
  
  // Ground - Area trap
  GROUND_COOLDOWN: 10, // seconds
  GROUND_FIELD_RADIUS: 150, // pixels
  GROUND_BASE_DAMAGE: 3, // DPS
  GROUND_SLOW_STRENGTH: 0.3, // 0.3x speed = 70% slow
  GROUND_BASE_DURATION: 6, // seconds
  GROUND_SPAWN_DISTANCE_MIN: 300, // pixels from center
  GROUND_SPAWN_DISTANCE_MAX: 500, // pixels from center
  GROUND_DAMAGE_SCALING: 0.1, // +10% per level
  GROUND_DURATION_SCALING: 0.5, // +0.5s per level
  
  // Release - Ultimate cleanse
  RELEASE_TRIGGER_SERENITY: 10, // Auto-trigger if Serenity <= 10%
  RELEASE_RADIUS: 800, // pixels
  RELEASE_BASE_DAMAGE: 50,
  RELEASE_BASE_SERENITY_RESTORE: 50, // percentage
  RELEASE_COOLDOWN: 90, // seconds
  RELEASE_DAMAGE_SCALING: 0.1, // +10% per level
  RELEASE_SERENITY_SCALING: 0.05, // +5% per level
  
  // Align - Rhythmic modulator
  ALIGN_CYCLE_DURATION: 6, // seconds (3s offense / 3s defense)
  ALIGN_BASE_BONUS: 0.5, // +50% bonus
  ALIGN_BONUS_SCALING: 0.05, // +5% per level
  ALIGN_CYCLE_SCALING: 0.5, // +0.5s per level
  
  // Legacy (kept for compatibility, may be removed later)
  AFFIRM_INSIGHT_MULTIPLIER: 1.5,
  AFFIRM_SERENITY_RESTORE: 2,
  
  // Insight and Upgrades
  INSIGHT_BASE: 5,
  INSIGHT_PER_WAVE: 1,
  UPGRADE_COST_BASE: 20,
  UPGRADE_COST_MULTIPLIER: 1.5,
  
  // Visual
  CENTER_RADIUS: 80, // Doubled from 40 to 80
  PLAYFIELD_PADDING: 50,
  BLOOM_INTENSITY: 0.3,
  
  // Performance
  TARGET_FPS: 60,
  PERFORMANCE_THRESHOLD: 55,
  TELEMETRY_INTERVAL: 1000, // ms
  
  // Colors (High Serenity)
  COLOR_HIGH_SERENITY: {
    background: '#F5F0FF', // Soft lavender-tinted white (complements purple)
    center: '#E6D5F5', // Light soft lavender
    accent: '#87CEEB',
    gold: '#FFD700'
  },
  
  // Colors (Low Serenity)
  COLOR_LOW_SERENITY: {
    background: '#E0F2E8', // Soft mint green (complements purple)
    center: '#9370DB', // Deeper soft purple
    accent: '#0f3460',
    rust: '#8B4513'
  }
};

