import { Stressor, StressorType, Vector2 } from '../types';
import { GameConfig } from '../GameConfig';
import { SeededRandom } from '../utils/Random';
import { distance, normalize, angleTo, multiply, add, subtract } from '../utils/MathUtils';
import { ISystem, SystemContext } from './ISystem';

export class StressorSystem implements ISystem {
  private stressors: Stressor[] = [];
  private random: SeededRandom;
  private center: Vector2;
  private playfieldWidth: number;
  private playfieldHeight: number;
  private wave: number = 0;

  constructor(center: Vector2, width: number, height: number, random: SeededRandom) {
    this.center = center;
    this.playfieldWidth = width;
    this.playfieldHeight = height;
    this.random = random;
  }

  setWave(wave: number): void {
    this.wave = wave;
  }

  spawnWave(): void {
    const count = Math.floor(
      GameConfig.STRESSOR_BASE_COUNT * 
      Math.pow(GameConfig.STRESSOR_COUNT_MULTIPLIER, this.wave - 1)
    );
    
    const types = this.getAvailableTypes();
    
    for (let i = 0; i < count; i++) {
      const type = this.random.choice(types);
      this.spawnStressor(type);
    }
  }

  private getAvailableTypes(): StressorType[] {
    if (this.wave <= 3) {
      return [StressorType.IntrusiveThought];
    } else if (this.wave <= 5) {
      return [StressorType.IntrusiveThought, StressorType.TimePressure];
    } else if (this.wave <= 8) {
      return [StressorType.IntrusiveThought, StressorType.TimePressure, StressorType.EnvironmentalNoise];
    } else if (this.wave <= 10) {
      return [StressorType.IntrusiveThought, StressorType.TimePressure, StressorType.EnvironmentalNoise, StressorType.Expectation];
    } else if (this.wave <= 13) {
      return [StressorType.IntrusiveThought, StressorType.TimePressure, StressorType.EnvironmentalNoise, StressorType.Expectation, StressorType.Fatigue];
    } else {
      return Object.values(StressorType);
    }
  }

  private spawnStressor(type: StressorType): void {
    const config = GameConfig.STRESSOR_TYPES[type as keyof typeof GameConfig.STRESSOR_TYPES];
    const healthMultiplier = Math.pow(GameConfig.STRESSOR_HEALTH_MULTIPLIER, this.wave - 1);
    const speedMultiplier = Math.pow(GameConfig.STRESSOR_SPEED_MULTIPLIER, this.wave - 1);
    
    const spawnPoint = this.getSpawnPoint();
    const direction = normalize(subtract(this.center, spawnPoint));
    const baseSpeed = GameConfig.STRESSOR_BASE_SPEED * config.speed * speedMultiplier;
    
    const stressor: Stressor = {
      id: `stressor_${Date.now()}_${Math.random()}`,
      type,
      position: { ...spawnPoint },
      velocity: multiply(direction, baseSpeed),
      health: GameConfig.STRESSOR_BASE_HEALTH * config.health * healthMultiplier,
      maxHealth: GameConfig.STRESSOR_BASE_HEALTH * config.health * healthMultiplier,
      size: 8 + (this.wave * 0.5),
      color: config.color,
      angle: angleTo(spawnPoint, this.center),
      spawnTime: Date.now()
    };

    if (type === StressorType.Expectation) {
      stressor.orbitRadius = 100 + this.random.range(0, 50);
      stressor.orbitAngle = this.random.range(0, Math.PI * 2);
      stressor.dashCooldown = 0;
    }

    this.stressors.push(stressor);
  }

  private getSpawnPoint(): Vector2 {
    const side = this.random.intRange(0, 3);
    const padding = GameConfig.PLAYFIELD_PADDING;
    
    switch (side) {
      case 0: // Top
        return {
          x: this.random.range(padding, this.playfieldWidth - padding),
          y: padding
        };
      case 1: // Right
        return {
          x: this.playfieldWidth - padding,
          y: this.random.range(padding, this.playfieldHeight - padding)
        };
      case 2: // Bottom
        return {
          x: this.random.range(padding, this.playfieldWidth - padding),
          y: this.playfieldHeight - padding
        };
      default: // Left
        return {
          x: padding,
          y: this.random.range(padding, this.playfieldHeight - padding)
        };
    }
  }

