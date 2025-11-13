import { Stressor, StressorType, Vector2 } from '../types';
import { GameConfig } from '../GameConfig';
import { SeededRandom } from '../utils/Random';
import { distance, normalize, angleTo, multiply, add, subtract } from '../utils/MathUtils';
import { ISystem, SystemContext } from './ISystem';
import { dev } from '../utils/dev';
import { MovementSpeedCalculator } from './movement/MovementSpeedCalculator';
import { getAvailableStressorTypes } from '../config/WaveProgressionConfig';
import { MovementBehaviorFactory } from './movement/MovementBehaviorFactory';

export class StressorSystem implements ISystem {
  private stressors: Stressor[] = [];
  private random: SeededRandom;
  private center: Vector2;
  private playfieldWidth: number;
  private playfieldHeight: number;
  private wave: number = 0;
  private movementSpeedCalculator?: MovementSpeedCalculator;

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
    return getAvailableStressorTypes(this.wave);
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
    // Initialize movement speed calculator on first use (lazy initialization)
    if (!this.movementSpeedCalculator) {
      this.movementSpeedCalculator = new MovementSpeedCalculator(
        context.getStatusEffectManager()
      );
    }
    
    // Extract values from context
    const center = context.center;
    const serenity = context.state.serenity;
    const auraActive = context.isAuraActive();
    const breathMaxRadius = context.getBreathMaxRadius();
    
