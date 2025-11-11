export interface Vector2 {
  x: number;
  y: number;
}

export interface GameState {
  serenity: number;
  maxSerenity: number;
  insight: number;
  wave: number;
  waveTimer: number;
  pace: number;
  isPaused: boolean;
  gameOver: boolean;
  randomSeed: number;
}

export enum StressorType {
  IntrusiveThought = 'intrusive_thought',
  TimePressure = 'time_pressure',
  EnvironmentalNoise = 'environmental_noise',
  Expectation = 'expectation',
  Fatigue = 'fatigue',
  Impulse = 'impulse'
}

export interface Stressor {
  id: string;
  type: StressorType;
  position: Vector2;
  velocity: Vector2;
  health: number;
  maxHealth: number;
  size: number;
  color: string;
  angle: number;
  orbitRadius?: number;
  orbitAngle?: number;
  dashCooldown?: number;
  spawnTime: number;
  slowDebuff?: number; // Persistent slow multiplier (0-1)
}

export interface AbilityBranch {
  id: string;
  name: string;
  description: string;
  effects: BranchEffect[];
}

export interface BranchEffect {
  type: 'damage' | 'radius' | 'cooldown' | 'duration' | 'special';
  modifier: number; // Multiplier or flat value
  description: string;
}

export interface AbilityUpgrade {
  name: string;
  description: string;
  cost: number;
  level: number;
  maxLevel: number;
  // New fields for branching
  branchPoints: number[]; // e.g., [3, 6, 9]
  chosenBranches: Map<number, string>; // level -> branchId
}

export interface AbilityState {
  breathe: AbilityUpgrade;
  recenter: AbilityUpgrade;
  affirm: AbilityUpgrade;
  exhale: AbilityUpgrade;
  reflect: AbilityUpgrade;
  mantra: AbilityUpgrade;
  ground: AbilityUpgrade;
  release: AbilityUpgrade;
  align: AbilityUpgrade;
}

export interface TelemetryData {
  timestamp: number;
  serenity: number;
  insight: number;
  wave: number;
  pace: number;
}

