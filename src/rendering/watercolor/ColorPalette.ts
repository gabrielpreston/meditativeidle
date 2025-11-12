/**
 * Color Palette Utility
 * 
 * Provides color mappings based on Serenity level and ability type,
 * matching the specifications in docs/design/COLOR_PALETTE.md
 */

import { AbilityType } from '../../config/AbilityDefinitions';

export type SerenityLevel = 'high' | 'medium' | 'low' | 'critical';

export interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

/**
 * Convert RGB to hex
 */
function rgbToHex(rgb: RGB): string {
  return `#${Math.round(rgb.r).toString(16).padStart(2, '0')}${Math.round(rgb.g).toString(16).padStart(2, '0')}${Math.round(rgb.b).toString(16).padStart(2, '0')}`;
}

/**
 * Convert RGB to Three.js color number
 */
function rgbToThreeColor(rgb: RGB): number {
  return (Math.round(rgb.r) << 16) | (Math.round(rgb.g) << 8) | Math.round(rgb.b);
}

/**
 * Interpolate between two RGB colors
 */
function lerpColor(a: RGB, b: RGB, t: number): RGB {
  return {
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  };
}

/**
 * Determine serenity level from ratio (0-1)
 */
export function getSerenityLevel(serenityRatio: number): SerenityLevel {
  if (serenityRatio >= 0.8) return 'high';
  if (serenityRatio >= 0.5) return 'medium';
  if (serenityRatio >= 0.2) return 'low';
  return 'critical';
}

/**
 * Color palette definitions matching COLOR_PALETTE.md
 */
const SerenityColors: Record<SerenityLevel, {
  lavender: string;
  paleBlue: string;
  warmOchre: string;
  whiteGold: string;
  coral?: string;
  slateBlue?: string;
  fadedMint?: string;
  mutedGray?: string;
  desaturatedIndigo?: string;
  deepViolet?: string;
  brittleGray?: string;
  dullIndigo?: string;
  fadedViolet?: string;
}> = {
  high: {
    lavender: '#E6E6FA',
    paleBlue: '#B0E0E6',
    warmOchre: '#CC7722',
    whiteGold: '#F5DEB3',
  },
  medium: {
    lavender: '#E6E6FA',
    paleBlue: '#B0E0E6',
    warmOchre: '#CC7722',
    whiteGold: '#F5DEB3',
    coral: '#FF7F50',
    slateBlue: '#6A5ACD',
    fadedMint: '#98FB98',
  },
  low: {
    lavender: '#E6E6FA',
    paleBlue: '#B0E0E6',
    warmOchre: '#CC7722',
    whiteGold: '#F5DEB3',
    coral: '#FF7F50',
    slateBlue: '#6A5ACD',
    fadedMint: '#98FB98',
    mutedGray: '#808080',
    desaturatedIndigo: '#4B0082',
    deepViolet: '#8B008B',
  },
  critical: {
    lavender: '#E6E6FA',
    paleBlue: '#B0E0E6',
    warmOchre: '#CC7722',
    whiteGold: '#F5DEB3',
    coral: '#FF7F50',
    slateBlue: '#6A5ACD',
    fadedMint: '#98FB98',
    mutedGray: '#808080',
    desaturatedIndigo: '#4B0082',
    deepViolet: '#8B008B',
    brittleGray: '#696969',
    dullIndigo: '#2F4F4F',
    fadedViolet: '#9370DB',
  },
};

/**
 * Ability-specific color mappings
 */
const AbilityColors: Record<AbilityType, Record<SerenityLevel, { primary: string; secondary: string; underAffirm?: string }>> = {
  breathe: {
    high: { primary: '#E6E6FA', secondary: '#B0E0E6' }, // Lavender → Pale Blue
    medium: { primary: '#6A5ACD', secondary: '#FF7F50' }, // Slate Blue → Coral
    low: { primary: '#808080', secondary: '#8B008B' }, // Muted Gray → Deep Violet
    critical: { primary: '#696969', secondary: '#8B008B' }, // Brittle Gray → Deep Violet
  },
  recenter: {
    high: { primary: '#7FFFD4', secondary: '#7FFFD4', underAffirm: '#FFD700' }, // Translucent blue-green → Golden
    medium: { primary: '#7FFFD4', secondary: '#7FFFD4', underAffirm: '#FFD700' },
    low: { primary: '#7FFFD4', secondary: '#7FFFD4', underAffirm: '#FFD700' },
    critical: { primary: '#7FFFD4', secondary: '#7FFFD4', underAffirm: '#FFD700' },
  },
  affirm: {
    high: { primary: '#FFD700', secondary: '#CC7722' }, // Golden glaze → Warm Ochre
    medium: { primary: '#FFD700', secondary: '#CC7722' },
    low: { primary: '#FFD700', secondary: '#CC7722' },
    critical: { primary: '#FFD700', secondary: '#CC7722' },
  },
  exhale: {
    high: { primary: '#B0E0E6', secondary: '#E6E6FA' }, // Pale Blue → Lavender → Faded Mint
    medium: { primary: '#B0E0E6', secondary: '#98FB98' },
    low: { primary: '#808080', secondary: '#808080' }, // Desaturates to Muted Gray
    critical: { primary: '#696969', secondary: '#696969' },
  },
  reflect: {
    high: { primary: '#E0F7FA', secondary: '#E0F7FA' }, // Clean water effect
    medium: { primary: '#E0F7FA', secondary: '#8B008B' }, // Absorbs stressor colors → Deep Violet
    low: { primary: '#E0F7FA', secondary: '#8B008B' },
    critical: { primary: '#E0F7FA', secondary: '#8B008B' },
  },
  mantra: {
    high: { primary: '#4B0082', secondary: '#8B008B', underAffirm: '#9370DB' }, // Focused indigo → Deep Violet → Gilded
    medium: { primary: '#4B0082', secondary: '#8B008B', underAffirm: '#9370DB' },
    low: { primary: '#4B0082', secondary: '#8B008B', underAffirm: '#9370DB' },
    critical: { primary: '#4B0082', secondary: '#8B008B', underAffirm: '#9370DB' },
  },
  ground: {
    high: { primary: '#8B7355', secondary: '#CC7722' }, // Earthy brown-green → Warm Ochre
    medium: { primary: '#8B7355', secondary: '#CC7722' },
    low: { primary: '#808080', secondary: '#808080' }, // Dries to Muted Gray
    critical: { primary: '#696969', secondary: '#696969' },
  },
  release: {
    high: { primary: '#808080', secondary: '#E6E6FA' }, // Full spectrum → Muted Gray → Pastel recovery
    medium: { primary: '#808080', secondary: '#B0E0E6' },
    low: { primary: '#808080', secondary: '#CC7722' },
    critical: { primary: '#696969', secondary: '#F5DEB3' },
  },
  align: {
    high: { primary: '#FF7F50', secondary: '#6A5ACD' }, // Warm (offense) → Cool (defense)
    medium: { primary: '#FF7F50', secondary: '#6A5ACD' },
    low: { primary: '#808080', secondary: '#4B0082' },
    critical: { primary: '#696969', secondary: '#2F4F4F' },
  },
};

