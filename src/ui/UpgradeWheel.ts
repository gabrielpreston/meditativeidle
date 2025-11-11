import { AbilityState, Vector2 } from '../types';
import { GameConfig } from '../GameConfig';

export class UpgradeWheel {
  private center: Vector2;
  private screenWidth: number;
  private screenHeight: number;
  private radius: number = 120;
  private visible: boolean = false;
  private hoveredAbility: string | null = null;
  private selectedAbility: string | null = null;

  constructor(center: Vector2, screenWidth: number, screenHeight: number) {
    this.center = center;
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
  }
  
  setScreenSize(width: number, height: number): void {
    this.screenWidth = width;
    this.screenHeight = height;
  }

  setVisible(visible: boolean): void {
    this.visible = visible;
  }

  isVisible(): boolean {
    return this.visible;
  }

  checkHover(mousePos: Vector2): void {
    if (!this.visible) {
      this.hoveredAbility = null;
      return;
    }
    
    const hudBottom = this.screenHeight - 20;
    const hudHeight = 80;
    const wheelY = hudBottom - hudHeight - 80;
    const wheelCenter = { x: this.screenWidth / 2, y: wheelY };
    
    const dist = Math.sqrt(
      (mousePos.x - wheelCenter.x) ** 2 + (mousePos.y - wheelCenter.y) ** 2
    );
    
    if (dist > this.radius + 30) {
      this.hoveredAbility = null;
      return;
    }
    
    const angle = Math.atan2(mousePos.y - wheelCenter.y, mousePos.x - wheelCenter.x);
    const normalizedAngle = (angle + Math.PI * 2) % (Math.PI * 2);
    
    // Divide circle into 9 sections
    const sectionSize = (Math.PI * 2) / 9;
    const allAbilities: Array<keyof AbilityState> = ['breathe', 'recenter', 'affirm', 'exhale', 'reflect', 'mantra', 'ground', 'release', 'align'];
    const startAngle = -Math.PI / 2;
    
    for (let i = 0; i < allAbilities.length; i++) {
      const sectionStart = (startAngle + i * sectionSize + Math.PI * 2) % (Math.PI * 2);
      const sectionEnd = (startAngle + (i + 1) * sectionSize + Math.PI * 2) % (Math.PI * 2);
      
      if (i === 0) {
        // First section wraps around
        if (normalizedAngle >= sectionStart || normalizedAngle < sectionEnd) {
          this.hoveredAbility = allAbilities[i];
          break;
        }
      } else {
        if (normalizedAngle >= sectionStart && normalizedAngle < sectionEnd) {
          this.hoveredAbility = allAbilities[i];
          break;
        }
      }
    }
  }

  checkClick(mousePos: Vector2): string | null {
    if (!this.visible) return null;
    
    const hudBottom = this.screenHeight - 20;
    const hudHeight = 80;
    const wheelY = hudBottom - hudHeight - 80;
    const wheelCenter = { x: this.screenWidth / 2, y: wheelY };
    
    const dist = Math.sqrt(
      (mousePos.x - wheelCenter.x) ** 2 + (mousePos.y - wheelCenter.y) ** 2
    );
    
    if (dist > this.radius + 30) return null;
    
    return this.hoveredAbility;
  }

  render(ctx: CanvasRenderingContext2D, abilities: AbilityState, insight: number, serenityRatio: number): void {
    if (!this.visible) return;
    
    // Position upgrade wheel below the HUD
    const hudBottom = this.screenHeight - 20;
    const hudHeight = 80;
    const wheelY = hudBottom - hudHeight - 80; // 80px above HUD
    const wheelCenter = { x: this.screenWidth / 2, y: wheelY };
    
    const sectionSize = (Math.PI * 2) / 9;
    const colors = this.getColors(serenityRatio);
    
    // Draw background circle
    ctx.fillStyle = `rgba(0, 0, 0, 0.7)`;
    ctx.beginPath();
    ctx.arc(wheelCenter.x, wheelCenter.y, this.radius + 30, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw nine sections
    const allAbilities: Array<keyof AbilityState> = ['breathe', 'recenter', 'affirm', 'exhale', 'reflect', 'mantra', 'ground', 'release', 'align'];
    const abilities_list: Array<{ key: keyof AbilityState; startAngle: number }> = allAbilities.map((key, index) => ({
      key,
      startAngle: -Math.PI / 2 + index * sectionSize
    }));
    
    abilities_list.forEach(({ key, startAngle }) => {
      const ability = abilities[key];
      const isHovered = this.hoveredAbility === key;
      const canAfford = insight >= this.getUpgradeCost(key, ability);
      const isMaxLevel = ability.level >= ability.maxLevel;
      
      // Draw section
      ctx.beginPath();
      ctx.moveTo(wheelCenter.x, wheelCenter.y);
      ctx.arc(
        wheelCenter.x, wheelCenter.y, this.radius,
        startAngle, startAngle + sectionSize
      );
      ctx.closePath();
      
      if (isHovered && canAfford && !isMaxLevel) {
        ctx.fillStyle = `rgba(135, 206, 235, 0.3)`;
      } else {
        ctx.fillStyle = `rgba(135, 206, 235, 0.1)`;
      }
      ctx.fill();
      
      // Draw border
      ctx.strokeStyle = isHovered ? colors.accent : `rgba(135, 206, 235, 0.5)`;
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw ability name
      const midAngle = startAngle + sectionSize / 2;
      const textRadius = this.radius * 0.7;
      const textX = wheelCenter.x + Math.cos(midAngle) * textRadius;
      const textY = wheelCenter.y + Math.sin(midAngle) * textRadius;
      
      ctx.fillStyle = isHovered ? colors.accent : 'rgba(255, 255, 255, 0.8)';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ability.name, textX, textY);
      
      // Draw level
      ctx.font = '12px sans-serif';
      ctx.fillText(`Lv.${ability.level}/${ability.maxLevel}`, textX, textY + 20);
      
      // Draw cost
      if (!isMaxLevel) {
        const cost = this.getUpgradeCost(key, ability);
        ctx.fillStyle = canAfford ? colors.gold : 'rgba(255, 255, 255, 0.5)';
        ctx.font = '10px sans-serif';
        ctx.fillText(`${cost} Insight`, textX, textY + 35);
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '10px sans-serif';
        ctx.fillText('MAX', textX, textY + 35);
      }
    });
  }

  private getUpgradeCost(key: keyof AbilityState, ability: any): number {
    return Math.floor(
      GameConfig.UPGRADE_COST_BASE * 
      Math.pow(GameConfig.UPGRADE_COST_MULTIPLIER, ability.level)
    );
  }

  private getColors(serenityRatio: number): typeof GameConfig.COLOR_HIGH_SERENITY {
    const t = Math.max(0, Math.min(1, (serenityRatio - 0.3) / 0.4));
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
}

