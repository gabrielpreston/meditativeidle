import { MovementBehavior } from './MovementBehavior';
import { Stressor, Vector2 } from '../../types';
import { SystemContext } from '../ISystem';
import { normalize, subtract, multiply } from '../../utils/MathUtils';

/**
 * TimePressureMovement - Speed boost at low Serenity
 * 
 * Used by: TimePressure
 * 
 * Behavior:
 * - Base direct movement toward center
 * - Speed increases when player Serenity is low
 * - Creates urgency as player's calm decreases
 */
export class TimePressureMovement implements MovementBehavior {
  private static readonly LOW_SERENITY_THRESHOLD = 0.3;
  private static readonly SPEED_BOOST_MULTIPLIER = 1.5;

  update(
    stressor: Stressor,
    deltaTime: number,
    context: SystemContext,
    baseSpeed: number
  ): Vector2 {
    const direction = subtract(context.center, stressor.position);
    const normalized = normalize(direction);
    
    // Speed boost at low Serenity
    const serenityRatio = context.state.serenity / context.state.maxSerenity;
    let speedMultiplier = 1.0;
    
    if (serenityRatio < TimePressureMovement.LOW_SERENITY_THRESHOLD) {
      const boostFactor = 1 - (serenityRatio / TimePressureMovement.LOW_SERENITY_THRESHOLD);
      speedMultiplier = 1.0 + (boostFactor * (TimePressureMovement.SPEED_BOOST_MULTIPLIER - 1.0));
    }
    
    return multiply(normalized, baseSpeed * speedMultiplier);
  }
}

