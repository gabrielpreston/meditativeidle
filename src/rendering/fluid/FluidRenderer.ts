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
   * Optimized to use fillRect for better performance on large canvases.
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
    // Clear canvas with serenity-based background tint
    const bgBrightness = 0.9 + serenityRatio * 0.1; // 0.9 to 1.0
    const bgValue = Math.floor(255 * bgBrightness);
    ctx.fillStyle = `rgb(${bgValue}, ${bgValue}, ${bgValue})`;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Color grading based on serenity (darker at low serenity)
    const colorMultiplier = 0.7 + serenityRatio * 0.3; // 0.7 to 1.0
    
    // Render grid cells using fillRect (faster than ImageData for sparse pigment)
    const cellWidth = canvasWidth / this.gridWidth;
    const cellHeight = canvasHeight / this.gridHeight;
    
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const cell = field.getCell(x, y);
        
        // Convert pigment to RGB color (0-255) with serenity-based color grading
        const r = Math.floor(cell.pigmentR * 255 * colorMultiplier);
        const g = Math.floor(cell.pigmentG * 255 * colorMultiplier);
        const b = Math.floor(cell.pigmentB * 255 * colorMultiplier);
        
        // Only render if there's significant pigment (threshold to skip very faint cells)
        if (r > 5 || g > 5 || b > 5) {
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.fillRect(
            Math.floor(x * cellWidth),
            Math.floor(y * cellHeight),
            Math.ceil(cellWidth) + 1, // +1 to avoid gaps
            Math.ceil(cellHeight) + 1
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

