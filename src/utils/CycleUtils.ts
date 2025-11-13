/**
 * Cycle Utilities
 * 
 * Generic utilities for managing time-based cycles with phases.
 * These are pure functions with no internal state - state is managed by callers.
 */

export interface CyclePhase {
  name: string;
  startProgress: number; // 0.0 to 1.0
  endProgress: number;   // 0.0 to 1.0
}

export interface CycleConfig {
  duration: number;      // Total cycle duration in seconds
  phases: CyclePhase[];  // Phases in order (must cover 0.0 to 1.0)
}

/**
 * Calculate cycle progress from cycle time.
 * 
 * @param cycleTime - Current cycle time (increments with deltaTime)
 * @param duration - Cycle duration in seconds
 * @returns Progress from 0.0 to 1.0
 */
export function getCycleProgress(cycleTime: number, duration: number): number {
  return (cycleTime % duration) / duration;
}

/**
 * Get the current phase based on cycle progress.
 * 
 * @param progress - Cycle progress (0.0 to 1.0)
 * @param phases - Array of phases in order
 * @returns Current phase, or null if progress is invalid
 */
export function getCurrentPhase(progress: number, phases: CyclePhase[]): CyclePhase | null {
  for (const phase of phases) {
    if (progress >= phase.startProgress && progress < phase.endProgress) {
      return phase;
    }
  }
  
  // Handle edge case: progress exactly at 1.0 (end of cycle)
  const lastPhase = phases[phases.length - 1];
  if (progress >= lastPhase.startProgress && progress <= lastPhase.endProgress) {
    return lastPhase;
  }
  
  return null;
}

/**
 * Check if cycle just transitioned to a specific phase.
 * 
 * @param currentProgress - Current cycle progress
 * @param previousProgress - Previous cycle progress
 * @param targetPhase - Phase to check transition to
 * @returns True if just transitioned to target phase
 */
export function justTransitionedToPhase(
  currentProgress: number,
  previousProgress: number,
  targetPhase: CyclePhase
): boolean {
  // Check if we crossed the start threshold
  const crossedStart = previousProgress < targetPhase.startProgress && 
                       currentProgress >= targetPhase.startProgress;
  
  // Handle wrap-around (cycle reset)
  const wrappedAround = previousProgress > targetPhase.startProgress && 
                        currentProgress < targetPhase.startProgress;
  
  return crossedStart || wrappedAround;
}

/**
 * Get phase-specific progress within current phase.
 * 
 * @param overallProgress - Overall cycle progress (0.0 to 1.0)
 * @param phase - Current phase
 * @returns Progress within phase (0.0 to 1.0)
 */
export function getPhaseProgress(overallProgress: number, phase: CyclePhase): number {
  const phaseDuration = phase.endProgress - phase.startProgress;
  if (phaseDuration === 0) return 0;
  
  const progressInPhase = overallProgress - phase.startProgress;
  return Math.max(0, Math.min(1, progressInPhase / phaseDuration));
}

/**
 * Create a two-phase cycle (e.g., inhale/exhale).
 * 
 * @param phase1Name - Name of first phase
 * @param phase1Duration - Duration of first phase (0.0 to 1.0)
 * @param phase2Name - Name of second phase
 * @returns CycleConfig with two phases
 */
export function createTwoPhaseCycle(
  phase1Name: string,
  phase1Duration: number,
  phase2Name: string
): CycleConfig {
  return {
    duration: 1.0, // Normalized - actual duration comes from config
    phases: [
      { name: phase1Name, startProgress: 0.0, endProgress: phase1Duration },
      { name: phase2Name, startProgress: phase1Duration, endProgress: 1.0 }
    ]
  };
}

