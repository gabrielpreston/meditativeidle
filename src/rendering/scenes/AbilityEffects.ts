import { Vector2, Stressor, RGB } from '../../types';
import { getAbilityColor, getExhaleWaveColor, getReleaseColor } from '../watercolor/ColorPalette';
import { AbilityConfig } from '../../config/AbilityConfig';
import { FluidSim } from '../watercolor/FluidSim';
import { RippleSystem } from '../watercolor/RippleSystem';
import { SystemContext } from '../../systems/ISystem';

/**
 * AbilityEffects - Visual effects rendering for abilities (fluid-only)
 * 
 * Uses fluid dye injection for liquid watermedia rendering.
 * Design Reference: docs/design/ABILITIES.md
 * Art Direction: docs/design/LIQUID_WATERMEDIA_ART_DIRECTION.md
 */
export class AbilityEffects {
  private width: number;
  private height: number;
  private fluid?: FluidSim;
  private rippleSystem?: RippleSystem;
  
  constructor(width: number, height: number, fluid?: FluidSim) {
    this.width = width;
    this.height = height;
    this.fluid = fluid;
    if (fluid) {
      this.rippleSystem = new RippleSystem(fluid);
    }
  }
  
  setSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }
  
  /**
   * Unified update method using SystemContext
   */
  update(context: SystemContext, center: Vector2, deltaTime: number): void {
    if (!this.fluid) return;
    
    const state = context.state;
    const serenityRatio = state.serenity / state.maxSerenity;
    const affirmActive = context.getAffirmAmplification() > 1.0;
    
    // Aura - REMOVED: No more aura visual, only breath waves
    // if (context.isAuraActive()) {
    //   this.updateAuraFluid(
    //     center,
    //     context.getBreathMaxRadius(),
    //     serenityRatio,
    //     context.getBreatheCycleProgress(),
    //     affirmActive
    //   );
    // }
    
    // Recenter pulse
    if (context.isRecenterPulseActive()) {
      this.updateRecenterFluid(
        center,
        context.getRecenterPulseRadius(),
        serenityRatio,
        affirmActive,
        context.getAffirmAmplification()
      );
    }
    
    // Exhale waves
    const exhaleWaves = context.getExhaleWaves();
    if (exhaleWaves.length > 0) {
      this.updateExhaleFluid(center, exhaleWaves, serenityRatio);
    }
    
    // Reflect barrier
    if (context.isReflectBarrierActive()) {
      this.updateReflectFluid(center, context.getReflectBarrierRadius(), serenityRatio);
    }
    
    // Mantra beam
    if (context.isMantraBeamActive()) {
      const targetId = context.getMantraTargetId();
      const stressors = context.getStressors();
      const target = stressors.find(s => s.id === targetId) || null;
      this.updateMantraFluid(center, target, context.getBreatheCycleProgress(), serenityRatio, affirmActive);
    }
    
    // Ground field
    if (context.isGroundFieldActive()) {
      const fieldPos = context.getGroundFieldPosition();
      if (fieldPos) {
        this.updateGroundFluid(fieldPos, context.getGroundFieldRadius(), serenityRatio);
      }
    }
    
    // Release shockwave
    if (context.wasReleaseJustTriggered()) {
      this.updateReleaseFluid(center, true, serenityRatio);
    }
     
    // Update ripple system
    if (this.rippleSystem) {
      this.rippleSystem.update(deltaTime);
    }
    
    // Breath ability: emit ripple when reaching peak (maximum size)
    if (context.justReachedBreathPeak()) {
      this.createBreathPeakRipple(center, serenityRatio, affirmActive, context);
    }
  }
  
  /**
   * Create a ripple effect when breath ability reaches peak (maximum size).
   * This is a specific visual effect for the breath ability, but uses the generic ripple system.
   */
  private createBreathPeakRipple(
    center: Vector2,
    serenityRatio: number,
    affirmActive: boolean,
    context: SystemContext
  ): void {
    // Get health-based color for the ripple
    const breathColors = getAbilityColor('breathe', serenityRatio, affirmActive);
    const rippleColor = this.hexToRGB(breathColors.primary);
    
    // Get current breath radius at peak (max radius)
    const maxRadius = context.getBreathMaxRadius();
    
    // Create ripple using generic ripple system
    this.createRipple(center, rippleColor, {
      initialRadius: maxRadius, // Start at the breath ability's maximum radius
      maxRadius: maxRadius * 2.0, // Expand to twice the max radius
      speed: 200, // Expansion speed
      velocityStrength: 400, // Outward push strength
      dyeStrength: 1.5, // Color intensity
      layerId: 'ability_breathe_peak'
    });
  }

  private hexToRGB(hex: number): RGB {
    const r = ((hex >> 16) & 0xFF) / 255;
    const g = ((hex >> 8) & 0xFF) / 255;
    const b = (hex & 0xFF) / 255;
    return { r, g, b };
  }

  /**
   * Calculate radial injection points around a center
   */
  private calculateRadialInjectionPoints(center: Vector2, radius: number, count: number): Vector2[] {
    const points: Vector2[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      points.push({
        x: center.x + Math.cos(angle) * radius,
        y: center.y + Math.sin(angle) * radius
      });
    }
    return points;
  }

  /**
   * Calculate circular injection points for field coverage
   */
  private calculateCircularInjectionPoints(center: Vector2, radius: number, count: number): Vector2[] {
    const points: Vector2[] = [];
    // Add center point
    points.push(center);
    // Add points in concentric circles
    const rings = Math.floor(Math.sqrt(count));
    for (let ring = 1; ring <= rings; ring++) {
      const ringRadius = (ring / rings) * radius;
      const ringCount = Math.max(4, Math.floor(count / rings));
      for (let i = 0; i < ringCount; i++) {
        const angle = (i / ringCount) * Math.PI * 2;
        points.push({
          x: center.x + Math.cos(angle) * ringRadius,
          y: center.y + Math.sin(angle) * ringRadius
        });
      }
    }
    return points;
  }

  /**
   * Calculate line injection points between start and end
   */
  private calculateLineInjectionPoints(start: Vector2, end: Vector2, steps: number): Vector2[] {
    const points: Vector2[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      points.push({
        x: start.x + (end.x - start.x) * t,
        y: start.y + (end.y - start.y) * t
      });
    }
    return points;
  }
  
  private updateAuraFluid(
    center: Vector2,
    radius: number,
    serenityRatio: number,
    breatheIntensity: number,
    affirmActive: boolean
  ): void {
    if (!this.fluid) return;
    
    const pulseFactor = 1 + (breatheIntensity * 0.2);
    const pulsedRadius = radius * pulseFactor;
    
    // Use liquid watermedia color palette
    const colors = getAbilityColor('breathe', serenityRatio, affirmActive);
    const color = this.hexToRGB(colors.primary);
    
    // Inject continuous dye at center
    this.fluid.injectDyeEnhanced({
      position: center,
      color: color,
      strength: 0.3 * (0.5 + breatheIntensity * 0.5),
      radius: 8,
      diffusionRate: 0.5,
      viscosity: 0.5,
      temperature: 0.5,
      lifetime: 2.0,
      layerId: 'ability_breathe'
    });
  }
  
  private updateRecenterFluid(
    center: Vector2,
    pulseRadius: number,
    serenityRatio: number,
    affirmActive: boolean,
    affirmAmplification: number
  ): void {
    if (!this.fluid || pulseRadius <= 0) return;
    
    const effectiveRadius = pulseRadius * affirmAmplification;
    
    // Use liquid watermedia color palette (Recenter uses translucent blue-green, golden under Affirm)
    const colors = getAbilityColor('recenter', serenityRatio, affirmActive);
    const color = this.hexToRGB(colors.primary);
    
    // Inject pulse dye into fluid
    if (!this.fluid) return;
    this.fluid.injectDyeEnhanced({
      position: center,
      color: color,
      strength: 0.5 * affirmAmplification,
      radius: effectiveRadius * 0.1, // Scale down for fluid injection
      diffusionRate: 0.7,
      viscosity: 0.3,
      temperature: 0.8,
      lifetime: 1.5,
      layerId: 'ability_recenter'
    });
  }
  
  private updateExhaleFluid(
    center: Vector2,
    waves: Array<{ radius: number; maxRadius: number }>,
    serenityRatio: number
  ): void {
    if (!this.fluid) return;
    const fluid = this.fluid; // Capture for type narrowing
    
    // Inject wave dye into fluid continuously around each wave circle
    waves.forEach((wave) => {
      const progress = wave.radius / wave.maxRadius;
      const waveColors = getExhaleWaveColor(progress, serenityRatio);
      const color = this.hexToRGB(waveColors.color);
      
      // Inject dye continuously around the entire wave circle - EXTREMELY EXAGGERATED
      const numInjectionPoints = Math.max(128, Math.floor(wave.radius * 2.0)); // Massive number of points for ultra-dense coverage
      const angleStep = (Math.PI * 2) / numInjectionPoints;
      
      for (let i = 0; i < numInjectionPoints; i++) {
        const angle = i * angleStep;
        const wavePosition: Vector2 = {
          x: center.x + Math.cos(angle) * wave.radius,
          y: center.y + Math.sin(angle) * wave.radius
        };
        
        // Calculate outward direction for velocity injection
        const outwardDirection = {
          x: Math.cos(angle),
          y: Math.sin(angle)
        };
        
        // EXTREMELY EXAGGERATED: Massive strength that barely fades
        const baseStrength = 5.0; // Extremely high base strength
        const strength = Math.max(2.0, baseStrength * (1 - progress * 0.1)); // Very high minimum, barely fades
        
        fluid.injectDyeEnhanced({
          position: wavePosition,
          color: color,
          strength: strength,
          radius: 200, // EXTREMELY large radius - massive splats
          diffusionRate: 0.98, // Near-maximum diffusion for explosive spread
          viscosity: 0.05, // Ultra-low viscosity for maximum fluidity
          temperature: 1.0, // Maximum temperature
          lifetime: 20.0, // Extremely long lifetime
          layerId: 'ability_exhale',
          dissipation: 0.998 // Ultra-slow dissipation (0.998 means only 0.2% fades per frame)
        });
        
        // EXTREMELY EXAGGERATED: Massive outward velocity to violently push dye
        const outwardSpeed = 3000 * (1 - progress * 0.1); // Extremely high speed
        fluid.injectVelocity(
          wavePosition.x,
          wavePosition.y,
          200, // Massive velocity injection radius
          {
            x: outwardDirection.x * outwardSpeed,
            y: outwardDirection.y * outwardSpeed
          },
          3.0 * strength // Extremely strong velocity injection
        );
      }
    });
  }
  
  private updateReflectFluid(
    center: Vector2,
    radius: number,
    serenityRatio: number
  ): void {
    if (!this.fluid || radius <= 0) return;
    
    const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.1;
    const pulsedRadius = radius * pulse;
    
    // Use liquid watermedia color palette (clean water effect, shifts hue when hit)
    const colors = getAbilityColor('reflect', serenityRatio, false);
    const color = this.hexToRGB(colors.primary);
    
    // Inject barrier dye into fluid (ring pattern)
    const injectionPoints = this.calculateRadialInjectionPoints(center, pulsedRadius * 0.9, 8);
    for (const barrierPosition of injectionPoints) {
      this.fluid.injectDyeEnhanced({
        position: barrierPosition,
        color: color,
        strength: 0.3 * serenityRatio,
        radius: 10,
        diffusionRate: 0.4,
        viscosity: 0.6,
        temperature: 0.5,
        lifetime: 1.5,
        layerId: 'ability_reflect'
      });
    }
  }
  
  private updateMantraFluid(
    center: Vector2,
    target: Stressor | null,
    breatheCycleProgress: number,
    serenityRatio: number,
    affirmActive: boolean = false
  ): void {
    if (!this.fluid || !target) return;
    
    const pulse = 0.8 + (breatheCycleProgress * 0.2);
    
    // Use liquid watermedia color palette (focused indigo → deep violet, gilded under Affirm)
    const colors = getAbilityColor('mantra', serenityRatio, affirmActive);
    const color = this.hexToRGB(colors.primary);
    
    // Inject beam dye along the line
    const injectionPoints = this.calculateLineInjectionPoints(center, target.position, 5);
    for (const beamPosition of injectionPoints) {
      this.fluid.injectDyeEnhanced({
        position: beamPosition,
        color: color,
        strength: 0.5 * pulse,
        radius: 8,
        diffusionRate: 0.3,
        viscosity: 0.7,
        temperature: 0.6,
        lifetime: 1.0,
        layerId: 'ability_mantra'
      });
    }
  }
  
  private updateGroundFluid(
    fieldPos: Vector2 | null,
    fieldRadius: number,
    serenityRatio: number
  ): void {
    if (!this.fluid || !fieldPos || fieldRadius <= 0) return;
    
    // Use liquid watermedia color palette (earthy brown-green → warm ochre, dries to muted gray)
    const colors = getAbilityColor('ground', serenityRatio, false);
    const color = this.hexToRGB(colors.primary);
    
    // Inject field dye into fluid
    this.fluid.injectDyeEnhanced({
      position: fieldPos,
      color: color,
      strength: 0.4 * serenityRatio,
      radius: fieldRadius * 0.3,
      diffusionRate: 0.5,
      viscosity: 0.5,
      temperature: 0.4,
      lifetime: 2.0,
      layerId: 'ability_ground'
    });
  }
  
  private updateReleaseFluid(
    center: Vector2,
    active: boolean,
    serenityRatio: number
  ): void {
    if (!this.fluid || !active) return;
    
    const maxRadius = AbilityConfig.RELEASE_RADIUS;
    
    // Use liquid watermedia color palette (full spectrum → muted gray → pastel recovery)
    const colors = getReleaseColor(serenityRatio);
    const color = this.hexToRGB(colors.color);
    
    // Inject shockwave dye into fluid (radial burst)
    const injectionPoints = this.calculateRadialInjectionPoints(center, maxRadius * 0.7, 12);
    for (const shockwavePosition of injectionPoints) {
      this.fluid.injectDyeEnhanced({
        position: shockwavePosition,
        color: color,
        strength: 0.6,
        radius: 20,
        diffusionRate: 0.8,
        viscosity: 0.2,
        temperature: 0.9,
        lifetime: 1.5,
        layerId: 'ability_release'
      });
    }
  }
  
  private updateAffirmFluid(
    center: Vector2,
    radius: number,
    serenityRatio: number
  ): void {
    if (!this.fluid || radius <= 0) return;
    
    const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.2;
    const pulsedRadius = radius * pulse;
    
    // Use liquid watermedia color palette (golden glaze → warm ochre)
    const colors = getAbilityColor('affirm', serenityRatio, false);
    const color = this.hexToRGB(colors.primary);
    
    // Inject glow dye into fluid (ring pattern)
    const injectionPoints = this.calculateRadialInjectionPoints(center, pulsedRadius * 1.25, 16);
    for (const glowPosition of injectionPoints) {
      this.fluid.injectDyeEnhanced({
        position: glowPosition,
        color: color,
        strength: 0.4 * serenityRatio,
        radius: 12,
        diffusionRate: 0.6,
        viscosity: 0.4,
        temperature: 0.7,
        lifetime: 2.0,
        layerId: 'ability_affirm'
      });
    }
    
    // Also inject at center for stronger glow
    this.fluid.injectDyeEnhanced({
      position: center,
      color: color,
      strength: 0.3 * serenityRatio,
      radius: pulsedRadius * 0.5,
      diffusionRate: 0.5,
      viscosity: 0.5,
      temperature: 0.6,
      lifetime: 2.0,
      layerId: 'ability_affirm'
    });
  }
  
  /**
   * Create a ripple effect at the specified position
   * Useful for stressor deaths, ability impacts, etc.
   */
  createRipple(position: Vector2, color: RGB, options?: {
    initialRadius?: number;
    maxRadius?: number;
    speed?: number;
    velocityStrength?: number;
    dyeStrength?: number;
    layerId?: string;
  }): void {
    if (!this.rippleSystem) return;
    
    this.rippleSystem.createRipple({
      position,
      color,
      initialRadius: options?.initialRadius ?? 5,
      maxRadius: options?.maxRadius ?? 200,
      speed: options?.speed ?? 150,
      velocityStrength: options?.velocityStrength ?? 300,
      dyeStrength: options?.dyeStrength ?? 1.0,
      layerId: options?.layerId ?? 'ability_ripple'
    });
  }
}
