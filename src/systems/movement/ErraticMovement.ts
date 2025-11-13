import { MovementBehavior } from './MovementBehavior';
import { Stressor, Vector2 } from '../../types';
import { SystemContext } from '../ISystem';
import { normalize, subtract, multiply, add } from '../../utils/MathUtils';

/**
 * ErraticMovement - Hesitation and retreat behavior
 * 
 * Used by: SelfDoubt
 * 
 * Behavior:
 * - Moves toward player, but periodically hesitates
 * - When hit, retreats briefly before resuming approach
 * - Hesitation creates irregular movement pattern
 */
export class ErraticMovement implements MovementBehavior {
  private static readonly HESITATION_INTERVAL = 1.5; // seconds
  private static readonly HESITATION_DURATION = 0.4; // seconds
  private static readonly RETREAT_DURATION = 0.8; // seconds
  private static readonly RETREAT_SPEED_MULTIPLIER = 0.6;

  update(
    stressor: Stressor,
    deltaTime: number,
    context: SystemContext,
    baseSpeed: number
  ): Vector2 {
    // Use wave timer as proxy for game time
    const currentTime = context.state.waveTimer;
    const timeSinceSpawn = currentTime - stressor.spawnTime;
    
    // Check if in retreat state
    if (stressor.retreatState && stressor.retreatState.endTime > currentTime) {
      // Retreat: move away from center
      const direction = subtract(stressor.position, context.center);
      const normalized = normalize(direction);
      return multiply(normalized, baseSpeed * ErraticMovement.RETREAT_SPEED_MULTIPLIER);
    }
    
    // Check for hesitation (periodic pauses)
    const hesitationCycle = Math.floor(timeSinceSpawn / ErraticMovement.HESITATION_INTERVAL);
    const timeInCycle = timeSinceSpawn % ErraticMovement.HESITATION_INTERVAL;
    
    if (timeInCycle < ErraticMovement.HESITATION_DURATION) {
      // Hesitation: slow movement or stop
      const direction = subtract(context.center, stressor.position);
      const normalized = normalize(direction);
      const hesitationFactor = 0.2; // Very slow during hesitation
      return multiply(normalized, baseSpeed * hesitationFactor);
    }
    
    // Normal approach
    const direction = subtract(context.center, stressor.position);
    const normalized = normalize(direction);
    
    // Add slight erratic offset
    const random = context.getRandom();
    const erraticAngle = random.range(-0.3, 0.3);
    const cos = Math.cos(erraticAngle);
    const sin = Math.sin(erraticAngle);
    const erraticOffset = {
      x: normalized.x * cos - normalized.y * sin,
      y: normalized.x * sin + normalized.y * cos
    };
    const finalDirection = normalize(erraticOffset);
    
    return multiply(finalDirection, baseSpeed);
  }
}

