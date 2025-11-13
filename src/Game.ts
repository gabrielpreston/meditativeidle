import { GameState, Vector2, Stressor, AbilityState } from './types';
import { GameConfig } from './GameConfig';
import { SeededRandom } from './utils/Random';
import { StressorSystem } from './systems/StressorSystem';
import { AbilitySystem } from './systems/AbilitySystem';
import { AbilityEffectSystem } from './systems/AbilityEffectSystem';
import { GameSystemContext } from './systems/GameSystemContext';
import { StatusEffectManager } from './systems/effects/StatusEffectManager';

export class Game {
  private state: GameState;
  private random: SeededRandom;
  private center: Vector2;
  public playfieldWidth: number; // Made public for SystemContext access
  public playfieldHeight: number; // Made public for SystemContext access
  
  private stressorSystem: StressorSystem;
  private abilitySystem: AbilitySystem;
  private abilityEffectSystem: AbilityEffectSystem;
  private statusEffectManager: StatusEffectManager;
  private systemContext: GameSystemContext;
  
  private onStateChange?: (state: GameState) => void;
  private onGameOver?: (data: { duration: number; wave: number; insight: number }) => void;

  constructor(width: number, height: number, seed?: number) {
    this.playfieldWidth = width;
    this.playfieldHeight = height;
    this.center = { x: width / 2, y: height / 2 };
    
    this.random = new SeededRandom(seed || Date.now());
    
    this.state = {
      serenity: GameConfig.MAX_SERENITY,
      maxSerenity: GameConfig.MAX_SERENITY,
      insight: 0,
      wave: 0,
      waveTimer: 0,
      pace: 1.0,
      isPaused: false,
      gameOver: false,
      randomSeed: this.random.getSeed()
    };
    
    // Initialize systems
    this.stressorSystem = new StressorSystem(this.center, width, height, this.random);
    this.abilitySystem = new AbilitySystem();
    this.abilityEffectSystem = new AbilityEffectSystem();
    this.statusEffectManager = new StatusEffectManager();
    
    // Create modular SystemContext
    this.systemContext = new GameSystemContext(this, this.stressorSystem, this.abilitySystem, this.statusEffectManager, this.random);
  }

  setStateChangeCallback(callback: (state: GameState) => void): void {
    this.onStateChange = callback;
  }

  setGameOverCallback(callback: (data: { duration: number; wave: number; insight: number }) => void): void {
    this.onGameOver = callback;
  }

  update(deltaTime: number): void {
    // Wave management - Hybrid: Timer-based with early advance
    const allStressorsDefeated = this.stressorSystem.getStressorCount() === 0;
    
    if (allStressorsDefeated && this.state.waveTimer > 0) {
      // Early advance: All stressors defeated before timer expires
      this.state.wave++;
      this.state.waveTimer = 0;
      this.stressorSystem.setWave(this.state.wave);
      this.stressorSystem.spawnWave();
    } else {
      // Timer-based progression
      this.state.waveTimer += deltaTime;
      if (this.state.waveTimer >= GameConfig.WAVE_DURATION) {
        this.state.wave++;
        this.state.waveTimer = 0;
        this.stressorSystem.setWave(this.state.wave);
        this.stressorSystem.spawnWave();
      }
    }
    
    // Update systems in order: expire effects, then abilities (to apply damage), then stressors (to check collision)
    // This ensures expired effects are removed before new ones are applied, and stressors can be killed by damage before they hit the player
    this.statusEffectManager.update(deltaTime); // Expire duration-based effects
    this.abilitySystem.update(deltaTime, this.systemContext);
    this.abilityEffectSystem.update(deltaTime, this.systemContext); // Apply ability effects (damage stressors)
    this.stressorSystem.update(deltaTime, this.systemContext); // Update stressors and check collision (after damage)
    
    // Update game state callbacks
    if (this.onStateChange) {
      this.onStateChange({ ...this.state });
    }
  }
  
  getStressors(): Stressor[] {
    return this.stressorSystem.getStressors();
  }
  
  getAbilities(): AbilityState {
    return this.abilitySystem.getAbilities();
  }

  getState(): GameState {
    return { ...this.state };
  }

  getCenter(): Vector2 {
    return { ...this.center };
  }

  getSystemContext(): GameSystemContext {
    return this.systemContext;
  }
  
  modifyState(updates: Partial<GameState>): void {
    this.state = { ...this.state, ...updates };
  }

  /**
   * Update max serenity and clamp current serenity if it exceeds new max.
   */
  updateMaxSerenity(value: number): void {
    this.modifyState({ 
      maxSerenity: value,
      serenity: Math.min(this.state.serenity, value)
    });
  }

  reset(): void {
    this.state.serenity = GameConfig.MAX_SERENITY;
    this.state.insight = 0;
    this.state.wave = 0;
    this.state.waveTimer = 0;
    this.state.gameOver = false;
    this.state.pace = 1.0;
  }
}
