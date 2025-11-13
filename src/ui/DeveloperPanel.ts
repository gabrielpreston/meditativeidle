/**
 * Developer Panel
 * 
 * Provides a slide-in panel for adjusting game settings during development.
 * Features: search/filter, scrollable content, keyboard navigation, collapsible sections,
 * presets, and type-safe config updates.
 */

import { FluidUIElement } from '../rendering/ui/fluid/FluidUIElement';
import { Color } from '../rendering/ui/fluid/Color';
import { Vector2 } from '../types';
import { DevPanelRegistry } from './dev/DevPanelRegistry';
import { SettingCategory, SettingDefinition, NumberSettingDefinition, BooleanSettingDefinition } from './dev/DevPanelTypes';
import { BaseControl } from './dev/controls/BaseControl';
import { NumberControl } from './dev/controls/NumberControl';
import { BooleanControl } from './dev/controls/BooleanControl';
import { ScrollableContainer } from './dev/ScrollableContainer';
import { ConfigUpdater } from './dev/ConfigUpdater';
import { DevPanelPresets } from './dev/DevPanelPresets';

type SettingChangeCallback = (key: string, value: number | boolean) => void;

export class DeveloperPanel extends FluidUIElement {
  private isVisible: boolean = false;
  private slideProgress: number = 0; // 0 = hidden, 1 = visible
  private panelWidth: number = 400;
  private viewportHeight: number = 0;
  private currentMousePos: Vector2 | null = null;
  private onSettingChange?: SettingChangeCallback;

  // Registry and categories
  private categories: SettingCategory[] = [];
  private filteredCategories: SettingCategory[] = [];
  private controls: Map<string, BaseControl> = new Map();

  // Search state (integrated)
  private searchQuery: string = '';
  private isSearchFocused: boolean = false;
  private searchInputY: number = 0;

  // Keyboard navigation state (integrated)
  private focusedCategoryIndex: number = 0;
  private focusedSettingIndex: number = -1;

  // Scrolling
  private scrollContainer: ScrollableContainer = new ScrollableContainer();

  // Layout constants
  private readonly headerHeight = 60;
  private readonly searchHeight = 40;
  private readonly categoryHeaderHeight = 25;
  private readonly settingHeight = 40;
  private readonly categorySpacing = 10;
  private readonly padding = 20;

  constructor(position: Vector2) {
    const initialColor = Color.fromRGB(0, 0, 0, 0.9);
    super(position, initialColor, 0);
    this.blendRadius = 0;
    this.setTargetOpacity(0);

    // Initialize registry and config updater
    DevPanelRegistry.initialize();
    ConfigUpdater.initialize();

    // Load categories and create controls
    this.refreshCategories();
  }

  /**
   * Set callback for when settings change.
   */
  setSettingChangeCallback(callback: SettingChangeCallback): void {
    this.onSettingChange = callback;
  }

  /**
   * Set dimensions for hit testing.
   */
  setDimensions(width: number, height: number): void {
    this.viewportHeight = height;
    this.scrollContainer.updateDimensions(this.calculateContentHeight(), height - this.headerHeight - this.searchHeight);
  }

  /**
   * Toggle panel visibility.
   */
  toggle(): void {
    this.isVisible = !this.isVisible;
    this.setTargetOpacity(this.isVisible ? 1.0 : 0);
    if (this.isVisible) {
      this.refreshCategories(); // Refresh values from GameConfig
    }
  }

  /**
   * Show the panel.
   */
  show(): void {
    this.isVisible = true;
    this.setTargetOpacity(1.0);
    this.refreshCategories();
  }

  /**
   * Hide the panel.
   */
  hide(): void {
    this.isVisible = false;
    this.setTargetOpacity(0);
  }

  /**
   * Check if panel is visible.
   */
  getIsVisible(): boolean {
    return this.isVisible;
  }

