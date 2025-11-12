import { FluidUIElement } from '../fluid/FluidUIElement';
import { Color } from '../fluid/Color';
import { Vector2 } from '../../../types';
import { GameConfig } from '../../../GameConfig';

/**
 * FluidAffirmField renders the Affirm ability indicator as a flowing energy field/pool.
 * When active, it fills like spreading paint with strong edge darkening.
 */
export class FluidAffirmField extends FluidUIElement {
  private isActive: boolean = false;
  private progress: number = 0; // 0-1 for active time or cooldown
  
  constructor(position: Vector2) {
    const initialColor = Color.fromHex(GameConfig.COLOR_HIGH_SERENITY.gold);
    super(position, initialColor, 75);
    this.blendRadius = 100;
  }
  
  /**
   * Update state (active/cooldown) and progress.
   */
  updateState(isActive: boolean, progress: number): void {
    this.isActive = isActive;
    this.progress = Math.max(0, Math.min(1, progress));
    
    if (isActive) {
      // Gold color with strong saturation when active
      const goldColor = Color.fromHex(GameConfig.COLOR_HIGH_SERENITY.gold);
      this.setTargetColor(goldColor.saturate(0.2));
      this.setTargetOpacity(0.9);
    } else {
      // Muted gray when on cooldown
      const mutedColor = Color.fromRGB(100, 100, 100);
      this.setTargetColor(mutedColor);
      this.setTargetOpacity(0.6);
    }
  }
  
  render(ctx: CanvasRenderingContext2D, time: number): void {
    // Wobble from fluid field
    const wobbleX = Math.sin(time * 0.5 + this.position.x * 0.01) * 2;
    const wobbleY = Math.cos(time * 0.5 + this.position.y * 0.01) * 2;
    const centerX = this.position.x + wobbleX;
    const centerY = this.position.y + wobbleY;
    
    const width = 150;
    const height = 12;
    
    // Background (flows)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(centerX - width / 2, centerY - height / 2, width, height);
    
    // Progress fill (flows like spreading paint)
    if (this.progress > 0) {
      const fillWidth = width * this.progress;
      
      // Create gradient for color bleeding
      const gradient = ctx.createLinearGradient(
        centerX - width / 2, centerY,
        centerX - width / 2 + fillWidth, centerY
      );
      
      if (this.isActive) {
        // Active: gold with pulsing highlight
        const pulse = 1 + Math.sin(time * 0.01) * 0.1;
        gradient.addColorStop(0, this.color.withAlpha(0.9).toString());
        gradient.addColorStop(0.5, this.color.withAlpha(0.7 * pulse).toString());
        gradient.addColorStop(1, this.color.withAlpha(0.5).toString());
      } else {
        // Cooldown: muted gray
        gradient.addColorStop(0, this.color.withAlpha(0.6).toString());
        gradient.addColorStop(1, this.color.withAlpha(0.4).toString());
      }
      
      ctx.fillStyle = gradient;
      ctx.fillRect(centerX - width / 2, centerY - height / 2, fillWidth, height);
      
      // Edge darkening at progress boundary (pigment pooling)
      if (this.isActive) {
        const edgeGradient = ctx.createLinearGradient(
          centerX - width / 2 + fillWidth - 3, centerY,
          centerX - width / 2 + fillWidth + 3, centerY
        );
        edgeGradient.addColorStop(0, this.color.darken(0.4).withAlpha(0.8).toString());
        edgeGradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = edgeGradient;
        ctx.fillRect(centerX - width / 2 + fillWidth - 3, centerY - height / 2, 6, height);
      }
    }
    
    // Border (flows with field)
    const borderColor = this.isActive ? this.color : Color.fromRGB(255, 255, 255);
    ctx.strokeStyle = borderColor.withAlpha(0.5).toString();
    ctx.lineWidth = this.isActive ? 2 : 1;
    ctx.strokeRect(centerX - width / 2, centerY - height / 2, width, height);
    
    // Label text
    ctx.fillStyle = this.color.toString();
    ctx.font = this.isActive ? 'bold 13px serif' : '12px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    ctx.shadowBlur = 2;
    ctx.shadowColor = this.color.darken(0.3).withAlpha(0.5).toString();
    
    if (this.isActive) {
      const timeRemaining = this.progress * GameConfig.AFFIRM_DURATION;
      ctx.fillText(`AFFIRM ACTIVE: ${timeRemaining.toFixed(1)}s`, centerX, centerY - 18);
    } else {
      const cooldownRemaining = this.progress * GameConfig.AFFIRM_COOLDOWN;
      ctx.fillText(`Affirm: ${cooldownRemaining.toFixed(1)}s`, centerX, centerY - 16);
    }
    
    ctx.shadowBlur = 0;
  }
}

