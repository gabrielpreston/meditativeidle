import { FluidUIElement } from '../fluid/FluidUIElement';
import { Color } from '../fluid/Color';
import { Vector2 } from '../../../types';
import { GameConfig } from '../../../GameConfig';

/**
 * FluidInsightCrystal renders insight as an organic crystalline shape.
 * The crystal pulses and flows, with color bleeding from edges.
 */
export class FluidInsightCrystal extends FluidUIElement {
  private insight: number = 0;
  private readonly numPoints: number = 6;
  
  constructor(position: Vector2) {
    const initialColor = Color.fromHex(GameConfig.COLOR_HIGH_SERENITY.gold);
    super(position, initialColor, 20);
    this.blendRadius = 50;
  }
  
  /**
   * Update insight value.
   */
  setInsight(insight: number): void {
    this.insight = insight;
    // Pulse size based on insight
    if (insight > 0) {
      const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.2;
      this.setTargetSize(20 * pulse);
    } else {
      this.setTargetSize(0);
    }
  }
  
  /**
   * Get crystalline shape points (organic hexagon).
   */
  private getCrystalPoints(time: number): Vector2[] {
    const points: Vector2[] = [];
    const baseSize = this.size;
    const pulse = 1 + Math.sin(time * 0.01) * 0.2;
    
    for (let i = 0; i < this.numPoints; i++) {
      const angle = (i / this.numPoints) * Math.PI * 2;
      // Add wobble for organic shape
      const wobble = Math.sin(angle * 2 + time * 0.005) * 2;
      points.push({
        x: Math.cos(angle) * (baseSize * pulse + wobble),
        y: Math.sin(angle) * (baseSize * pulse + wobble)
      });
    }
    
    return points;
  }
  
  render(ctx: CanvasRenderingContext2D, time: number): void {
    if (this.insight <= 0) return;
    
    // Wobble from fluid field
    const wobble = {
      x: Math.sin(time * 0.5 + this.position.x * 0.01) * 1,
      y: Math.cos(time * 0.5 + this.position.y * 0.01) * 1
    };
    const centerX = this.position.x + wobble.x;
    const centerY = this.position.y + wobble.y;
    
    // Get crystalline shape
    const points = this.getCrystalPoints(time);
    
    // Draw crystalline shape
    ctx.beginPath();
    const startPoint = points[0];
    ctx.moveTo(centerX + startPoint.x, centerY + startPoint.y);
    
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(centerX + points[i].x, centerY + points[i].y);
    }
    ctx.closePath();
    
    // Fill with gradient (color bleeds from center)
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, this.size * 1.5
    );
    gradient.addColorStop(0, this.color.withAlpha(0.9).toString());
    gradient.addColorStop(0.7, this.color.withAlpha(0.5).toString());
    gradient.addColorStop(1, this.color.withAlpha(0.1).toString());
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Edge darkening (pigment pooling)
    const edgeColor = this.color.darken(0.3);
    ctx.strokeStyle = edgeColor.withAlpha(0.8).toString();
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Insight value text
    ctx.fillStyle = this.color.toString();
    ctx.font = 'bold 16px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.shadowBlur = 3;
    ctx.shadowColor = edgeColor.withAlpha(0.5).toString();
    
    ctx.fillText(`${Math.round(this.insight)}`, centerX, centerY);
    
    ctx.shadowBlur = 0;
  }
}

