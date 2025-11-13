import { Vector2, RGB } from '../../types';
import { FluidSim } from './FluidSim';

export interface RippleConfig {
  position: Vector2;
  color?: RGB;  // Optional: if provided, injects dye; if not, just velocity
  initialRadius: number;  // Starting radius of the ripple
  maxRadius: number;  // Maximum expansion radius
  speed: number;  // Expansion speed (pixels per second)
  velocityStrength: number;  // How strong the outward push is
  dyeStrength?: number;  // Optional dye injection strength
  layerId?: string;  // Which fluid layer to affect
  waveFrequency?: number;  // Optional: override default wave frequency
  waveAmplitude?: number;  // Optional: override default wave amplitude
}

export interface ActiveRipple {
  config: RippleConfig;
  currentRadius: number;
  age: number;
  lifetime: number;
}

export class RippleSystem {
  private ripples: ActiveRipple[] = [];
  private fluid: FluidSim;
  
  constructor(fluid: FluidSim) {
    this.fluid = fluid;
  }
  
  /**
   * Create a new ripple at the specified position
   */
  createRipple(config: RippleConfig): void {
    const lifetime = (config.maxRadius - config.initialRadius) / config.speed;
    this.ripples.push({
      config,
      currentRadius: config.initialRadius,
      age: 0,
      lifetime
    });
  }
  
  /**
   * Update all active ripples and inject velocity/dye
   */
  update(deltaTime: number): void {
    this.ripples = this.ripples.filter(ripple => {
      ripple.age += deltaTime;
      ripple.currentRadius += ripple.config.speed * deltaTime;
      
      // Remove if fully expanded
      if (ripple.currentRadius >= ripple.config.maxRadius) {
        return false;
      }
      
      // Inject ripple effect into fluid
      this.injectRipple(ripple, deltaTime);
      
      return true;
    });
  }
  
  /**
   * Inject velocity and dye for a single ripple using enhanced shader
   */
  private injectRipple(ripple: ActiveRipple, deltaTime: number): void {
    const { config, currentRadius } = ripple;
    const progress = (currentRadius - config.initialRadius) / 
                     (config.maxRadius - config.initialRadius);
    
    // Calculate ripple properties based on progress
    // Ripples are strongest at the leading edge and fade behind
    const edgeStrength = 1.0 - progress * 0.7; // Fade as it expands
    const ringWidth = config.initialRadius * 0.3; // Width of the ripple ring
    
    // Use enhanced ripple shader for velocity injection
    const velocityStrength = config.velocityStrength * edgeStrength;
    
    // Calculate wave properties
    const waveFrequency = config.waveFrequency ?? (8.0 + progress * 4.0);
    const waveAmplitude = config.waveAmplitude ?? (0.15 * (1.0 - progress * 0.5));
    
    // Inject ripple velocity using enhanced shader
    this.fluid.injectRippleVelocity(
      config.position.x,
      config.position.y,
      currentRadius,
      ringWidth,
      velocityStrength,
      waveFrequency,
      waveAmplitude
    );
    
    // Optionally inject dye if color is provided
    if (config.color && config.dyeStrength) {
      const dyeStrength = (config.dyeStrength || 1.0) * edgeStrength * 0.5;
      
      // Sample points around the ripple for dye injection
      // Fewer points needed since velocity is handled by shader
      const numPoints = Math.max(12, Math.floor(currentRadius * 0.08));
      const angleStep = (Math.PI * 2) / numPoints;
      
      for (let i = 0; i < numPoints; i++) {
        const angle = i * angleStep;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        
        const ringPosition: Vector2 = {
          x: config.position.x + cos * currentRadius,
          y: config.position.y + sin * currentRadius
        };
        
        const dyeRadius = ringWidth * 0.5;
        
        this.fluid.injectDyeEnhanced({
          position: ringPosition,
          color: config.color,
          strength: dyeStrength,
          radius: dyeRadius,
          diffusionRate: 0.85,
          viscosity: 0.3,
          temperature: 0.8,
          lifetime: 2.0,
          layerId: config.layerId || 'ripple',
          dissipation: 0.98
        });
      }
    }
    
    // Also inject at the center for initial impact (only when ripple is small)
    if (currentRadius <= config.initialRadius * 2) {
      if (config.color && config.dyeStrength) {
        this.fluid.injectDyeEnhanced({
          position: config.position,
          color: config.color,
          strength: (config.dyeStrength || 1.0) * (1 - progress),
          radius: config.initialRadius,
          diffusionRate: 0.9,
          viscosity: 0.2,
          temperature: 1.0,
          lifetime: 3.0,
          layerId: config.layerId || 'ripple',
          dissipation: 0.97
        });
      }
    }
  }
  
  /**
   * Clear all active ripples
   */
  clear(): void {
    this.ripples = [];
  }
  
  /**
   * Get count of active ripples
   */
  getActiveCount(): number {
    return this.ripples.length;
  }
}

