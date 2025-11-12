import { FluidUIElement } from '../fluid/FluidUIElement';
import { Color } from '../fluid/Color';
import { Vector2 } from '../../../types';
import { FluidParticle } from '../fluid/FluidParticle';

/**
 * FluidAbilityButton renders a single ability upgrade button.
 * Buttons flow, blend colors on hover, and create ripple effects on click.
 */
export class FluidAbilityButton extends FluidUIElement {
  public readonly abilityName: string;
  private level: number;
  private cost: number;
  private canAfford: boolean;
  private isMaxLevel: boolean;
  private isHovered: boolean = false;
  private buttonColor: Color;
  
  constructor(
    position: Vector2,
    abilityName: string,
    level: number,
    cost: number,
    canAfford: boolean,
    isMaxLevel: boolean,
    buttonColorHex: string
  ) {
    const initialColor = Color.fromHex(buttonColorHex);
    super(position, initialColor, 30);
    this.abilityName = abilityName;
    this.level = level;
    this.cost = cost;
    this.canAfford = canAfford;
    this.isMaxLevel = isMaxLevel;
    this.buttonColor = initialColor.clone();
    this.blendRadius = 60;
  }
  
  /**
   * Update button state.
   */
  updateState(level: number, cost: number, canAfford: boolean, isMaxLevel: boolean): void {
    this.level = level;
    this.cost = cost;
    this.canAfford = canAfford;
    this.isMaxLevel = isMaxLevel;
  }
  
  /**
   * Set hover state (triggers color bleeding).
   */
  setHovered(hovered: boolean): void {
    this.isHovered = hovered;
    if (hovered && this.canAfford && !this.isMaxLevel) {
      // Color intensifies and bleeds outward
      this.setTargetSize(this.size * 1.2);
      this.blendRadius *= 1.5;
      this.setTargetColor(this.buttonColor.saturate(0.2));
    } else {
      this.setTargetSize(30);
      this.blendRadius = 60;
      this.setTargetColor(this.buttonColor.clone());
    }
  }
  
  /**
   * Create ripple particles for click feedback.
   */
  createRippleParticles(): FluidParticle[] {
    const particles: FluidParticle[] = [];
    const particleCount = 20;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = 50 + Math.random() * 30;
      particles.push(new FluidParticle({
        position: { ...this.position },
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed
        },
        color: this.color.clone(),
        lifetime: 0.5,
        size: 3
      }));
    }
    
    return particles;
  }
  
  render(ctx: CanvasRenderingContext2D, time: number): void {
    // Wobble from fluid field
    const wobbleX = Math.sin(time * 0.5 + this.position.x * 0.01) * 1;
    const wobbleY = Math.cos(time * 0.5 + this.position.y * 0.01) * 1;
    const centerX = this.position.x + wobbleX;
    const centerY = this.position.y + wobbleY;
    
    // Outer glow (dissipates outward, stronger on hover)
    const glowRadius = this.size * (this.isHovered ? 2.0 : 1.5);
    const glowGradient = ctx.createRadialGradient(
      centerX, centerY, this.size,
      centerX, centerY, glowRadius
    );
    glowGradient.addColorStop(0, this.color.withAlpha(0.3).toString());
    glowGradient.addColorStop(1, this.color.withAlpha(0).toString());
    
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Main circle
    ctx.fillStyle = this.color.withAlpha(this.canAfford && !this.isMaxLevel ? 0.6 : 0.3).toString();
    ctx.beginPath();
    ctx.arc(centerX, centerY, this.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Edge darkening (pigment pooling)
    const edgeColor = this.color.darken(0.4);
    ctx.strokeStyle = edgeColor.withAlpha(0.8).toString();
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Level rings (concentric, flow outward)
    for (let i = 0; i < this.level; i++) {
      const ringRadius = this.size + (i * 3);
      ctx.beginPath();
      ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
      ctx.strokeStyle = this.color.withAlpha(0.2 / (i + 1)).toString();
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    
    // Text (flows with button)
    const textColor = this.canAfford && !this.isMaxLevel ? this.color : Color.fromRGB(255, 255, 255);
    ctx.fillStyle = textColor.withAlpha(0.9).toString();
    ctx.font = 'bold 12px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.shadowBlur = 2;
    ctx.shadowColor = edgeColor.withAlpha(0.5).toString();
    
    // Ability name
    ctx.fillText(this.abilityName, centerX, centerY - 5);
    
    // Level
    ctx.font = '10px serif';
    ctx.fillText(`Lv.${this.level}`, centerX, centerY + 8);
    
    // Cost or MAX
    if (this.isMaxLevel) {
      ctx.fillStyle = textColor.withAlpha(0.5).toString();
      ctx.font = '9px serif';
      ctx.fillText('MAX', centerX, centerY + 18);
    } else {
      const costColor = this.canAfford ? Color.fromHex('#FFD700') : textColor;
      ctx.fillStyle = costColor.withAlpha(this.canAfford ? 0.9 : 0.4).toString();
      ctx.font = '9px serif';
      ctx.fillText(`${this.cost}`, centerX, centerY + 18);
    }
    
    ctx.shadowBlur = 0;
  }
  
  /**
   * Check if point is inside button (for hit testing).
   */
  containsPoint(point: Vector2): boolean {
    const dx = point.x - this.position.x;
    const dy = point.y - this.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist <= this.size + this.blendRadius * 0.5; // Account for blend radius
  }
}

