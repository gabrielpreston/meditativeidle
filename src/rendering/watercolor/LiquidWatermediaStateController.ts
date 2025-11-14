type AffectState = 'calm' | 'focus' | 'overwhelm' | 'recovery';

interface StatePreset {
  diffusionRate: number;
  wetness: number;
}

export class LiquidWatermediaStateController {
  private currentState: AffectState = 'focus';
  private targetPreset: StatePreset;
  private currentPreset: StatePreset;
  private lerpSpeed: number = 0.02; // ~600-1200ms transitions
  private previousSerenityRatio: number = 0.5;
  
  private presets: Record<AffectState, StatePreset> = {
    calm: {
      diffusionRate: 0.2,
      wetness: 0.5
    },
    focus: {
      diffusionRate: 0.5,
      wetness: 0.7
    },
    overwhelm: {
      diffusionRate: 0.8,
      wetness: 0.9
    },
    recovery: {
      diffusionRate: 0.3,
      wetness: 0.6
    }
  };
  
  constructor() {
    this.currentPreset = { ...this.presets.focus };
    this.targetPreset = { ...this.presets.focus };
  }
  
  setAffectState(state: AffectState): void {
    this.currentState = state;
    this.targetPreset = { ...this.presets[state] };
  }
  
  update(serenityRatio: number): void {
    // Auto-detect state from serenity ratio
    let detectedState: AffectState;
    
    if (serenityRatio > 0.7) {
      detectedState = 'calm';
    } else if (serenityRatio > 0.3) {
      detectedState = 'focus';
    } else if (serenityRatio > 0.1) {
      detectedState = 'overwhelm';
    } else {
      detectedState = 'overwhelm'; // Critical state
    }
    
    // Detect recovery: serenity is increasing
    const isRecovering = serenityRatio > this.previousSerenityRatio && 
                         serenityRatio < 0.7 && 
                         this.previousSerenityRatio < serenityRatio;
    
    if (isRecovering) {
      detectedState = 'recovery';
    }
    
    this.previousSerenityRatio = serenityRatio;
    
    // Update state if changed
    if (detectedState !== this.currentState) {
      this.setAffectState(detectedState);
    }
    
    // Lerp current preset toward target preset
    this.currentPreset = {
      diffusionRate: this.lerp(
        this.currentPreset.diffusionRate,
        this.targetPreset.diffusionRate
      ),
      wetness: this.lerp(
        this.currentPreset.wetness,
        this.targetPreset.wetness
      )
    };
  }
  
  /**
   * Get diffusion rate for UI fluid field intensity.
   * Higher values = more pronounced flow in UI elements.
   */
  getDiffusionRate(): number {
    return this.currentPreset.diffusionRate;
  }
  
  // Fluid simulation parameter getters
  // High serenity (calm) → Low viscosity, slow dissipation, less curl
  getViscosity(): number {
    const wetness = this.currentPreset.wetness;
    return 0.0008 + (1 - wetness) * 0.001; // 0.0008 to 0.0018
  }
  
  getDyeDissipation(): number {
    const wetness = this.currentPreset.wetness;
    return 0.9 + wetness * 0.07; // 0.9 to 0.97
  }
  
  getVelocityDissipation(): number {
    const wetness = this.currentPreset.wetness;
    return 0.93 + wetness * 0.05; // 0.93 to 0.98
  }
  
  getCurl(): number {
    const wetness = this.currentPreset.wetness;
    return 15 + (1 - wetness) * 20; // 15 to 35
  }
  
  getPressureIters(): number {
    const wetness = this.currentPreset.wetness;
    return Math.round(12 + (1 - wetness) * 10); // 12 to 22
  }
  
  getRefractionScale(): number {
    const wetness = this.currentPreset.wetness;
    return 0.003 + (1 - wetness) * 0.003; // 0.003 to 0.006
  }
  
  private lerp(a: number, b: number): number {
    return a + (b - a) * this.lerpSpeed;
  }
}

