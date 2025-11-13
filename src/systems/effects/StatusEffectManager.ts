import { StatusEffect, StatusEffectType, StatusEffectManager as IStatusEffectManager, StackingRule, AuraEffect } from './StatusEffect';
import { distance } from '../../utils/MathUtils';

/**
 * StatusEffectManager - Manages status effects on game entities
 * 
 * Handles application, removal, expiration, and stacking of status effects.
 * Uses multiplicative stacking for slow effects by default.
 */
export class StatusEffectManager implements IStatusEffectManager {
  public effects: Map<string, StatusEffect[]> = new Map();
  private auraEffects: Map<string, AuraEffect> = new Map();

  /**
   * Apply a status effect to a target
   * If an effect with the same ID already exists, it is replaced
   */
  apply(effect: StatusEffect, targetId: string): void {
    if (!this.effects.has(targetId)) {
      this.effects.set(targetId, []);
    }

    const targetEffects = this.effects.get(targetId)!;
    
    // Remove existing effect with same ID (replace)
    const existingIndex = targetEffects.findIndex(e => e.id === effect.id);
    if (existingIndex !== -1) {
      targetEffects[existingIndex] = effect;
    } else {
      targetEffects.push(effect);
    }
  }

  /**
   * Remove a specific effect by ID from a target
   */
  remove(effectId: string, targetId: string): void {
    const targetEffects = this.effects.get(targetId);
    if (!targetEffects) return;

    const index = targetEffects.findIndex(e => e.id === effectId);
    if (index !== -1) {
      targetEffects.splice(index, 1);
    }

    // Clean up empty arrays
    if (targetEffects.length === 0) {
      this.effects.delete(targetId);
    }
  }

  /**
   * Remove all effects from a specific source (e.g., all 'breathe' effects)
   */
  removeBySource(source: string, targetId: string): void {
    const targetEffects = this.effects.get(targetId);
    if (!targetEffects) return;

    const filtered = targetEffects.filter(e => e.source !== source);
    
    if (filtered.length === 0) {
      this.effects.delete(targetId);
    } else {
      this.effects.set(targetId, filtered);
    }
  }

  /**
   * Remove all effects of a specific type from a target
   */
  removeByType(type: StatusEffectType, targetId: string): void {
    const targetEffects = this.effects.get(targetId);
    if (!targetEffects) return;

    const filtered = targetEffects.filter(e => e.type !== type);
    
    if (filtered.length === 0) {
      this.effects.delete(targetId);
    } else {
      this.effects.set(targetId, filtered);
    }
  }

  /**
   * Get all effects of a specific type on a target
   */
  getEffects(type: StatusEffectType, targetId: string): StatusEffect[] {
    const targetEffects = this.effects.get(targetId);
    if (!targetEffects) return [];

    return targetEffects.filter(e => e.type === type);
  }

  /**
   * Calculate the effective value of all effects of a type on a target
   * Uses stacking rules to combine multiple effects
   */
  getEffectiveValue(type: StatusEffectType, targetId: string): number {
    const effects = this.getEffects(type, targetId);
    if (effects.length === 0) {
      // No effects - return default value (1.0 for multipliers, 0 for additive)
      return type === StatusEffectType.SLOW ? 1.0 : 0;
    }

    // Use the stacking rule from the first effect (all effects of same type should use same rule)
    const stackingRule = effects[0].stackingRule;

    switch (stackingRule) {
      case StackingRule.MULTIPLICATIVE:
        // Multiplicative stacking: effects multiply together
        // Example: 0.5 (50% slow) × 0.8 (20% slow) = 0.4 (60% total slow)
        return effects.reduce((acc, effect) => acc * effect.value, 1.0);

      case StackingRule.STRONGEST_WINS:
        // Strongest wins: lowest value wins (for slow, lower = stronger)
        return Math.min(...effects.map(e => e.value));

      case StackingRule.ADDITIVE:
        // Additive stacking: effects add together
        return effects.reduce((acc, effect) => acc + effect.value, 0);

      default:
        // Fallback to multiplicative
        return effects.reduce((acc, effect) => acc * effect.value, 1.0);
    }
  }

  /**
   * Update all effects, removing expired ones
   * Called each frame to handle duration-based effects
   */
  update(deltaTime: number): void {
    const now = Date.now();

    for (const [targetId, targetEffects] of this.effects.entries()) {
      const activeEffects: StatusEffect[] = [];

      for (const effect of targetEffects) {
        if (effect.duration !== undefined) {
          // Duration-based effect - check if expired
          const elapsed = (now - effect.startTime) / 1000; // Convert to seconds
          if (elapsed < effect.duration) {
            activeEffects.push(effect);
          }
          // Otherwise, effect has expired - don't add to activeEffects
        } else {
          // Permanent effect (or while-in-area effect) - keep it
          activeEffects.push(effect);
        }
      }

      // Update or remove entry
      if (activeEffects.length === 0) {
        this.effects.delete(targetId);
      } else {
        this.effects.set(targetId, activeEffects);
      }
    }
  }

  /**
   * Remove all effects from a target
   */
  clear(targetId: string): void {
    this.effects.delete(targetId);
  }

  /**
   * Apply an aura effect (proximity-based)
   * Auras are updated each frame based on positions
   */
  applyAura(aura: AuraEffect): void {
    this.auraEffects.set(aura.sourceId, aura);
  }

  /**
   * Remove an aura effect
   */
  removeAura(sourceId: string): void {
    this.auraEffects.delete(sourceId);
  }

  /**
   * Get all aura effects affecting a stressor at a given position
   * Returns status effects that should be applied based on proximity
   */
  getAuraEffects(stressorId: string, position: { x: number; y: number }): StatusEffect[] {
    const effects: StatusEffect[] = [];

    for (const aura of this.auraEffects.values()) {
      const dist = distance(position, aura.position);
      if (dist <= aura.radius) {
        // Create a status effect from the aura
        effects.push({
          id: `aura-${aura.sourceId}-${stressorId}`,
          type: aura.effectType,
          source: aura.sourceType,
          value: aura.value,
          startTime: Date.now(),
          stackingRule: StackingRule.MULTIPLICATIVE // Auras use multiplicative stacking
        });
      }
    }

    return effects;
  }
}

