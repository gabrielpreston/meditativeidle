import { StressorType } from '../types';
import { RGB } from '../types';
import { ColorInterpolator } from '../utils/ColorInterpolator';

/**
 * Color Configuration - Serenity-based color ranges for stressors
 * 
 * Defines color ranges for each stressor type based on Serenity levels:
 * - High Serenity (80-100%): Lighter, more translucent colors
 * - Medium Serenity (50-79%): Moderate colors
 * - Low Serenity (20-49%): Darker, denser colors
 * - Critical Serenity (≤19%): Nearly opaque, stagnant colors
 * 
 * Reference: docs/design/COLOR_PALETTE.md
 */

interface SerenityColorRange {
  high: RGB;      // 80-100% Serenity
  medium: RGB;   // 50-79% Serenity
  low: RGB;      // 20-49% Serenity
  critical: RGB; // ≤19% Serenity
}

/**
 * Get color for a stressor type based on Serenity ratio
 * @param stressorType - Type of stressor
 * @param serenityRatio - Current Serenity ratio (0-1)
 * @returns Hex color string
 */
export function getStressorColor(stressorType: StressorType, serenityRatio: number): string {
  const colorRange = STRESSOR_COLOR_RANGES.get(stressorType);
  if (!colorRange) {
    // Fallback to gray
    return '#808080';
  }

  // Map serenity ratio to color range
  let color: RGB;
  if (serenityRatio >= 0.8) {
    // High Serenity: use high color
    color = colorRange.high;
  } else if (serenityRatio >= 0.5) {
    // Medium Serenity: interpolate between high and medium
    const ratio = (serenityRatio - 0.5) / 0.3; // Map 0.5-0.8 to 0-1
    color = ColorInterpolator.interpolate(colorRange.high, colorRange.medium, ratio);
  } else if (serenityRatio >= 0.2) {
    // Low Serenity: interpolate between medium and low
    const ratio = (serenityRatio - 0.2) / 0.3; // Map 0.2-0.5 to 0-1
    color = ColorInterpolator.interpolate(colorRange.medium, colorRange.low, ratio);
  } else {
    // Critical Serenity: interpolate between low and critical
    const ratio = serenityRatio / 0.2; // Map 0-0.2 to 0-1
    color = ColorInterpolator.interpolate(colorRange.low, colorRange.critical, ratio);
  }

  return ColorInterpolator.rgbToHex(color);
}

/**
 * Color ranges for each stressor type
 * Based on design specifications from docs/design/COLOR_PALETTE.md
 */
const STRESSOR_COLOR_RANGES = new Map<StressorType, SerenityColorRange>([
  [StressorType.IntrusiveThought, {
    high: ColorInterpolator.hexToRgb('#B8C5E8'),    // Light Blue-Gray
    medium: ColorInterpolator.hexToRgb('#8B9DC3'),  // Medium Blue-Gray
    low: ColorInterpolator.hexToRgb('#5A6B8A'),     // Dark Blue-Gray
    critical: ColorInterpolator.hexToRgb('#3A4A5A') // Very Dark Blue-Gray
  }],
  [StressorType.TimePressure, {
    high: ColorInterpolator.hexToRgb('#FFD4A3'),    // Light Orange
    medium: ColorInterpolator.hexToRgb('#FFB347'),  // Medium Orange
    low: ColorInterpolator.hexToRgb('#FF8C00'),     // Dark Orange
    critical: ColorInterpolator.hexToRgb('#CC6600') // Very Dark Orange
  }],
  [StressorType.EnvironmentalNoise, {
    high: ColorInterpolator.hexToRgb('#E8D4F0'),    // Light Purple
    medium: ColorInterpolator.hexToRgb('#C8A2C8'),  // Medium Purple
    low: ColorInterpolator.hexToRgb('#9B6FA8'),     // Dark Purple
    critical: ColorInterpolator.hexToRgb('#6B4A7A') // Very Dark Purple
  }],
  [StressorType.Expectation, {
    high: ColorInterpolator.hexToRgb('#FFB3B3'),    // Light Red-Pink
    medium: ColorInterpolator.hexToRgb('#FF6B6B'),   // Medium Red-Pink
    low: ColorInterpolator.hexToRgb('#CC4444'),    // Dark Red-Pink
    critical: ColorInterpolator.hexToRgb('#992222') // Very Dark Red-Pink
  }],
  [StressorType.Fatigue, {
    high: ColorInterpolator.hexToRgb('#6B7A8A'),    // Light Gray-Blue
    medium: ColorInterpolator.hexToRgb('#4A5568'),  // Medium Gray-Blue
    low: ColorInterpolator.hexToRgb('#2D3440'),     // Dark Gray-Blue
    critical: ColorInterpolator.hexToRgb('#1A1F26') // Very Dark Gray-Blue
  }],
  [StressorType.SelfDoubt, {
    high: ColorInterpolator.hexToRgb('#C0C8D0'),    // Light Gray-Blue
    medium: ColorInterpolator.hexToRgb('#A0A0A0'),  // Medium Gray-Blue
    low: ColorInterpolator.hexToRgb('#707080'),    // Dark Gray-Blue
    critical: ColorInterpolator.hexToRgb('#505060') // Very Dark Gray-Blue (Dark Slate)
  }],
  [StressorType.Overwhelm, {
    high: ColorInterpolator.hexToRgb('#FFB3D9'),   // Light Pink
    medium: ColorInterpolator.hexToRgb('#FF69B4'), // Medium Pink
    low: ColorInterpolator.hexToRgb('#CC4A8A'),     // Dark Pink
    critical: ColorInterpolator.hexToRgb('#992266') // Very Dark Pink
  }],
  [StressorType.Impulse, {
    high: ColorInterpolator.hexToRgb('#FF8A9A'),    // Light Red
    medium: ColorInterpolator.hexToRgb('#FF4757'),  // Medium Red
    low: ColorInterpolator.hexToRgb('#CC2A3A'),     // Dark Red
    critical: ColorInterpolator.hexToRgb('#991A22') // Very Dark Red
  }]
]);

