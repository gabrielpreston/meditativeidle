import { LiquidField } from './LiquidField';

/**
 * FluidRenderer - Renders the grid-based fluid field to canvas
 * 
 * Maps grid cells to canvas pixels with smooth interpolation.
 */
export class FluidRenderer {
  private gridWidth: number;
  private gridHeight: number;
  
  constructor(gridWidth: number = 512, gridHeight: number = 288) {
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
  }
  
  /**
   * Render the fluid field to canvas
   * 
   * @param ctx Canvas 2D context
   * @param field LiquidField to render
   * @param canvasWidth Canvas width in pixels
   * @param canvasHeight Canvas height in pixels
   * @param serenityRatio Current serenity ratio for color grading (0-1)
   */
  render(
    ctx: CanvasRenderingContext2D,
    field: LiquidField,
    canvasWidth: number,
    canvasHeight: number,
    serenityRatio: number = 0.5
  ): void {
    const cellWidth = canvasWidth / this.gridWidth;
    const cellHeight = canvasHeight / this.gridHeight;
    
    // Clear canvas with serenity-based background tint
    const bgBrightness = 0.9 + serenityRatio * 0.1; // 0.9 to 1.0
    ctx.fillStyle = `rgb(${Math.floor(255 * bgBrightness)}, ${Math.floor(255 * bgBrightness)}, ${Math.floor(255 * bgBrightness)})`;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Color grading based on serenity (darker at low serenity)
    const colorMultiplier = 0.7 + serenityRatio * 0.3; // 0.7 to 1.0
    
    // Render each cell
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const cell = field.getCell(x, y);
        
        // Convert pigment to RGB color (0-255) with serenity-based color grading
        const r = Math.floor(cell.pigmentR * 255 * colorMultiplier);
        const g = Math.floor(cell.pigmentG * 255 * colorMultiplier);
        const b = Math.floor(cell.pigmentB * 255 * colorMultiplier);
        
        // Only render if there's pigment
        if (r > 0 || g > 0 || b > 0) {
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.fillRect(
            x * cellWidth,
            y * cellHeight,
            Math.ceil(cellWidth),
            Math.ceil(cellHeight)
          );
        }
      }
    }
  }
  
  /**
   * Update grid dimensions
   */
  setGridDimensions(width: number, height: number): void {
    this.gridWidth = width;
    this.gridHeight = height;
  }
}

