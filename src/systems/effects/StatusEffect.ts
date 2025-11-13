/**
 * Status Effect System - Type Definitions
 * 
 * Provides type-safe definitions for status effects (slow, vulnerability, etc.)
 * and their stacking rules.
 */

export enum StatusEffectType {
  SLOW = 'slow',
  VULNERABILITY = 'vulnerability',
  DAMAGE_REDUCTION = 'damage_reduction',
  // Future: STUN, HASTE, etc.
}

export enum StackingRule {
  MULTIPLICATIVE = 'multiplicative',  // Effects multiply (0.5 × 0.8 = 0.4)
  STRONGEST_WINS = 'strongest_wins',  // Lowest value wins (for slow)
  ADDITIVE = 'additive',              // Effects add (future use)
}

export interface StatusEffect {
  id: string;                    // Unique identifier (e.g., 'breathe-slow-123')
  type: StatusEffectType;
  source: string;                 // Source ability/system ('breathe', 'recenter', etc.)
  value: number;                  // Effect strength (multiplier for slow: 0.5 = 50% slow)
  duration?: number;              // Duration in seconds (undefined = permanent/while in area)
  startTime: number;             // Timestamp when applied (Date.now())
  stackingRule: StackingRule;     // How this effect stacks with others
}

/**
 * AuraEffect - Proximity-based status effect
 * 
 * Applied to stressors within range of an aura source (e.g., Self-Doubt self-sabotage aura)
 */
export interface AuraEffect {
  sourceId: string;
  sourceType: string; // e.g., 'self_doubt', 'fatigue'
  effectType: StatusEffectType;
  value: number;
  radius: number;
  position: { x: number; y: number };
}

export interface StatusEffectManager {
  effects: Map<string, StatusEffect[]>;  // stressorId -> effects[]
  
  apply(effect: StatusEffect, targetId: string): void;
  remove(effectId: string, targetId: string): void;
  removeBySource(source: string, targetId: string): void;
  removeByType(type: StatusEffectType, targetId: string): void;
  getEffectiveValue(type: StatusEffectType, targetId: string): number;
  getEffects(type: StatusEffectType, targetId: string): StatusEffect[];
  update(deltaTime: number): void;  // Remove expired effects
  clear(targetId: string): void;      // Remove all effects from target
  // Aura effect methods
  applyAura(aura: AuraEffect): void;
  removeAura(sourceId: string): void;
  getAuraEffects(stressorId: string, position: { x: number; y: number }): StatusEffect[];
}

