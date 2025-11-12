import { FluidUIElement } from '../fluid/FluidUIElement';
import { Color } from '../fluid/Color';
import { Vector2 } from '../../../types';
import { smoothstep } from '../../../utils/MathUtils';

/**
 * FluidSerenityPool renders serenity/health as an organic droplet/pool shape.
 * The pool flows and morphs like spilled paint, with color transitions
 * that blend like watercolor (green → yellow → red).
 */
export class FluidSerenityPool extends FluidUIElement {
  private serenityRatio: number = 1.0;
  private poolShape: Vector2[] = [];
  private readonly numPoints: number = 16;
  
  constructor(position: Vector2) {
    // Start with green (high serenity)
    const initialColor = Color.fromRGB(76, 175, 80);
    super(position, initialColor, 50);
    this.blendRadius = 120;
    
    // Initialize pool shape points
    this.updatePoolShape();
  }
  
  /**
   * Update serenity ratio (0-1).
   */
  setSerenityRatio(ratio: number): void {
    this.serenityRatio = Math.max(0, Math.min(1, ratio));
    this.updatePoolShape();
    this.updateColorFromSerenity();
  }
  
  /**
   * Update pool shape to create organic, flowing blob.
   */
  private updatePoolShape(): void {
    this.poolShape = [];
    const baseRadius = 30 + (this.serenityRatio * 40); // 30-70px radius
    
    for (let i = 0; i < this.numPoints; i++) {
      const angle = (i / this.numPoints) * Math.PI * 2;
      // Add wobble for organic shape
      const wobble = Math.sin(angle * 3 + Date.now() * 0.001) * 5;
      this.poolShape.push({
        x: Math.cos(angle) * (baseRadius + wobble),
        y: Math.sin(angle) * (baseRadius + wobble)
      });
    }
  }
  
  /**
   * Update color based on serenity (flows between colors).
   */
  private updateColorFromSerenity(): void {
    const highColor = Color.fromRGB(76, 175, 80);   // Green
    const midColor = Color.fromRGB(255, 193, 7);    // Yellow
    const lowColor = Color.fromRGB(244, 67, 54);    // Red
    
    let targetColor: Color;
    if (this.serenityRatio > 0.7) {
      targetColor = highColor;
    } else if (this.serenityRatio > 0.4) {
      const t = (this.serenityRatio - 0.4) / 0.3;
      targetColor = midColor.lerp(highColor, t);
    } else {
      const t = this.serenityRatio / 0.4;
      targetColor = lowColor.lerp(midColor, t);
    }
    
    this.setTargetColor(targetColor);
  }
  
  /**
   * Override update to morph pool shape.
   */
  update(deltaTime: number, fluidField: any, nearbyElements: FluidUIElement[]): void {
    super.update(deltaTime, fluidField, nearbyElements);
    
    // Pool shape flows and morphs
    this.updatePoolShape();
  }
  
  render(ctx: CanvasRenderingContext2D, time: number): void {
    // Draw organic blob using quadratic curves for smooth, flowing shape
    ctx.beginPath();
    
    const startPoint = this.poolShape[0];
    ctx.moveTo(
      this.position.x + startPoint.x,
      this.position.y + startPoint.y
    );
    
    for (let i = 0; i < this.poolShape.length; i++) {
      const point = this.poolShape[i];
      const nextPoint = this.poolShape[(i + 1) % this.poolShape.length];
      
      // Use quadratic curves for smooth, organic shape
      const cpX = (point.x + nextPoint.x) / 2;
      const cpY = (point.y + nextPoint.y) / 2;
      
      ctx.quadraticCurveTo(
        this.position.x + point.x,
        this.position.y + point.y,
        this.position.x + cpX,
        this.position.y + cpY
      );
    }
    ctx.closePath();
    
    // Fill with gradient (color bleeds outward)
    const gradient = ctx.createRadialGradient(
      this.position.x, this.position.y, 0,
      this.position.x, this.position.y, 100
    );
    
    gradient.addColorStop(0, this.color.withAlpha(0.8).toString());
    gradient.addColorStop(0.5, this.color.withAlpha(0.4).toString());
    gradient.addColorStop(1, this.color.withAlpha(0.1).toString());
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Edge darkening (pigment pooling at edges)
    const edgeColor = this.color.darken(0.3);
    ctx.strokeStyle = edgeColor.withAlpha(0.6).toString();
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Percentage text in center
    ctx.fillStyle = this.color.toString();
    ctx.font = 'bold 14px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Text shadow for watercolor effect
    ctx.shadowBlur = 2;
    ctx.shadowColor = edgeColor.withAlpha(0.5).toString();
    
    const percentage = Math.round(this.serenityRatio * 100);
    ctx.fillText(`${percentage}%`, this.position.x, this.position.y);
    
    ctx.shadowBlur = 0;
  }
}