  // New ISystem-compliant update method
  update(deltaTime: number, context: SystemContext): void {
    // Extract values from context
    const center = context.center;
    const serenity = context.state.serenity;
    const auraActive = context.isAuraActive();
    const auraRadius = context.getAuraRadius();
    
    // Update stressors using extracted values
    for (const stressor of this.stressors) {
      this.updateStressor(stressor, deltaTime, center, serenity, auraActive, auraRadius);
      
      // Cap velocity to prevent stressors from flying off screen
      const maxVelocity = 500; // pixels per second
      const currentSpeed = Math.sqrt(stressor.velocity.x ** 2 + stressor.velocity.y ** 2);
      if (currentSpeed > maxVelocity) {
        const scale = maxVelocity / currentSpeed;
        stressor.velocity.x *= scale;
        stressor.velocity.y *= scale;
      }
      
      // Keep stressors within screen bounds
      const padding = GameConfig.PLAYFIELD_PADDING;
      stressor.position.x = Math.max(padding, Math.min(this.playfieldWidth - padding, stressor.position.x));
      stressor.position.y = Math.max(padding, Math.min(this.playfieldHeight - padding, stressor.position.y));
    }
    
    this.stressors = this.stressors.filter(s => s.health > 0);
  }

  // Legacy update method - kept for backward compatibility during transition
  // Will be removed once Game is fully migrated to use ISystem interface
  updateLegacy(deltaTime: number, center: Vector2, serenity: number, auraActive: boolean, auraRadius: number): void {
    for (const stressor of this.stressors) {
      this.updateStressor(stressor, deltaTime, center, serenity, auraActive, auraRadius);
      
      // Cap velocity to prevent stressors from flying off screen
      const maxVelocity = 500; // pixels per second
      const currentSpeed = Math.sqrt(stressor.velocity.x ** 2 + stressor.velocity.y ** 2);
      if (currentSpeed > maxVelocity) {
        const scale = maxVelocity / currentSpeed;
        stressor.velocity.x *= scale;
        stressor.velocity.y *= scale;
      }
      
      // Keep stressors within screen bounds
      const padding = GameConfig.PLAYFIELD_PADDING;
      stressor.position.x = Math.max(padding, Math.min(this.playfieldWidth - padding, stressor.position.x));
      stressor.position.y = Math.max(padding, Math.min(this.playfieldHeight - padding, stressor.position.y));
    }
    
    this.stressors = this.stressors.filter(s => s.health > 0);
  }

  private updateStressor(
    stressor: Stressor,
    deltaTime: number,
    center: Vector2,
    serenity: number,
    auraActive: boolean,
    auraRadius: number
  ): void {
    const config = GameConfig.STRESSOR_TYPES[stressor.type as keyof typeof GameConfig.STRESSOR_TYPES];
    const distToCenter = distance(stressor.position, center);
    
    // Aura effect - damage only (no slow)
    if (distToCenter < auraRadius && auraActive) {
      const resist = (config as any).auraResist || 0;
      
      // Apply passive damage from aura
      const damage = GameConfig.AURA_DAMAGE_PER_SECOND * deltaTime * (1 - resist);
      stressor.health -= damage;
    }
    
    // Apply persistent slow debuff (if exists)
    if (stressor.slowDebuff !== undefined) {
      stressor.velocity = multiply(stressor.velocity, stressor.slowDebuff);
    }
    
    // Type-specific behavior
    switch (stressor.type) {
      case StressorType.Expectation:
        this.updateExpectation(stressor, deltaTime, center);
        break;
      case StressorType.EnvironmentalNoise:
        this.updateEnvironmentalNoise(stressor, deltaTime);
        break;
      case StressorType.Impulse:
        this.updateImpulse(stressor, deltaTime, serenity);
        break;
      default:
        // Direct movement
        const direction = normalize(subtract(center, stressor.position));
        stressor.velocity = multiply(direction, Math.sqrt(stressor.velocity.x ** 2 + stressor.velocity.y ** 2));
        break;
    }
    
    // Ensure stressors always move toward center (elastic behavior)
    const directionToCenter = normalize(subtract(center, stressor.position));
    const currentSpeed = Math.sqrt(stressor.velocity.x ** 2 + stressor.velocity.y ** 2);
    
    // Calculate how much of current velocity is toward center
    const velocityDot = stressor.velocity.x * directionToCenter.x + stressor.velocity.y * directionToCenter.y;
    
    // If moving away from center, add a pull force toward center
    if (velocityDot < 0 || currentSpeed < 10) {
      // Add elastic pull toward center
      const pullStrength = 50; // pixels per second squared
      const pullForce = multiply(directionToCenter, pullStrength * deltaTime);
      stressor.velocity = add(stressor.velocity, pullForce);
    } else {
      // Ensure at least some component is always toward center
      const minTowardCenter = currentSpeed * 0.3; // At least 30% of speed toward center
      const currentTowardCenter = Math.max(0, velocityDot);
      if (currentTowardCenter < minTowardCenter) {
        // Adjust velocity to have minimum component toward center
        const towardCenter = multiply(directionToCenter, minTowardCenter);
        const perpendicular = normalize({
          x: directionToCenter.y,
          y: -directionToCenter.x
        });
        const perpComponent = (stressor.velocity.x * perpendicular.x + stressor.velocity.y * perpendicular.y);
        const perpVelocity = multiply(perpendicular, perpComponent);
        stressor.velocity = add(towardCenter, perpVelocity);
      }
    }
    
    // Update position
    stressor.position.x += stressor.velocity.x * deltaTime;
    stressor.position.y += stressor.velocity.y * deltaTime;
  }

