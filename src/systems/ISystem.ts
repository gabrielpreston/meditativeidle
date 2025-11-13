import { GameState, AbilityState, Stressor, Vector2 } from '../types';
import { StatusEffectManager } from './effects/StatusEffectManager';
import { SeededRandom } from '../utils/Random';

export interface SystemContext {
  state: GameState;
  center: Vector2;
  playfieldWidth: number;
  playfieldHeight: number;
  getStressors(): Stressor[];
  getAbilities(): AbilityState;
  getAbilityLevel(ability: keyof AbilityState): number;
  getBreathMaxRadius(): number; // Returns the maximum breath AoE radius
  isAuraActive(): boolean; // Needed for StressorSystem.update() which requires auraActive parameter
  // AbilitySystem query methods (needed by AbilityEffectSystem)
  getAffirmAmplification(): number;
  getAlignBonus(): number;
  getAlignPhase(): 'offense' | 'defense';
  isRecenterPulseActive(): boolean;
  getRecenterPulseRadius(): number;
  getExhaleWaves(): Array<{ radius: number; maxRadius: number; damage: number; slowFactor: number; slowDuration: number }>;
  isReflectBarrierActive(): boolean;
  getReflectBarrierRadius(): number;
  isMantraBeamActive(): boolean;
  getMantraTargetId(): string | null;
  getMantraBeamDamage(): number;
  isGroundFieldActive(): boolean;
  getGroundFieldPosition(): Vector2 | null;
  getGroundFieldRadius(): number;
  wasReleaseJustTriggered(): boolean;
  getBreatheCycleProgress(): number; // Returns 0-1 breathe intensity
  getBreatheRawCycleProgress(): number; // Returns raw cycle progress: 0-1 (0 = start inhale, 0.5 = start exhale, 1 = end exhale)
  justTransitionedToExhale(): boolean; // Returns true if just transitioned from inhale to exhale
  justReachedBreathPeak(): boolean; // Returns true if breath just reached maximum size (peak of exhale)
  // Mutation methods (controlled)
  damageStressor(id: string, damage: number): void;
  modifyState(updates: Partial<GameState>): void;
  // Status effect system access
  getStatusEffectManager(): StatusEffectManager;
  // Random number generator access
  getRandom(): SeededRandom;
}

export interface ISystem {
  update(deltaTime: number, context: SystemContext): void;
  initialize?(context: SystemContext): void;
  cleanup?(): void;
}

