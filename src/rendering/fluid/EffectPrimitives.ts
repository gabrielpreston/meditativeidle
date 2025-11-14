import { Vector2, RGB } from '../../types';
import { LiquidField } from './LiquidField';

/**
 * EffectPrimitives - Primitive operations for fluid effects
 * 
 * Provides simple, composable effects that can be combined
 * to create complex ability behaviors.
 */

export interface ActiveEffect {
  id: string;
  type: 'pigment' | 'flow' | 'diffusion' | 'clear';
  position: Vector2;
  radius: number;
  startTime: number;
  duration: number;
  color?: RGB;
  strength?: number;
  deltaVX?: number;
  deltaVY?: number;
  diffusionFactor?: number;
  fadeRate?: number;
}

/**
 * EffectPrimitives - Manages active effects and applies them to LiquidField
 */
export class EffectPrimitives {
  private activeEffects: Map<string, ActiveEffect> = new Map();
  private effectIdCounter: number = 0;
  private worldWidth: number;
  private worldHeight: number;
  
  constructor(worldWidth: number, worldHeight: number) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
  }
  
  /**
   * Update world dimensions (called on resize)
   */
  setWorldDimensions(width: number, height: number): void {
    this.worldWidth = width;
    this.worldHeight = height;
  }
  
  /**
   * AddPigment - Deposit dye into the fluid field
   * 
   * @param position Center position
   * @param radius Effect radius
   * @param color Pigment color
   * @param strength Pigment strength (0-1)
   * @param duration Effect duration in seconds
   * @returns Effect ID for tracking
   */
  addPigment(
    position: Vector2,
    radius: number,
    color: RGB,
    strength: number,
    duration: number
  ): string {
    const id = `pigment_${this.effectIdCounter++}`;
    const effect: ActiveEffect = {
      id,
      type: 'pigment',
      position,
      radius,
      startTime: performance.now() / 1000,
      duration,
      color,
      strength
    };
    
    this.activeEffects.set(id, effect);
    return id;
  }
  
  /**
   * ModifyFlow - Push or pull flow vectors
   * 
   * @param position Center position
   * @param radius Effect radius
   * @param deltaVX Flow change in X direction
   * @param deltaVY Flow change in Y direction
   * @param duration Effect duration in seconds
   * @returns Effect ID for tracking
   */
  modifyFlow(
    position: Vector2,
    radius: number,
    deltaVX: number,
    deltaVY: number,
    duration: number
  ): string {
    const id = `flow_${this.effectIdCounter++}`;
    const effect: ActiveEffect = {
      id,
      type: 'flow',
      position,
      radius,
      startTime: performance.now() / 1000,
      duration,
      deltaVX,
      deltaVY
    };
    
    this.activeEffects.set(id, effect);
    return id;
  }
  
  /**
   * ChangeDiffusion - Modify diffusion rate in a region
   * 
   * Note: This is a placeholder for future implementation.
   * Current LiquidField doesn't support per-region diffusion rates.
   * 
   * @param position Center position
   * @param radius Effect radius
   * @param factor Diffusion multiplier (1.0 = no change, 2.0 = double speed)
   * @param duration Effect duration in seconds
   * @returns Effect ID for tracking
   */
  changeDiffusion(
    position: Vector2,
    radius: number,
    factor: number,
    duration: number
  ): string {
    const id = `diffusion_${this.effectIdCounter++}`;
    const effect: ActiveEffect = {
      id,
      type: 'diffusion',
      position,
      radius,
      startTime: performance.now() / 1000,
      duration,
      diffusionFactor: factor
    };
    
    this.activeEffects.set(id, effect);
    return id;
  }
  
  /**
   * ClearRegion - Fade pigment in a region
   * 
   * @param position Center position
   * @param radius Effect radius
   * @param fadeRate Fade rate per second (0-1)
   * @param duration Effect duration in seconds
   * @returns Effect ID for tracking
   */
  clearRegion(
    position: Vector2,
    radius: number,
    fadeRate: number,
    duration: number
  ): string {
    const id = `clear_${this.effectIdCounter++}`;
    const effect: ActiveEffect = {
      id,
      type: 'clear',
      position,
      radius,
      startTime: performance.now() / 1000,
      duration,
      fadeRate
    };
    
    this.activeEffects.set(id, effect);
    return id;
  }
  
  /**
   * Remove an effect by ID
   */
  removeEffect(id: string): void {
    this.activeEffects.delete(id);
  }
  
  /**
   * Update and apply all active effects to the fluid field
   * Call this every frame
   */
  update(field: LiquidField, deltaTime: number): void {
    const currentTime = performance.now() / 1000;
    const effectsToRemove: string[] = [];
    
    for (const [id, effect] of this.activeEffects.entries()) {
      const elapsed = currentTime - effect.startTime;
      
      if (elapsed >= effect.duration) {
        effectsToRemove.push(id);
        continue;
      }
      
      // Calculate strength based on remaining duration (optional fade-out)
      const timeRemaining = effect.duration - elapsed;
      const strengthMultiplier = Math.min(1, timeRemaining / effect.duration);
      
      switch (effect.type) {
        case 'pigment':
          if (effect.color && effect.strength !== undefined) {
            field.addPigment(
              effect.position,
              effect.radius,
              effect.color,
              effect.strength * strengthMultiplier,
              this.worldWidth,
              this.worldHeight
            );
          }
          break;
          
        case 'flow':
          if (effect.deltaVX !== undefined && effect.deltaVY !== undefined) {
            field.modifyFlow(
              effect.position,
              effect.radius,
              effect.deltaVX * strengthMultiplier,
              effect.deltaVY * strengthMultiplier,
              this.worldWidth,
              this.worldHeight
            );
          }
          break;
          
        case 'diffusion':
          // Placeholder - not yet implemented in LiquidField
          // Could store per-cell diffusion rates in future
          break;
          
        case 'clear':
          if (effect.fadeRate !== undefined) {
            field.clearRegion(
              effect.position,
              effect.radius,
              effect.fadeRate * strengthMultiplier * deltaTime,
              this.worldWidth,
              this.worldHeight
            );
          }
          break;
      }
    }
    
    // Remove expired effects
    for (const id of effectsToRemove) {
      this.activeEffects.delete(id);
    }
  }
  
  /**
   * Get all active effects
   */
  getActiveEffects(): ActiveEffect[] {
    return Array.from(this.activeEffects.values());
  }
  
  /**
   * Clear all effects
   */
  clearAll(): void {
    this.activeEffects.clear();
  }
}

