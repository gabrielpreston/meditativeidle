import { Vector2 } from '../../../types';
import { FluidField } from './FluidField';
import { Color } from './Color';
import { add, subtract, multiply, normalize, distance, lerp } from '../../../utils/MathUtils';

/**
 * Base class for all fluid UI elements.
 * Provides flow, blend, meld, and dissipate behaviors that create
 * the watercolor aesthetic.
 */
export abstract class FluidUIElement {
  position: Vector2;
  velocity: Vector2;
  targetPosition: Vector2;
  color: Color;
  targetColor: Color;
  size: number;
  targetSize: number;
  opacity: number;
  targetOpacity: number;
  blendRadius: number;
  
  constructor(
    initialPosition: Vector2,
    initialColor: Color,
    initialSize: number = 50
  ) {
    this.position = { ...initialPosition };
    this.targetPosition = { ...initialPosition };
    this.velocity = { x: 0, y: 0 };
    this.color = initialColor.clone();
    this.targetColor = initialColor.clone();
    this.size = initialSize;
    this.targetSize = initialSize;
    this.opacity = 1.0;
    this.targetOpacity = 1.0;
    this.blendRadius = 100;
  }
  
  /**
   * Render the element. Must be implemented by subclasses.
   */
  abstract render(ctx: CanvasRenderingContext2D, time: number): void;
  
  /**
   * Check if this element is related to another (for melding behavior).
   * Override in subclasses to define relationships.
   */
  protected isRelated(other: FluidUIElement): boolean {
    return false; // Default: no relationships
  }
  
  /**
   * Check if this element should dissipate.
   * Override in subclasses for custom dissipation logic.
   */
  protected shouldDissipate(): boolean {
    return false; // Default: no dissipation
  }
  
  /**
   * Update element with fluid dynamics.
   * Handles flow, blend, meld, and dissipate behaviors.
   */
  update(deltaTime: number, fluidField: FluidField, nearbyElements: FluidUIElement[]): void {
    // 1. Flow: Update position based on fluid field
    const fieldVel = fluidField.getVelocity(
      this.position.x,
      this.position.y,
      fluidField.getTime()
    );
    
    // Smooth velocity following (like fluid resistance)
    const followFactor = 0.1;
    this.velocity.x += (fieldVel.x - this.velocity.x) * followFactor;
    this.velocity.y += (fieldVel.y - this.velocity.y) * followFactor;
    
    // Update position
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    
    // 2. Blend: Mix colors with nearby elements
    this.blendWithNearby(nearbyElements);
    
    // 3. Meld: Attract to related elements
    this.meldWithRelated(nearbyElements);
    
    // 4. Dissipate: Gradually fade/spread
    this.dissipate(deltaTime);
    
    // 5. Lerp to targets (smooth transitions)
    this.lerpToTargets(deltaTime);
  }
  
  /**
   * Blend colors with nearby elements (like wet paint mixing).
   */
  private blendWithNearby(elements: FluidUIElement[]): void {
    for (const other of elements) {
      if (other === this) continue;
      
      const dist = distance(this.position, other.position);
      if (dist < this.blendRadius && dist > 0) {
        const blendFactor = (1 - dist / this.blendRadius) * 0.1; // Max 10% blend per frame
        this.color.blend(other.color, blendFactor);
      }
    }
  }
  
  /**
   * Attract to related elements (melding behavior).
   */
  private meldWithRelated(elements: FluidUIElement[]): void {
    for (const other of elements) {
      if (other === this) continue;
      if (!this.isRelated(other)) continue;
      
      const dist = distance(this.position, other.position);
      if (dist > 0) {
        // Inverse square attraction (stronger when closer)
        const attraction = 1 / (dist * dist + 1);
        const direction = normalize(subtract(other.position, this.position));
        const attractionForce = multiply(direction, attraction * 10);
        
        this.velocity.x += attractionForce.x * 0.1;
        this.velocity.y += attractionForce.y * 0.1;
      }
    }
  }
  
  /**
   * Gradually fade and spread (dissipation).
   */
  private dissipate(deltaTime: number): void {
    if (this.shouldDissipate()) {
      // Opacity naturally decreases
      this.targetOpacity *= (1 - deltaTime * 0.1);
      
      // Size spreads out (like watercolor bleeding)
      this.targetSize += deltaTime * 5;
    }
  }
  
  /**
   * Smoothly lerp all properties toward their targets.
   */
  private lerpToTargets(deltaTime: number): void {
    const lerpSpeed = 5.0; // Lerp speed per second
    
    // Position
    const posT = Math.min(1, lerpSpeed * deltaTime);
    this.position.x = lerp(this.position.x, this.targetPosition.x, posT);
    this.position.y = lerp(this.position.y, this.targetPosition.y, posT);
    
    // Color
    this.color = this.color.lerp(this.targetColor, lerpSpeed * deltaTime);
    
    // Size
    this.size = lerp(this.size, this.targetSize, lerpSpeed * deltaTime);
    
    // Opacity
    this.opacity = lerp(this.opacity, this.targetOpacity, lerpSpeed * deltaTime);
  }
  
  /**
   * Set target position (for smooth movement).
   */
  setTargetPosition(pos: Vector2): void {
    this.targetPosition = { ...pos };
  }
  
  /**
   * Set target color (for smooth color transitions).
   */
  setTargetColor(color: Color): void {
    this.targetColor = color.clone();
  }
  
  /**
   * Set target size (for smooth size changes).
   */
  setTargetSize(size: number): void {
    this.targetSize = size;
  }
  
  /**
   * Set target opacity (for smooth fade effects).
   */
  setTargetOpacity(opacity: number): void {
    this.targetOpacity = Math.max(0, Math.min(1, opacity));
  }
}

