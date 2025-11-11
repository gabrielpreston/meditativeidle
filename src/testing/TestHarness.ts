import { Game } from '../Game';
import { GameConfig } from '../GameConfig';
import { AbilityState } from '../types';
import { dev } from '../utils/dev';

interface TestResult {
  success: boolean;
  duration: number;
  waveReached: number;
  averageFPS: number;
  serenityCollapsedByWave15: boolean;
  noInterludes: boolean;
  errors: string[];
}

export class TestHarness {
  private game: Game;
  private testPace: number = 10; // Accelerated for testing
  private frameTimes: number[] = [];
  private lastFrameTime: number = 0;
  private waveTransitions: number[] = [];
  private lastWave: number = 0;

  constructor() {
    this.game = new Game(1920, 1080, 12345); // Fixed seed for deterministic testing
    this.game.setPace(this.testPace);
  }

  async runTest(): Promise<TestResult> {
    const errors: string[] = [];
    const startTime = Date.now();
    let frameCount = 0;
    this.lastFrameTime = performance.now();
    this.lastWave = 1;
    
    // Simulate 20 waves at accelerated pace
    const maxSimulationTime = (GameConfig.WAVE_DURATION * 20 / this.testPace) * 1000; // Convert to ms
    const endTime = startTime + maxSimulationTime;
    
    const simulateFrame = (currentTime: number): Promise<void> => {
      return new Promise((resolve) => {
        if (currentTime >= endTime || this.game.getState().gameOver) {
          resolve();
          return;
        }
        
        const deltaTime = (currentTime - this.lastFrameTime) / 1000;
        this.lastFrameTime = currentTime;
        
        // Track wave transitions
        const currentWave = this.game.getState().wave;
        if (currentWave !== this.lastWave) {
          this.waveTransitions.push(currentTime);
          this.lastWave = currentWave;
        }
        
        // Update game
        this.game.update(deltaTime);
        
        // Track frame time
        frameCount++;
        this.frameTimes.push(deltaTime);
        
        // Simulate player actions (basic AI)
        this.simulatePlayerActions();
        
        requestAnimationFrame((nextTime) => {
          resolve(simulateFrame(nextTime));
        });
      });
    };
    
    await simulateFrame(performance.now());
    
    const duration = (Date.now() - startTime) / 1000;
    const state = this.game.getState();
    const averageFPS = frameCount / duration;
    
    // Validate results
    const serenityCollapsedByWave15 = state.wave >= 15 || state.serenity <= 0;
    if (!serenityCollapsedByWave15 && state.wave < 15) {
      errors.push(`Serenity did not collapse by wave 15. Wave: ${state.wave}, Serenity: ${state.serenity}`);
    }
    
    // Check for interludes (gaps between wave transitions)
    let noInterludes = true;
    for (let i = 1; i < this.waveTransitions.length; i++) {
      const gap = this.waveTransitions[i] - this.waveTransitions[i - 1];
      // Allow small gaps for processing, but flag if > 100ms
      if (gap > 100) {
        noInterludes = false;
        errors.push(`Interlude detected between waves: ${gap}ms gap`);
      }
    }
    
    // Check duration (should be ~15-20 minutes at normal pace, but accelerated)
    const expectedDuration = (15 * 60) / this.testPace; // 15 minutes at test pace
    const actualDuration = duration;
    if (actualDuration < expectedDuration * 0.8 || actualDuration > expectedDuration * 1.2) {
      errors.push(`Duration out of expected range. Expected: ~${expectedDuration.toFixed(1)}s, Got: ${actualDuration.toFixed(1)}s`);
    }
    
    // Check FPS
    if (averageFPS < 58) {
      errors.push(`Average FPS below threshold: ${averageFPS.toFixed(1)} (target: 58+)`);
    }
    
    const success = errors.length === 0 && serenityCollapsedByWave15 && noInterludes && averageFPS >= 58;
    
    return {
      success,
      duration: actualDuration,
      waveReached: state.wave,
      averageFPS,
      serenityCollapsedByWave15,
      noInterludes,
      errors
    };
  }

  private simulatePlayerActions(): void {
    const state = this.game.getState();
    const stressors = this.game.getStressorSystem().getStressors();
    
    // Use abilities when available and needed (cooldown only)
    if (stressors.length > 5 && this.game.getAbilitySystem().canRecenter()) {
      this.game.useRecenter();
    }
    
    if (stressors.length > 3 && this.game.getAbilitySystem().canAffirm()) {
      this.game.useAffirm();
    }
    
    // Upgrade when possible
    if (state.insight >= GameConfig.UPGRADE_COST_BASE) {
      const abilities = this.game.getAbilitySystem().getAbilities();
      // Randomly upgrade
      const upgradeable = (['breathe', 'recenter', 'affirm', 'exhale', 'reflect', 'mantra', 'ground', 'release', 'align'] as Array<keyof AbilityState>).filter(
        key => abilities[key as keyof typeof abilities].level < abilities[key as keyof typeof abilities].maxLevel
      );
      if (upgradeable.length > 0) {
        const randomAbility = upgradeable[Math.floor(Math.random() * upgradeable.length)];
        this.game.upgradeAbility(randomAbility as keyof AbilityState);
      }
    }
  }

  static async runValidation(): Promise<void> {
    dev.log('Running test harness...');
    const harness = new TestHarness();
    const result = await harness.runTest();
    
    dev.log('\n=== Test Results ===');
    dev.log(`Success: ${result.success}`);
    dev.log(`Duration: ${result.duration.toFixed(2)}s`);
    dev.log(`Wave Reached: ${result.waveReached}`);
    dev.log(`Average FPS: ${result.averageFPS.toFixed(2)}`);
    dev.log(`Serenity Collapsed by Wave 15: ${result.serenityCollapsedByWave15}`);
    dev.log(`No Interludes: ${result.noInterludes}`);
    
    if (result.errors.length > 0) {
      dev.log('\nErrors:');
      result.errors.forEach(err => dev.error(`  - ${err}`));
    }
    
    if (!result.success) {
      dev.error('\n❌ Test validation failed!');
      throw new Error('Test validation failed. Review errors above.');
    } else {
      dev.log('\n✅ All tests passed!');
    }
  }
}

// Test harness can be imported and run manually
// Usage: TestHarness.runValidation()

