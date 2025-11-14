import { FluidUIElement } from '../fluid/FluidUIElement';
import { Color } from '../fluid/Color';
import { Vector2, GameState, Stressor } from '../../../types';
import { GameConfig } from '../../../GameConfig';
import { smoothstep } from '../../../utils/MathUtils';

/**
 * FluidStatsTable renders the stats table with liquid watermedia effects.
 * The panel has an organic, flowing shape with text that blends and flows.
 */
export class FluidStatsTable extends FluidUIElement {
  private state: GameState | null = null;
  private stressors: Stressor[] = [];
  private fadeInProgress: number = 0;
  private isVisible: boolean = false;
  private hoveredRow: number | null = null;
  private currentMousePos: Vector2 | null = null;
  private width: number = 0;
  private height: number = 0;
  
  constructor(position: Vector2) {
    const initialColor = Color.fromRGB(0, 0, 0, 0.85);
    super(position, initialColor, 0);
    this.blendRadius = 0;
    this.setTargetOpacity(0);
  }
  
  /**
   * Show the stats table with fade-in effect.
   */
  show(state: GameState, stressors: Stressor[]): void {
    this.state = state;
    this.stressors = stressors;
    this.isVisible = true;
    this.fadeInProgress = 0;
    this.setTargetOpacity(1.0);
  }
  
  /**
   * Hide the stats table with fade-out effect.
   */
  hide(): void {
    this.isVisible = false;
    this.setTargetOpacity(0);
  }
  
  /**
   * Update mouse position for hover detection.
   */
  updateMousePos(pos: Vector2): void {
    this.currentMousePos = pos;
    this.updateHoveredRow();
  }
  
  /**
   * Update which row is hovered.
   */
  private updateHoveredRow(): void {
    if (!this.currentMousePos || !this.isVisible) {
      this.hoveredRow = null;
      return;
    }
    
    const panelWidth = 500;
    const panelHeight = 600;
    const x = (this.width - panelWidth) / 2;
    const y = (this.height - panelHeight) / 2;
    
    // Check if mouse is in table area
    if (this.currentMousePos.x < x || this.currentMousePos.x > x + panelWidth ||
        this.currentMousePos.y < y + 90 || this.currentMousePos.y > y + panelHeight - 30) {
      this.hoveredRow = null;
      return;
    }
    
    // Calculate row
    const lineHeight = 35;
    const startY = y + 90;
    const row = Math.floor((this.currentMousePos.y - startY) / lineHeight);
    
    // Check if row is valid (skip header row)
    if (row > 0 && row <= 6) {
      this.hoveredRow = row - 1; // -1 because header is row 0
    } else {
      this.hoveredRow = null;
    }
  }
  
  /**
   * Get organic panel shape points (flowing blob).
   */
  private getPanelShape(time: number): Vector2[] {
    const panelWidth = 500;
    const panelHeight = 600;
    const centerX = this.position.x;
    const centerY = this.position.y;
    
    const points: Vector2[] = [];
    const numPoints = 16;
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const baseRadiusX = panelWidth / 2;
      const baseRadiusY = panelHeight / 2;
      
      // Add wobble for organic shape
      const wobbleX = Math.sin(angle * 3 + time * 0.001) * 5;
      const wobbleY = Math.cos(angle * 2 + time * 0.001) * 5;
      
      points.push({
        x: centerX + Math.cos(angle) * (baseRadiusX + wobbleX),
        y: centerY + Math.sin(angle) * (baseRadiusY + wobbleY)
      });
    }
    
