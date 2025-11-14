/**
 * Color class with liquid watermedia-style blending and manipulation.
 * Supports blending (like wet paint mixing), lerping, darkening,
 * saturation, and alpha manipulation for fluid UI effects.
 */
export class Color {
  r: number;
  g: number;
  b: number;
  alpha: number;
  
  constructor(r: number, g: number, b: number, alpha: number = 1.0) {
    this.r = Math.max(0, Math.min(255, r));
    this.g = Math.max(0, Math.min(255, g));
    this.b = Math.max(0, Math.min(255, b));
    this.alpha = Math.max(0, Math.min(1, alpha));
  }
  
  /**
   * Create Color from hex string (e.g., "#FFD700" or "FFD700")
   */
  static fromHex(hex: string, alpha: number = 1.0): Color {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) {
      throw new Error(`Invalid hex color: ${hex}`);
    }
    return new Color(
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16),
      alpha
    );
  }
  
  /**
   * Create Color from RGB values (0-255)
   */
  static fromRGB(r: number, g: number, b: number, alpha: number = 1.0): Color {
    return new Color(r, g, b, alpha);
  }
  
  /**
   * Blend with another color (like wet paint mixing).
   * Modifies this color in place.
   */
  blend(other: Color, factor: number): void {
    // Mix RGB values
    this.r = this.r + (other.r - this.r) * factor;
    this.g = this.g + (other.g - this.g) * factor;
    this.b = this.b + (other.b - this.b) * factor;
    
    // Alpha increases when blending (like paint getting thicker)
    this.alpha = Math.min(1, this.alpha + other.alpha * factor * 0.5);
  }
  
  /**
   * Lerp between this color and another color.
   * Returns a new Color instance.
   */
  lerp(other: Color, t: number): Color {
    const clampedT = Math.max(0, Math.min(1, t));
    return new Color(
      this.r + (other.r - this.r) * clampedT,
      this.g + (other.g - this.g) * clampedT,
      this.b + (other.b - this.b) * clampedT,
      this.alpha + (other.alpha - this.alpha) * clampedT
    );
  }
  
  /**
   * Darken the color (for edge darkening effect).
   * Returns a new Color instance.
   */
  darken(amount: number): Color {
    const clampedAmount = Math.max(0, Math.min(1, amount));
    return new Color(
      this.r * (1 - clampedAmount),
      this.g * (1 - clampedAmount),
      this.b * (1 - clampedAmount),
      this.alpha
    );
  }
  
  /**
   * Saturate the color (increase pigment intensity).
   * Returns a new Color instance.
   */
  saturate(amount: number): Color {
    const clampedAmount = Math.max(0, Math.min(1, amount));
    const gray = (this.r + this.g + this.b) / 3;
    return new Color(
      this.r + (this.r - gray) * clampedAmount,
      this.g + (this.g - gray) * clampedAmount,
      this.b + (this.b - gray) * clampedAmount,
      this.alpha
    );
  }
  
  /**
   * Create a copy with different alpha value.
   * Returns a new Color instance.
   */
  withAlpha(alpha: number): Color {
    return new Color(this.r, this.g, this.b, alpha);
  }
  
  /**
   * Convert to CSS rgba() string.
   */
  toString(): string {
    return `rgba(${Math.round(this.r)}, ${Math.round(this.g)}, ${Math.round(this.b)}, ${this.alpha})`;
  }
  
  /**
   * Convert to hex string (without alpha).
   */
  toHex(): string {
    const r = Math.round(this.r).toString(16).padStart(2, '0');
    const g = Math.round(this.g).toString(16).padStart(2, '0');
    const b = Math.round(this.b).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }
  
  /**
   * Clone this color.
   */
  clone(): Color {
    return new Color(this.r, this.g, this.b, this.alpha);
  }
}

