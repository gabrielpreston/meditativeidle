import { FluidUIElement } from '../fluid/FluidUIElement';
import { Color } from '../fluid/Color';
import { Vector2 } from '../../../types';
import { FluidParticle } from '../fluid/FluidParticle';

/**
 * FluidReflectionScreen renders the game over reflection screen with watercolor effects.
 * The screen fades in with dissipation effects, and text flows like liquid paint.
 */
export class FluidReflectionScreen extends FluidUIElement {
  private duration: number = 0;
  private wave: number = 0;
  private insight: number = 0;
  private fadeInProgress: number = 0;
  private isVisible: boolean = false;
  private particles: FluidParticle[] = [];
  private time: number = 0;
  private width: number = 0;
  private height: number = 0;
  
  constructor(position: Vector2) {
    const initialColor = Color.fromRGB(255, 255, 255, 0.9);
    super(position, initialColor, 0);
    this.blendRadius = 0;
    this.setTargetOpacity(0);
  }
  
  /**
   * Show the reflection screen with fade-in effect.
   */
  show(duration: number, wave: number, insight: number): void {
    this.duration = duration;
    this.wave = wave;
    this.insight = insight;
    this.isVisible = true;
    this.fadeInProgress = 0;
    this.setTargetOpacity(1.0);
    
    // Create dissipation particles
    this.createDissipationParticles();
  }
  
  /**
   * Hide the reflection screen.
   */
  hide(): void {
    this.isVisible = false;
    this.setTargetOpacity(0);
    this.particles = [];
  }
  
  /**
   * Create particles for dissipation effect.
   */
  private createDissipationParticles(): void {
    this.particles = [];
    const particleCount = 50;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = 30 + Math.random() * 50;
      const offset = Math.random() * 200;
      
      this.particles.push(new FluidParticle({
        position: {
          x: this.position.x + Math.cos(angle) * offset,
          y: this.position.y + Math.sin(angle) * offset
        },
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed
        },
        color: Color.fromRGB(255, 255, 255, 0.8),
        lifetime: 2.0,
        size: 5 + Math.random() * 10
      }));
    }
  }
  
  /**
   * Update with fluid dynamics.
   */
  update(deltaTime: number, fluidField: any, nearbyElements: FluidUIElement[]): void {
    super.update(deltaTime, fluidField, nearbyElements);
    
    this.time += deltaTime;
    
    // Update fade-in progress
    if (this.isVisible) {
      this.fadeInProgress = Math.min(1, this.fadeInProgress + deltaTime * 2);
    }
    
    // Update particles
    this.particles = this.particles.filter(p => {
      p.update(deltaTime, fluidField);
      return !p.isExpired();
    });
  }
  
  render(ctx: CanvasRenderingContext2D, time: number): void {
    if (!this.isVisible || this.opacity <= 0) return;
    
    // Render particles first (dissipation effect)
    for (const particle of this.particles) {
      particle.render(ctx);
    }
    
    // Background fade (flows like paint spreading)
    const fadeAlpha = this.opacity * this.fadeInProgress;
    ctx.fillStyle = this.color.withAlpha(fadeAlpha).toString();
    ctx.fillRect(0, 0, this.width, this.height);
    
    // Add flowing background pattern (like watercolor wash)
    const gradient = ctx.createRadialGradient(
      this.position.x, this.position.y, 0,
      this.position.x, this.position.y, Math.max(this.width, this.height)
    );
    
    const wobbleX = Math.sin(time * 0.1) * 50;
    const wobbleY = Math.cos(time * 0.1) * 50;
    
    gradient.addColorStop(0, Color.fromRGB(255, 255, 255)
      .withAlpha(0.3 * fadeAlpha).toString());
    gradient.addColorStop(0.5, Color.fromRGB(240, 240, 255)
      .withAlpha(0.2 * fadeAlpha).toString());
    gradient.addColorStop(1, Color.fromRGB(255, 255, 255)
      .withAlpha(0.1 * fadeAlpha).toString());
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);
    
    const centerY = this.height / 2;
    const centerX = this.width / 2;
    
    // Title with watercolor effect (flows)
    const titleWobbleX = Math.sin(time * 0.05) * 2;
    const titleWobbleY = Math.cos(time * 0.05) * 2;
    
    ctx.fillStyle = Color.fromRGB(51, 51, 51)
      .withAlpha(fadeAlpha).toString();
    ctx.font = 'bold 48px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Text shadow for edge darkening
    ctx.shadowBlur = 8;
    ctx.shadowColor = Color.fromRGB(0, 0, 0)
      .withAlpha(0.3 * fadeAlpha).toString();
    
    ctx.fillText(
      'You drifted, but you return wiser.',
      centerX + titleWobbleX,
      centerY - 100 + titleWobbleY
    );
    
    ctx.shadowBlur = 0;
    
    // Stats with flowing effect
    ctx.font = '24px serif';
    const minutes = Math.floor(this.duration / 60);
    const seconds = Math.floor(this.duration % 60);
    
    const statsWobbleX = Math.sin(time * 0.03 + 1) * 1;
    const statsWobbleY = Math.cos(time * 0.03 + 1) * 1;
    
    ctx.fillText(
      `Duration: ${minutes}:${seconds.toString().padStart(2, '0')}`,
      centerX + statsWobbleX,
      centerY + statsWobbleY
    );
    
    ctx.fillText(
      `Wave Reached: ${this.wave}`,
      centerX + statsWobbleX,
      centerY + 40 + statsWobbleY
    );
    
    ctx.fillText(
      `Insight Gained: ${this.insight.toFixed(0)}`,
      centerX + statsWobbleX,
      centerY + 80 + statsWobbleY
    );
    
    // Restart hint (pulses)
    const pulse = 1 + Math.sin(time * 0.01) * 0.1;
    ctx.font = '18px serif';
    ctx.fillStyle = Color.fromRGB(102, 102, 102)
      .withAlpha(pulse * fadeAlpha).toString();
    
    ctx.fillText(
      'Press SPACE or click to restart',
      centerX,
      centerY + 140
    );
  }
  
  /**
   * Set dimensions for rendering.
   */
  setDimensions(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }
}