    // Update stressors using extracted values
    for (const stressor of this.stressors) {
      // Check for collision with player edge before updating
      const distToCenter = distance(stressor.position, center);
      const collisionRadius = GameConfig.PLAYER_RADIUS + stressor.size;
      
      if (distToCenter <= collisionRadius) {
        // Stressor hit player edge - apply damage and kill stressor
        const currentSerenity = context.state.serenity;
        
        // Only apply damage if serenity is above 0 (prevent unnecessary logs and state updates)
        if (currentSerenity > 0) {
          const newSerenity = Math.max(0, currentSerenity - GameConfig.STRESSOR_COLLISION_DAMAGE);
          context.modifyState({ serenity: newSerenity });
          
          // Combat log: Stressor hit player
          dev.log('[Combat] Stressor hit player', {
            stressorId: stressor.id,
            stressorType: stressor.type,
            damage: GameConfig.STRESSOR_COLLISION_DAMAGE,
            serenityBefore: currentSerenity,
            serenityAfter: newSerenity,
            wave: context.state.wave
          });
        }
        
        // Kill the stressor regardless of serenity (prevent it from hitting again)
        stressor.health = 0;
        continue; // Skip update for this stressor
      }
      
      this.updateStressor(stressor, deltaTime, center, serenity, auraActive, breathMaxRadius, context);
      
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
  updateLegacy(deltaTime: number, center: Vector2, serenity: number, auraActive: boolean, auraRadius: number, context?: SystemContext): void {
    // Note: Legacy method doesn't have context, so movement speed calculator won't work
    // This method is deprecated and should not be used
    if (!context) {
      // Fallback: use old behavior without status effects
      for (const stressor of this.stressors) {
        const direction = normalize(subtract(center, stressor.position));
        const currentSpeed = Math.sqrt(stressor.velocity.x ** 2 + stressor.velocity.y ** 2);
        stressor.velocity = multiply(direction, currentSpeed);
        stressor.position.x += stressor.velocity.x * deltaTime;
        stressor.position.y += stressor.velocity.y * deltaTime;
      }
      return;
    }
    
    for (const stressor of this.stressors) {
      this.updateStressor(stressor, deltaTime, center, serenity, auraActive, auraRadius, context);
      
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
    breathMaxRadius: number,
    context: SystemContext
  ): void {
    const config = GameConfig.STRESSOR_TYPES[stressor.type as keyof typeof GameConfig.STRESSOR_TYPES];
    
    // Calculate base speed (from config, wave scaling, type modifiers)
    const speedMultiplier = Math.pow(GameConfig.STRESSOR_SPEED_MULTIPLIER, this.wave - 1);
    const baseSpeed = GameConfig.STRESSOR_BASE_SPEED * config.speed * speedMultiplier;
    
    // Get effective speed from status effect system
    const effectiveSpeed = this.movementSpeedCalculator!.calculateSpeed(
      baseSpeed,
      stressor.id,
      stressor.type
    );
    
    // Use MovementBehaviorFactory to get appropriate behavior
    const behavior = MovementBehaviorFactory.getBehavior(stressor.type);
    stressor.velocity = behavior.update(stressor, deltaTime, context, effectiveSpeed);
    
    // Update position
    stressor.position.x += stressor.velocity.x * deltaTime;
    stressor.position.y += stressor.velocity.y * deltaTime;
  }

  private updateExpectation(stressor: Stressor, deltaTime: number, center: Vector2, effectiveSpeed: number, baseSpeed: number): void {
    if (!stressor.orbitRadius || stressor.orbitAngle === undefined) return;
    
    stressor.dashCooldown = (stressor.dashCooldown || 0) - deltaTime;
    
    if (stressor.dashCooldown! > 0) {
      // Orbiting - apply slow to orbit speed if desired (currently fixed speed)
      stressor.orbitAngle += deltaTime * 0.5; // Could multiply by slow multiplier here if desired
      const angle = angleTo(center, stressor.position) + stressor.orbitAngle;
      stressor.position.x = center.x + Math.cos(angle) * stressor.orbitRadius!;
      stressor.position.y = center.y + Math.sin(angle) * stressor.orbitRadius!;
    } else {
      // Dashing - use effectiveSpeed instead of hardcoded dashSpeed
      const direction = normalize(subtract(center, stressor.position));
      const dashSpeedMultiplier = 1200 / baseSpeed; // Preserve dash speed ratio (1200 is original dash speed)
      stressor.velocity = multiply(direction, effectiveSpeed * dashSpeedMultiplier);
      
      if (distance(stressor.position, center) < stressor.orbitRadius! * 0.5) {
        stressor.dashCooldown = 2 + this.random.range(0, 2);
        stressor.orbitRadius = 100 + this.random.range(0, 50);
      }
    }
  }

  private updateEnvironmentalNoise(stressor: Stressor, deltaTime: number, effectiveSpeed: number): void {
    // Calculate base wobble (preserve current behavior)
    const wobble = Math.sin(Date.now() * 0.005 + stressor.spawnTime * 0.001) * 180;
    const perpAngle = stressor.angle + Math.PI / 2;
    
    // Set base velocity with effective speed
    const direction = normalize(subtract(this.center, stressor.position));
    stressor.velocity = multiply(direction, effectiveSpeed);
    
    // Add wobble (wobble magnitude could also be affected by slow if desired)
    stressor.velocity.x += Math.cos(perpAngle) * wobble * deltaTime;
    stressor.velocity.y += Math.sin(perpAngle) * wobble * deltaTime;
  }

  private updateImpulse(stressor: Stressor, deltaTime: number, serenity: number, effectiveSpeed: number): void {
    const serenityFactor = 1 - (serenity / GameConfig.MAX_SERENITY);
    const acceleration = 1 + serenityFactor * 2;
    
    // Start with effective speed, then apply impulse acceleration
    const direction = normalize(subtract(this.center, stressor.position));
    stressor.velocity = multiply(direction, effectiveSpeed);
    stressor.velocity = multiply(stressor.velocity, 1 + acceleration * deltaTime);
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
      // Skip if already dead to prevent multiple kill logs and negative damage
      if (stressor.health <= 0) {
        return true; // Already dead
      }
      
      const healthBefore = stressor.health;
      stressor.health -= damage;
      const isDead = stressor.health <= 0;
      
      // Combat log: Only log deaths and significant health milestones (every 25% health lost)
      if (isDead) {
        dev.log('[Combat] Stressor killed', {
          stressorId: stressor.id,
          stressorType: stressor.type,
          damage: damage,
          healthBefore: healthBefore,
          finalHealth: stressor.health
        });
      } else {
        // Log when health crosses 25% thresholds
        const healthPercentBefore = Math.floor((healthBefore / stressor.maxHealth) * 4) / 4; // 0, 0.25, 0.5, 0.75, 1.0
        const healthPercentAfter = Math.floor((stressor.health / stressor.maxHealth) * 4) / 4;
        if (healthPercentAfter < healthPercentBefore) {
          dev.log('[Combat] Stressor health milestone', {
            stressorId: stressor.id,
            stressorType: stressor.type,
            healthPercent: healthPercentAfter,
            health: Math.max(0, stressor.health),
            maxHealth: stressor.maxHealth
          });
        }
      }
      
      return isDead;
    }
    return false;
  }

  getStressors(): Stressor[] {
    // Filter out dead stressors to prevent damage application to dead stressors
    return this.stressors.filter(s => s.health > 0);
  }

  getStressorCount(): number {
    // Count only alive stressors for consistency with getStressors()
    return this.stressors.filter(s => s.health > 0).length;
  }

  clearAll(): void {
    this.stressors = [];
  }
}

