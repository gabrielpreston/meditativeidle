import { Stressor, StressorType, Vector2, RGB, EnhancedDyeInjection } from '../../types';
import { FluidSim } from './FluidSim';
import { StressorCulling } from './StressorCulling';

interface FluidBehaviorConfig {
  diffusionRate: number;
  viscosity: number;
  temperature: number;
  baseStrength: number;
}

/**
 * StressorFluidIntegration - Bridge between StressorSystem and FluidSim
 * 
 * Converts stressors to fluid injections with type-specific behaviors.
 * Handles culling, LOD throttling, and death bursts.
 */
export class StressorFluidIntegration {
  private width: number;
  private height: number;
  private injectionRate: number = 1.0; // Default full rate (for LOD throttling)
  private culling: StressorCulling;
  private previousStressorIds: Set<string> = new Set();
  
  // Type-specific behavior mapping (config)
  private typeBehaviors: Map<StressorType, FluidBehaviorConfig> = new Map([
    [StressorType.IntrusiveThought, {
      diffusionRate: 0.5,
      viscosity: 0.3,
      temperature: 0.6,
      baseStrength: 0.4
    }],
    [StressorType.TimePressure, {
      diffusionRate: 0.8,
      viscosity: 0.2,
      temperature: 0.9,
      baseStrength: 0.6
    }],
    [StressorType.EnvironmentalNoise, {
      diffusionRate: 0.6,
      viscosity: 0.4,
      temperature: 0.7,
      baseStrength: 0.5
    }],
    [StressorType.Expectation, {
      diffusionRate: 0.4,
      viscosity: 0.5,
      temperature: 0.5,
      baseStrength: 0.3
    }],
    [StressorType.Fatigue, {
      diffusionRate: 0.3,
      viscosity: 0.6,
      temperature: 0.4,
      baseStrength: 0.4
    }],
    [StressorType.Impulse, {
      diffusionRate: 0.9,
      viscosity: 0.1,
      temperature: 0.95,
      baseStrength: 0.7
    }],
    [StressorType.SelfDoubt, {
      diffusionRate: 0.5,
      viscosity: 0.35,
      temperature: 0.55,
      baseStrength: 0.35
    }],
    [StressorType.Overwhelm, {
      diffusionRate: 0.95,
      viscosity: 0.15,
      temperature: 0.98,
      baseStrength: 0.75
    }]
  ]);
  
  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.culling = new StressorCulling(width, height);
  }
  
  // Set injection rate for LOD throttling
  setInjectionRate(rate: number): void {
    this.injectionRate = Math.max(0, Math.min(1, rate));
  }
  
  // Bridge logic: Convert stressors to fluid injections
  update(stressors: Stressor[], deltaTime: number, fluid: FluidSim): void {
    const viewport = { x: 0, y: 0, width: this.width, height: this.height };
    const currentIds = new Set<string>();
    
    for (const stressor of stressors) {
      currentIds.add(stressor.id);
      
      // Apply culling: skip non-visible/small/static stressors
      if (!this.culling.shouldInject(stressor, viewport)) continue;
      
      const behavior = this.typeBehaviors.get(stressor.type);
      if (!behavior) continue;
      
      // Calculate injection parameters from stressor state
      const injection = this.createInjection(stressor, behavior, deltaTime);
      
      // Inject into appropriate layer
      fluid.injectDyeEnhanced(injection);
    }
    
    // Handle death bursts (detect stressors that disappeared)
    this.handleDeathBursts(currentIds, fluid);
    
    // Update previous frame tracking
    this.previousStressorIds = currentIds;
  }
  
  private createInjection(stressor: Stressor, behavior: FluidBehaviorConfig, deltaTime: number): EnhancedDyeInjection {
    // Calculate temperature from stressor state (velocity, health ratio)
    const speed = Math.sqrt(stressor.velocity.x ** 2 + stressor.velocity.y ** 2);
    const temperature = behavior.temperature * (1 + speed * 0.1);
    
    return {
      position: stressor.position,
      color: this.hexToRGB(stressor.color),
      strength: behavior.baseStrength * (stressor.health / stressor.maxHealth) * this.injectionRate, // Apply LOD throttling
      radius: stressor.size,
      diffusionRate: behavior.diffusionRate,
      viscosity: behavior.viscosity,
      temperature: Math.min(1, temperature),
      lifetime: 2.0, // 2 seconds
      layerId: `stressor_${stressor.type}`
    };
  }
  
  private handleDeathBursts(currentIds: Set<string>, fluid: FluidSim): void {
    // Find stressors that existed last frame but not this frame (deaths)
    const deaths = Array.from(this.previousStressorIds).filter(id => !currentIds.has(id));
    
    // Create dramatic burst injection for each death
    // Note: We don't have access to the dead stressor's properties, so we'll skip this for now
    // In a full implementation, we'd track stressor properties to create death bursts
    // For now, this is a placeholder
  }
  
  private hexToRGB(hex: string): RGB {
    const r = parseInt(hex.substring(1, 3), 16) / 255;
    const g = parseInt(hex.substring(3, 5), 16) / 255;
    const b = parseInt(hex.substring(5, 7), 16) / 255;
    return { r, g, b };
  }
  
  setSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.culling = new StressorCulling(width, height);
  }
}

