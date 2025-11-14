import { FluidUIElement } from '../fluid/FluidUIElement';
import { Color } from '../fluid/Color';
import { Vector2 } from '../../../types';
import { GameConfig } from '../../../GameConfig';

/**
 * FluidWaveIndicator renders wave progress as a flowing circular ring.
 * The ring fills like liquid dye dispersing through fluid, with color bleeding and soft edges.
 */
export class FluidWaveIndicator extends FluidUIElement {
  private progress: number = 0;
  private readonly ringRadius: number = 60;
  
  constructor(position: Vector2) {
    const initialColor = Color.fromHex(GameConfig.COLOR_HIGH_SERENITY.gold);
    super(position, initialColor, 60); // Use literal value instead of this.ringRadius
    this.blendRadius = 80;
  }
  
  /**
   * Update progress value (0-1).
   */
  setProgress(progress: number): void {
    this.progress = Math.max(0, Math.min(1, progress));
  }
  
  /**
   * Get wobble offset from fluid field (simulates paper texture distortion).
   */
  private getWobble(time: number): Vector2 {
    const noiseX = Math.sin(time * 0.5 + this.position.x * 0.01) * 2;
    const noiseY = Math.cos(time * 0.5 + this.position.y * 0.01) * 2;
    return { x: noiseX, y: noiseY };
  }
  
  render(ctx: CanvasRenderingContext2D, time: number): void {
    // Wobble from fluid field
    const wobble = this.getWobble(time);
    const centerX = this.position.x + wobble.x;
    const centerY = this.position.y + wobble.y;
    
    // Outer ring with soft edges (paper texture visible)
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color.withAlpha(0.3).toString();
    ctx.beginPath();
    ctx.arc(centerX, centerY, this.ringRadius, 0, Math.PI * 2);
    ctx.strokeStyle = this.color.withAlpha(0.3).toString();
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Progress fill with color bleeding (flows like liquid)
    if (this.progress > 0) {
      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + (Math.PI * 2 * this.progress);
      
      // Create gradient for color bleeding (radial spread)
      const gradient = ctx.createRadialGradient(
        centerX, centerY, this.ringRadius - 5,
        centerX, centerY, this.ringRadius + 5
      );
      
      // Inner edge (darker - pigment pooling)
      const edgeColor = this.color.darken(0.3);
      gradient.addColorStop(0, edgeColor.withAlpha(0.8).toString());
      gradient.addColorStop(0.5, this.color.withAlpha(0.6).toString());
      gradient.addColorStop(1, this.color.withAlpha(0.2).toString());
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(centerX, centerY, this.ringRadius - 2, startAngle, endAngle);
      ctx.stroke();
      
      // Inner glow (color bleeds inward)
      const innerGradient = ctx.createRadialGradient(
        centerX, centerY, this.ringRadius - 8,
        centerX, centerY, this.ringRadius - 2
      );
      innerGradient.addColorStop(0, this.color.withAlpha(0.4).toString());
      innerGradient.addColorStop(1, this.color.withAlpha(0).toString());
      
      ctx.fillStyle = innerGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, this.ringRadius - 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Percentage text (flows with ring, liquid watermedia style)
    if (this.progress > 0.1) {
      ctx.fillStyle = this.color.toString();
      ctx.font = '16px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Add text shadow for liquid watermedia edge darkening
      ctx.shadowBlur = 3;
      ctx.shadowColor = this.color.darken(0.5).withAlpha(0.5).toString();
      
      const percentage = Math.round(this.progress * 100);
      ctx.fillText(`${percentage}%`, centerX, centerY);
      
      ctx.shadowBlur = 0;
    }
  }
}