  /**
   * Handle wheel event for scrolling.
   */
  handleWheel(deltaY: number): boolean {
    if (!this.isVisible) return false;
    this.scrollContainer.handleWheel(deltaY);
    return true;
  }

  /**
   * Update mouse position for hover detection.
   */
  updateMousePos(pos: Vector2): void {
    this.currentMousePos = pos;
    if (this.isVisible) {
      this.updateHoverStates();
    }
  }

  /**
   * Check if mouse click is within panel bounds and handle interactions.
   * Returns true if click was handled, false otherwise.
   */
  checkClick(mousePos: Vector2): boolean {
    if (!this.isVisible) return false;

    const panelX = -this.panelWidth + (this.panelWidth * this.slideProgress);
    if (mousePos.x < panelX || mousePos.x > panelX + this.panelWidth) {
      return false;
    }

    const relativeX = mousePos.x - panelX;
    const relativeY = mousePos.y;

    // Check search input click
    if (relativeY >= this.headerHeight && relativeY <= this.headerHeight + this.searchHeight) {
      this.isSearchFocused = true;
      return true;
    }

    // Check scrollbar
    const scrollY = this.scrollContainer.getScrollY();
    const contentY = this.headerHeight + this.searchHeight - scrollY;
    if (this.scrollContainer.isPointOnScrollbar(relativeX, relativeY, panelX, contentY, this.panelWidth, this.viewportHeight - this.headerHeight - this.searchHeight)) {
      this.scrollContainer.startDrag(relativeY);
      return true;
    }

    // Check category headers (for collapse/expand)
    let currentY = contentY;
    for (let catIdx = 0; catIdx < this.filteredCategories.length; catIdx++) {
      const category = this.filteredCategories[catIdx];
      const headerY = currentY;
      
      if (relativeY >= headerY && relativeY <= headerY + this.categoryHeaderHeight) {
        this.toggleCategory(category.id);
        return true;
      }

      currentY += this.categoryHeaderHeight;

      // Check settings in this category
      if (!category.collapsed) {
        for (let setIdx = 0; setIdx < category.settings.length; setIdx++) {
          const setting = category.settings[setIdx];
          const control = this.controls.get(setting.key);
          if (control) {
            const settingY = currentY;
            control.setPosition(panelX + this.padding, settingY, this.panelWidth - this.padding * 2);
            if (control.handleClick(relativeX, relativeY)) {
              return true;
            }
          }
          currentY += this.settingHeight;
        }
      }
      currentY += this.categorySpacing;
    }

    return false;
  }

