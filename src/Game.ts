import { GameState, TelemetryData, Vector2, AbilityState } from './types';
import { GameConfig } from './GameConfig';
import { StressorSystem } from './systems/StressorSystem';
import { AbilitySystem } from './systems/AbilitySystem';
import { AbilityEffectSystem } from './systems/AbilityEffectSystem';
import { SeededRandom } from './utils/Random';
import { distance } from './utils/MathUtils';
import { dev } from './utils/dev';
import { ISystem, SystemContext } from './systems/ISystem';

export class Game {
  private state: GameState;
  private stressorSystem: StressorSystem;
  private abilitySystem: AbilitySystem;
  private abilityEffectSystem: AbilityEffectSystem;
  private systems: Map<string, ISystem> = new Map();
  private context: SystemContext;
  private random: SeededRandom;
  private center: Vector2;
  private playfieldWidth: number;
  private playfieldHeight: number;
  
  private auraRadius: number = GameConfig.AURA_RADIUS;
  
  private telemetryData: TelemetryData[] = [];
  private lastTelemetryTime: number = 0;
  
  private sessionStartTime: number = 0;
  private waveStartTime: number = 0;
  private activeStressors: Set<string> = new Set();
  
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
    
    this.stressorSystem = new StressorSystem(this.center, width, height, this.random);
    this.abilitySystem = new AbilitySystem();
    this.abilityEffectSystem = new AbilityEffectSystem();
    
    // Create SystemContext
    this.context = {
      state: this.state,
      center: this.center,
      playfieldWidth: this.playfieldWidth,
      playfieldHeight: this.playfieldHeight,
      getStressors: () => this.stressorSystem.getStressors(),
      getAbilities: () => this.abilitySystem.getAbilities(),
      getAbilityLevel: (ability) => 
        this.abilitySystem.getAbilities()[ability].level,
      getAuraRadius: () => this.auraRadius,
      isAuraActive: () => true, // Aura is always active in current implementation
      // AbilitySystem query methods
      getAffirmAmplification: () => this.abilitySystem.getAffirmAmplification(),
      getAlignBonus: () => this.abilitySystem.getAlignBonus(),
      getAlignPhase: () => this.abilitySystem.getAlignPhase(),
      isRecenterPulseActive: () => this.abilitySystem.isRecenterPulseActive(),
      getRecenterPulseRadius: () => this.abilitySystem.getRecenterPulseRadius(),
      getExhaleWaves: () => this.abilitySystem.getExhaleWaves(),
      isReflectBarrierActive: () => this.abilitySystem.isReflectBarrierActive(),
      getReflectBarrierRadius: () => this.abilitySystem.getReflectBarrierRadius(),
      isMantraBeamActive: () => this.abilitySystem.isMantraBeamActive(),
      getMantraTargetId: () => this.abilitySystem.getMantraTargetId(),
      getMantraBeamDamage: () => this.abilitySystem.getMantraBeamDamage(),
      isGroundFieldActive: () => this.abilitySystem.isGroundFieldActive(),
      getGroundFieldPosition: () => this.abilitySystem.getGroundFieldPosition(),
      getGroundFieldRadius: () => this.abilitySystem.getGroundFieldRadius(),
      wasReleaseJustTriggered: () => this.abilitySystem.wasReleaseJustTriggered(),
      // Mutation methods
      damageStressor: (id, damage) => 
        this.stressorSystem.damageStressor(id, damage),
      modifyState: (updates) => Object.assign(this.state, updates),
    };
    
    // Register systems
    this.registerSystem('stressor', this.stressorSystem);
    this.registerSystem('ability', this.abilitySystem);
    this.registerSystem('abilityEffect', this.abilityEffectSystem);
    
