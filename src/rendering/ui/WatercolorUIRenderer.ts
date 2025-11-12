import { GameState, Vector2 } from '../../types';
import { FluidField } from './fluid/FluidField';
import { FluidUIElement } from './fluid/FluidUIElement';
import { FluidParticle } from './fluid/FluidParticle';
import { WatercolorStateController } from '../watercolor/WatercolorStateController';
import { SimpleStatsDisplay } from './elements/SimpleStatsDisplay';

/**
 * WatercolorUIRenderer manages all fluid UI elements and integrates
 * with the WatercolorStateController to create a cohesive watercolor aesthetic.
 * All UI elements flow, blend, meld, and dissipate like liquid paint.
 */
export class WatercolorUIRenderer {
  private fluidField: FluidField;
  private elements: FluidUIElement[] = [];
  private particles: FluidParticle[] = [];
  private time: number = 0;
  private watercolorController: WatercolorStateController;
  private currentMousePos: Vector2 | null = null;
  
  // Simple stats display
  private statsDisplay: SimpleStatsDisplay | null = null;
  
  private initialized: boolean = false;
  
  constructor(
    private ctx: CanvasRenderingContext2D,
    private width: number,
    private height: number,
    watercolorController: WatercolorStateController
  ) {
    this.fluidField = new FluidField();
    this.watercolorController = watercolorController;
  }
  
  /**
   * Initialize simple UI elements (called once).
   */
  private initializeElements(): void {
    if (this.initialized) return;
    
    // Simple stats display (top left)
    this.statsDisplay = new SimpleStatsDisplay({
      x: 20,
      y: 20
    });
    this.elements.push(this.statsDisplay);
    
    this.initialized = true;
  }
  
  /**
   * Main render method. Updates all fluid elements and particles,
   * then renders them with watercolor effects.
   */
  render(state: GameState, abilitySystem: any, deltaTime: number): void {
    this.time += deltaTime;
    
    // Initialize elements on first render
    this.initializeElements();
    
    // Update fluid field intensity from watercolor params
    const intensity = this.watercolorController.getDiffusionRate();
    this.fluidField.setIntensity(intensity);
    this.fluidField.update(deltaTime);
    
    // Update element states from game state
    this.updateElementStates(state, abilitySystem);
    
    // Update all elements with fluid dynamics
    for (const element of this.elements) {
      element.update(deltaTime, this.fluidField, this.elements);
    }
    
    // Update particles
    this.particles = this.particles.filter(p => {
      p.update(deltaTime, this.fluidField);
      return !p.isExpired();
    });
    
    // Render everything
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.renderElements();
    this.renderParticles();
  }
  
  /**
   * Update all element states from game state.
   */
  private updateElementStates(state: GameState, abilitySystem: any): void {
    // Update simple stats display
    if (this.statsDisplay) {
      this.statsDisplay.setState(state);
    }
  }
  
  /**
   * Render all fluid UI elements.
   */
  private renderElements(): void {
    // Save context state
    this.ctx.save();
    
    // Render each element
    for (const element of this.elements) {
      // Set global alpha for element
      this.ctx.globalAlpha = element.opacity;
      element.render(this.ctx, this.time);
    }
    
    // Restore context state
    this.ctx.restore();
  }
  
  /**
   * Render all particles.
   */
  private renderParticles(): void {
    this.ctx.save();
    
    for (const particle of this.particles) {
      particle.render(this.ctx);
    }
    
    this.ctx.restore();
  }
  
  /**
   * Add a fluid UI element to the renderer.
   */
  addElement(element: FluidUIElement): void {
    this.elements.push(element);
  }
  
  /**
   * Remove a fluid UI element from the renderer.
   */
  removeElement(element: FluidUIElement): void {
    const index = this.elements.indexOf(element);
    if (index > -1) {
      this.elements.splice(index, 1);
    }
  }
  
  /**
   * Add a particle for dissipation effects.
   */
  addParticle(particle: FluidParticle): void {
    this.particles.push(particle);
  }
  
  /**
   * Clear all elements and particles.
   */
  clear(): void {
    this.elements = [];
    this.particles = [];
  }
  
  /**
   * Update mouse position for hover detection.
   */
  updateMousePos(pos: Vector2): void {
    this.currentMousePos = pos;
  }
  
  /**
   * Check if mouse is clicking on an ability button.
   * Returns the ability key if clicked, null otherwise.
   */
  checkAbilityClick(mousePos: Vector2): string | null {
    // Simple UI doesn't have clickable elements yet
    return null;
  }
  
  /**
   * Resize the renderer (called when window resizes).
   */
  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }
  
  /**
   * Get the fluid field (for advanced element interactions).
   */
  getFluidField(): FluidField {
    return this.fluidField;
  }
  
  /**
   * Get all elements (for advanced interactions).
   */
  getElements(): readonly FluidUIElement[] {
    return this.elements;
  }
}

