/**
 * Base Control Class
 * 
 * Abstract base class for all developer panel controls.
 * Provides common functionality for rendering, interaction, and state management.
 */

import { SettingDefinition } from '../DevPanelTypes';

export abstract class BaseControl {
  protected setting: SettingDefinition;
  protected x: number = 0;
  protected y: number = 0;
  protected width: number = 0;
  protected isHovered: boolean = false;
  protected isFocused: boolean = false;

  constructor(setting: SettingDefinition) {
    this.setting = setting;
  }

  /**
   * Render the control.
   */
  abstract render(ctx: CanvasRenderingContext2D): void;

  /**
   * Handle click at the given coordinates.
   * Returns true if the click was handled, false otherwise.
   */
  abstract handleClick(x: number, y: number): boolean;

  /**
   * Handle hover at the given coordinates.
   */
  abstract handleHover(x: number, y: number): void;

  /**
   * Handle keyboard input.
   * Returns true if the key was handled, false otherwise.
   */
  abstract handleKey(key: string): boolean;

  /**
   * Get the height of this control.
   */
  abstract getHeight(): number;

  /**
   * Set the position and width of this control.
   */
  setPosition(x: number, y: number, width: number): void {
    this.x = x;
    this.y = y;
    this.width = width;
  }

  /**
   * Set the hovered state.
   */
  setHovered(hovered: boolean): void {
    this.isHovered = hovered;
  }

  /**
   * Set the focused state.
   */
  setFocused(focused: boolean): void {
    this.isFocused = focused;
  }

  /**
   * Check if a point is within the control bounds.
   */
  protected isPointInBounds(x: number, y: number): boolean {
    return x >= this.x && x <= this.x + this.width &&
           y >= this.y && y <= this.y + this.getHeight();
  }
}

