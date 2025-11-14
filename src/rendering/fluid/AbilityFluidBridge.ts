import { Vector2, AbilityState, RGB } from '../../types';
import { SystemContext } from '../../systems/ISystem';
import { LiquidField } from './LiquidField';
import { EffectPrimitives } from './EffectPrimitives';
import { getAbilityColor, getExhaleWaveColor, getReleaseColor } from '../watercolor/ColorPalette';
import { ColorInterpolator } from '../../utils/ColorInterpolator';
import { getBreathRadius, getBreathMaxRadius } from '../../utils/BreathUtils';

/**
 * AbilityFluidBridge - Bridge between AbilitySystem and grid-based LiquidField
 * 
 * Maps abilities to effect primitives for fluid simulation.
 * Design Reference: docs/design/ABILITIES.md
 */
export class AbilityFluidBridge {
  private effectPrimitives: EffectPrimitives;
  private width: number;
  private height: number;
  
  constructor(effectPrimitives: EffectPrimitives, width: number, height: number) {
    this.effectPrimitives = effectPrimitives;
    this.width = width;
    this.height = height;
  }
  
  /**
   * Update ability effects - maps abilities to fluid effects
   * 
   * @param context SystemContext with ability state
   * @param center Center position of playfield
   * @param serenityRatio Current serenity ratio (0-1)
   * @param deltaTime Time since last frame
   */
  update(
    context: SystemContext,
    center: Vector2,
    serenityRatio: number,
    deltaTime: number
  ): void {
    const affirmActive = context.getAffirmAmplification() > 1.0;
    const affirmAmplification = context.getAffirmAmplification();
    
    // Breathe: AddPigment (lavender) + ModifyFlow (slow)
    if (context.isAuraActive()) {
      const breathRadius = getBreathRadius(context.getBreatheCycleProgress());
      const breathColors = getAbilityColor('breathe', serenityRatio, affirmActive);
      const color = this.hexToRgb(breathColors.primary);
      
      // Continuous pigment injection
      this.effectPrimitives.addPigment(
        center,
        breathRadius,
        color,
        0.3 * (0.5 + context.getBreatheCycleProgress() * 0.5),
        0.1 // Short duration, continuously refreshed
      );
      
      // Slow flow in breath area (calming effect)
      this.effectPrimitives.modifyFlow(
        center,
        breathRadius * 1.2,
        -center.x * 0.001, // Gentle inward flow
        -center.y * 0.001,
        0.1
      );
    }
    
    // Recenter: Expanding ClearRegion + ModifyFlow
    if (context.isRecenterPulseActive()) {
      const pulseRadius = context.getRecenterPulseRadius();
      const recenterColors = getAbilityColor('recenter', serenityRatio, affirmActive);
      const color = this.hexToRgb(recenterColors.primary);
      
      // Expanding clear region
      this.effectPrimitives.clearRegion(
        center,
        pulseRadius,
        0.3 * affirmAmplification, // Fade rate
        1.5 // Duration
      );
      
      // Modify flow (slowing effect)
      this.effectPrimitives.modifyFlow(
        center,
        pulseRadius,
        0, // No directional push
        0,
        1.5
      );
      
      // Add pigment at edge for visual feedback
      this.effectPrimitives.addPigment(
        center,
        pulseRadius * 0.1,
        color,
        0.5 * affirmAmplification,
        1.5
      );
    }
    
    // Exhale: Expanding AddPigment rings
    const exhaleWaves = context.getExhaleWaves();
    if (exhaleWaves.length > 0) {
      for (const wave of exhaleWaves) {
        const progress = wave.radius / wave.maxRadius;
        const waveColors = getExhaleWaveColor(progress, serenityRatio);
        const color = this.hexToRgb(waveColors.color);
        
        // Expanding ring of pigment
        const numPoints = Math.max(16, Math.floor(wave.radius / 10));
        for (let i = 0; i < numPoints; i++) {
          const angle = (i / numPoints) * Math.PI * 2;
          const wavePos: Vector2 = {
            x: center.x + Math.cos(angle) * wave.radius,
            y: center.y + Math.sin(angle) * wave.radius
          };
          
          this.effectPrimitives.addPigment(
            wavePos,
            20,
            color,
            0.8 * (1 - progress * 0.5),
            2.0
          );
          
          // Outward flow
          const outwardX = Math.cos(angle);
          const outwardY = Math.sin(angle);
          this.effectPrimitives.modifyFlow(
            wavePos,
            30,
            outwardX * 0.5,
            outwardY * 0.5,
            2.0
          );
        }
      }
    }
    
    // Reflect: Barrier AddPigment
    if (context.isReflectBarrierActive()) {
      const barrierRadius = context.getReflectBarrierRadius();
      const reflectColors = getAbilityColor('reflect', serenityRatio, false);
      const color = this.hexToRgb(reflectColors.primary);
      
      // Barrier ring
      const numPoints = 16;
      for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        const barrierPos: Vector2 = {
          x: center.x + Math.cos(angle) * barrierRadius * 0.9,
          y: center.y + Math.sin(angle) * barrierRadius * 0.9
        };
        
        this.effectPrimitives.addPigment(
          barrierPos,
          15,
          color,
          0.4 * serenityRatio,
          1.5
        );
      }
    }
    
