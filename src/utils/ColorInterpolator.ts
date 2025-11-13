import { RGB } from '../types';

/**
 * ColorInterpolator - Utility for color interpolation and conversion
 * 
 * Handles color interpolation based on Serenity levels and converts between
 * hex and RGB color formats.
 */
export class ColorInterpolator {
  /**
   * Interpolate between two colors based on a ratio (0-1)
   * @param color1 - Start color (RGB)
   * @param color2 - End color (RGB)
   * @param ratio - Interpolation ratio (0 = color1, 1 = color2)
   * @returns Interpolated RGB color
   */
  static interpolate(color1: RGB, color2: RGB, ratio: number): RGB {
    const clampedRatio = Math.max(0, Math.min(1, ratio));
    return {
      r: Math.round(color1.r + (color2.r - color1.r) * clampedRatio),
      g: Math.round(color1.g + (color2.g - color1.g) * clampedRatio),
      b: Math.round(color1.b + (color2.b - color1.b) * clampedRatio)
    };
  }

  /**
   * Interpolate between multiple colors based on a ratio
   * @param colors - Array of RGB colors
   * @param ratio - Interpolation ratio (0-1, mapped across colors array)
   * @returns Interpolated RGB color
   */
  static interpolateMulti(colors: RGB[], ratio: number): RGB {
    if (colors.length === 0) {
      return { r: 0, g: 0, b: 0 };
    }
    if (colors.length === 1) {
      return colors[0];
    }

    const clampedRatio = Math.max(0, Math.min(1, ratio));
    const segmentSize = 1 / (colors.length - 1);
    const segmentIndex = Math.floor(clampedRatio / segmentSize);
    const segmentRatio = (clampedRatio % segmentSize) / segmentSize;

    if (segmentIndex >= colors.length - 1) {
      return colors[colors.length - 1];
    }

    return this.interpolate(colors[segmentIndex], colors[segmentIndex + 1], segmentRatio);
  }

  /**
   * Convert hex color string to RGB
   * @param hex - Hex color string (e.g., '#FF5733' or 'FF5733')
   * @returns RGB color object
   */
  static hexToRgb(hex: string): RGB {
    // Remove # if present
    const cleanHex = hex.replace('#', '');
    
    // Parse hex values
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    
    return { r, g, b };
  }

  /**
   * Convert RGB color to hex string
   * @param rgb - RGB color object
   * @returns Hex color string (e.g., '#FF5733')
   */
  static rgbToHex(rgb: RGB): string {
    const r = Math.max(0, Math.min(255, rgb.r)).toString(16).padStart(2, '0');
    const g = Math.max(0, Math.min(255, rgb.g)).toString(16).padStart(2, '0');
    const b = Math.max(0, Math.min(255, rgb.b)).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }
}

