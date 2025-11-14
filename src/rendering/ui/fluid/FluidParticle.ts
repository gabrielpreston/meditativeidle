import { Vector2 } from '../../../types';
import { FluidField } from './FluidField';
import { Color } from './Color';
import { add, multiply } from '../../../utils/MathUtils';

/**
 * FluidParticle represents a single particle in the dissipation system.
 * Particles flow with the fluid field and gradually fade/spread,
 * creating liquid watermedia-style dissipation effects.
 */
export class FluidParticle {
  position: Vector2;
  velocity: Vector2;
  color: Color;
  size: number;
  lifetime: number;
  age: number = 0;
  
  constructor(options: {
    position: Vector2;
    velocity: Vector2;
    color: Color;
    lifetime: number;
    size?: number;
  }) {
    this.position = { ...options.position };
    this.velocity = { ...options.velocity };
    this.color = options.color.clone();
    this.lifetime = options.lifetime;
    this.size = options.size || 3;
  }
  
  /**
   * Update particle with fluid dynamics.
   * Particles flow with the field, fade, and spread.
   */
  update(deltaTime: number, fluidField: FluidField): void {
    // Flow with fluid field
    const fieldVel = fluidField.getVelocity(
      this.position.x,
      this.position.y,
      fluidField.getTime()
    );
    
    // Add field velocity (scaled down for subtle effect)
    this.velocity.x += fieldVel.x * 0.1;
    this.velocity.y += fieldVel.y * 0.1;
    
    // Update position
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    
    // Dissipate (fade and spread)
    this.age += deltaTime;
    this.size += deltaTime * 2; // Spreads out
    this.color.alpha *= (1 - deltaTime * 2); // Fades
    
    // Drag (slows down over time)
    this.velocity.x *= 0.95;
    this.velocity.y *= 0.95;
  }
  
  /**
   * Render the particle as a soft circle with gradient.
   */
  render(ctx: CanvasRenderingContext2D): void {
    if (this.age >= this.lifetime || this.color.alpha <= 0) return;
    
    // Draw as soft circle (dissipates outward)
    const gradient = ctx.createRadialGradient(
      this.position.x, this.position.y, 0,
      this.position.x, this.position.y, this.size
    );
    gradient.addColorStop(0, this.color.withAlpha(this.color.alpha * 0.8).toString());
    gradient.addColorStop(1, this.color.withAlpha(0).toString());
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  /**
   * Check if particle is expired.
   */
  isExpired(): boolean {
    return this.age >= this.lifetime || this.color.alpha <= 0;
  }
}

