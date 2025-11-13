import { Stressor, Vector2 } from '../../types';

/**
 * StressorCulling - Performance optimization to skip fluid injection for non-visible/small/static stressors
 */
export class StressorCulling {
  constructor(private width: number, private height: number) {}
  
  shouldInject(stressor: Stressor, viewport?: { x: number; y: number; width: number; height: number }): boolean {
    // Use provided viewport or default to full canvas
    const vp = viewport || { x: 0, y: 0, width: this.width, height: this.height };
    
    // Viewport culling
    if (stressor.position.x < vp.x || stressor.position.x > vp.x + vp.width) return false;
    if (stressor.position.y < vp.y || stressor.position.y > vp.y + vp.height) return false;
    
    // Size culling (skip very small stressors)
    if (stressor.size < 2) return false;
    
    // Velocity culling (skip static stressors)
    const speed = Math.sqrt(stressor.velocity.x ** 2 + stressor.velocity.y ** 2);
    if (speed < 0.1) return false;
    
    return true;
  }
}

