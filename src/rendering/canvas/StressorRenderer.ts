import { Stressor, Vector2 } from '../../types';
import { getStressorColor } from '../../config/ColorConfig';

/**
 * StressorRenderer - Renders stressors as circles on canvas
 * 
 * Simple canvas-based rendering with health-based opacity and pulse animation.
 */
export class StressorRenderer {
  private width: number;
  private height: number;
  private time: number = 0;
  
  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }
  
  /**
   * Update renderer (advances animation time)
   */
  update(deltaTime: number): void {
    this.time += deltaTime;
  }
  
  /**
   * Render stressors to canvas
   * 
   * @param ctx Canvas 2D context
   * @param stressors Array of stressors to render
   * @param center Center position of playfield
   * @param serenityRatio Current serenity ratio (0-1) for color modulation
   */
  render(
    ctx: CanvasRenderingContext2D,
    stressors: Stressor[],
    center: Vector2,
    serenityRatio: number
  ): void {
    for (const stressor of stressors) {
      // Validate stressor size
      if (!Number.isFinite(stressor.size) || stressor.size <= 0) continue;
      
      // Calculate position relative to center
      const x = center.x + stressor.position.x;
      const y = center.y + stressor.position.y;
      
      // Validate position
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      
      // Get serenity-modulated color
      const color = getStressorColor(stressor.type, serenityRatio);
      
      // Calculate health-based opacity
      const healthRatio = Math.max(0, Math.min(1, stressor.health / stressor.maxHealth));
      const baseOpacity = 0.6 + healthRatio * 0.4; // 0.6 to 1.0
      
      // Add pulse animation (subtle)
      const pulse = Math.sin(this.time * 2) * 0.1 + 1.0; // 0.9 to 1.1
      const radius = stressor.size * pulse;
      
      // Validate radius before drawing
      if (!Number.isFinite(radius) || radius <= 0) continue;
      
      // Draw stressor circle
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      
      // Fill with color and opacity
      const rgb = this.hexToRgb(color);
      ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${baseOpacity})`;
      ctx.fill();
      
      // Draw outline
      ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${baseOpacity * 0.8})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
  
  /**
   * Convert hex color to RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    return { r, g, b };
  }
  
  /**
   * Resize renderer
   */
  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }
}

