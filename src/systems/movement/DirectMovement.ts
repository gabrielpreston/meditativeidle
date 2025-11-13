import { MovementBehavior } from './MovementBehavior';
import { Stressor, Vector2 } from '../../types';
import { SystemContext } from '../ISystem';
import { normalize, subtract } from '../../utils/MathUtils';

/**
 * DirectMovement - Simple direct movement toward player center
 * 
 * Used by: IntrusiveThought, Fatigue
 */
export class DirectMovement implements MovementBehavior {
  update(
    stressor: Stressor,
    deltaTime: number,
    context: SystemContext,
    baseSpeed: number
  ): Vector2 {
    const direction = subtract(context.center, stressor.position);
    const normalized = normalize(direction);
    return {
      x: normalized.x * baseSpeed,
      y: normalized.y * baseSpeed
    };
  }
}

