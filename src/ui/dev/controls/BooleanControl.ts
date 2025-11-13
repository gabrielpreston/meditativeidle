/**
 * Boolean Control
 * 
 * Control for boolean settings with a toggle switch visualization.
 */

import { BaseControl } from './BaseControl';
import { BooleanSettingDefinition } from '../DevPanelTypes';

export class BooleanControl extends BaseControl {
  private toggleWidth: number = 50;
  private toggleHeight: number = 25;
  private toggleHovered: boolean = false;
  private onValueChange?: (key: string, value: boolean) => void;

  constructor(setting: BooleanSettingDefinition, onValueChange?: (key: string, value: boolean) => void) {
    super(setting);
    this.onValueChange = onValueChange;
  }

  getHeight(): number {
    return 40;
  }

  render(ctx: CanvasRenderingContext2D): void {
    const setting = this.setting as BooleanSettingDefinition;
    const labelY = this.y + 15;
    const toggleY = this.y;

    // Label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(setting.label, this.x + 20, labelY);

    // Toggle switch
    const toggleX = this.x + this.width - 80;
    const isOn = setting.value;
    const radius = this.toggleHeight / 2;
    const padding = 2;

    // Background (rounded rectangle)
    ctx.fillStyle = isOn 
      ? (this.toggleHovered ? 'rgba(100, 255, 100, 0.9)' : 'rgba(100, 255, 100, 0.7)')
      : (this.toggleHovered ? 'rgba(100, 100, 100, 0.8)' : 'rgba(100, 100, 100, 0.6)');
    ctx.beginPath();
    ctx.moveTo(toggleX + radius, toggleY);
    ctx.lineTo(toggleX + this.toggleWidth - radius, toggleY);
    ctx.quadraticCurveTo(toggleX + this.toggleWidth, toggleY, toggleX + this.toggleWidth, toggleY + radius);
    ctx.lineTo(toggleX + this.toggleWidth, toggleY + this.toggleHeight - radius);
    ctx.quadraticCurveTo(toggleX + this.toggleWidth, toggleY + this.toggleHeight, toggleX + this.toggleWidth - radius, toggleY + this.toggleHeight);
    ctx.lineTo(toggleX + radius, toggleY + this.toggleHeight);
    ctx.quadraticCurveTo(toggleX, toggleY + this.toggleHeight, toggleX, toggleY + this.toggleHeight - radius);
    ctx.lineTo(toggleX, toggleY + radius);
    ctx.quadraticCurveTo(toggleX, toggleY, toggleX + radius, toggleY);
    ctx.closePath();
    ctx.fill();

    // Toggle circle
    const circleX = isOn 
      ? toggleX + this.toggleWidth - radius - padding
      : toggleX + radius + padding;
    const circleY = toggleY + radius;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.beginPath();
    ctx.arc(circleX, circleY, radius - padding, 0, Math.PI * 2);
    ctx.fill();

    // Text label (ON/OFF)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(isOn ? 'ON' : 'OFF', toggleX + this.toggleWidth / 2, labelY);
  }

  handleClick(x: number, y: number): boolean {
    if (!this.isPointInBounds(x, y)) {
      return false;
    }

    const toggleX = this.x + this.width - 80;
    const toggleY = this.y;

    // Check if click is on toggle
    if (x >= toggleX && x <= toggleX + this.toggleWidth &&
        y >= toggleY && y <= toggleY + this.toggleHeight) {
      this.toggle();
      return true;
    }

    return false;
  }

  handleHover(x: number, y: number): void {
    if (!this.isPointInBounds(x, y)) {
      this.toggleHovered = false;
      this.isHovered = false;
      return;
    }

    this.isHovered = true;
    const toggleX = this.x + this.width - 80;
    const toggleY = this.y;

    this.toggleHovered = x >= toggleX && x <= toggleX + this.toggleWidth &&
                         y >= toggleY && y <= toggleY + this.toggleHeight;
  }

  handleKey(key: string): boolean {
    if (key === 'Enter' || key === ' ') {
      this.toggle();
      return true;
    }
    return false;
  }

  private toggle(): void {
    const setting = this.setting as BooleanSettingDefinition;
    setting.value = !setting.value;
    
    if (this.onValueChange) {
      this.onValueChange(setting.key, setting.value);
    }
  }
}

