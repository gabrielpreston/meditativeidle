import { GameState } from '../types';
import { GameConfig } from '../GameConfig';

export class AudioSystem {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientOscillators: OscillatorNode[] = [];
  private isInitialized: boolean = false;
  private reducedMotion: boolean = false;

  constructor() {
    // Audio context will be initialized on user interaction
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = 0.3;
      this.isInitialized = true;
    } catch (e) {
      console.warn('Audio initialization failed:', e);
    }
  }

  setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
  }

  update(state: GameState): void {
    if (!this.audioContext || !this.masterGain || !this.isInitialized) return;
    
    const serenityRatio = state.serenity / state.maxSerenity;
    this.updateAmbient(serenityRatio);
  }

  private updateAmbient(serenityRatio: number): void {
    if (!this.audioContext || !this.masterGain) return;
    
    // Clear existing oscillators
    this.ambientOscillators.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {
        // Ignore errors
      }
    });
    this.ambientOscillators = [];
    
    if (this.reducedMotion) return;
    
    // High serenity: consonant harmonics
    // Low serenity: dissonant tones
    const baseFreq = 220; // A3
    
    if (serenityRatio > 0.5) {
      // Major chord harmonics
      const frequencies = [baseFreq, baseFreq * 1.25, baseFreq * 1.5];
      frequencies.forEach((freq, i) => {
        const osc = this.audioContext!.createOscillator();
        const gain = this.audioContext!.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.value = 0.05 * serenityRatio;
        
        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start();
        
        this.ambientOscillators.push(osc);
      });
    } else {
      // Dissonant intervals
      const frequencies = [baseFreq, baseFreq * 1.1, baseFreq * 1.33];
      frequencies.forEach((freq, i) => {
        const osc = this.audioContext!.createOscillator();
        const gain = this.audioContext!.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        gain.gain.value = 0.03 * (1 - serenityRatio);
        
        // Add filter for low serenity
        const filter = this.audioContext!.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 200 + (1 - serenityRatio) * 300;
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain!);
        osc.start();
        
        this.ambientOscillators.push(osc);
      });
    }
  }

  playAbilitySound(ability: 'breathe' | 'recenter' | 'affirm' | 'exhale' | 'reflect' | 'mantra' | 'ground' | 'release' | 'align', serenityRatio: number): void {
    if (!this.audioContext || !this.masterGain || !this.isInitialized) return;
    if (this.reducedMotion) return;
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    let frequency = 440;
    let duration = 0.2;
    
    switch (ability) {
      case 'breathe':
        frequency = 330 + serenityRatio * 110;
        duration = 0.3;
        break;
      case 'recenter':
        frequency = 550;
        duration = 0.15;
        break;
      case 'affirm':
        frequency = 660;
        duration = 0.25;
        break;
      case 'exhale':
        frequency = 200 + serenityRatio * 100; // Low frequency sweep
        duration = 0.4;
        break;
      case 'reflect':
        frequency = 150; // Low ambient hum
        duration = 0.1; // Continuous, will be called repeatedly
        break;
      case 'mantra':
        frequency = 440 + serenityRatio * 110; // Harmonic hum
        duration = 0.1; // Continuous while channeling
        break;
      case 'ground':
        frequency = 180; // Grounding hum
        duration = 0.1; // Continuous while field active
        break;
      case 'release':
        frequency = 880; // Resonant bell chime
        duration = 0.5;
        break;
      case 'align':
        frequency = 330; // Subtle pulse beat
        duration = 0.1;
        break;
    }
    
    osc.type = 'sine';
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start();
    osc.stop(this.audioContext.currentTime + duration);
  }

  stop(): void {
    this.ambientOscillators.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {
        // Ignore errors
      }
    });
    this.ambientOscillators = [];
  }
}