  /**
   * Handle keyboard input.
   */
  handleKeyEvent(event: KeyboardEvent): boolean {
    if (!this.isVisible) return false;

    const key = event.key;
    const ctrl = event.ctrlKey;
    const shift = event.shiftKey;

    // Backtick is handled by global handler - never process it here
    if (key === '`' || key === '~') {
      return false;
    }

    // Search focus shortcut
    if (key === '/' && !this.isSearchFocused) {
      this.isSearchFocused = true;
      return true;
    }

    // Escape to unfocus search or close panel
    if (key === 'Escape') {
      if (this.isSearchFocused) {
        this.isSearchFocused = false;
        return true;
      }
      // Could close panel here if desired
      return false;
    }

    // Handle search input
    if (this.isSearchFocused) {
      if (key === 'Backspace') {
        this.searchQuery = this.searchQuery.slice(0, -1);
        this.filterCategories();
        return true;
      } else if (key.length === 1 && !ctrl) {
        this.searchQuery += key;
        this.filterCategories();
        return true;
      }
      return false;
    }

    // Keyboard navigation
    if (key === 'ArrowDown') {
      this.navigateNext();
      return true;
    } else if (key === 'ArrowUp') {
      this.navigatePrevious();
      return true;
    } else if (key === 'Enter' || key === ' ') {
      return this.activateFocusedSetting();
    } else if (key === 'Tab') {
      if (shift) {
        this.navigatePrevious();
      } else {
        this.navigateNext();
      }
      return true;
    }

    // Preset shortcuts
    if (ctrl && key === 's') {
      // Save preset (would need name input - simplified for now)
      return true;
    } else if (ctrl && key === 'r') {
      // Reset to defaults
      ConfigUpdater.reset();
      this.refreshCategories();
      return true;
    }

    // Handle focused control keyboard input
    if (this.focusedCategoryIndex >= 0 && this.focusedSettingIndex >= 0) {
      const category = this.filteredCategories[this.focusedCategoryIndex];
      if (category && this.focusedSettingIndex < category.settings.length) {
        const setting = category.settings[this.focusedSettingIndex];
        const control = this.controls.get(setting.key);
        if (control && control.handleKey(key)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Refresh categories from registry and update control values.
   */
  private refreshCategories(): void {
    this.categories = DevPanelRegistry.getCategories();
    
    // Update setting values from GameConfig
    for (const category of this.categories) {
      for (const setting of category.settings) {
        const currentValue = DevPanelRegistry.getDefaultValue(setting.key);
        if (setting.type === 'number') {
          (setting as NumberSettingDefinition).value = currentValue as number;
        } else if (setting.type === 'boolean') {
          (setting as BooleanSettingDefinition).value = currentValue as boolean;
        }
      }
    }

    // Recreate controls
    this.createControls();
    this.filterCategories();
  }

  /**
   * Create control instances for all settings.
   */
  private createControls(): void {
    this.controls.clear();

    for (const category of this.categories) {
      for (const setting of category.settings) {
        let control: BaseControl;

        if (setting.type === 'number') {
          control = new NumberControl(
            setting as NumberSettingDefinition,
            (key: string, value: number) => this.onSettingValueChange(key, value)
          );
        } else {
          control = new BooleanControl(
            setting as BooleanSettingDefinition,
            (key: string, value: boolean) => this.onSettingValueChange(key, value)
          );
        }

        this.controls.set(setting.key, control);
      }
    }
  }

  /**
   * Filter categories based on search query.
   */
  private filterCategories(): void {
    if (!this.searchQuery.trim()) {
      this.filteredCategories = this.categories.map(cat => ({ ...cat }));
      return;
    }

    const query = this.searchQuery.toLowerCase().trim();
    this.filteredCategories = this.categories.map(category => {
      const filteredSettings = category.settings.filter(setting =>
        setting.label.toLowerCase().includes(query) ||
        setting.key.toLowerCase().includes(query) ||
        (setting.description && setting.description.toLowerCase().includes(query))
      );

      return {
        ...category,
        settings: filteredSettings
      };
    }).filter(category => category.settings.length > 0);
  }

  /**
   * Handle setting value change.
   */
  private onSettingValueChange(key: string, value: number | boolean): void {
    // Update registry
    DevPanelRegistry.updateSettingValue(key, value);

    // Update GameConfig via ConfigUpdater
    ConfigUpdater.update(key, value);

    // Notify callback
    if (this.onSettingChange) {
      this.onSettingChange(key, value);
    }
  }

  /**
   * Toggle category collapse/expand.
   */
  private toggleCategory(categoryId: string): void {
    const category = this.categories.find(cat => cat.id === categoryId);
    if (category) {
      category.collapsed = !category.collapsed;
      // Update filtered categories too
      const filteredCat = this.filteredCategories.find(cat => cat.id === categoryId);
      if (filteredCat) {
        filteredCat.collapsed = category.collapsed;
      }
    }
  }

  /**
   * Navigate to next setting.
   */
  private navigateNext(): void {
    if (this.filteredCategories.length === 0) return;

    this.focusedSettingIndex++;
    const category = this.filteredCategories[this.focusedCategoryIndex];

    if (!category || this.focusedSettingIndex >= category.settings.length) {
      this.focusedCategoryIndex++;
      this.focusedSettingIndex = 0;

      if (this.focusedCategoryIndex >= this.filteredCategories.length) {
        this.focusedCategoryIndex = 0;
        this.focusedSettingIndex = 0;
      }
    }
  }

  /**
   * Navigate to previous setting.
   */
  private navigatePrevious(): void {
    if (this.filteredCategories.length === 0) return;

    this.focusedSettingIndex--;

    if (this.focusedSettingIndex < 0) {
      this.focusedCategoryIndex--;
      if (this.focusedCategoryIndex < 0) {
        this.focusedCategoryIndex = this.filteredCategories.length - 1;
      }
      const category = this.filteredCategories[this.focusedCategoryIndex];
      this.focusedSettingIndex = category ? category.settings.length - 1 : 0;
    }
  }

  /**
   * Activate the focused setting (for keyboard input).
   */
  private activateFocusedSetting(): boolean {
    if (this.focusedCategoryIndex < 0 || this.focusedSettingIndex < 0) return false;

    const category = this.filteredCategories[this.focusedCategoryIndex];
    if (!category || this.focusedSettingIndex >= category.settings.length) return false;

    const setting = category.settings[this.focusedSettingIndex];
    const control = this.controls.get(setting.key);
    if (control) {
      return control.handleKey('Enter');
    }

    return false;
  }

  /**
   * Update hover states for all controls.
   */
  private updateHoverStates(): void {
    if (!this.currentMousePos) return;

    const panelX = -this.panelWidth + (this.panelWidth * this.slideProgress);
    const relativeX = this.currentMousePos.x - panelX;
    const relativeY = this.currentMousePos.y;
    const scrollY = this.scrollContainer.getScrollY();
    const contentY = this.headerHeight + this.searchHeight - scrollY;

    let currentY = contentY;
    for (const category of this.filteredCategories) {
      currentY += this.categoryHeaderHeight;

      if (!category.collapsed) {
        for (const setting of category.settings) {
          const control = this.controls.get(setting.key);
          if (control) {
            control.setPosition(panelX + this.padding, currentY, this.panelWidth - this.padding * 2);
            control.handleHover(relativeX, relativeY);
          }
          currentY += this.settingHeight;
        }
      }
      currentY += this.categorySpacing;
    }
  }

  /**
   * Calculate total content height.
   */
  private calculateContentHeight(): number {
    let height = this.headerHeight + this.searchHeight;
    
    for (const category of this.filteredCategories) {
      height += this.categoryHeaderHeight;
      if (!category.collapsed) {
        height += category.settings.length * this.settingHeight;
      }
      height += this.categorySpacing;
    }

    return height;
  }

  /**
   * Render the panel with slide animation.
   */
  render(ctx: CanvasRenderingContext2D, time: number): void {
    if (!this.isVisible && this.opacity <= 0) return;

    // Animate slide progress
    const targetProgress = this.isVisible ? 1 : 0;
    this.slideProgress += (targetProgress - this.slideProgress) * 0.15;

    const panelX = -this.panelWidth + (this.panelWidth * this.slideProgress);
    const panelY = 0;

    ctx.save();
    ctx.globalAlpha = this.opacity;

    // Update scroll container dimensions
    const contentHeight = this.calculateContentHeight();
    this.scrollContainer.updateDimensions(contentHeight, this.viewportHeight - this.headerHeight - this.searchHeight);

    // Draw panel background with rounded corners
    const panelHeight = Math.min(this.viewportHeight, contentHeight + this.headerHeight + this.searchHeight);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    const radius = 10;
    ctx.beginPath();
    ctx.moveTo(panelX + radius, panelY);
    ctx.lineTo(panelX + this.panelWidth - radius, panelY);
    ctx.quadraticCurveTo(panelX + this.panelWidth, panelY, panelX + this.panelWidth, panelY + radius);
    ctx.lineTo(panelX + this.panelWidth, panelY + panelHeight - radius);
    ctx.quadraticCurveTo(panelX + this.panelWidth, panelY + panelHeight, panelX + this.panelWidth - radius, panelY + panelHeight);
    ctx.lineTo(panelX + radius, panelY + panelHeight);
    ctx.quadraticCurveTo(panelX, panelY + panelHeight, panelX, panelY + panelHeight - radius);
    ctx.lineTo(panelX, panelY + radius);
    ctx.quadraticCurveTo(panelX, panelY, panelX + radius, panelY);
    ctx.closePath();
    ctx.fill();

    // Draw title
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Developer Panel', panelX + 20, panelY + 35);

    // Draw search box
    this.searchInputY = panelY + this.headerHeight;
    this.renderSearchBox(ctx, panelX, this.searchInputY, time);

    // Clip to viewport
    const viewportY = panelY + this.headerHeight + this.searchHeight;
    const viewportHeight = this.viewportHeight - this.headerHeight - this.searchHeight;
    ctx.save();
    ctx.beginPath();
    ctx.rect(panelX, viewportY, this.panelWidth, viewportHeight);
    ctx.clip();

    // Render categories and settings with scroll offset
    const scrollY = this.scrollContainer.getScrollY();
    let currentY = viewportY - scrollY;

    for (let catIdx = 0; catIdx < this.filteredCategories.length; catIdx++) {
      const category = this.filteredCategories[catIdx];
      const isFocusedCategory = catIdx === this.focusedCategoryIndex;

      // Render category header
      ctx.fillStyle = isFocusedCategory ? 'rgba(135, 206, 235, 1.0)' : 'rgba(135, 206, 235, 0.8)';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'left';
      const collapseIcon = category.collapsed ? '▶' : '▼';
      ctx.fillText(`${collapseIcon} ${category.label}`, panelX + this.padding, currentY + 18);
      currentY += this.categoryHeaderHeight;

      // Render settings in category
      if (!category.collapsed) {
        for (let setIdx = 0; setIdx < category.settings.length; setIdx++) {
          const setting = category.settings[setIdx];
          const control = this.controls.get(setting.key);
          const isFocused = isFocusedCategory && setIdx === this.focusedSettingIndex;

          if (control) {
            control.setPosition(panelX + this.padding, currentY, this.panelWidth - this.padding * 2);
            control.setFocused(isFocused);
            control.render(ctx);
          }

          currentY += this.settingHeight;
        }
      }

      currentY += this.categorySpacing;
    }

    ctx.restore(); // Restore clipping

    // Render scrollbar
    this.scrollContainer.renderScrollbar(ctx, panelX, viewportY, this.panelWidth, viewportHeight);

    // Close hint
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Press ` to close', panelX + this.panelWidth / 2, panelY + panelHeight - 20);

    ctx.restore();
  }

  /**
   * Render search input box.
   */
  private renderSearchBox(ctx: CanvasRenderingContext2D, x: number, y: number, time: number): void {
    const searchWidth = this.panelWidth - this.padding * 2;
    const searchBoxHeight = 30;

    // Search box background
    ctx.fillStyle = this.isSearchFocused ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(x + this.padding, y + 5, searchWidth, searchBoxHeight);

    // Search icon/label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🔍', x + this.padding + 5, y + 25);

    // Search query text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '12px sans-serif';
    const displayQuery = this.searchQuery || (this.isSearchFocused ? '' : 'Search settings...');
    const queryColor = this.searchQuery ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.5)';
    ctx.fillStyle = queryColor;
    ctx.fillText(displayQuery, x + this.padding + 25, y + 25);

    // Cursor if focused
    if (this.isSearchFocused && Math.floor(time * 2) % 2 === 0) {
      const textWidth = ctx.measureText(displayQuery).width;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(x + this.padding + 25 + textWidth, y + 10, 1, searchBoxHeight - 10);
    }
  }
}
