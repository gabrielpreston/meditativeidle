/**
 * Ability Definitions
 * 
 * Structured data definitions for all abilities, matching the design specifications
 * in docs/design/ABILITIES.md. This file serves as the bridge between design and
 * implementation, providing type-safe ability configurations.
 */

export type AbilityType = 
  | 'breathe'
  | 'recenter'
  | 'affirm'
  | 'exhale'
  | 'reflect'
  | 'mantra'
  | 'ground'
  | 'release'
  | 'align';

export type ActivationType = 
  | 'always_active'
  | 'cooldown_auto'
  | 'timed_amplifier'
  | 'reactive_defense';

export interface AbilityVisualExpression {
  /** Primary visual description */
  description: string;
  /** Watercolor techniques used */
  techniques: string[];
  /** Color palette reference (see COLOR_PALETTE.md) */
  colorPalette: string[];
}

export interface AbilityScaling {
  /** Damage scaling per level (multiplier) */
  damagePerLevel?: number;
  /** Radius scaling per level (multiplier or pixels) */
  radiusPerLevel?: number;
  /** Cooldown scaling per level (seconds reduction) */
  cooldownPerLevel?: number;
  /** Duration scaling per level (seconds addition) */
  durationPerLevel?: number;
  /** Slow strength scaling per level (multiplier) */
  slowPerLevel?: number;
  /** Bonus strength scaling per level (multiplier) */
  bonusStrength?: number;
}

export interface AbilityDefinition {
  /** Unique identifier */
  id: AbilityType;
  /** Display name */
  name: string;
  /** Flavor description */
  description: string;
  /** Activation pattern */
  activationType: ActivationType;
  /** Base stats (agnostic values) */
  baseStats: {
    damage?: number;
    radius?: number;
    cooldown?: number;
    duration?: number;
    slowStrength?: number;
    amplification?: number;
    cycleDuration?: number;
    bonusStrength?: number;
  };
  /** Scaling configuration */
  scaling: AbilityScaling;
  /** Visual expression details */
  visual: AbilityVisualExpression;
  /** Maximum level */
  maxLevel: number;
  /** Branch points (levels where branching occurs) */
  branchPoints: number[];
}

/**
 * Complete ability definitions matching design specifications.
 * 
 * Reference: docs/design/ABILITIES.md
 */
