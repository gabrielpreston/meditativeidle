import { WatercolorUniforms } from './WatercolorPass';

type AffectState = 'calm' | 'focus' | 'overwhelm' | 'recovery';

interface StatePreset {
  edgeDarkeningIntensity: number;
  bleedRadius: number;
  diffusionRate: number;
  pigmentSaturation: number;
  wetness: number;
  toonThreshold: number;
}

export class WatercolorStateController {
  private currentState: AffectState = 'focus';
  private targetPreset: StatePreset;
  private currentPreset: StatePreset;
  private lerpSpeed: number = 0.02; // ~600-1200ms transitions
  private previousSerenityRatio: number = 0.5;
  
  private presets: Record<AffectState, StatePreset> = {
    calm: {
      edgeDarkeningIntensity: 0.1,
      bleedRadius: 1.0,
      diffusionRate: 0.2,
      pigmentSaturation: 0.8,
      wetness: 0.5,
      toonThreshold: 0.3
    },
    focus: {
      edgeDarkeningIntensity: 0.3,
      bleedRadius: 2.0,
      diffusionRate: 0.5,
      pigmentSaturation: 1.0,
      wetness: 0.7,
      toonThreshold: 0.5
    },
    overwhelm: {
      edgeDarkeningIntensity: 0.6,
      bleedRadius: 4.0,
      diffusionRate: 0.8,
      pigmentSaturation: 0.6,
      wetness: 0.9,
      toonThreshold: 0.2
    },
    recovery: {
      edgeDarkeningIntensity: 0.2,
      bleedRadius: 1.5,
      diffusionRate: 0.3,
      pigmentSaturation: 0.9,
      wetness: 0.6,
      toonThreshold: 0.4
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
      edgeDarkeningIntensity: this.lerp(
        this.currentPreset.edgeDarkeningIntensity,
        this.targetPreset.edgeDarkeningIntensity
      ),
      bleedRadius: this.lerp(
        this.currentPreset.bleedRadius,
        this.targetPreset.bleedRadius
      ),
      diffusionRate: this.lerp(
        this.currentPreset.diffusionRate,
        this.targetPreset.diffusionRate
      ),
      pigmentSaturation: this.lerp(
        this.currentPreset.pigmentSaturation,
        this.targetPreset.pigmentSaturation
      ),
      wetness: this.lerp(
        this.currentPreset.wetness,
        this.targetPreset.wetness
      ),
      toonThreshold: this.lerp(
        this.currentPreset.toonThreshold,
        this.targetPreset.toonThreshold
      )
    };
  }
  
  getUniforms(): Partial<WatercolorUniforms> {
    return {
      edgeDarkeningIntensity: this.currentPreset.edgeDarkeningIntensity,
      bleedRadius: this.currentPreset.bleedRadius,
      diffusionRate: this.currentPreset.diffusionRate,
      pigmentSaturation: this.currentPreset.pigmentSaturation,
      wetness: this.currentPreset.wetness,
      toonThreshold: this.currentPreset.toonThreshold
    };
  }
  
  private lerp(a: number, b: number): number {
    return a + (b - a) * this.lerpSpeed;
  }
}

