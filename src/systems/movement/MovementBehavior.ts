import { Stressor, Vector2 } from '../../types';
import { SystemContext } from '../ISystem';

/**
 * MovementBehavior - Strategy pattern interface for stressor movement
 * 
 * Each stressor type uses a specific movement behavior that calculates
 * velocity based on stressor state, game context, and base speed.
 */
export interface MovementBehavior {
  /**
   * Update stressor movement for this frame
   * @param stressor - The stressor to update
   * @param deltaTime - Time since last frame (seconds)
   * @param context - System context for queries (state, center, etc.)
   * @param baseSpeed - Base speed (includes wave scaling, type modifiers)
   * @returns Updated velocity vector
   */
  update(
    stressor: Stressor,
    deltaTime: number,
    context: SystemContext,
    baseSpeed: number
  ): Vector2;
}