    // Mantra: Focused AddPigment beam
    if (context.isMantraBeamActive()) {
      const targetId = context.getMantraTargetId();
      const stressors = context.getStressors();
      const target = stressors.find(s => s.id === targetId);
      
      if (target) {
        const mantraColors = getAbilityColor('mantra', serenityRatio, affirmActive);
        const color = this.hexToRgb(mantraColors.primary);
        
        // Beam line from center to target
        const steps = 20;
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const beamPos: Vector2 = {
            x: center.x + (target.position.x - center.x) * t,
            y: center.y + (target.position.y - center.y) * t
          };
          
          this.effectPrimitives.addPigment(
            beamPos,
            10,
            color,
            0.6,
            0.5
          );
        }
      }
    }
    
    // Ground: Area AddPigment trap
    if (context.isGroundFieldActive()) {
      const fieldPos = context.getGroundFieldPosition();
      if (fieldPos) {
        const fieldRadius = context.getGroundFieldRadius();
        const groundColors = getAbilityColor('ground', serenityRatio, affirmActive);
        const color = this.hexToRgb(groundColors.primary);
        
        // Area trap
        this.effectPrimitives.addPigment(
          fieldPos,
          fieldRadius,
          color,
          0.5,
          3.0
        );
      }
    }
    
    // Release: Large ClearRegion
    if (context.wasReleaseJustTriggered()) {
      const releaseColors = getReleaseColor(serenityRatio);
      const color = this.hexToRgb(releaseColors.color);
      
      // Large clearing effect
      this.effectPrimitives.clearRegion(
        center,
        Math.max(this.width, this.height) * 0.8,
        0.5, // Fast fade
        2.0
      );
      
      // Add release color at center
      this.effectPrimitives.addPigment(
        center,
        50,
        color,
        1.0,
        2.0
      );
    }
    
    // Align: Modulate flow based on phase
    const alignPhase = context.getAlignPhase();
    const alignBonus = context.getAlignBonus();
    if (alignBonus > 0) {
      // Modify flow based on phase
      const flowStrength = alignBonus * 0.01;
      if (alignPhase === 'offense') {
        // Outward flow
        this.effectPrimitives.modifyFlow(
          center,
          getBreathMaxRadius() * 2,
          flowStrength,
          flowStrength,
          0.1
        );
      } else {
        // Inward flow
        this.effectPrimitives.modifyFlow(
          center,
          getBreathMaxRadius() * 2,
          -flowStrength,
          -flowStrength,
          0.1
        );
      }
    }
  }
  
  /**
   * Convert hex color to RGB
   */
  private hexToRgb(hex: number): RGB {
    const r = ((hex >> 16) & 0xFF) / 255;
    const g = ((hex >> 8) & 0xFF) / 255;
    const b = (hex & 0xFF) / 255;
    return { r, g, b };
  }
  
  /**
   * Resize bridge
   */
  setSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }
}