export const AbilityDefinitions: Record<AbilityType, AbilityDefinition> = {
  breathe: {
    id: 'breathe',
    name: 'Breathe',
    description: 'A constant aura of calm that gently damages nearby stressors.',
    activationType: 'always_active',
    baseStats: {
      damage: 5, // Moderate base damage per second
      radius: 250, // Medium aura radius
    },
    scaling: {
      damagePerLevel: 0.1, // +10% per level
      radiusPerLevel: 0.05, // +5% per level
    },
    visual: {
      description: 'A soft circular bloom of pigment expands and contracts in rhythm with breathing.',
      techniques: [
        'Wet-on-wet diffusion',
        'Soft-edge blooming',
        'Pigment reactivation',
        'Rhythmic desaturation',
      ],
      colorPalette: ['Lavender', 'Amber', 'Cerulean'],
    },
    maxLevel: 10,
    branchPoints: [3, 6, 9],
  },
  recenter: {
    id: 'recenter',
    name: 'Recenter',
    description: 'A grounding ripple that slows and soothes approaching stressors.',
    activationType: 'cooldown_auto',
    baseStats: {
      radius: 300, // Expands outward from center
      slowStrength: 0.5, // 50% slow (high debuff)
      duration: 1.5, // Short pulse duration
      cooldown: 8, // Moderate cooldown
    },
    scaling: {
      radiusPerLevel: 20, // +20 pixels per level
      slowPerLevel: 0.05, // +5% slow per level
    },
    visual: {
      description: 'A droplet of pigment landing on wet paper, rippling outward as translucent waves.',
      techniques: [
        'Backrun/cauliflower textures',
        'Ripple diffusion',
        'Transparent layering',
        'Soft bleed edges',
      ],
      colorPalette: ['Translucent blue-green', 'Golden tide (under Affirm)'],
    },
    maxLevel: 10,
    branchPoints: [3, 6, 9],
  },
  affirm: {
    id: 'affirm',
    name: 'Affirm',
    description: 'A phase of lucidity and light that strengthens all other abilities.',
    activationType: 'timed_amplifier',
    baseStats: {
      duration: 10, // Long active window
      cooldown: 45, // Long cooldown
      amplification: 1.0, // Base amplification (doubles at max level)
    },
    scaling: {
      // Amplification is calculated as: 1 + (level * 0.1)
      // This reaches 2.0x at level 10
    },
    visual: {
      description: 'A golden glaze wash floods the canvas, unifying all pigment layers.',
      techniques: [
        'Glazing',
        'Transparency modulation',
        'Pigment lifting',
        'Warm unification layer',
      ],
      colorPalette: ['Golden glaze', 'Warm tones'],
    },
    maxLevel: 10,
    branchPoints: [3, 6, 9],
  },
  exhale: {
    id: 'exhale',
    name: 'Exhale',
    description: 'A release of breath — waves of energy ripple outward, damaging and slowing stressors.',
    activationType: 'cooldown_auto',
    baseStats: {
      damage: 15, // Burst, moderate per hit
      slowStrength: 0.3, // Brief and light slow
      cooldown: 12, // Medium-short cooldown
      radius: 800, // Max wave radius
    },
    scaling: {
      damagePerLevel: 0.1, // +10% per level
      cooldownPerLevel: -0.5, // -0.5s per level
    },
    visual: {
      description: 'Pigment blooms erupt from the center in successive translucent rings.',
      techniques: [
        'Wet-on-wet bloom',
        'Pigment dispersion',
        'Separation granulation',
        'Fading halos',
      ],
      colorPalette: ['Pale Blue', 'Lavender', 'Faded Mint'],
    },
    maxLevel: 10,
    branchPoints: [3, 6, 9],
  },
  reflect: {
    id: 'reflect',
    name: 'Reflect',
    description: 'A protective dome of clarity that turns stress back upon itself.',
    activationType: 'reactive_defense',
    baseStats: {
      duration: 6, // Short to medium duration
      cooldown: 45, // Long cooldown
      radius: 150, // Barrier radius
    },
    scaling: {
      durationPerLevel: 0.5, // +0.5s per level
    },
    visual: {
      description: 'A film of clean water pooling atop the paper, shimmering with faint pigment reflections.',
      techniques: [
        'Water pooling',
        'Pigment backflow',
        'Reflection staining',
        'Evaporative halos',
      ],
      colorPalette: ['Clean water effect', 'Absorbs stressor colors'],
    },
    maxLevel: 10,
    branchPoints: [3, 6, 9],
  },
  mantra: {
    id: 'mantra',
    name: 'Mantra',
    description: 'A focused line of attention that dissolves a single stressor\'s presence.',
    activationType: 'cooldown_auto',
    baseStats: {
      damage: 10, // Sustained single-target DPS
      duration: 3, // Short channel
      cooldown: 20, // Moderate cooldown
    },
    scaling: {
      damagePerLevel: 0.1, // +10% per level
      durationPerLevel: 0.3, // +0.3s per level
    },
    visual: {
      description: 'A single, deliberate brushstroke of pigment drawn from center to target.',
      techniques: [
        'Dry-on-wet line control',
        'Pigment pooling',
        'Fading stroke memory',
      ],
      colorPalette: ['Focused indigo', 'Deep Violet', 'Gilded (under Affirm)'],
    },
    maxLevel: 10,
    branchPoints: [3, 6, 9],
  },
  ground: {
    id: 'ground',
    name: 'Ground',
    description: 'A patch of stillness that slows and wears down stressors who linger there.',
    activationType: 'cooldown_auto',
    baseStats: {
      damage: 3, // Low-over-time DPS
      slowStrength: 0.3, // Strong slow (70% reduction)
      duration: 6, // Moderate duration
      radius: 150, // Small, local zone
      cooldown: 10, // Short interval
    },
    scaling: {
      damagePerLevel: 0.1, // +10% per level
      durationPerLevel: 0.5, // +0.5s per level
    },
    visual: {
      description: 'A spreading watercolor stain blooms outward, darkest at its center.',
      techniques: [
        'Puddle bloom',
        'Sedimentation',
        'Diffuse opacity layering',
      ],
      colorPalette: ['Earthy brown-green', 'Warm Ochre'],
    },
    maxLevel: 10,
    branchPoints: [3, 6, 9],
  },
  release: {
    id: 'release',
    name: 'Release',
    description: 'A total letting-go — a surge that clears all stressors and restores calm.',
    activationType: 'reactive_defense',
    baseStats: {
      damage: 50, // Very high (global hit)
      cooldown: 90, // Long cooldown
      radius: 800, // Global radius
    },
    scaling: {
      damagePerLevel: 0.1, // +10% per level
    },
    visual: {
      description: 'The entire canvas floods with clean water, dissolving all pigment into swirling gradients.',
      techniques: [
        'Full wash',
        'Pigment lifting',
        'Rewet-and-drain',
        'Tonal reset',
      ],
      colorPalette: ['Full spectrum blend', 'Muted Gray', 'Pastel recovery tones'],
    },
    maxLevel: 10,
    branchPoints: [3, 6, 9],
  },
  align: {
    id: 'align',
    name: 'Align',
    description: 'Alternates between offense and defense phases to maintain equilibrium.',
    activationType: 'always_active',
    baseStats: {
      cycleDuration: 6, // Short repeating period (3s offense / 3s defense)
      bonusStrength: 0.5, // Moderate bonus (+50%)
    },
    scaling: {
      bonusStrength: 0.05, // +5% per level
    },
    visual: {
      description: 'The aura\'s temperature oscillates between warm and cool tones like glazing layers.',
      techniques: [
        'Temperature contrast',
        'Wet-over-damp blending',
        'Slow bleed transitions',
      ],
      colorPalette: ['Warm tones (offense)', 'Cool tones (defense)'],
    },
    maxLevel: 10,
    branchPoints: [3, 6, 9],
  },
};

/**
 * Get ability definition by ID
 */
export function getAbilityDefinition(id: AbilityType): AbilityDefinition {
  return AbilityDefinitions[id];
}

/**
 * Get all ability definitions
 */
export function getAllAbilityDefinitions(): Record<AbilityType, AbilityDefinition> {
  return AbilityDefinitions;
}

/**
 * Get ability visual expression
 */
export function getAbilityVisual(id: AbilityType): AbilityVisualExpression {
  return AbilityDefinitions[id].visual;
}

