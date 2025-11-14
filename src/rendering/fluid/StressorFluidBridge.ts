import { Stressor, StressorType, Vector2, RGB } from '../../types';
import { LiquidField } from './LiquidField';
import { getStressorColor } from '../../config/ColorConfig';
import { ColorInterpolator } from '../../utils/ColorInterpolator';

interface FluidBehaviorConfig {
  diffusionRate: number;
  viscosity: number;
  baseStrength: number;
}

/**
 * StressorFluidBridge - Bridge between StressorSystem and grid-based LiquidField
 * 
 * Converts stressors to dye injections with type-specific behaviors.
 * Handles death bursts and serenity-based color modulation.
 */
export class StressorFluidBridge {
  private width: number;
  private height: number;
  private injectionRate: number = 1.0; // For LOD throttling
  private previousStressorIds: Set<string> = new Set();
  
  // Type-specific behavior mapping (simplified from WebGL version)
  private typeBehaviors: Map<StressorType, FluidBehaviorConfig> = new Map([
    [StressorType.IntrusiveThought, {
      diffusionRate: 0.5,
      viscosity: 0.3,
      baseStrength: 0.4
    }],
    [StressorType.TimePressure, {
      diffusionRate: 0.8,
      viscosity: 0.2,
      baseStrength: 0.6
    }],
    [StressorType.EnvironmentalNoise, {
      diffusionRate: 0.6,
      viscosity: 0.4,
      baseStrength: 0.5
    }],
    [StressorType.Expectation, {
      diffusionRate: 0.4,
      viscosity: 0.5,
      baseStrength: 0.3
    }],
    [StressorType.Fatigue, {
      diffusionRate: 0.3,
      viscosity: 0.6,
      baseStrength: 0.4
    }],
    [StressorType.Impulse, {
      diffusionRate: 0.9,
      viscosity: 0.1,
      baseStrength: 0.7
    }],
    [StressorType.SelfDoubt, {
      diffusionRate: 0.5,
      viscosity: 0.35,
      baseStrength: 0.35
    }],
    [StressorType.Overwhelm, {
      diffusionRate: 0.95,
      viscosity: 0.15,
      baseStrength: 0.75
    }]
  ]);
  
  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }
  
  /**
   * Set injection rate for LOD throttling (0-1)
   */
  setInjectionRate(rate: number): void {
    this.injectionRate = Math.max(0, Math.min(1, rate));
  }
  
  /**
   * Update stressors and inject dye into fluid field
   * 
   * @param stressors Array of stressors
   * @param field LiquidField to inject into
   * @param serenityRatio Current serenity ratio (0-1) for color modulation
   */
  update(
    stressors: Stressor[],
    field: LiquidField,
    serenityRatio: number
  ): void {
    const currentIds = new Set<string>();
    
    for (const stressor of stressors) {
      currentIds.add(stressor.id);
      
      const behavior = this.typeBehaviors.get(stressor.type);
      if (!behavior) continue;
      
      // Get serenity-modulated color
      const hexColor = getStressorColor(stressor.type, serenityRatio);
      const color = ColorInterpolator.hexToRgb(hexColor);
      
      // Calculate strength based on health and injection rate
      const healthRatio = stressor.health / stressor.maxHealth;
      const strength = behavior.baseStrength * healthRatio * this.injectionRate;
      
      // Inject dye into fluid field
      field.addPigment(
        stressor.position,
        stressor.size,
        color,
        strength,
        this.width,
        this.height
      );
      
      // Increase turbulence for certain stressor types
      if (stressor.type === StressorType.Overwhelm || 
          stressor.type === StressorType.EnvironmentalNoise) {
        // These stressors create more turbulence
        // Note: Turbulence is handled in LiquidField.addPigment now
      }
      
      // Apply flow modification based on stressor velocity
      const speed = Math.sqrt(stressor.velocity.x ** 2 + stressor.velocity.y ** 2);
      if (speed > 0.1) {
        // Create flow in direction of movement
        const flowStrength = speed * 0.01 * behavior.viscosity;
        field.modifyFlow(
          stressor.position,
          stressor.size * 1.5,
          stressor.velocity.x * flowStrength,
          stressor.velocity.y * flowStrength,
          this.width,
          this.height
        );
      }
    }
    
    // Handle death bursts (detect stressors that disappeared)
    this.handleDeathBursts(currentIds, stressors, field, serenityRatio);
    
    // Update previous frame tracking
    this.previousStressorIds = currentIds;
  }
  
  /**
   * Handle death bursts - create dramatic dye injection when stressors die
   */
  private handleDeathBursts(
    currentIds: Set<string>,
    currentStressors: Stressor[],
    field: LiquidField,
    serenityRatio: number
  ): void {
    // Find stressors that existed last frame but not this frame (deaths)
    const deaths = Array.from(this.previousStressorIds).filter(id => !currentIds.has(id));
    
    // Create burst for each death
    // Note: We don't have access to dead stressor properties, so we'll use a generic burst
    // In a full implementation, we'd track stressor properties to create accurate death bursts
    for (const deadId of deaths) {
      // Find the stressor in current list before it died (if available)
      // For now, create a generic burst at center
      // This is a simplified implementation - full version would track stressor positions
    }
  }
  
  /**
   * Resize bridge (called when canvas resizes)
   */
  setSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }
}

