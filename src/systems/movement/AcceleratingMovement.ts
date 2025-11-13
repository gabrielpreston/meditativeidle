import { MovementBehavior } from './MovementBehavior';
import { Stressor, Vector2 } from '../../types';
import { SystemContext } from '../ISystem';
import { normalize, subtract, multiply } from '../../utils/MathUtils';

/**
 * AcceleratingMovement - Cascading acceleration behavior
 * 
 * Used by: Overwhelm
 * 
 * Behavior:
 * - Starts slow, accelerates as it approaches
 * - Speed increases exponentially based on distance to center
 * - Creates cascading effect when multiple stressors are present
 */
export class AcceleratingMovement implements MovementBehavior {
  private static readonly MIN_SPEED_MULTIPLIER = 0.5;
  private static readonly MAX_SPEED_MULTIPLIER = 2.5;
  private static readonly ACCELERATION_DISTANCE = 200; // Distance at which acceleration starts

  update(
    stressor: Stressor,
    deltaTime: number,
    context: SystemContext,
    baseSpeed: number
  ): Vector2 {
    const direction = subtract(context.center, stressor.position);
    const dist = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
    
    // Calculate speed multiplier based on distance
    // Closer = faster (inverse relationship)
    let speedMultiplier = AcceleratingMovement.MIN_SPEED_MULTIPLIER;
    
    if (dist < AcceleratingMovement.ACCELERATION_DISTANCE) {
      // Accelerate as we get closer
      const accelerationFactor = 1 - (dist / AcceleratingMovement.ACCELERATION_DISTANCE);
      speedMultiplier = AcceleratingMovement.MIN_SPEED_MULTIPLIER + 
        (accelerationFactor * (AcceleratingMovement.MAX_SPEED_MULTIPLIER - AcceleratingMovement.MIN_SPEED_MULTIPLIER));
    }
    
    // Cascade effect: speed up if other Overwhelm stressors are nearby
    const nearbyOverwhelm = context.getStressors().filter(s => 
      s.type === stressor.type && 
      s.id !== stressor.id &&
      Math.sqrt(Math.pow(s.position.x - stressor.position.x, 2) + 
                Math.pow(s.position.y - stressor.position.y, 2)) < 100
    );
    
    if (nearbyOverwhelm.length > 0) {
      speedMultiplier *= 1 + (nearbyOverwhelm.length * 0.15); // 15% per nearby stressor
    }
    
    const normalized = normalize(direction);
    return multiply(normalized, baseSpeed * speedMultiplier);
  }
}

