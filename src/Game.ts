import { GameState, Vector2 } from './types';
import { GameConfig } from './GameConfig';
import { SeededRandom } from './utils/Random';

export class Game {
  private state: GameState;
  private random: SeededRandom;
  private center: Vector2;
  private playfieldWidth: number;
  private playfieldHeight: number;
  
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
  }

  setStateChangeCallback(callback: (state: GameState) => void): void {
    this.onStateChange = callback;
  }

  setGameOverCallback(callback: (data: { duration: number; wave: number; insight: number }) => void): void {
    this.onGameOver = callback;
  }

  update(deltaTime: number): void {
    // Minimal update - nothing to update for now
    if (this.onStateChange) {
      this.onStateChange({ ...this.state });
    }
  }

  getState(): GameState {
    return { ...this.state };
  }

  getCenter(): Vector2 {
    return { ...this.center };
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
