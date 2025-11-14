import { Vector2, Stressor, RGB } from '../../types';
import { SystemContext } from '../../systems/ISystem';
import { getAbilityColor, getExhaleWaveColor, getReleaseColor } from '../watercolor/ColorPalette';
import { getBreathRadius } from '../../utils/BreathUtils';

/**
 * AbilityRenderer - Renders ability visual effects on canvas
 * 
 * Simple canvas-based rendering for ability visual feedback.
 * Design Reference: docs/design/ABILITIES.md
 */
export class AbilityRenderer {
  private width: number;
  private height: number;
  private time: number = 0;
  
  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }
  
  /**
   * Update renderer (advances animation time)
   */
  update(deltaTime: number): void {
    this.time += deltaTime;
  }
  
  /**
   * Render ability effects to canvas
   * 
   * @param ctx Canvas 2D context
   * @param context SystemContext with ability state
   * @param center Center position of playfield
   * @param serenityRatio Current serenity ratio (0-1)
   */
  render(
    ctx: CanvasRenderingContext2D,
    context: SystemContext,
    center: Vector2,
    serenityRatio: number
  ): void {
    const affirmActive = context.getAffirmAmplification() > 1.0;
    
    // Breathe: Pulsing circle
    if (context.isAuraActive()) {
      const breathRadius = getBreathRadius(context.getBreatheCycleProgress());
      const breathColors = getAbilityColor('breathe', serenityRatio, affirmActive);
      const color = this.hexToRgb(breathColors.primary);
      
      ctx.beginPath();
      ctx.arc(center.x, center.y, breathRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.4)`;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    
    // Recenter: Expanding ripple
    if (context.isRecenterPulseActive()) {
      const pulseRadius = context.getRecenterPulseRadius();
      const recenterColors = getAbilityColor('recenter', serenityRatio, affirmActive);
      const color = this.hexToRgb(recenterColors.primary);
      
      ctx.beginPath();
      ctx.arc(center.x, center.y, pulseRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.6)`;
      ctx.lineWidth = 4;
      ctx.stroke();
    }
    
    // Exhale: Expanding rings
    const exhaleWaves = context.getExhaleWaves();
    if (exhaleWaves.length > 0) {
      for (const wave of exhaleWaves) {
        const progress = wave.radius / wave.maxRadius;
        const waveColors = getExhaleWaveColor(progress, serenityRatio);
        const color = this.hexToRgb(waveColors.color);
        const opacity = 0.8 * (1 - progress * 0.5);
        
        ctx.beginPath();
        ctx.arc(center.x, center.y, wave.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity})`;
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    }
    
    // Reflect: Barrier circle
    if (context.isReflectBarrierActive()) {
      const barrierRadius = context.getReflectBarrierRadius();
      const reflectColors = getAbilityColor('reflect', serenityRatio, false);
      const color = this.hexToRgb(reflectColors.primary);
      const pulse = 1 + Math.sin(this.time * 10) * 0.1;
      
      ctx.beginPath();
      ctx.arc(center.x, center.y, barrierRadius * pulse, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.5)`;
      ctx.lineWidth = 4;
      ctx.stroke();
    }
    
    // Mantra: Beam line
    if (context.isMantraBeamActive()) {
      const targetId = context.getMantraTargetId();
      const stressors = context.getStressors();
      const target = stressors.find(s => s.id === targetId);
      
      if (target) {
        const mantraColors = getAbilityColor('mantra', serenityRatio, affirmActive);
        const color = this.hexToRgb(mantraColors.primary);
        
        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.lineTo(center.x + target.position.x, center.y + target.position.y);
        ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.8)`;
        ctx.lineWidth = 4;
        ctx.stroke();
      }
    }
    
    // Ground: Field circle
    if (context.isGroundFieldActive()) {
      const fieldPos = context.getGroundFieldPosition();
      if (fieldPos) {
        const fieldRadius = context.getGroundFieldRadius();
        const groundColors = getAbilityColor('ground', serenityRatio, affirmActive);
        const color = this.hexToRgb(groundColors.primary);
        
        ctx.beginPath();
        ctx.arc(center.x + fieldPos.x, center.y + fieldPos.y, fieldRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.3)`;
        ctx.fill();
        ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.6)`;
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    }
    
    // Release: Expanding clear effect
    if (context.wasReleaseJustTriggered()) {
      const releaseColors = getReleaseColor(serenityRatio);
      const color = this.hexToRgb(releaseColors.color);
      
      // Expanding circle
      const maxRadius = Math.max(this.width, this.height) * 0.8;
      ctx.beginPath();
      ctx.arc(center.x, center.y, maxRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.8)`;
      ctx.lineWidth = 6;
      ctx.stroke();
    }
  }
  
  /**
   * Convert hex color to RGB
   */
  private hexToRgb(hex: number): RGB {
    const r = ((hex >> 16) & 0xFF);
    const g = ((hex >> 8) & 0xFF);
    const b = (hex & 0xFF);
    return { r, g, b };
  }
  
  /**
   * Resize renderer
   */
  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }
}

