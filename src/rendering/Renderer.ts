import { GameState, Stressor, Vector2 } from '../types';
import { GameConfig } from '../GameConfig';
import { distance, smoothstep } from '../utils/MathUtils';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    this.width = canvas.width;
    this.height = canvas.height;
    
    // Create offscreen canvas for bloom effect
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = this.width;
    this.offscreenCanvas.height = this.height;
    this.offscreenCtx = this.offscreenCanvas.getContext('2d')!;
    
    this.setupCanvas();
  }

  private setupCanvas(): void {
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.offscreenCtx.clearRect(0, 0, this.width, this.height);
  }

  render(
    state: GameState,
    center: Vector2,
    stressors: Stressor[],
    auraRadius: number,
    breatheHeld: boolean,
    breatheHoldDuration: number,
    abilitySystem?: any
  ): void {
    this.clear();
    
    const serenityRatio = state.serenity / state.maxSerenity;
    const colors = this.getColors(serenityRatio);
    const affirmActive = abilitySystem?.isAffirmActive() || false;
    
    // Draw background
    this.drawBackground(colors, serenityRatio);
    
    // Draw aura - pulse with breathing cycle (with Affirm color feedback)
    // breatheHoldDuration is the intensity from getBreatheCycleProgress() (0-1 inhale, 1-0 exhale)
    // For the aura, we need to use the same calculation as the progress bar for consistency
    // The aura calculation already handles the intensity value correctly
    this.drawAura(center, auraRadius, serenityRatio, colors, breatheHoldDuration, affirmActive);
    
    // Draw Recenter pulse burst (if ability system provided, with Affirm color feedback)
    if (abilitySystem) {
      this.drawRecenterPulse(center, abilitySystem, serenityRatio, colors);
      // Draw new ability visual effects
      this.drawExhaleWaves(center, abilitySystem, serenityRatio);
      this.drawReflectBarrier(center, abilitySystem, serenityRatio);
      this.drawMantraBeam(center, abilitySystem, stressors, serenityRatio, breatheHoldDuration);
      this.drawGroundField(center, abilitySystem, serenityRatio);
      this.drawReleaseShockwave(center, abilitySystem, serenityRatio);
    }
    
    // Draw stressors
    for (const stressor of stressors) {
      this.drawStressor(stressor, center, serenityRatio);
    }
    
    // Draw center (with Affirm glow effect)
    this.drawCenter(center, serenityRatio, colors, breatheHeld, breatheHoldDuration, affirmActive);
    
    // Draw Affirm active glow effect in game world
    if (affirmActive) {
      this.drawAffirmGlow(center, serenityRatio, colors);
    }
    
    // Apply bloom effect
    this.applyBloom();
  }

  private getColors(serenityRatio: number): typeof GameConfig.COLOR_HIGH_SERENITY {
    const t = smoothstep(0.3, 0.7, serenityRatio);
    const high = GameConfig.COLOR_HIGH_SERENITY;
    const low = GameConfig.COLOR_LOW_SERENITY;
    
    return {
      background: this.lerpColor(low.background, high.background, t),
      center: this.lerpColor(low.center, high.center, t),
      accent: this.lerpColor(low.accent, high.accent, t),
      gold: high.gold
    };
  }

  private lerpColor(color1: string, color2: string, t: number): string {
    const c1 = this.hexToRgb(color1);
    const c2 = this.hexToRgb(color2);
    if (!c1 || !c2) return color1;
    
    const r = Math.round(c1.r + (c2.r - c1.r) * t);
    const g = Math.round(c1.g + (c2.g - c1.g) * t);
    const b = Math.round(c1.b + (c2.b - c1.b) * t);
    
    return `rgb(${r}, ${g}, ${b})`;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  private drawBackground(colors: typeof GameConfig.COLOR_HIGH_SERENITY, serenityRatio: number): void {
    const gradient = this.ctx.createRadialGradient(
      this.width / 2, this.height / 2, 0,
      this.width / 2, this.height / 2, Math.max(this.width, this.height)
    );
    
    gradient.addColorStop(0, colors.background);
    gradient.addColorStop(1, this.darkenColor(colors.background, 0.3));
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Add subtle noise
    this.drawNoise(serenityRatio);
  }

  private drawNoise(serenityRatio: number): void {
    const imageData = this.ctx.createImageData(this.width, this.height);
    const data = imageData.data;
    const intensity = (1 - serenityRatio) * 0.1;
    
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * intensity * 255;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
      data[i + 3] = 255;
    }
    
    this.ctx.putImageData(imageData, 0, 0);
  }

  private darkenColor(color: string, factor: number): string {
    const rgb = this.hexToRgb(color);
    if (!rgb) return color;
    return `rgb(${Math.round(rgb.r * factor)}, ${Math.round(rgb.g * factor)}, ${Math.round(rgb.b * factor)})`;
  }

  private drawAura(center: Vector2, radius: number, serenityRatio: number, colors: typeof GameConfig.COLOR_HIGH_SERENITY, breatheIntensity: number, affirmActive: boolean = false): void {
    // breatheIntensity is already the intensity value from getBreatheCycleProgress():
    // 0-1 during inhale, 1-0 during exhale
    // No conversion needed - use it directly
    
    // Pulse the aura radius with breathing (expand up to 20% on inhale)
    const pulseFactor = 1 + (breatheIntensity * 0.2);
    const pulsedRadius = radius * pulseFactor;
    
    const gradient = this.ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, pulsedRadius);
    const alpha = 0.15 * serenityRatio;
    
    // Change color when Affirm is active (golden/yellow tint)
    if (affirmActive) {
      // Golden/yellow tint for Affirm active
      gradient.addColorStop(0, `rgba(255, 215, 0, ${alpha * 1.2})`); // Gold
      gradient.addColorStop(0.5, `rgba(255, 200, 50, ${alpha * 0.8})`); // Yellow-gold
      gradient.addColorStop(0.7, `rgba(135, 206, 235, ${alpha * 0.6})`); // Blend to blue
      gradient.addColorStop(1, 'transparent');
    } else {
      // Normal blue aura
      gradient.addColorStop(0, `rgba(135, 206, 235, ${alpha})`);
      gradient.addColorStop(0.7, `rgba(135, 206, 235, ${alpha * 0.5})`);
      gradient.addColorStop(1, 'transparent');
    }
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(center.x, center.y, pulsedRadius, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawRecenterPulse(center: Vector2, abilitySystem: any, serenityRatio: number, colors: typeof GameConfig.COLOR_HIGH_SERENITY): void {
    if (!abilitySystem.isRecenterPulseActive()) return;
    
    const pulseRadius = abilitySystem.getRecenterPulseRadius();
    if (pulseRadius <= 0) return;
    
    // Apply Affirm amplification if active
    const affirmActive = abilitySystem.isAffirmActive();
    const affirmAmplification = abilitySystem.getAffirmAmplification();
    const effectiveRadius = pulseRadius * affirmAmplification;
    
    this.ctx.save();
    
    // Use green/cyan color for Recenter, or gold when Affirm is active
    const baseAlpha = 0.4 * serenityRatio;
    let rgb;
    if (affirmActive) {
      // Golden/yellow when Affirm is active
      rgb = { r: 255, g: 215, b: 0 }; // Gold
    } else {
      const pulseColor = colors.accent; // Use accent color (cyan/blue)
      rgb = this.hexToRgb(pulseColor) || { r: 76, g: 175, b: 80 }; // Default to green
    }
    
    // Draw expanding pulse ring
    // Outer ring with gradient fade
    const ringWidth = 15;
    const gradient = this.ctx.createRadialGradient(
      center.x, center.y, Math.max(0, effectiveRadius - ringWidth),
      center.x, center.y, effectiveRadius
    );
    
    gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${baseAlpha})`);
    gradient.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${baseAlpha * 0.6})`);
    gradient.addColorStop(1, 'transparent');
    
    this.ctx.strokeStyle = gradient;
    this.ctx.lineWidth = ringWidth;
    this.ctx.beginPath();
    this.ctx.arc(center.x, center.y, effectiveRadius, 0, Math.PI * 2);
    this.ctx.stroke();
    
    // Inner bright ring for visibility
    this.ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${baseAlpha * 1.2})`;
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(center.x, center.y, effectiveRadius, 0, Math.PI * 2);
    this.ctx.stroke();
    
    this.ctx.restore();
  }

  private drawCenter(center: Vector2, serenityRatio: number, colors: typeof GameConfig.COLOR_HIGH_SERENITY, breatheHeld: boolean, breatheHoldDuration: number, affirmActive: boolean = false): void {
    const radius = GameConfig.CENTER_RADIUS;
    const pulse = 1 + Math.sin(Date.now() * 0.003) * 0.1 * serenityRatio;
    const currentRadius = radius * pulse;
    
    // Outer glow
    const glowGradient = this.ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, currentRadius * 3);
    glowGradient.addColorStop(0, colors.center);
    glowGradient.addColorStop(0.5, this.addAlpha(colors.center, 0.5));
    glowGradient.addColorStop(1, 'transparent');
    
    this.ctx.fillStyle = glowGradient;
    this.ctx.beginPath();
    this.ctx.arc(center.x, center.y, currentRadius * 3, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Center circle
    this.ctx.fillStyle = colors.center;
    this.ctx.beginPath();
    this.ctx.arc(center.x, center.y, currentRadius, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Automatic breathing indicator - continuous ebb and flow
    // Always show breathing animation to represent natural rhythm
    // breatheHoldDuration is the intensity value from getBreatheCycleProgress():
    // 0-1 during inhale, 1-0 during exhale
    const breatheIntensity = breatheHoldDuration;
    
    const breatheRadius = currentRadius + (breatheIntensity * 40); // Expand up to 40px
    
    // Breathing glow that expands and contracts
    const breatheGlowGradient = this.ctx.createRadialGradient(
      center.x, center.y, currentRadius,
      center.x, center.y, breatheRadius
    );
    breatheGlowGradient.addColorStop(0, this.addAlpha(colors.accent, 0.2 * breatheIntensity));
    breatheGlowGradient.addColorStop(1, 'transparent');
    this.ctx.fillStyle = breatheGlowGradient;
    this.ctx.beginPath();
    this.ctx.arc(center.x, center.y, breatheRadius, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Center pulse that matches breathing
    const centerPulse = 1 + (breatheIntensity * 0.15);
    // Change color when Affirm is active
    if (affirmActive) {
      this.ctx.fillStyle = this.addAlpha('#FFD700', 0.4 * breatheIntensity); // Gold
    } else {
      this.ctx.fillStyle = this.addAlpha(colors.accent, 0.3 * breatheIntensity);
    }
    this.ctx.beginPath();
    this.ctx.arc(center.x, center.y, currentRadius * centerPulse, 0, Math.PI * 2);
    this.ctx.fill();
  }
  
  private drawAffirmGlow(center: Vector2, serenityRatio: number, colors: typeof GameConfig.COLOR_HIGH_SERENITY): void {
    // Draw a pulsing golden glow around the center when Affirm is active
    this.ctx.save();
    
    const pulse = 1 + Math.sin(Date.now() * 0.005) * 0.15;
    const glowRadius = GameConfig.CENTER_RADIUS * 4 * pulse;
    
    // Outer golden glow
    const glowGradient = this.ctx.createRadialGradient(
      center.x, center.y, GameConfig.CENTER_RADIUS * 2,
      center.x, center.y, glowRadius
    );
    glowGradient.addColorStop(0, 'rgba(255, 215, 0, 0.2)'); // Gold
    glowGradient.addColorStop(0.5, 'rgba(255, 200, 50, 0.1)');
    glowGradient.addColorStop(1, 'transparent');
    
    this.ctx.fillStyle = glowGradient;
    this.ctx.beginPath();
    this.ctx.arc(center.x, center.y, glowRadius, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Inner bright ring
    const ringGradient = this.ctx.createRadialGradient(
      center.x, center.y, GameConfig.CENTER_RADIUS * 1.5,
      center.x, center.y, GameConfig.CENTER_RADIUS * 2.5
    );
    ringGradient.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
    ringGradient.addColorStop(1, 'transparent');
    
    this.ctx.fillStyle = ringGradient;
    this.ctx.beginPath();
    this.ctx.arc(center.x, center.y, GameConfig.CENTER_RADIUS * 2.5, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.restore();
  }
  
  private drawExhaleWaves(center: Vector2, abilitySystem: any, serenityRatio: number): void {
    const waves = abilitySystem.getExhaleWaves();
    if (waves.length === 0) return;
    
    this.ctx.save();
    
    for (const wave of waves) {
      const progress = wave.radius / wave.maxRadius;
      const alpha = 0.4 * serenityRatio * (1 - progress * 0.5);
      
      // Color gradient: gold → white → blue
      let r = 255, g = 215, b = 0; // Gold
      if (progress > 0.5) {
        const t = (progress - 0.5) * 2;
        r = Math.round(255 - t * 155);
        g = Math.round(215 - t * 115);
        b = Math.round(0 + t * 135);
      }
      
      // Draw expanding ring with gradient fade
      const ringWidth = 20;
      const gradient = this.ctx.createRadialGradient(
        center.x, center.y, Math.max(0, wave.radius - ringWidth),
        center.x, center.y, wave.radius
      );
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`);
      gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${alpha * 0.6})`);
      gradient.addColorStop(1, 'transparent');
      
      this.ctx.strokeStyle = gradient;
      this.ctx.lineWidth = ringWidth;
      this.ctx.beginPath();
      this.ctx.arc(center.x, center.y, wave.radius, 0, Math.PI * 2);
      this.ctx.stroke();
    }
    
    this.ctx.restore();
  }
  
  private drawReflectBarrier(center: Vector2, abilitySystem: any, serenityRatio: number): void {
    if (!abilitySystem.isReflectBarrierActive()) return;
    
    this.ctx.save();
    
    const radius = abilitySystem.getReflectBarrierRadius();
    const alpha = 0.3 * serenityRatio;
    const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.1;
    
    // Draw translucent mirrored sphere
    const gradient = this.ctx.createRadialGradient(
      center.x, center.y, 0,
      center.x, center.y, radius * pulse
    );
    gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.8})`);
    gradient.addColorStop(0.3, `rgba(255, 255, 200, ${alpha * 0.5})`);
    gradient.addColorStop(0.7, `rgba(200, 200, 255, ${alpha * 0.3})`);
    gradient.addColorStop(1, 'transparent');
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(center.x, center.y, radius * pulse, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Rippling surface effect
    this.ctx.strokeStyle = `rgba(255, 215, 0, ${alpha * 0.6})`;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(center.x, center.y, radius * pulse, 0, Math.PI * 2);
    this.ctx.stroke();
    
    this.ctx.restore();
  }
  
  private drawMantraBeam(center: Vector2, abilitySystem: any, stressors: any[], serenityRatio: number, breatheCycleProgress: number): void {
    if (!abilitySystem.isMantraBeamActive()) return;
    
    const targetId = abilitySystem.getMantraTargetId();
    if (!targetId) return;
    
    const target = stressors.find(s => s.id === targetId);
    if (!target) return;
    
    this.ctx.save();
    
    // Draw thin beam from center to target
    const pulse = 0.8 + (breatheCycleProgress * 0.2);
    const alpha = 0.6 * serenityRatio * pulse;
    
    const gradient = this.ctx.createLinearGradient(
      center.x, center.y,
      target.position.x, target.position.y
    );
    gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
    gradient.addColorStop(0.5, `rgba(255, 215, 0, ${alpha * 0.8})`);
    gradient.addColorStop(1, `rgba(255, 200, 100, ${alpha * 0.6})`);
    
    this.ctx.strokeStyle = gradient;
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(center.x, center.y);
    this.ctx.lineTo(target.position.x, target.position.y);
    this.ctx.stroke();
    
    // Add glow effect
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = `rgba(255, 215, 0, ${alpha})`;
    this.ctx.stroke();
    
    this.ctx.restore();
  }
  
  private drawGroundField(center: Vector2, abilitySystem: any, serenityRatio: number): void {
    if (!abilitySystem.isGroundFieldActive()) return;
    
    const fieldPos = abilitySystem.getGroundFieldPosition();
    const fieldRadius = abilitySystem.getGroundFieldRadius();
    if (!fieldPos) return;
    
    this.ctx.save();
    
    const alpha = 0.4 * serenityRatio;
    
    // Draw circular patch with pale green
    const gradient = this.ctx.createRadialGradient(
      fieldPos.x, fieldPos.y, 0,
      fieldPos.x, fieldPos.y, fieldRadius
    );
    gradient.addColorStop(0, `rgba(144, 238, 144, ${alpha * 0.8})`);
    gradient.addColorStop(0.5, `rgba(152, 251, 152, ${alpha * 0.5})`);
    gradient.addColorStop(1, 'transparent');
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(fieldPos.x, fieldPos.y, fieldRadius, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Floating motes (simple particles)
    const time = Date.now() * 0.001;
    for (let i = 0; i < 5; i++) {
      const angle = (time * 0.5 + i * Math.PI * 0.4) % (Math.PI * 2);
      const dist = fieldRadius * 0.6;
      const x = fieldPos.x + Math.cos(angle) * dist;
      const y = fieldPos.y + Math.sin(angle) * dist;
      
      this.ctx.fillStyle = `rgba(144, 238, 144, ${alpha * 0.6})`;
      this.ctx.beginPath();
      this.ctx.arc(x, y, 3, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    this.ctx.restore();
  }
  
  private drawReleaseShockwave(center: Vector2, abilitySystem: any, serenityRatio: number): void {
    if (!abilitySystem.wasReleaseJustTriggered()) return;
    
    this.ctx.save();
    
    // Bright white flash expanding from center
    const maxRadius = GameConfig.RELEASE_RADIUS;
    const flashTime = 0.3; // seconds
    let progress = 1.0; // Start at full, fade out
    
    // This will be called once per frame, so we need to track animation
    // For simplicity, draw a bright expanding circle
    const gradient = this.ctx.createRadialGradient(
      center.x, center.y, 0,
      center.x, center.y, maxRadius
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    gradient.addColorStop(0.2, 'rgba(255, 240, 200, 0.6)');
    gradient.addColorStop(0.5, 'rgba(200, 220, 255, 0.3)');
    gradient.addColorStop(1, 'transparent');
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(center.x, center.y, maxRadius, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.restore();
  }
  
  private drawAlignAura(center: Vector2, abilitySystem: any, auraRadius: number, serenityRatio: number, colors: typeof GameConfig.COLOR_HIGH_SERENITY): void {
    const phase = abilitySystem.getAlignPhase();
    
    // Modify aura colors based on phase (this is integrated into drawAura call)
    // For now, this is a placeholder - actual integration happens in drawAura
  }
  
  private drawStressor(stressor: Stressor, center: Vector2, serenityRatio: number): void {
    const healthRatio = stressor.health / stressor.maxHealth;
    const dist = distance(stressor.position, center);
    const alpha = Math.min(1, healthRatio * 0.8 + 0.2);
    
    // Draw glow
    const glowGradient = this.ctx.createRadialGradient(
      stressor.position.x, stressor.position.y, 0,
      stressor.position.x, stressor.position.y, stressor.size * 2
    );
    glowGradient.addColorStop(0, this.addAlpha(stressor.color, alpha));
    glowGradient.addColorStop(1, 'transparent');
    
    this.ctx.fillStyle = glowGradient;
    this.ctx.beginPath();
    this.ctx.arc(stressor.position.x, stressor.position.y, stressor.size * 2, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Draw stressor
    this.ctx.fillStyle = this.addAlpha(stressor.color, alpha);
    this.ctx.beginPath();
    this.ctx.arc(stressor.position.x, stressor.position.y, stressor.size, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Health indicator
    if (healthRatio < 1) {
      this.ctx.strokeStyle = this.addAlpha('#FFFFFF', 0.5);
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.arc(stressor.position.x, stressor.position.y, stressor.size + 2, 0, Math.PI * 2 * healthRatio);
      this.ctx.stroke();
    }
  }

  private addAlpha(color: string, alpha: number): string {
    const rgb = this.hexToRgb(color);
    if (!rgb) return color;
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
  }

  private applyBloom(): void {
    // Simple bloom: draw offscreen with blur, then composite
    this.offscreenCtx.drawImage(this.ctx.canvas, 0, 0);
    
    // Apply blur (simulated with multiple semi-transparent copies)
    this.ctx.globalCompositeOperation = 'screen';
    this.ctx.globalAlpha = GameConfig.BLOOM_INTENSITY;
    
    for (let i = 0; i < 3; i++) {
      this.ctx.drawImage(this.offscreenCanvas, 0, 0);
    }
    
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.globalAlpha = 1.0;
  }

  renderUI(state: GameState, abilitySystem: any): void {
    // Wave Progress Bar (top center)
    this.drawWaveProgressBar(state);
    
    // Pace indicator (top right)
    this.drawPaceIndicator(this.width - 20, 20, state);
    
    // Bottom center HUD
    this.drawBottomCenterHUD(state, abilitySystem);
    
    // Ability upgrade menu at bottom of HUD
    this.drawAbilityUpgradeMenu(state, abilitySystem);
  }

  private drawBottomCenterHUD(state: GameState, abilitySystem: any): void {
    const centerX = this.width / 2;
    const bottomY = this.height - 20;
    const hudHeight = 130; // Expanded to include upgrade buttons
    const startY = bottomY - hudHeight;
    
    // Background panel
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    this.ctx.fillRect(centerX - 300, startY, 600, hudHeight);
    
    // Border
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(centerX - 300, startY, 600, hudHeight);
    
    // Health (Serenity) - Left side
    this.drawHealthBar(centerX - 250, startY + 10, state);
    
    // Wave - Right side
    this.drawWaveInfo(centerX + 250, startY + 10, state);
    
    // Insight - Below wave
    this.drawInsightInfo(centerX + 250, startY + 45, state);
    
    // Affirm active/cooldown indicator
    this.drawAffirmIndicator(centerX, startY + 45, abilitySystem);
  }
  
  private drawAffirmIndicator(x: number, y: number, abilitySystem: any): void {
    const isActive = abilitySystem.isAffirmActive();
    const activeTimeRemaining = abilitySystem.getAffirmActiveTimeRemaining();
    const cooldownRemaining = abilitySystem.getAffirmCooldownRemaining();
    
    const width = 150; // Increased from 100
    const height = 12; // Increased from 8
    
    // Background with stronger visibility
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(x - width / 2, y, width, height);
    
    if (isActive) {
      // Active state - show time remaining with pulsing gold effect
      const progress = activeTimeRemaining / GameConfig.AFFIRM_DURATION;
      const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.1; // Subtle pulse
      
      // Gold fill with pulse
      const colors = this.getColors(0.8);
      this.ctx.fillStyle = colors.gold;
      this.ctx.fillRect(x - width / 2, y, width * progress, height);
      
      // Pulsing highlight
      this.ctx.fillStyle = `rgba(255, 255, 255, ${0.3 * pulse})`;
      this.ctx.fillRect(x - width / 2, y, width * progress, height / 2);
      
      // Label - larger and more prominent
      this.ctx.fillStyle = colors.gold;
      this.ctx.font = 'bold 13px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'top';
      this.ctx.fillText(`AFFIRM ACTIVE: ${activeTimeRemaining.toFixed(1)}s`, x, y - 18);
      
      // Border - gold when active
      this.ctx.strokeStyle = colors.gold;
      this.ctx.lineWidth = 2;
    } else {
      // Cooldown state - show cooldown remaining
      const progress = cooldownRemaining / GameConfig.AFFIRM_COOLDOWN;
      this.ctx.fillStyle = 'rgba(100, 100, 100, 0.6)';
      this.ctx.fillRect(x - width / 2, y, width * progress, height);
      
      // Label
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      this.ctx.font = '12px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'top';
      this.ctx.fillText(`Affirm: ${cooldownRemaining.toFixed(1)}s`, x, y - 16);
      
      // Border - gray when on cooldown
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      this.ctx.lineWidth = 1;
    }
    
    this.ctx.strokeRect(x - width / 2, y, width, height);
  }
  
  private drawBreatheCycleIndicator(x: number, y: number, cycleProgress: number, isInhaling: boolean): void {
    const width = 100;
    const height = 8;
    
    // Background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    this.ctx.fillRect(x - width / 2, y, width, height);
    
    // Breathing cycle fill - expands and contracts
    const colors = this.getColors(0.8); // Use high serenity colors for breathe
    this.ctx.fillStyle = colors.accent;
    this.ctx.fillRect(x - width / 2, y, width * cycleProgress, height);
    
    // Smooth pulsing effect
    const pulse = Math.sin(Date.now() * 0.005) * 0.1 + 0.9;
    this.ctx.fillStyle = this.addAlpha(colors.accent, pulse);
    this.ctx.fillRect(x - width / 2, y, width * cycleProgress, height);
    
    // Border
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x - width / 2, y, width, height);
    
    // Label with phase indicator
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    this.ctx.font = '10px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    const phaseText = isInhaling ? 'Breathe In' : 'Breathe Out';
    this.ctx.fillText(phaseText, x, y - 14);
  }
  
  private drawHealthBar(x: number, y: number, state: GameState): void {
    const width = 200;
    const height = 12;
    const ratio = state.serenity / state.maxSerenity;
    
    // Label
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    this.ctx.font = '12px sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText('Health', x, y - 16);
    
    // Background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    this.ctx.fillRect(x, y, width, height);
    
    // Fill with color based on health
    let fillColor: string;
    if (ratio > 0.7) {
      fillColor = '#4CAF50'; // Green
    } else if (ratio > 0.4) {
      fillColor = '#FFC107'; // Yellow
    } else {
      fillColor = '#F44336'; // Red
    }
    
    this.ctx.fillStyle = fillColor;
    this.ctx.fillRect(x, y, width * ratio, height);
    
    // Border
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x, y, width, height);
    
    // Percentage text
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    this.ctx.font = '11px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    const percentage = Math.round(ratio * 100);
    this.ctx.fillText(`${percentage}%`, x + width / 2, y + height / 2);
  }
  
  private drawWaveInfo(x: number, y: number, state: GameState): void {
    const colors = this.getColors(state.serenity / state.maxSerenity);
    
    // Label
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    this.ctx.font = '12px sans-serif';
    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText('Wave', x, y - 16);
    
    // Wave number
    this.ctx.fillStyle = colors.accent;
    this.ctx.font = 'bold 20px sans-serif';
    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText(`${state.wave}`, x, y);
  }
  
  private drawInsightInfo(x: number, y: number, state: GameState): void {
    const colors = this.getColors(state.serenity / state.maxSerenity);
    
    // Label
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    this.ctx.font = '12px sans-serif';
    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText('Insight', x, y - 16);
    
    // Insight value with symbol
    this.ctx.fillStyle = colors.gold;
    this.ctx.font = 'bold 16px sans-serif';
    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText(`${Math.round(state.insight)}`, x, y);
    
    // Draw small crystalline symbol
    const symbolSize = 12;
    const symbolX = x - 40;
    const symbolY = y + 2;
    if (state.insight > 0) {
      this.ctx.fillStyle = colors.gold;
      this.ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const px = symbolX + Math.cos(angle) * symbolSize;
        const py = symbolY + Math.sin(angle) * symbolSize;
        if (i === 0) {
          this.ctx.moveTo(px, py);
        } else {
          this.ctx.lineTo(px, py);
        }
      }
      this.ctx.closePath();
      this.ctx.fill();
    }
  }
  
  private drawSerenityRing(state: GameState): void {
    const x = this.width - 40;
    const y = 40;
    const radius = 30;
    const ratio = state.serenity / state.maxSerenity;
    const colors = this.getColors(ratio);
    
    // Draw background ring (empty portion)
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    this.ctx.lineWidth = 6;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.stroke();
    
    // Draw filled portion with color based on health level
    let fillColor: string;
    if (ratio > 0.7) {
      fillColor = '#4CAF50'; // Green for high health
    } else if (ratio > 0.4) {
      fillColor = '#FFC107'; // Yellow/Amber for medium health
    } else {
      fillColor = '#F44336'; // Red for low health
    }
    
    this.ctx.strokeStyle = fillColor;
    this.ctx.lineWidth = 6;
    this.ctx.lineCap = 'round';
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio);
    this.ctx.stroke();
    
    // Add percentage text in center
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    this.ctx.font = 'bold 14px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    const percentage = Math.round(ratio * 100);
    this.ctx.fillText(`${percentage}%`, x, y);
  }

  private drawInsightSymbol(state: GameState): void {
    const x = this.width - 40;
    const y = this.height - 40;
    const size = 20;
    const colors = this.getColors(state.serenity / state.maxSerenity);
    
    if (state.insight > 0) {
      const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.2;
      
      this.ctx.fillStyle = colors.gold;
      this.ctx.beginPath();
      // Draw crystalline shape (hexagon)
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const px = x + Math.cos(angle) * size * pulse;
        const py = y + Math.sin(angle) * size * pulse;
        if (i === 0) {
          this.ctx.moveTo(px, py);
        } else {
          this.ctx.lineTo(px, py);
        }
      }
      this.ctx.closePath();
      this.ctx.fill();
    }
  }

  private drawPaceIndicator(x: number, y: number, state: GameState): void {
    const colors = this.getColors(state.serenity / state.maxSerenity);
    
    // Label
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    this.ctx.font = '12px sans-serif';
    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText('Pace', x, y);
    
    // Pace value
    this.ctx.fillStyle = colors.accent;
    this.ctx.font = 'bold 20px sans-serif';
    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'top';
    const paceText = `${Math.round(state.pace)}x`;
    this.ctx.fillText(paceText, x, y + 16);
  }
  
  private drawAbilityUpgradeMenu(state: GameState, abilitySystem: any): void {
    const centerX = this.width / 2;
    const bottomY = this.height - 20;
    const menuY = bottomY - 80; // At bottom of HUD (80px from screen bottom to accommodate 3 rows)
    const menuHeight = 120; // Increased to fit 3 rows
    const menuWidth = 600;
    const startX = centerX - menuWidth / 2;
    
    const abilities = abilitySystem.getAbilities();
    const abilityKeys: Array<keyof typeof abilities> = ['breathe', 'recenter', 'affirm', 'exhale', 'reflect', 'mantra', 'ground', 'release', 'align'];
    const abilityNames = { 
      breathe: 'Breathe', recenter: 'Recenter', affirm: 'Affirm',
      exhale: 'Exhale', reflect: 'Reflect', mantra: 'Mantra',
      ground: 'Ground', release: 'Release', align: 'Align'
    };
    const abilityColors = { 
      breathe: '#87CEEB', recenter: '#4CAF50', affirm: '#FFD700',
      exhale: '#FFA500', reflect: '#C0C0C0', mantra: '#FFD700',
      ground: '#90EE90', release: '#FFFFFF', align: '#9370DB'
    };
    
    // Subtle divider line above buttons
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(startX, menuY);
    this.ctx.lineTo(startX + menuWidth, menuY);
    this.ctx.stroke();
    
    // 3x3 grid layout for 9 abilities
    const buttonsPerRow = 3;
    const buttonWidth = (menuWidth - 40) / buttonsPerRow;
    const buttonSpacing = 10;
    const buttonHeight = 35;
    const rowHeight = buttonHeight + 5;
    const totalHeight = Math.ceil(abilityKeys.length / buttonsPerRow) * rowHeight;
    const menuHeightAdjusted = Math.min(totalHeight + 10, 120); // Max height with scroll
    
    abilityKeys.forEach((key, index) => {
      const row = Math.floor(index / buttonsPerRow);
      const col = index % buttonsPerRow;
      const ability = abilities[key];
      const buttonX = startX + 10 + col * (buttonWidth + buttonSpacing);
      const buttonY = menuY + 5 + row * rowHeight;
      const btnHeight = buttonHeight; // Use the buttonHeight from above
      
      const upgradeCost = this.getUpgradeCost(key as string, ability);
      const canAfford = state.insight >= upgradeCost;
      const isMaxLevel = ability.level >= ability.maxLevel;
      const isHovered = this.isAbilityHovered(buttonX, buttonY, buttonWidth, btnHeight);
      
      // Button background
      if (isHovered && canAfford && !isMaxLevel) {
        this.ctx.fillStyle = 'rgba(135, 206, 235, 0.4)';
      } else {
        this.ctx.fillStyle = 'rgba(135, 206, 235, 0.1)';
      }
      this.ctx.fillRect(buttonX, buttonY, buttonWidth, btnHeight);
      
      // Button border
      if (canAfford && !isMaxLevel) {
        this.ctx.strokeStyle = isHovered ? abilityColors[key as keyof typeof abilityColors] : 'rgba(135, 206, 235, 0.5)';
      } else {
        this.ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
      }
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(buttonX, buttonY, buttonWidth, btnHeight);
      
      // Ability name (smaller font for 9 abilities)
      this.ctx.fillStyle = canAfford && !isMaxLevel ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.5)';
      this.ctx.font = 'bold 12px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'top';
      this.ctx.fillText(abilityNames[key as keyof typeof abilityNames], buttonX + buttonWidth / 2, buttonY + 3);
      
      // Level
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      this.ctx.font = '10px sans-serif';
      this.ctx.fillText(`Lv.${ability.level}/${ability.maxLevel}`, buttonX + buttonWidth / 2, buttonY + 17);
      
      // Cost or MAX
      if (isMaxLevel) {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.font = '9px sans-serif';
        this.ctx.fillText('MAX', buttonX + buttonWidth / 2, buttonY + 28);
      } else {
        this.ctx.fillStyle = canAfford ? '#FFD700' : 'rgba(255, 255, 255, 0.4)';
        this.ctx.font = '9px sans-serif';
        this.ctx.fillText(`${upgradeCost}`, buttonX + buttonWidth / 2, buttonY + 28);
      }
    });
  }
  
  private getUpgradeCost(key: string, ability: any): number {
    return Math.floor(
      GameConfig.UPGRADE_COST_BASE * 
      Math.pow(GameConfig.UPGRADE_COST_MULTIPLIER, ability.level)
    );
  }
  
  private hoveredAbilityButton: string | null = null;
  
  setHoveredAbility(abilityKey: string | null): void {
    this.hoveredAbilityButton = abilityKey;
  }
  
  private isAbilityHovered(x: number, y: number, width: number, height: number): boolean {
    if (!this.currentMousePos) return false;
    return (
      this.currentMousePos.x >= x &&
      this.currentMousePos.x <= x + width &&
      this.currentMousePos.y >= y &&
      this.currentMousePos.y <= y + height
    );
  }
  
  private currentMousePos: Vector2 | null = null;
  
  updateMousePos(pos: Vector2): void {
    this.currentMousePos = pos;
  }
  
  checkAbilityClick(mousePos: Vector2): string | null {
    const centerX = this.width / 2;
    const bottomY = this.height - 20;
    const menuY = bottomY - 80; // At bottom of HUD
    const menuHeight = 120;
    const menuWidth = 600;
    const startX = centerX - menuWidth / 2;
    
    if (mousePos.y < menuY || mousePos.y > menuY + menuHeight) return null;
    if (mousePos.x < startX + 10 || mousePos.x > startX + menuWidth - 10) return null;
    
    const buttonsPerRow = 3;
    const buttonWidth = (menuWidth - 40) / buttonsPerRow;
    const buttonSpacing = 10;
    const buttonHeight = 35;
    const rowHeight = buttonHeight + 5;
    
    const allAbilities = ['breathe', 'recenter', 'affirm', 'exhale', 'reflect', 'mantra', 'ground', 'release', 'align'];
    
    for (let i = 0; i < allAbilities.length; i++) {
      const row = Math.floor(i / buttonsPerRow);
      const col = i % buttonsPerRow;
      const btnX = startX + 10 + col * (buttonWidth + buttonSpacing);
      const btnY = menuY + 5 + row * rowHeight;
      
      if (mousePos.x >= btnX && mousePos.x <= btnX + buttonWidth &&
          mousePos.y >= btnY && mousePos.y <= btnY + buttonHeight) {
        return allAbilities[i];
      }
    }
    
    return null;
  }

  private drawWaveProgressBar(state: GameState): void {
    const centerX = this.width / 2;
    const y = 20;
    const width = Math.min(400, this.width * 0.6);
    const height = 8; // Slightly taller for better visibility
    const x = centerX - width / 2;
    
    const colors = this.getColors(state.serenity / state.maxSerenity);
    
    // Calculate progress (0 to 1)
    const progress = Math.max(0, Math.min(1, (GameConfig.WAVE_DURATION - state.waveTimer) / GameConfig.WAVE_DURATION));
    
    // Background - use darker, more visible color
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    this.ctx.fillRect(x, y, width, height);
    
    // Progress fill - use bright, contrasting color
    if (progress > 0) {
      // Use gold/yellow for high visibility
      const fillColor = colors.gold || '#FFD700';
      this.ctx.fillStyle = fillColor;
      this.ctx.fillRect(x, y, width * progress, height);
      
      // Add inner highlight for depth
      const highlightGradient = this.ctx.createLinearGradient(x, y, x, y + height);
      highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
      highlightGradient.addColorStop(1, 'transparent');
      this.ctx.fillStyle = highlightGradient;
      this.ctx.fillRect(x, y, width * progress, height / 2);
    }
    
    // Border for definition
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x, y, width, height);
    
    // Add progress percentage text for clarity
    if (progress > 0.1) { // Only show text if there's enough space
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      this.ctx.font = '12px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      const percentage = Math.round(progress * 100);
      this.ctx.fillText(`${percentage}%`, centerX, y + height / 2);
    }
  }

  renderStatsTable(state: GameState, stressors: Stressor[]): void {
    const panelWidth = 500;
    const panelHeight = 600;
    const x = (this.width - panelWidth) / 2;
    const y = (this.height - panelHeight) / 2;
    
    // Background panel
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    this.ctx.fillRect(x, y, panelWidth, panelHeight);
    
    // Border
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, panelWidth, panelHeight);
    
    // Title
    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = 'bold 24px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText('Stressor Stats', x + panelWidth / 2, y + 20);
    
    // Current wave info
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    this.ctx.font = '16px sans-serif';
    this.ctx.fillText(`Wave ${state.wave}`, x + panelWidth / 2, y + 55);
    
    let currentY = y + 90;
    const lineHeight = 35;
    const col1X = x + 20;
    const col2X = x + 150;
    const col3X = x + 280;
    const col4X = x + 380;
    
    // Headers
    this.ctx.fillStyle = '#87CEEB';
    this.ctx.font = 'bold 14px sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Type', col1X, currentY);
    this.ctx.fillText('Speed', col2X, currentY);
    this.ctx.fillText('Health', col3X, currentY);
    this.ctx.fillText('Wave', col4X, currentY);
    
    currentY += lineHeight;
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(col1X, currentY - 5);
    this.ctx.lineTo(x + panelWidth - 20, currentY - 5);
    this.ctx.stroke();
    
    // Stressor types data
    const stressorData = [
      { name: 'Intrusive Thought', key: 'intrusive_thought', waves: '1-3', color: '#8B9DC3' },
      { name: 'Time Pressure', key: 'time_pressure', waves: '4-5', color: '#FFB347' },
      { name: 'Environmental Noise', key: 'environmental_noise', waves: '6-8', color: '#C8A2C8' },
      { name: 'Expectation', key: 'expectation', waves: '9-10', color: '#FF6B6B' },
      { name: 'Fatigue', key: 'fatigue', waves: '11-13', color: '#4A5568' },
      { name: 'Impulse', key: 'impulse', waves: '14+', color: '#FF4757' }
    ];
    
    stressorData.forEach((data, index) => {
      const config = GameConfig.STRESSOR_TYPES[data.key as keyof typeof GameConfig.STRESSOR_TYPES];
      const isAvailable = this.isStressorAvailable(data.key, state.wave);
      
      // Color indicator
      this.ctx.fillStyle = data.color;
      this.ctx.beginPath();
      this.ctx.arc(col1X + 10, currentY + 8, 6, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Name
      this.ctx.fillStyle = isAvailable ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.4)';
      this.ctx.font = '12px sans-serif';
      this.ctx.fillText(data.name, col1X + 25, currentY);
      
      // Speed (relative multiplier)
      const speedText = `${config.speed}x`;
      this.ctx.fillText(speedText, col2X, currentY);
      
      // Health (relative multiplier)
      const healthText = `${config.health}x`;
      this.ctx.fillText(healthText, col3X, currentY);
      
      // Wave range
      this.ctx.fillText(data.waves, col4X, currentY);
      
      // Special abilities
      const specials: string[] = [];
      if ((config as any).wobble) specials.push('Wobble');
      if ((config as any).orbit) specials.push('Orbit');
      if ((config as any).auraResist) specials.push(`${((config as any).auraResist * 100)}% Aura Resist`);
      if ((config as any).acceleration) specials.push('Accelerates');
      
      if (specials.length > 0) {
        this.ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
        this.ctx.font = '10px sans-serif';
        this.ctx.fillText(specials.join(', '), col1X + 25, currentY + 14);
      }
      
      currentY += lineHeight;
    });
    
    // Current wave stats
    currentY += 20;
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.beginPath();
    this.ctx.moveTo(col1X, currentY - 5);
    this.ctx.lineTo(x + panelWidth - 20, currentY - 5);
    this.ctx.stroke();
    
    this.ctx.fillStyle = '#87CEEB';
    this.ctx.font = 'bold 14px sans-serif';
    this.ctx.fillText('Current Wave Stats', col1X, currentY);
    currentY += lineHeight;
    
    const healthMultiplier = Math.pow(GameConfig.STRESSOR_HEALTH_MULTIPLIER, state.wave - 1);
    const speedMultiplier = Math.pow(GameConfig.STRESSOR_SPEED_MULTIPLIER, state.wave - 1);
    const baseHealth = GameConfig.STRESSOR_BASE_HEALTH;
    const baseSpeed = GameConfig.STRESSOR_BASE_SPEED;
    
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    this.ctx.font = '12px sans-serif';
    this.ctx.fillText(`Base Health: ${(baseHealth * healthMultiplier).toFixed(1)}`, col1X, currentY);
    currentY += 20;
    this.ctx.fillText(`Base Speed: ${(baseSpeed * speedMultiplier).toFixed(0)} px/s`, col1X, currentY);
    currentY += 20;
    this.ctx.fillText(`Stressor Count: ${Math.floor(GameConfig.STRESSOR_BASE_COUNT * Math.pow(GameConfig.STRESSOR_COUNT_MULTIPLIER, state.wave - 1))}`, col1X, currentY);
    currentY += 20;
    this.ctx.fillText(`Active Stressors: ${stressors.length}`, col1X, currentY);
    
    // Close hint
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.font = '12px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Press T to close', x + panelWidth / 2, y + panelHeight - 30);
  }
  
  private isStressorAvailable(key: string, wave: number): boolean {
    if (wave <= 3) return key === 'intrusive_thought';
    if (wave <= 5) return key === 'intrusive_thought' || key === 'time_pressure';
    if (wave <= 8) return key === 'intrusive_thought' || key === 'time_pressure' || key === 'environmental_noise';
    if (wave <= 10) return key !== 'fatigue' && key !== 'impulse';
    if (wave <= 13) return key !== 'impulse';
    return true; // All available at wave 14+
  }

  renderReflection(duration: number, wave: number, insight: number): void {
    // Fade to white
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    const centerY = this.height / 2;
    
    // Title
    this.ctx.fillStyle = '#333';
    this.ctx.font = '48px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('You drifted, but you return wiser.', this.width / 2, centerY - 100);
    
    // Stats
    this.ctx.font = '24px sans-serif';
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    this.ctx.fillText(`Duration: ${minutes}:${seconds.toString().padStart(2, '0')}`, this.width / 2, centerY);
    this.ctx.fillText(`Wave Reached: ${wave}`, this.width / 2, centerY + 40);
    this.ctx.fillText(`Insight Gained: ${insight.toFixed(0)}`, this.width / 2, centerY + 80);
    
    // Restart hint
    this.ctx.font = '18px sans-serif';
    this.ctx.fillStyle = '#666';
    this.ctx.fillText('Press SPACE or click to restart', this.width / 2, centerY + 140);
  }
}

