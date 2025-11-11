import { GameState, AbilityState, Stressor, Vector2 } from '../types';

export interface SystemContext {
  state: GameState;
  center: Vector2;
  playfieldWidth: number;
  playfieldHeight: number;
  getStressors(): Stressor[];
  getAbilities(): AbilityState;
  getAbilityLevel(ability: keyof AbilityState): number;
  getAuraRadius(): number;
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
  // Mutation methods (controlled)
  damageStressor(id: string, damage: number): void;
  modifyState(updates: Partial<GameState>): void;
}

export interface ISystem {
  update(deltaTime: number, context: SystemContext): void;
  initialize?(context: SystemContext): void;
  cleanup?(): void;
}

