import { MovementBehavior } from './MovementBehavior';
import { Stressor, Vector2 } from '../../types';
import { SystemContext } from '../ISystem';
import { normalize, subtract, multiply, add } from '../../utils/MathUtils';

/**
 * WobbleMovement - Wobbling movement with perpendicular offset
 * 
 * Used by: EnvironmentalNoise
 */
export class WobbleMovement implements MovementBehavior {
  update(
    stressor: Stressor,
    deltaTime: number,
    context: SystemContext,
    baseSpeed: number
  ): Vector2 {
    const direction = subtract(context.center, stressor.position);
    const normalized = normalize(direction);
    
    // Perpendicular offset for wobble
    const perpendicular = {
      x: -normalized.y,
      y: normalized.x
    };
    
    // Wobble frequency and amplitude
    const wobbleFrequency = 3.0;
    const wobbleAmplitude = 0.3;
    const wobble = Math.sin(stressor.spawnTime * wobbleFrequency) * wobbleAmplitude;
    
    const wobbleOffset = multiply(perpendicular, wobble);
    const finalDirection = add(normalized, wobbleOffset);
    const finalNormalized = normalize(finalDirection);
    
    return {
      x: finalNormalized.x * baseSpeed,
      y: finalNormalized.y * baseSpeed
    };
  }
}

