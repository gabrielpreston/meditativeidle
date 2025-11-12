import { FluidUIElement } from '../fluid/FluidUIElement';
import { Color } from '../fluid/Color';
import { Vector2 } from '../../../types';
import { GameConfig } from '../../../GameConfig';
import { smoothstep } from '../../../utils/MathUtils';

/**
 * FluidPaceBadge renders pace as a painted badge/medallion.
 * The badge flows and color responds to pace intensity.
 */
export class FluidPaceBadge extends FluidUIElement {
  private pace: number = 1.0;
  
  constructor(position: Vector2) {
    const initialColor = Color.fromHex(GameConfig.COLOR_HIGH_SERENITY.accent);
    super(position, initialColor, 30);
    this.blendRadius = 50;
  }
  
  /**
   * Update pace value.
   */
  setPace(pace: number): void {
    this.pace = pace;
    // Color responds to pace (slow=calm colors, fast=intense)
    this.updateColorFromPace();
  }
  
  /**
   * Update color based on pace.
   */
  private updateColorFromPace(): void {
    const t = smoothstep(0.5, 2.0, this.pace);
    const calmColor = Color.fromHex(GameConfig.COLOR_HIGH_SERENITY.accent);
    const intenseColor = Color.fromRGB(255, 100, 100); // Reddish for high pace
    
    const targetColor = calmColor.lerp(intenseColor, t);
    this.setTargetColor(targetColor);
  }
  
  render(ctx: CanvasRenderingContext2D, time: number): void {
    // Wobble from fluid field
    const wobbleX = Math.sin(time * 0.5 + this.position.x * 0.01) * 1.5;
    const wobbleY = Math.cos(time * 0.5 + this.position.y * 0.01) * 1.5;
    const centerX = this.position.x + wobbleX;
    const centerY = this.position.y + wobbleY;
    
    // Badge circle with soft edges
    ctx.shadowBlur = 8;
    ctx.shadowColor = this.color.withAlpha(0.3).toString();
    ctx.beginPath();
    ctx.arc(centerX, centerY, this.size, 0, Math.PI * 2);
    
    // Fill with gradient (color bleeds)
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, this.size
    );
    gradient.addColorStop(0, this.color.withAlpha(0.7).toString());
    gradient.addColorStop(1, this.color.withAlpha(0.2).toString());
    
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Edge darkening
    const edgeColor = this.color.darken(0.3);
    ctx.strokeStyle = edgeColor.withAlpha(0.6).toString();
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Pace text
    ctx.fillStyle = this.color.toString();
    ctx.font = 'bold 20px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.shadowBlur = 3;
    ctx.shadowColor = edgeColor.withAlpha(0.5).toString();
    
    const paceText = `${Math.round(this.pace)}x`;
    ctx.fillText(paceText, centerX, centerY);
    
    ctx.shadowBlur = 0;
  }
}

