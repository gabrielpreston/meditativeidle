import { FluidUIElement } from '../fluid/FluidUIElement';
import { Color } from '../fluid/Color';
import { Vector2 } from '../../../types';
import { GameConfig } from '../../../GameConfig';
import { smoothstep } from '../../../utils/MathUtils';

/**
 * FluidWaveNumber renders the wave number with liquid watermedia-style effects.
 * The number flows and has decorative organic borders that bleed color.
 */
export class FluidWaveNumber extends FluidUIElement {
  private waveNumber: number = 1;
  
  constructor(position: Vector2) {
    const initialColor = Color.fromHex(GameConfig.COLOR_HIGH_SERENITY.accent);
    super(position, initialColor, 40);
    this.blendRadius = 60;
  }
  
  /**
   * Update wave number.
   */
  setWaveNumber(wave: number): void {
    this.waveNumber = wave;
  }
  
  /**
   * Update color based on serenity ratio.
   */
  updateColorFromSerenity(serenityRatio: number): void {
    const t = smoothstep(0.3, 0.7, serenityRatio);
    const high = GameConfig.COLOR_HIGH_SERENITY;
    const low = GameConfig.COLOR_LOW_SERENITY;
    
    const highColor = Color.fromHex(high.accent);
    const lowColor = Color.fromHex(low.accent);
    const targetColor = highColor.lerp(lowColor, 1 - t);
    
    this.setTargetColor(targetColor);
  }
  
  render(ctx: CanvasRenderingContext2D, time: number): void {
    // Wobble from fluid field
    const wobbleX = Math.sin(time * 0.5 + this.position.x * 0.01) * 1;
    const wobbleY = Math.cos(time * 0.5 + this.position.y * 0.01) * 1;
    const centerX = this.position.x + wobbleX;
    const centerY = this.position.y + wobbleY;
    
    // Decorative organic border (flows around number)
    const borderRadius = 35;
    ctx.beginPath();
    ctx.arc(centerX, centerY, borderRadius, 0, Math.PI * 2);
    
    // Border with color bleeding
    const borderGradient = ctx.createRadialGradient(
      centerX, centerY, borderRadius - 3,
      centerX, centerY, borderRadius + 3
    );
    borderGradient.addColorStop(0, this.color.withAlpha(0.6).toString());
    borderGradient.addColorStop(1, this.color.withAlpha(0.1).toString());
    
    ctx.strokeStyle = borderGradient;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Wave number text (large, liquid watermedia style)
    ctx.fillStyle = this.color.toString();
    ctx.font = 'bold 20px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Text shadow for edge darkening
    ctx.shadowBlur = 4;
    ctx.shadowColor = this.color.darken(0.4).withAlpha(0.6).toString();
    
    ctx.fillText(`${this.waveNumber}`, centerX, centerY);
    
    ctx.shadowBlur = 0;
  }
}