  private updateExpectation(stressor: Stressor, deltaTime: number, center: Vector2): void {
    if (!stressor.orbitRadius || stressor.orbitAngle === undefined) return;
    
    stressor.dashCooldown = (stressor.dashCooldown || 0) - deltaTime;
    
    if (stressor.dashCooldown! > 0) {
      // Orbiting
      stressor.orbitAngle += deltaTime * 0.5;
      const angle = angleTo(center, stressor.position) + stressor.orbitAngle;
      stressor.position.x = center.x + Math.cos(angle) * stressor.orbitRadius!;
      stressor.position.y = center.y + Math.sin(angle) * stressor.orbitRadius!;
    } else {
      // Dashing
      const direction = normalize(subtract(center, stressor.position));
      const dashSpeed = 1200; // 6x faster than original (200 * 6)
      stressor.velocity = multiply(direction, dashSpeed);
      
      if (distance(stressor.position, center) < stressor.orbitRadius! * 0.5) {
        stressor.dashCooldown = 2 + this.random.range(0, 2);
        stressor.orbitRadius = 100 + this.random.range(0, 50);
      }
    }
  }

  private updateEnvironmentalNoise(stressor: Stressor, deltaTime: number): void {
    const wobble = Math.sin(Date.now() * 0.005 + stressor.spawnTime * 0.001) * 180; // 6x faster (30 * 6)
    const perpAngle = stressor.angle + Math.PI / 2;
    stressor.velocity.x += Math.cos(perpAngle) * wobble * deltaTime;
    stressor.velocity.y += Math.sin(perpAngle) * wobble * deltaTime;
  }

  private updateImpulse(stressor: Stressor, deltaTime: number, serenity: number): void {
    const serenityFactor = 1 - (serenity / GameConfig.MAX_SERENITY);
    const acceleration = 1 + serenityFactor * 2;
    stressor.velocity = multiply(stressor.velocity, 1 + acceleration * deltaTime);
  }

  applySlow(stressorId: string, factor: number): void {
    const stressor = this.stressors.find(s => s.id === stressorId);
    if (stressor) {
      stressor.velocity = multiply(stressor.velocity, factor);
    }
  }

  applyPush(stressorId: string, force: number, center: Vector2): void {
    const stressor = this.stressors.find(s => s.id === stressorId);
    if (stressor) {
      const direction = normalize(subtract(stressor.position, center));
      stressor.velocity = add(stressor.velocity, multiply(direction, force));
    }
  }

  applyPushAll(radius: number, force: number, center: Vector2): void {
    for (const stressor of this.stressors) {
      const dist = distance(stressor.position, center);
      if (dist < radius && dist > 0) {
        const direction = normalize(subtract(stressor.position, center));
        // Scale push force to be more reasonable (force is now in pixels/second, not instantaneous)
        const pushForce = force * (1 - dist / radius) * 0.1; // Scale down to prevent excessive velocity
        stressor.velocity = add(stressor.velocity, multiply(direction, pushForce));
      }
    }
  }

  damageStressor(stressorId: string, damage: number): boolean {
    const stressor = this.stressors.find(s => s.id === stressorId);
    if (stressor) {
      stressor.health -= damage;
      return stressor.health <= 0;
    }
    return false;
  }

  getStressors(): Stressor[] {
    return [...this.stressors];
  }

  getStressorCount(): number {
    return this.stressors.length;
  }

  clearAll(): void {
    this.stressors = [];
  }
}

