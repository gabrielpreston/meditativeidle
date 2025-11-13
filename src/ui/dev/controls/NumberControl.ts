/**
 * Number Control
 * 
 * Control for numeric settings with +/- buttons and value display.
 * Supports min/max validation and step increments.
 */

import { BaseControl } from './BaseControl';
import { NumberSettingDefinition } from '../DevPanelTypes';

export class NumberControl extends BaseControl {
  private buttonWidth: number = 30;
  private buttonHeight: number = 25;
  private minusButtonHovered: boolean = false;
  private plusButtonHovered: boolean = false;
  private onValueChange?: (key: string, value: number) => void;

  constructor(setting: NumberSettingDefinition, onValueChange?: (key: string, value: number) => void) {
    super(setting);
    this.onValueChange = onValueChange;
  }

  getHeight(): number {
    return 40;
  }

  render(ctx: CanvasRenderingContext2D): void {
    const setting = this.setting as NumberSettingDefinition;
    const labelY = this.y + 15;
    const buttonY = this.y;

    // Label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(setting.label, this.x + 20, labelY);

    // Value display
    const valueX = this.x + this.width - 180;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    const displayValue = setting.step < 1 
      ? setting.value.toFixed(2) 
      : setting.value.toString();
    const unitDisplay = setting.unit ? ` ${setting.unit}` : '';
    ctx.fillText(displayValue + unitDisplay, valueX, labelY);

    // Minus button
    const minusX = this.x + this.width - 120;
    const isMinusHovered = this.minusButtonHovered || this.isHovered;
    
    ctx.fillStyle = isMinusHovered ? 'rgba(255, 100, 100, 0.8)' : 'rgba(100, 100, 100, 0.6)';
    ctx.fillRect(minusX, buttonY, this.buttonWidth, this.buttonHeight);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('-', minusX + this.buttonWidth / 2, buttonY + 18);

    // Plus button
    const plusX = this.x + this.width - 50;
    const isPlusHovered = this.plusButtonHovered || this.isHovered;
    
    ctx.fillStyle = isPlusHovered ? 'rgba(100, 255, 100, 0.8)' : 'rgba(100, 100, 100, 0.6)';
    ctx.fillRect(plusX, buttonY, this.buttonWidth, this.buttonHeight);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText('+', plusX + this.buttonWidth / 2, buttonY + 18);
  }

  handleClick(x: number, y: number): boolean {
    if (!this.isPointInBounds(x, y)) {
      return false;
    }

    const setting = this.setting as NumberSettingDefinition;
    const minusX = this.x + this.width - 120;
    const plusX = this.x + this.width - 50;
    const buttonY = this.y;

    // Check minus button
    if (x >= minusX && x <= minusX + this.buttonWidth &&
        y >= buttonY && y <= buttonY + this.buttonHeight) {
      this.adjustValue(-setting.step);
      return true;
    }

    // Check plus button
    if (x >= plusX && x <= plusX + this.buttonWidth &&
        y >= buttonY && y <= buttonY + this.buttonHeight) {
      this.adjustValue(setting.step);
      return true;
    }

    return false;
  }

  handleHover(x: number, y: number): void {
    if (!this.isPointInBounds(x, y)) {
      this.minusButtonHovered = false;
      this.plusButtonHovered = false;
      this.isHovered = false;
      return;
    }

    this.isHovered = true;
    const minusX = this.x + this.width - 120;
    const plusX = this.x + this.width - 50;
    const buttonY = this.y;

    // Check which button is hovered
    this.minusButtonHovered = x >= minusX && x <= minusX + this.buttonWidth &&
                              y >= buttonY && y <= buttonY + this.buttonHeight;
    this.plusButtonHovered = x >= plusX && x <= plusX + this.buttonWidth &&
                             y >= buttonY && y <= buttonY + this.buttonHeight;
  }

  handleKey(key: string): boolean {
    const setting = this.setting as NumberSettingDefinition;
    
    if (key === 'ArrowLeft' || key === 'ArrowDown') {
      this.adjustValue(-setting.step);
      return true;
    } else if (key === 'ArrowRight' || key === 'ArrowUp') {
      this.adjustValue(setting.step);
      return true;
    }
    
    return false;
  }

  private adjustValue(delta: number): void {
    const setting = this.setting as NumberSettingDefinition;
    const newValue = Math.max(setting.min, Math.min(setting.max, setting.value + delta));
    
    if (newValue !== setting.value) {
      setting.value = newValue;
      if (this.onValueChange) {
        this.onValueChange(setting.key, newValue);
      }
    }
  }
}

