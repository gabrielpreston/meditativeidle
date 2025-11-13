import { SystemContext } from './ISystem';
import { GameState, AbilityState, Stressor, Vector2 } from '../types';
import { Game } from '../Game';
import { StressorSystem } from './StressorSystem';
import { AbilitySystem } from './AbilitySystem';
import { StatusEffectManager } from './effects/StatusEffectManager';
import { SeededRandom } from '../utils/Random';

/**
 * GameSystemContext - Modular implementation of SystemContext interface
 * 
 * Provides a clean interface for systems to access game state and query other systems
 * without tight coupling.
 */
export class GameSystemContext implements SystemContext {
  constructor(
    private game: Game,
    private stressorSystem: StressorSystem,
    private abilitySystem: AbilitySystem,
    private statusEffectManager: StatusEffectManager,
    private random: SeededRandom
  ) {}

  get state(): GameState { 
    return this.game.getState(); 
  }
  
  get center(): Vector2 { 
    return this.game.getCenter(); 
  }
  
  get playfieldWidth(): number { 
    return (this.game as any).playfieldWidth; 
  }
  
  get playfieldHeight(): number { 
    return (this.game as any).playfieldHeight; 
  }

  getStressors(): Stressor[] {
    return this.stressorSystem.getStressors();
  }

  getAbilities(): AbilityState {
    return this.abilitySystem.getAbilities();
  }

  getAbilityLevel(ability: keyof AbilityState): number {
    return this.abilitySystem.getAbilityLevel(ability);
  }

  getBreathMaxRadius(): number {
    return this.abilitySystem.getBreathMaxRadius();
  }

  isAuraActive(): boolean {
    return this.abilitySystem.isAuraActive();
  }

  getAffirmAmplification(): number {
    return this.abilitySystem.getAffirmAmplification();
  }

  getAlignBonus(): number {
    return this.abilitySystem.getAlignBonus();
  }

  getAlignPhase(): 'offense' | 'defense' {
    return this.abilitySystem.getAlignPhase();
  }

  isRecenterPulseActive(): boolean {
    return this.abilitySystem.isRecenterPulseActive();
  }

  getRecenterPulseRadius(): number {
    return this.abilitySystem.getRecenterPulseRadius();
  }

  getExhaleWaves(): Array<{ radius: number; maxRadius: number; damage: number; slowFactor: number; slowDuration: number }> {
    return this.abilitySystem.getExhaleWaves();
  }

  isReflectBarrierActive(): boolean {
    return this.abilitySystem.isReflectBarrierActive();
  }

  getReflectBarrierRadius(): number {
    return this.abilitySystem.getReflectBarrierRadius();
  }

  isMantraBeamActive(): boolean {
    return this.abilitySystem.isMantraBeamActive();
  }

  getMantraTargetId(): string | null {
    return this.abilitySystem.getMantraTargetId();
  }

  getMantraBeamDamage(): number {
    return this.abilitySystem.getMantraBeamDamage();
  }

  isGroundFieldActive(): boolean {
    return this.abilitySystem.isGroundFieldActive();
  }

  getGroundFieldPosition(): Vector2 | null {
    return this.abilitySystem.getGroundFieldPosition();
  }

  getGroundFieldRadius(): number {
    return this.abilitySystem.getGroundFieldRadius();
  }

  wasReleaseJustTriggered(): boolean {
    return this.abilitySystem.wasReleaseJustTriggered();
  }

  getBreatheCycleProgress(): number {
    return this.abilitySystem.getBreatheCycleProgress();
  }

  getBreatheRawCycleProgress(): number {
    return this.abilitySystem.getBreatheRawCycleProgress();
  }

  justTransitionedToExhale(): boolean {
    return this.abilitySystem.justTransitionedToExhale();
  }

  justReachedBreathPeak(): boolean {
    return this.abilitySystem.justReachedBreathPeak();
  }

  damageStressor(id: string, damage: number): void {
    this.stressorSystem.damageStressor(id, damage);
  }

  modifyState(updates: Partial<GameState>): void {
    this.game.modifyState(updates);
  }

  getStatusEffectManager(): StatusEffectManager {
    return this.statusEffectManager;
  }

  getRandom(): SeededRandom {
    return this.random;
  }
}

