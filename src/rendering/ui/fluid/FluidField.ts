import { Vector2 } from '../../../types';

/**
 * FluidField generates a velocity field using simplified noise functions.
 * This drives the flowing motion of UI elements, creating a watercolor-like
 * fluid aesthetic that responds to game state.
 */
export class FluidField {
  private time: number = 0;
  private intensity: number = 1.0; // Controlled by serenity/watercolor state
  
  /**
   * Simplified Perlin-like noise using sine waves.
   * This creates smooth, organic flow patterns suitable for UI elements.
   */
  private noise(x: number, y: number, time: number): number {
    return Math.sin(x * 0.01 + time * 0.5) * 
           Math.cos(y * 0.01 + time * 0.5) * 
           Math.sin((x + y) * 0.005 + time * 0.3);
  }
  
  /**
   * Get velocity vector at a given position and time.
   * The velocity drives the flowing motion of UI elements.
   */
  getVelocity(x: number, y: number, time: number): Vector2 {
    const vx = this.noise(x, y, time);
    const vy = this.noise(x + 100, y + 100, time);
    return {
      x: vx * 20 * this.intensity,
      y: vy * 20 * this.intensity
    };
  }
  
  /**
   * Set the intensity of the fluid field.
   * Higher intensity = more pronounced flow.
   * Typically controlled by watercolor diffusionRate parameter.
   */
  setIntensity(intensity: number): void {
    this.intensity = Math.max(0, Math.min(2, intensity)); // Clamp 0-2
  }
  
  /**
   * Update the internal time counter.
   * Call this each frame to advance the fluid animation.
   */
  update(deltaTime: number): void {
    this.time += deltaTime;
  }
  
  /**
   * Get the current time value.
   */
  getTime(): number {
    return this.time;
  }
}