/**
 * Get color for an ability based on serenity level
 */
export function getAbilityColor(
  ability: AbilityType,
  serenityRatio: number,
  affirmActive: boolean = false,
  phase?: 'offense' | 'defense'
): { primary: number; secondary: number; opacity: number } {
  const level = getSerenityLevel(serenityRatio);
  const colors = AbilityColors[ability][level];
  
  // Handle special cases
  if (ability === 'align' && phase) {
    const phaseColor = phase === 'offense' ? colors.primary : colors.secondary;
    const rgb = hexToRgb(phaseColor);
    return {
      primary: rgbToThreeColor(rgb),
      secondary: rgbToThreeColor(rgb),
      opacity: 0.4 * serenityRatio,
    };
  }
  
  if (affirmActive && colors.underAffirm) {
    const rgb = hexToRgb(colors.underAffirm);
    return {
      primary: rgbToThreeColor(rgb),
      secondary: rgbToThreeColor(rgb),
      opacity: 0.5 * serenityRatio,
    };
  }
  
  // Interpolate between primary and secondary based on serenity within level
  const levelRanges: Record<SerenityLevel, [number, number]> = {
    high: [0.8, 1.0],
    medium: [0.5, 0.8],
    low: [0.2, 0.5],
    critical: [0.0, 0.2],
  };
  
  const [min, max] = levelRanges[level];
  const t = Math.max(0, Math.min(1, (serenityRatio - min) / (max - min)));
  
  const primaryRgb = hexToRgb(colors.primary);
  const secondaryRgb = hexToRgb(colors.secondary);
  const interpolated = lerpColor(primaryRgb, secondaryRgb, t);
  
  // Calculate opacity based on serenity
  let opacity = 0.4;
  if (ability === 'breathe') opacity = 0.15 * serenityRatio;
  else if (ability === 'reflect') opacity = 0.3 * serenityRatio * 0.8;
  else if (ability === 'mantra') opacity = 0.6 * serenityRatio;
  else opacity = 0.4 * serenityRatio;
  
  return {
    primary: rgbToThreeColor(interpolated),
    secondary: rgbToThreeColor(secondaryRgb),
    opacity: Math.max(0.1, Math.min(1.0, opacity)),
  };
}

/**
 * Get color for exhale wave based on progress
 */
export function getExhaleWaveColor(
  progress: number,
  serenityRatio: number
): { color: number; opacity: number } {
  const level = getSerenityLevel(serenityRatio);
  const colors = AbilityColors.exhale[level];
  
  // Fade from primary to secondary as wave expands
  const primaryRgb = hexToRgb(colors.primary);
  const secondaryRgb = hexToRgb(colors.secondary);
  const interpolated = lerpColor(primaryRgb, secondaryRgb, progress);
  
  // Desaturate as it fades
  const fadeFactor = 1 - progress * 0.5;
  const faded = lerpColor(interpolated, { r: 128, g: 128, b: 128 }, 1 - fadeFactor);
  
  return {
    color: rgbToThreeColor(faded),
    opacity: 0.4 * serenityRatio * fadeFactor,
  };
}

/**
 * Get color for release shockwave
 */
export function getReleaseColor(serenityRatio: number): { color: number; opacity: number } {
  const level = getSerenityLevel(serenityRatio);
  const colors = AbilityColors.release[level];
  
  // Start with muted gray, transition to recovery colors
  const grayRgb = hexToRgb(colors.primary);
  const recoveryRgb = hexToRgb(colors.secondary);
  const interpolated = lerpColor(grayRgb, recoveryRgb, serenityRatio);
  
  return {
    color: rgbToThreeColor(interpolated),
    opacity: 0.9,
  };
}

