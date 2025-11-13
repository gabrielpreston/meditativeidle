import { MovementBehavior } from './MovementBehavior';
import { Stressor, Vector2 } from '../../types';
import { SystemContext } from '../ISystem';
import { normalize, subtract, multiply, add, distance, angleTo } from '../../utils/MathUtils';

/**
 * OrbitDashMovement - Orbits player then dashes inward
 * 
 * Used by: Expectation
 */
export class OrbitDashMovement implements MovementBehavior {
  private static readonly ORBIT_DISTANCE = 150;
  private static readonly DASH_DISTANCE = 80;
  private static readonly ORBIT_SPEED = 0.8;
  private static readonly DASH_SPEED = 2.5;

  update(
    stressor: Stressor,
    deltaTime: number,
    context: SystemContext,
    baseSpeed: number
  ): Vector2 {
    const dist = distance(stressor.position, context.center);
    
    // Orbit phase: maintain distance, move perpendicular
    if (dist > OrbitDashMovement.ORBIT_DISTANCE) {
      const direction = subtract(context.center, stressor.position);
      const normalized = normalize(direction);
      
      // Perpendicular for orbit
      const perpendicular = {
        x: -normalized.y,
        y: normalized.x
      };
      
      // Orbit direction (clockwise or counter-clockwise based on spawn)
      const orbitDir = (stressor.id.charCodeAt(0) % 2 === 0) ? 1 : -1;
      const orbitVelocity = multiply(perpendicular, orbitDir * OrbitDashMovement.ORBIT_SPEED * baseSpeed);
      
      // Also move slightly inward
      const inwardComponent = multiply(normalized, 0.3 * baseSpeed);
      
      return add(orbitVelocity, inwardComponent);
    }
    
    // Dash phase: move directly toward center
    if (dist > OrbitDashMovement.DASH_DISTANCE) {
      const direction = subtract(context.center, stressor.position);
      const normalized = normalize(direction);
      return multiply(normalized, OrbitDashMovement.DASH_SPEED * baseSpeed);
    }
    
    // Reset orbit if too close
    if (dist < OrbitDashMovement.DASH_DISTANCE) {
      // Move outward to reset orbit
      const direction = subtract(stressor.position, context.center);
      const normalized = normalize(direction);
      return multiply(normalized, OrbitDashMovement.ORBIT_SPEED * baseSpeed);
    }
    
    // Fallback: direct movement
    const direction = subtract(context.center, stressor.position);
    const normalized = normalize(direction);
    return multiply(normalized, baseSpeed);
  }
}

