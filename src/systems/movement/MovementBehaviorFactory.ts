import { StressorType } from '../../types';
import { MovementBehavior } from './MovementBehavior';
import { DirectMovement } from './DirectMovement';
import { WobbleMovement } from './WobbleMovement';
import { OrbitDashMovement } from './OrbitDashMovement';
import { ErraticMovement } from './ErraticMovement';
import { AcceleratingMovement } from './AcceleratingMovement';
import { TimePressureMovement } from './TimePressureMovement';

/**
 * MovementBehaviorFactory - Creates movement behaviors for stressor types
 * 
 * Uses Strategy pattern to map stressor types to their movement behaviors.
 */
export class MovementBehaviorFactory {
  private static behaviors: Map<StressorType, MovementBehavior> = new Map([
    [StressorType.IntrusiveThought, new DirectMovement()],
    [StressorType.Fatigue, new DirectMovement()],
    [StressorType.EnvironmentalNoise, new WobbleMovement()],
    [StressorType.Expectation, new OrbitDashMovement()],
    [StressorType.SelfDoubt, new ErraticMovement()],
    [StressorType.Overwhelm, new AcceleratingMovement()],
    [StressorType.TimePressure, new TimePressureMovement()],
    [StressorType.Impulse, new AcceleratingMovement()] // Impulse uses accelerating movement
  ]);

  /**
   * Get movement behavior for a stressor type
   */
  static getBehavior(type: StressorType): MovementBehavior {
    const behavior = this.behaviors.get(type);
    if (!behavior) {
      // Fallback to direct movement
      return this.behaviors.get(StressorType.IntrusiveThought)!;
    }
    return behavior;
  }
}