    return points;
  }
  
  render(ctx: CanvasRenderingContext2D, time: number): void {
    if (!this.isVisible || this.opacity <= 0) return;
    
    const panelWidth = 500;
    const panelHeight = 600;
    const x = (this.width - panelWidth) / 2;
    const y = (this.height - panelHeight) / 2;
    
    // Update fade-in progress
    this.fadeInProgress = Math.min(1, this.fadeInProgress + 0.05);
    
    // Get organic panel shape
    const panelShape = this.getPanelShape(time);
    
    // Draw organic panel background
    ctx.beginPath();
    const startPoint = panelShape[0];
    ctx.moveTo(startPoint.x, startPoint.y);
    
    for (let i = 1; i < panelShape.length; i++) {
      const point = panelShape[i];
      const nextPoint = panelShape[(i + 1) % panelShape.length];
      
      // Use quadratic curves for smooth, organic shape
      const cpX = (point.x + nextPoint.x) / 2;
      const cpY = (point.y + nextPoint.y) / 2;
      
      ctx.quadraticCurveTo(point.x, point.y, cpX, cpY);
    }
    ctx.closePath();
    
    // Fill with gradient (color bleeds outward)
    const gradient = ctx.createRadialGradient(
      this.position.x, this.position.y, 0,
      this.position.x, this.position.y, Math.max(panelWidth, panelHeight) / 2
    );
    gradient.addColorStop(0, this.color.withAlpha(0.9 * this.opacity).toString());
    gradient.addColorStop(0.5, this.color.withAlpha(0.85 * this.opacity).toString());
    gradient.addColorStop(1, this.color.withAlpha(0.7 * this.opacity).toString());
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Edge darkening (pigment pooling)
    const edgeColor = this.color.darken(0.2);
    ctx.strokeStyle = edgeColor.withAlpha(0.8 * this.opacity).toString();
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Title with liquid watermedia effect
    ctx.fillStyle = Color.fromHex(GameConfig.COLOR_HIGH_SERENITY.gold)
      .withAlpha(this.opacity).toString();
    ctx.font = 'bold 24px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    ctx.shadowBlur = 4;
    ctx.shadowColor = Color.fromHex(GameConfig.COLOR_HIGH_SERENITY.gold)
      .darken(0.3).withAlpha(0.6 * this.opacity).toString();
    
    ctx.fillText('Stressor Stats', this.position.x, y + 20);
    ctx.shadowBlur = 0;
    
    if (!this.state) return;
    
    // Current wave info
    ctx.fillStyle = Color.fromRGB(255, 255, 255)
      .withAlpha(0.9 * this.opacity).toString();
    ctx.font = '16px serif';
    ctx.fillText(`Wave ${this.state.wave}`, this.position.x, y + 55);
    
    let currentY = y + 90;
    const lineHeight = 35;
    const col1X = x + 20;
    const col2X = x + 150;
    const col3X = x + 280;
    const col4X = x + 380;
    
    // Headers
    ctx.fillStyle = Color.fromHex(GameConfig.COLOR_HIGH_SERENITY.accent)
      .withAlpha(this.opacity).toString();
    ctx.font = 'bold 14px serif';
    ctx.textAlign = 'left';
    ctx.fillText('Type', col1X, currentY);
    ctx.fillText('Speed', col2X, currentY);
    ctx.fillText('Health', col3X, currentY);
    ctx.fillText('Wave', col4X, currentY);
    
    currentY += lineHeight;
    
    // Divider line (flows)
    ctx.strokeStyle = Color.fromRGB(255, 255, 255)
      .withAlpha(0.2 * this.opacity).toString();
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(col1X, currentY - 5);
    ctx.lineTo(x + panelWidth - 20, currentY - 5);
    ctx.stroke();
    
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
      const isHovered = this.hoveredRow === index;
      const isAvailable = this.isStressorAvailable(data.key, this.state!.wave);
      
      // Row background (flows on hover)
      if (isHovered && isAvailable) {
        const hoverGradient = ctx.createLinearGradient(
          col1X, currentY,
          x + panelWidth - 20, currentY
        );
        hoverGradient.addColorStop(0, Color.fromHex(data.color)
          .withAlpha(0.2 * this.opacity).toString());
        hoverGradient.addColorStop(1, Color.fromHex(data.color)
          .withAlpha(0.05 * this.opacity).toString());
        
        ctx.fillStyle = hoverGradient;
        ctx.fillRect(col1X, currentY - 5, x + panelWidth - 20 - col1X, lineHeight);
      }
      
      // Type name
      const typeColor = isAvailable 
        ? Color.fromHex(data.color)
        : Color.fromRGB(100, 100, 100);
      ctx.fillStyle = typeColor.withAlpha((isAvailable ? 0.9 : 0.4) * this.opacity).toString();
      ctx.font = isHovered ? 'bold 12px serif' : '12px serif';
      ctx.fillText(data.name, col1X, currentY);
      
      if (isAvailable) {
        const healthMultiplier = Math.pow(GameConfig.STRESSOR_HEALTH_MULTIPLIER, this.state!.wave - 1);
        const speedMultiplier = Math.pow(GameConfig.STRESSOR_SPEED_MULTIPLIER, this.state!.wave - 1);
        const baseHealth = GameConfig.STRESSOR_BASE_HEALTH;
        const baseSpeed = GameConfig.STRESSOR_BASE_SPEED;
        
        const typeConfig = GameConfig.STRESSOR_TYPES[data.key as keyof typeof GameConfig.STRESSOR_TYPES];
        const health = baseHealth * healthMultiplier * (typeConfig?.health || 1);
        const speed = baseSpeed * speedMultiplier * (typeConfig?.speed || 1);
        
        ctx.fillStyle = Color.fromRGB(255, 255, 255)
          .withAlpha(0.9 * this.opacity).toString();
        ctx.font = '12px serif';
        ctx.fillText(`${speed.toFixed(0)}`, col2X, currentY);
        ctx.fillText(`${health.toFixed(1)}`, col3X, currentY);
        ctx.fillText(data.waves, col4X, currentY);
      } else {
        ctx.fillStyle = Color.fromRGB(100, 100, 100)
          .withAlpha(0.4 * this.opacity).toString();
        ctx.font = '12px serif';
        ctx.fillText('-', col2X, currentY);
        ctx.fillText('-', col3X, currentY);
        ctx.fillText(data.waves, col4X, currentY);
      }
      
      currentY += lineHeight;
    });
    
    // Current Wave Stats section
    currentY += 20;
    ctx.strokeStyle = Color.fromRGB(255, 255, 255)
      .withAlpha(0.2 * this.opacity).toString();
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(col1X, currentY - 5);
    ctx.lineTo(x + panelWidth - 20, currentY - 5);
    ctx.stroke();
    
    ctx.fillStyle = Color.fromHex(GameConfig.COLOR_HIGH_SERENITY.accent)
      .withAlpha(this.opacity).toString();
    ctx.font = 'bold 14px serif';
    ctx.fillText('Current Wave Stats', col1X, currentY);
    currentY += lineHeight;
    
    const healthMultiplier = Math.pow(GameConfig.STRESSOR_HEALTH_MULTIPLIER, this.state.wave - 1);
    const speedMultiplier = Math.pow(GameConfig.STRESSOR_SPEED_MULTIPLIER, this.state.wave - 1);
    const baseHealth = GameConfig.STRESSOR_BASE_HEALTH;
    const baseSpeed = GameConfig.STRESSOR_BASE_SPEED;
    
    ctx.fillStyle = Color.fromRGB(255, 255, 255)
      .withAlpha(0.9 * this.opacity).toString();
    ctx.font = '12px serif';
    ctx.fillText(`Base Health: ${(baseHealth * healthMultiplier).toFixed(1)}`, col1X, currentY);
    currentY += 20;
    ctx.fillText(`Base Speed: ${(baseSpeed * speedMultiplier).toFixed(0)} px/s`, col1X, currentY);
    currentY += 20;
    ctx.fillText(`Stressor Count: ${Math.floor(GameConfig.STRESSOR_BASE_COUNT * Math.pow(GameConfig.STRESSOR_COUNT_MULTIPLIER, this.state.wave - 1))}`, col1X, currentY);
    currentY += 20;
    ctx.fillText(`Active Stressors: ${this.stressors.length}`, col1X, currentY);
    
    // Close hint
    ctx.fillStyle = Color.fromRGB(255, 255, 255)
      .withAlpha(0.5 * this.opacity).toString();
    ctx.font = '12px serif';
    ctx.textAlign = 'center';
    ctx.fillText('Press T to close', this.position.x, y + panelHeight - 30);
  }
  
  private isStressorAvailable(key: string, wave: number): boolean {
    if (wave <= 3) return key === 'intrusive_thought';
    if (wave <= 5) return key === 'intrusive_thought' || key === 'time_pressure';
    if (wave <= 8) return key === 'intrusive_thought' || key === 'time_pressure' || key === 'environmental_noise';
    if (wave <= 10) return key !== 'fatigue' && key !== 'impulse';
    if (wave <= 13) return key !== 'impulse';
    return true; // All available at wave 14+
  }
  
  /**
   * Set dimensions for hit testing.
   */
  setDimensions(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }
}

