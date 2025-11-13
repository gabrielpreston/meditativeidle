/**
 * Unified FPS counter with exponential moving average smoothing,
 * frame time variance tracking, and 1% low FPS calculation.
 * 
 * Follows singleton pattern matching KeyboardManager.ts
 */
export class FPSCounter {
  private smoothedFPS: number = 60;
  private lastFrameTime: number = performance.now();
  private readonly alpha: number = 0.1; // EMA smoothing factor (~10-frame smoothing)
  
  // Enhanced metrics
  private frameTimes: number[] = []; // Last 100 frame times for variance calculation
  private readonly maxFrameTimeHistory: number = 100;
  private frameTimeVariance: number = 0;
  private onePercentLowFPS: number = 60; // 1% low FPS for perceived smoothness
  
  /**
   * Update FPS counter with new frame time.
   * Should be called once per frame from main.ts animate().
   * 
   * @param deltaTime Frame time in seconds
   */
  update(deltaTime: number): void {
    // Validate and clamp deltaTime to prevent invalid calculations
    deltaTime = Math.max(0.001, Math.min(deltaTime, 1.0)); // Clamp between 0.001s and 1.0s
    
    const currentFPS = 1 / deltaTime;
    this.smoothedFPS = this.alpha * currentFPS + (1 - this.alpha) * this.smoothedFPS;
    
    // Track frame times for variance and 1% low calculation
    this.frameTimes.push(deltaTime);
    if (this.frameTimes.length > this.maxFrameTimeHistory) {
      this.frameTimes.shift();
    }
    
    // Calculate variance (standard deviation of frame times)
    if (this.frameTimes.length >= 10) {
      const mean = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
      const variance = this.frameTimes.reduce((sum, ft) => sum + Math.pow(ft - mean, 2), 0) / this.frameTimes.length;
      this.frameTimeVariance = Math.sqrt(variance);
    }
    
    // Calculate 1% low FPS (worst 1% of frames - slowest frame times)
    if (this.frameTimes.length >= 100) {
      const sorted = [...this.frameTimes].sort((a, b) => a - b);
      // Get worst 1%: index 99% (slowest frames, highest frame times)
      const worstOnePercentIndex = Math.floor(sorted.length * 0.99);
      const worstFrameTime = sorted[worstOnePercentIndex];
      this.onePercentLowFPS = worstFrameTime > 0 ? 1 / worstFrameTime : 60;
    }
  }
  
  /**
   * Get smoothed FPS (exponential moving average).
   * 
   * @returns Smoothed FPS value
   */
  getFPS(): number {
    return this.smoothedFPS;
  }
  
  /**
   * Get frame time variance (standard deviation of frame times).
   * Higher variance indicates more frame time jitter.
   * 
   * @returns Frame time variance in seconds
   */
  getFrameTimeVariance(): number {
    return this.frameTimeVariance;
  }
  
  /**
   * Get 1% low FPS (worst 1% of frames).
   * This metric represents perceived smoothness better than average FPS.
   * 
   * @returns 1% low FPS value
   */
  getOnePercentLowFPS(): number {
    return this.onePercentLowFPS;
  }
}

// Singleton instance
let fpsCounterInstance: FPSCounter | null = null;

/**
 * Get the global FPS counter instance.
 * Follows singleton pattern matching KeyboardManager.ts:198-209
 */
export function getFPSCounter(): FPSCounter {
  if (!fpsCounterInstance) {
    fpsCounterInstance = new FPSCounter();
  }
  return fpsCounterInstance;
}

