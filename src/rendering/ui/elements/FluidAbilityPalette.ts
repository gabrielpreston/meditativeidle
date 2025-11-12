import { FluidUIElement } from '../fluid/FluidUIElement';
import { Color } from '../fluid/Color';
import { Vector2 } from '../../../types';
import { FluidAbilityButton } from './FluidAbilityButton';
import { distance } from '../../../utils/MathUtils';

/**
 * FluidAbilityPalette manages a flowing arrangement of ability buttons.
 * Buttons are arranged in an organic arc that flows and melds together.
 */
export class FluidAbilityPalette extends FluidUIElement {
  private buttons: FluidAbilityButton[] = [];
  private centerPosition: Vector2;
  private arrangementRadius: number = 200;
  private currentMousePos: Vector2 | null = null;
  
  constructor(position: Vector2) {
    const initialColor = Color.fromRGB(135, 206, 235, 0.1); // Light blue, very transparent
    super(position, initialColor, 0); // No visual size, just container
    this.centerPosition = position;
    this.blendRadius = 0;
  }
  
  /**
   * Initialize buttons from ability data.
   */
  initializeButtons(
    abilities: Record<string, { level: number; maxLevel: number }>,
    abilityNames: Record<string, string>,
    abilityColors: Record<string, string>,
    insight: number,
    upgradeCostFn: (key: string, ability: any) => number
  ): void {
    this.buttons = [];
    const abilityKeys = Object.keys(abilities);
    const angleStep = (Math.PI * 2) / abilityKeys.length;
    
    abilityKeys.forEach((key, index) => {
      const ability = abilities[key];
      const angle = angleStep * index;
      const buttonX = this.centerPosition.x + Math.cos(angle) * this.arrangementRadius;
      const buttonY = this.centerPosition.y + Math.sin(angle) * this.arrangementRadius;
      
      const upgradeCost = upgradeCostFn(key, ability);
      const canAfford = insight >= upgradeCost;
      const isMaxLevel = ability.level >= ability.maxLevel;
      
      const button = new FluidAbilityButton(
        { x: buttonX, y: buttonY },
        abilityNames[key] || key,
        ability.level,
        upgradeCost,
        canAfford,
        isMaxLevel,
        abilityColors[key] || '#87CEEB'
      );
      
      this.buttons.push(button);
    });
  }
  
  /**
   * Update button states.
   */
  updateButtons(
    abilities: Record<string, { level: number; maxLevel: number }>,
    insight: number,
    upgradeCostFn: (key: string, ability: any) => number
  ): void {
    const abilityKeys = Object.keys(abilities);
    this.buttons.forEach((button, index) => {
      if (index < abilityKeys.length) {
        const key = abilityKeys[index];
        const ability = abilities[key];
        const upgradeCost = upgradeCostFn(key, ability);
        const canAfford = insight >= upgradeCost;
        const isMaxLevel = ability.level >= ability.maxLevel;
        
        button.updateState(ability.level, upgradeCost, canAfford, isMaxLevel);
      }
    });
  }
  
  /**
   * Update with fluid dynamics and arrange buttons in flowing arc.
   */
  update(deltaTime: number, fluidField: any, nearbyElements: FluidUIElement[]): void {
    super.update(deltaTime, fluidField, nearbyElements);
    
    // Arrange buttons in flowing arc
    const angleStep = (Math.PI * 2) / this.buttons.length;
    const flowOffset = Math.sin(Date.now() * 0.001) * 0.1; // Flows
    
    this.buttons.forEach((button, index) => {
      const angle = angleStep * index + flowOffset;
      const targetX = this.centerPosition.x + Math.cos(angle) * this.arrangementRadius;
      const targetY = this.centerPosition.y + Math.sin(angle) * this.arrangementRadius;
      
      button.setTargetPosition({ x: targetX, y: targetY });
      
      // Update button with fluid dynamics
      button.update(deltaTime, fluidField, this.buttons);
      
      // Melding: buttons attract/repel based on distance
      for (const other of this.buttons) {
        if (button === other) continue;
        
        const dist = distance(button.position, other.position);
        if (dist < 80) {
          // Push apart slightly (surface tension)
          const direction = {
            x: button.position.x - other.position.x,
            y: button.position.y - other.position.y
          };
          const mag = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
          if (mag > 0) {
            direction.x /= mag;
            direction.y /= mag;
            button.velocity.x += direction.x * 0.5;
            button.velocity.y += direction.y * 0.5;
          }
        }
      }
      
      // Update hover state
      if (this.currentMousePos) {
        button.setHovered(button.containsPoint(this.currentMousePos));
      } else {
        button.setHovered(false);
      }
    });
  }
  
  /**
   * Update mouse position for hover detection.
   */
  updateMousePos(pos: Vector2): void {
    this.currentMousePos = pos;
  }
  
  /**
   * Check if mouse clicked on a button.
   */
  checkClick(mousePos: Vector2): string | null {
    for (const button of this.buttons) {
      if (button.containsPoint(mousePos)) {
        return button.abilityName.toLowerCase();
      }
    }
    return null;
  }
  
  /**
   * Get all buttons (for rendering).
   */
  getButtons(): readonly FluidAbilityButton[] {
    return this.buttons;
  }
  
  render(ctx: CanvasRenderingContext2D, time: number): void {
    // Draw flowing connections between buttons (like paint connecting)
    for (let i = 0; i < this.buttons.length; i++) {
      const button = this.buttons[i];
      const next = this.buttons[(i + 1) % this.buttons.length];
      
      // Draw flowing connection
      const midX = (button.position.x + next.position.x) / 2;
      const midY = (button.position.y + next.position.y) / 2;
      
      // Add flowing wobble
      const wobbleX = Math.sin(time * 0.5) * 10;
      const wobbleY = Math.cos(time * 0.5) * 10;
      
      ctx.beginPath();
      ctx.moveTo(button.position.x, button.position.y);
      ctx.quadraticCurveTo(
        midX + wobbleX,
        midY + wobbleY,
        next.position.x,
        next.position.y
      );
      
      // Gradient stroke (color flows)
      const gradient = ctx.createLinearGradient(
        button.position.x, button.position.y,
        next.position.x, next.position.y
      );
      gradient.addColorStop(0, 'rgba(135, 206, 235, 0.3)');
      gradient.addColorStop(0.5, 'rgba(135, 206, 235, 0.5)');
      gradient.addColorStop(1, 'rgba(135, 206, 235, 0.3)');
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    // Render each button
    for (const button of this.buttons) {
      button.render(ctx, time);
    }
  }
  
  /**
   * Get ability name from button (for click detection).
   */
  getAbilityName(button: FluidAbilityButton): string {
    return button.abilityName;
  }
}

