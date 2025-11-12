import { GameState } from '../../../types';
import { FluidUIElement } from '../fluid/FluidUIElement';
import { FluidField } from '../fluid/FluidField';
import { Vector2 } from '../../../types';
import { Color } from '../fluid/Color';

/**
 * Simple stats display showing key-value pairs for tracked game state.
 * Super minimal UI - just Name (Key) and its value.
 */
export class SimpleStatsDisplay extends FluidUIElement {
  private state: GameState | null = null;
  private fontSize: number = 16;
  private lineHeight: number = 24;
  private padding: number = 20;
  
  constructor(position: Vector2) {
    super(position, new Color(0, 0, 0, 0.9), 0);
    this.opacity = 0.9;
  }
  
  setState(state: GameState): void {
    this.state = state;
  }
  
  update(deltaTime: number, fluidField: FluidField, elements: FluidUIElement[]): void {
    // Simple stats don't need complex fluid dynamics
    // Just maintain position
  }
  
  render(ctx: CanvasRenderingContext2D, time: number): void {
    if (!this.state) return;
    
    ctx.save();
    
    // Set font
    ctx.font = `${this.fontSize}px sans-serif`;
    ctx.textBaseline = 'top';
    
    // Get all key-value pairs to display
    const stats = this.getStats();
    
    // Start from top (position.y is top-left corner)
    const startY = this.position.y;
    
    // Render each stat
    stats.forEach((stat, index) => {
      const y = startY + index * this.lineHeight;
      
      // Render key (name)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillText(
        `${stat.key}:`,
        this.position.x,
        y
      );
      
      // Render value
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      const keyWidth = ctx.measureText(`${stat.key}: `).width;
      ctx.fillText(
        stat.value,
        this.position.x + keyWidth,
        y
      );
    });
    
    ctx.restore();
  }
  
  private getStats(): Array<{ key: string; value: string }> {
    if (!this.state) return [];
    
    return [
      { key: 'Serenity', value: `${Math.round(this.state.serenity)}/${this.state.maxSerenity}` },
      { key: 'Insight', value: Math.round(this.state.insight).toString() },
      { key: 'Wave', value: this.state.wave.toString() },
      { key: 'Wave Timer', value: `${Math.round(this.state.waveTimer)}s` },
      { key: 'Pace', value: this.state.pace.toString() }
    ];
  }
  
  getBounds(): { x: number; y: number; width: number; height: number } {
    if (!this.state) {
      return { x: this.position.x, y: this.position.y, width: 0, height: 0 };
    }
    
    const stats = this.getStats();
    const totalHeight = stats.length * this.lineHeight;
    
    // Estimate width (will be calculated based on longest text)
    const tempCtx = document.createElement('canvas').getContext('2d');
    if (tempCtx) {
      tempCtx.font = `${this.fontSize}px sans-serif`;
      let maxWidth = 0;
      stats.forEach(stat => {
        const width = tempCtx.measureText(`${stat.key}: ${stat.value}`).width;
        maxWidth = Math.max(maxWidth, width);
      });
    return {
      x: this.position.x,
      y: this.position.y,
      width: maxWidth,
      height: totalHeight
    };
    }
    
    return {
      x: this.position.x,
      y: this.position.y,
      width: 200,
      height: totalHeight
    };
  }
}