    this.sessionStartTime = Date.now();
    this.startWave(1);
  }
  
  private registerSystem(name: string, system: ISystem): void {
    this.systems.set(name, system);
    system.initialize?.(this.context);
  }

  setStateChangeCallback(callback: (state: GameState) => void): void {
    this.onStateChange = callback;
  }

  setGameOverCallback(callback: (data: { duration: number; wave: number; insight: number }) => void): void {
    this.onGameOver = callback;
  }

  startWave(wave: number): void {
    this.state.wave = wave;
    this.state.waveTimer = GameConfig.WAVE_DURATION;
    this.waveStartTime = Date.now();
    this.stressorSystem.setWave(wave);
    this.stressorSystem.spawnWave();
  }

  update(deltaTime: number): void {
    try {
      if (this.state.gameOver || this.state.isPaused) return;
    
    const scaledDelta = deltaTime * this.state.pace;
    
    // Track stressors before update (for resolution tracking)
    const stressorsBefore = new Set(this.stressorSystem.getStressors().map(s => s.id));
    
    // Update all systems in order
    for (const system of this.systems.values()) {
      system.update(scaledDelta, this.context);
    }
    
    // Game-specific coordination logic (currently inline, can be extracted to helper methods)
    // Update wave timer
    this.state.waveTimer -= scaledDelta;
    
    // Check for wave completion
    if (this.stressorSystem.getStressorCount() === 0 || this.state.waveTimer <= 0) {
      this.startWave(this.state.wave + 1);
    }
    
    // Check for resolved stressors (destroyed by abilities or natural decay)
    const stressorsAfter = this.stressorSystem.getStressors();
    const stressorsAfterIds = new Set(stressorsAfter.map(s => s.id));
    
    for (const id of stressorsBefore) {
      if (!stressorsAfterIds.has(id)) {
        // Stressor was resolved
        this.resolveStressor(id);
      }
    }
    
    // Check for stressor collisions with center
    for (const stressor of stressorsAfter) {
      const dist = distance(stressor.position, this.center);
      if (dist < GameConfig.CENTER_RADIUS + stressor.size) {
        // Reflect barrier prevents Serenity loss
        if (!this.abilitySystem.isReflectBarrierActive()) {
          this.state.serenity = Math.max(0, this.state.serenity - 5);
        }
        this.stressorSystem.damageStressor(stressor.id, stressor.health);
        // Will be resolved on next update cycle
      }
    }
    
    // Check game over
    if (this.state.serenity <= 0 && !this.state.gameOver) {
      this.state.gameOver = true;
      const duration = (Date.now() - this.sessionStartTime) / 1000;
      if (this.onGameOver) {
        this.onGameOver({
          duration,
          wave: this.state.wave,
          insight: this.state.insight
        });
      }
    }
    
    // Telemetry
    const now = Date.now();
    if (now - this.lastTelemetryTime >= GameConfig.TELEMETRY_INTERVAL) {
      this.telemetryData.push({
        timestamp: now,
        serenity: this.state.serenity,
        insight: this.state.insight,
        wave: this.state.wave,
        pace: this.state.pace
      });
      dev.log(`[Telemetry] Wave: ${this.state.wave}, Serenity: ${this.state.serenity.toFixed(1)}, Insight: ${this.state.insight}`);
      this.lastTelemetryTime = now;
    }
    
    if (this.onStateChange) {
      this.onStateChange({ ...this.state });
    }
    } catch (error) {
      dev.error('[Game] Update failed:', error);
      dev.error('[Game] State:', this.state);
      throw error; // Still crash, but with context
    }
  }

  // Breathe is now automatic - these methods are kept for compatibility but do nothing
  useBreathe(): boolean {
    // Automatic breathing - no player input needed
    return false;
  }

  startBreathe(): void {
    // Automatic breathing - no player input needed
  }

  useRecenter(): boolean {
    // Recenter is now always active (rotating cone), no manual activation needed
    // This method is kept for compatibility but does nothing
    return false;
  }

  useAffirm(): { transformed: number; insightGained: number } | null {
    // Affirm is now auto-triggered and amplifies other abilities, no manual activation
    // This method is kept for compatibility but returns null
    return null;
  }

  resolveStressor(stressorId: string): void {
    const baseInsight = GameConfig.INSIGHT_BASE + (this.state.wave * GameConfig.INSIGHT_PER_WAVE);
    this.state.insight += baseInsight;
  }

  upgradeAbility(abilityName: keyof AbilityState): boolean {
    try {
      const cost = this.abilitySystem.getUpgradeCost(abilityName);
      if (this.state.insight < cost) return false;
      
      // Check if this upgrade would reach a branch point
      const currentLevel = this.abilitySystem.getAbilities()[abilityName].level;
      const nextLevel = currentLevel + 1;
      const branchPoints = this.abilitySystem.getAbilities()[abilityName].branchPoints;
      const isBranchPoint = branchPoints.includes(nextLevel);
      
      // If it's a branch point, don't upgrade yet - return a special indicator
      // The UI will handle showing branch selection, then call chooseBranchAndUpgrade()
      if (isBranchPoint) {
        // Return false but this will be handled by UI to show branch selection
        // We'll add a method to check this before calling upgradeAbility
        return false; // Signal that branch selection is needed
      }
      
      if (this.abilitySystem.upgradeAbility(abilityName, this.state.insight)) {
        this.state.insight -= cost;
        
        // Breathe upgrades increase aura radius by 5% of starting value per level
        if (abilityName === 'breathe') {
          const auraIncrease = GameConfig.AURA_RADIUS * 0.05; // 5% of starting value
          this.auraRadius += auraIncrease;
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      dev.error('[Game] upgradeAbility failed:', error);
      dev.error('[Game] Ability:', abilityName);
      dev.error('[Game] State:', this.state);
      throw error;
    }
  }

  chooseBranchAndUpgrade(abilityName: keyof AbilityState, branchId: string): boolean {
    try {
      // First, choose the branch
      if (!this.abilitySystem.chooseBranch(abilityName, branchId)) {
        return false;
      }
      
      // Then perform the upgrade
      const cost = this.abilitySystem.getUpgradeCost(abilityName);
      if (this.state.insight < cost) {
        // Rollback branch choice if we can't afford upgrade
        const ability = this.abilitySystem.getAbilities()[abilityName];
        ability.chosenBranches.delete(ability.level);
        return false;
      }
      
      if (this.abilitySystem.upgradeAbility(abilityName, this.state.insight)) {
        this.state.insight -= cost;
        
        // Breathe upgrades increase aura radius by 5% of starting value per level
        if (abilityName === 'breathe') {
          const auraIncrease = GameConfig.AURA_RADIUS * 0.05; // 5% of starting value
          this.auraRadius += auraIncrease;
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      dev.error('[Game] chooseBranchAndUpgrade failed:', error);
      dev.error('[Game] Ability:', abilityName);
      dev.error('[Game] Branch:', branchId);
      dev.error('[Game] State:', this.state);
      throw error;
    }
  }

  setPace(pace: number): void {
    // Clamp to discrete steps: 1, 2, 3, 4, or 5
    this.state.pace = Math.max(1, Math.min(5, Math.round(pace)));
  }
  
  incrementPace(): void {
    this.setPace(this.state.pace + 1);
  }
  
  decrementPace(): void {
    this.setPace(this.state.pace - 1);
  }

  getState(): GameState {
    return { ...this.state };
  }

  getStressorSystem(): StressorSystem {
    return this.stressorSystem;
  }

  getAbilitySystem(): AbilitySystem {
    return this.abilitySystem;
  }

  getCenter(): Vector2 {
    return { ...this.center };
  }

  getAuraRadius(): number {
    return this.auraRadius;
  }

  getTelemetryData(): TelemetryData[] {
    return [...this.telemetryData];
  }

  reset(): void {
    this.state.serenity = GameConfig.MAX_SERENITY;
    this.state.insight = 0;
    this.state.wave = 0;
    this.state.waveTimer = 0;
    this.state.gameOver = false;
    this.state.pace = 1.0;
    this.telemetryData = [];
    this.stressorSystem.clearAll();
    this.abilitySystem = new AbilitySystem();
    this.sessionStartTime = Date.now();
    this.startWave(1);
  }
}

