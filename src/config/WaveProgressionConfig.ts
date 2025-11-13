import { StressorType } from '../types';

/**
 * Wave Progression Configuration
 * 
 * Defines when each stressor type becomes available based on wave number.
 * Matches design specifications from docs/design/STRESSORS.md
 */
export interface WaveUnlock {
  wave: number;
  stressorType: StressorType;
}

export const WAVE_UNLOCKS: WaveUnlock[] = [
  { wave: 1, stressorType: StressorType.IntrusiveThought },
  { wave: 4, stressorType: StressorType.TimePressure },
  { wave: 6, stressorType: StressorType.EnvironmentalNoise },
  { wave: 9, stressorType: StressorType.Expectation },
  { wave: 11, stressorType: StressorType.Fatigue },
  { wave: 12, stressorType: StressorType.SelfDoubt },
  { wave: 13, stressorType: StressorType.Overwhelm },
];

/**
 * Get all stressor types available at a given wave
 * @param wave - Current wave number
 * @returns Array of available stressor types
 */
export function getAvailableStressorTypes(wave: number): StressorType[] {
  return WAVE_UNLOCKS
    .filter(unlock => unlock.wave <= wave)
    .map(unlock => unlock.stressorType);
}

