import { Vector2, RGB } from '../../types';
import { LiquidCell, createEmptyCell, mixColors, rgbToPigment } from './LiquidCell';

/**
 * LiquidField - Grid-based fluid simulation
 * 
 * Simple, predictable CPU-based fluid field using a 2D grid.
 * Each cell stores pigment RGB values and flow vectors.
 * Provides basic diffusion and advection for natural fluid behavior.
 */
export class LiquidField {
  private grid: LiquidCell[][];
  private gridWidth: number;
  private gridHeight: number;
  private diffusionRate: number;
  private flowDecay: number;
  private time: number = 0;
  
  /**
   * @param width Grid width in cells (default: 512)
   * @param height Grid height in cells (default: 288)
   * @param diffusionRate Rate of pigment diffusion (0-1, default: 0.1)
   * @param flowDecay Rate of flow velocity decay (0-1, default: 0.95)
   */
  constructor(
    width: number = 512,
    height: number = 288,
    diffusionRate: number = 0.1,
    flowDecay: number = 0.95
  ) {
    this.gridWidth = width;
    this.gridHeight = height;
    this.diffusionRate = diffusionRate;
    this.flowDecay = flowDecay;
    
    // Initialize grid with empty cells
    this.grid = [];
    for (let y = 0; y < height; y++) {
      this.grid[y] = [];
      for (let x = 0; x < width; x++) {
        this.grid[y][x] = createEmptyCell();
      }
    }
  }
  
  /**
   * Get grid dimensions
   */
  getDimensions(): { width: number; height: number } {
    return { width: this.gridWidth, height: this.gridHeight };
  }
  
  /**
   * Set grid resolution (resizes grid, preserving data where possible)
   */
  setResolution(width: number, height: number): void {
    if (width === this.gridWidth && height === this.gridHeight) {
      return; // No change needed
    }
    
    // Create new grid
    const newGrid: LiquidCell[][] = [];
    for (let y = 0; y < height; y++) {
      newGrid[y] = [];
      for (let x = 0; x < width; x++) {
        // Map old grid coordinates to new grid coordinates
        const oldX = Math.floor((x / width) * this.gridWidth);
        const oldY = Math.floor((y / height) * this.gridHeight);
        const clampedOldX = Math.max(0, Math.min(this.gridWidth - 1, oldX));
        const clampedOldY = Math.max(0, Math.min(this.gridHeight - 1, oldY));
        
        // Copy cell data from old grid (or create empty if scaling up)
        newGrid[y][x] = { ...this.grid[clampedOldY][clampedOldX] };
      }
    }
    
    this.grid = newGrid;
    this.gridWidth = width;
    this.gridHeight = height;
  }
  
  /**
   * Get cell at grid coordinates (clamped to bounds)
   */
  getCell(x: number, y: number): LiquidCell {
    const clampedX = Math.max(0, Math.min(this.gridWidth - 1, Math.floor(x)));
    const clampedY = Math.max(0, Math.min(this.gridHeight - 1, Math.floor(y)));
    return this.grid[clampedY][clampedX];
  }
  
  /**
   * Set cell at grid coordinates (clamped to bounds)
   */
  setCell(x: number, y: number, cell: LiquidCell): void {
    const clampedX = Math.max(0, Math.min(this.gridWidth - 1, Math.floor(x)));
    const clampedY = Math.max(0, Math.min(this.gridHeight - 1, Math.floor(y)));
    this.grid[clampedY][clampedX] = { ...cell };
  }
  
  /**
   * Convert world position to grid coordinates
   */
  worldToGrid(worldX: number, worldY: number, worldWidth: number, worldHeight: number): { x: number; y: number } {
    return {
      x: (worldX / worldWidth) * this.gridWidth,
      y: (worldY / worldHeight) * this.gridHeight
    };
  }
  
  /**
   * Add pigment to a region (deposit dye)
   * Uses circular falloff based on distance from center
   */
  addPigment(
    position: Vector2,
    radius: number,
    color: RGB,
    strength: number,
    worldWidth: number,
    worldHeight: number
  ): void {
    const gridPos = this.worldToGrid(position.x, position.y, worldWidth, worldHeight);
    const gridRadius = (radius / Math.max(worldWidth, worldHeight)) * Math.max(this.gridWidth, this.gridHeight);
    const pigment = rgbToPigment(color);
    
    // Calculate affected region
    const minX = Math.max(0, Math.floor(gridPos.x - gridRadius));
    const maxX = Math.min(this.gridWidth - 1, Math.ceil(gridPos.x + gridRadius));
    const minY = Math.max(0, Math.floor(gridPos.y - gridRadius));
    const maxY = Math.min(this.gridHeight - 1, Math.ceil(gridPos.y + gridRadius));
    
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dx = x - gridPos.x;
        const dy = y - gridPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= gridRadius) {
          const falloff = 1 - (distance / gridRadius); // Linear falloff
          const cell = this.getCell(x, y);
          
      // Additive color mixing
      const addR = pigment.r * strength * falloff;
      const addG = pigment.g * strength * falloff;
      const addB = pigment.b * strength * falloff;
      
      // Increase turbulence in region (for visual interest)
      const turbulenceIncrease = strength * falloff * 0.1;
      
      this.setCell(x, y, {
        ...cell,
        pigmentR: Math.min(1, cell.pigmentR + addR),
        pigmentG: Math.min(1, cell.pigmentG + addG),
        pigmentB: Math.min(1, cell.pigmentB + addB),
        turbulence: Math.min(1, cell.turbulence + turbulenceIncrease)
      });
        }
      }
    }
  }
  
  /**
   * Modify flow vectors in a region (push/pull flow)
   */
  modifyFlow(
    position: Vector2,
    radius: number,
    deltaVX: number,
    deltaVY: number,
    worldWidth: number,
    worldHeight: number
  ): void {
    const gridPos = this.worldToGrid(position.x, position.y, worldWidth, worldHeight);
    const gridRadius = (radius / Math.max(worldWidth, worldHeight)) * Math.max(this.gridWidth, this.gridHeight);
    
    const minX = Math.max(0, Math.floor(gridPos.x - gridRadius));
    const maxX = Math.min(this.gridWidth - 1, Math.ceil(gridPos.x + gridRadius));
    const minY = Math.max(0, Math.floor(gridPos.y - gridRadius));
    const maxY = Math.min(this.gridHeight - 1, Math.ceil(gridPos.y + gridRadius));
    
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dx = x - gridPos.x;
        const dy = y - gridPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= gridRadius) {
          const falloff = 1 - (distance / gridRadius);
          const cell = this.getCell(x, y);
          
          this.setCell(x, y, {
            ...cell,
            flowX: cell.flowX + deltaVX * falloff,
            flowY: cell.flowY + deltaVY * falloff
          });
        }
      }
    }
  }
  
  /**
   * Clear/fade pigment in a region
   */
  clearRegion(
    position: Vector2,
    radius: number,
    fadeRate: number,
    worldWidth: number,
    worldHeight: number
  ): void {
    const gridPos = this.worldToGrid(position.x, position.y, worldWidth, worldHeight);
    const gridRadius = (radius / Math.max(worldWidth, worldHeight)) * Math.max(this.gridWidth, this.gridHeight);
    
    const minX = Math.max(0, Math.floor(gridPos.x - gridRadius));
    const maxX = Math.min(this.gridWidth - 1, Math.ceil(gridPos.x + gridRadius));
    const minY = Math.max(0, Math.floor(gridPos.y - gridRadius));
    const maxY = Math.min(this.gridHeight - 1, Math.ceil(gridPos.y + gridRadius));
    
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dx = x - gridPos.x;
        const dy = y - gridPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= gridRadius) {
          const falloff = 1 - (distance / gridRadius);
          const cell = this.getCell(x, y);
          const fade = fadeRate * falloff;
          
          this.setCell(x, y, {
            ...cell,
            pigmentR: Math.max(0, cell.pigmentR * (1 - fade)),
            pigmentG: Math.max(0, cell.pigmentG * (1 - fade)),
            pigmentB: Math.max(0, cell.pigmentB * (1 - fade))
          });
        }
      }
    }
  }
  
  /**
   * Update fluid simulation (diffusion, advection, and turbulence)
   * Call this every frame to advance the simulation
   */
  update(deltaTime: number, globalTurbulence: number = 0): void {
    // Validate deltaTime - prevent NaN or invalid values
    if (!Number.isFinite(deltaTime) || deltaTime <= 0 || deltaTime > 1) {
      deltaTime = 0.016; // Default to ~60 FPS
    }
    
    this.time += deltaTime;
    // Create temporary grid for diffusion calculation
    const tempGrid: LiquidCell[][] = [];
    for (let y = 0; y < this.gridHeight; y++) {
      tempGrid[y] = [];
      for (let x = 0; x < this.gridWidth; x++) {
        tempGrid[y][x] = createEmptyCell();
      }
    }
    
    // Diffusion: Spread pigment to neighbors
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const cell = this.grid[y][x];
        let sumR = cell.pigmentR;
        let sumG = cell.pigmentG;
        let sumB = cell.pigmentB;
        let count = 1;
        
        // Average with neighbors (4-directional)
        const neighbors = [
          { x: x - 1, y },
          { x: x + 1, y },
          { x, y: y - 1 },
          { x, y: y + 1 }
        ];
        
        for (const neighbor of neighbors) {
          if (neighbor.x >= 0 && neighbor.x < this.gridWidth &&
              neighbor.y >= 0 && neighbor.y < this.gridHeight) {
            const neighborCell = this.grid[neighbor.y][neighbor.x];
            sumR += neighborCell.pigmentR;
            sumG += neighborCell.pigmentG;
            sumB += neighborCell.pigmentB;
            count++;
          }
        }
        
        // Blend current cell with averaged neighbors
        const avgR = sumR / count;
        const avgG = sumG / count;
        const avgB = sumB / count;
        
        tempGrid[y][x] = {
          ...cell,
          pigmentR: cell.pigmentR * (1 - this.diffusionRate) + avgR * this.diffusionRate,
          pigmentG: cell.pigmentG * (1 - this.diffusionRate) + avgG * this.diffusionRate,
          pigmentB: cell.pigmentB * (1 - this.diffusionRate) + avgB * this.diffusionRate
        };
      }
    }
    
    // Advection: Move pigment with flow vectors
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const cell = tempGrid[y][x];
        
        // Validate flow values - ensure they're finite numbers
        const flowX = Number.isFinite(cell.flowX) ? cell.flowX : 0;
        const flowY = Number.isFinite(cell.flowY) ? cell.flowY : 0;
        
        // Sample pigment from upstream position (backward advection)
        const sourceX = x - flowX * deltaTime * 60; // Scale for 60 FPS
        const sourceY = y - flowY * deltaTime * 60;
        
        // Validate source coordinates
        if (!Number.isFinite(sourceX) || !Number.isFinite(sourceY)) {
          // If source is invalid, just copy current cell without advection
          this.grid[y][x] = { ...cell };
          continue;
        }
        
        // Bilinear interpolation for sub-grid positions
        const x0 = Math.floor(sourceX);
        const y0 = Math.floor(sourceY);
        const x1 = x0 + 1;
        const y1 = y0 + 1;
        const fx = sourceX - x0;
        const fy = sourceY - y0;
        
        // Clamp to grid bounds and validate indices
        const x0Clamped = Math.max(0, Math.min(this.gridWidth - 1, Math.floor(x0)));
        const y0Clamped = Math.max(0, Math.min(this.gridHeight - 1, Math.floor(y0)));
        const x1Clamped = Math.max(0, Math.min(this.gridWidth - 1, Math.floor(x1)));
        const y1Clamped = Math.max(0, Math.min(this.gridHeight - 1, Math.floor(y1)));
        
        // Ensure indices are valid integers
        if (!Number.isFinite(x0Clamped) || !Number.isFinite(y0Clamped) ||
            !Number.isFinite(x1Clamped) || !Number.isFinite(y1Clamped) ||
            x0Clamped < 0 || y0Clamped < 0 || x1Clamped < 0 || y1Clamped < 0 ||
            x0Clamped >= this.gridWidth || y0Clamped >= this.gridHeight ||
            x1Clamped >= this.gridWidth || y1Clamped >= this.gridHeight) {
          // If indices are invalid, just copy current cell
          this.grid[y][x] = { ...cell };
          continue;
        }
        
        const c00 = tempGrid[y0Clamped]?.[x0Clamped];
        const c10 = tempGrid[y0Clamped]?.[x1Clamped];
        const c01 = tempGrid[y1Clamped]?.[x0Clamped];
        const c11 = tempGrid[y1Clamped]?.[x1Clamped];
        
        // Validate cells exist before accessing properties
        if (!c00 || !c10 || !c01 || !c11) {
          // If any cell is missing, just copy current cell
          this.grid[y][x] = { ...cell };
          continue;
        }
        
        // Bilinear interpolation
        const r = (c00.pigmentR * (1 - fx) + c10.pigmentR * fx) * (1 - fy) +
                  (c01.pigmentR * (1 - fx) + c11.pigmentR * fx) * fy;
        const g = (c00.pigmentG * (1 - fx) + c10.pigmentG * fx) * (1 - fy) +
                  (c01.pigmentG * (1 - fx) + c11.pigmentG * fx) * fy;
        const b = (c00.pigmentB * (1 - fx) + c10.pigmentB * fx) * (1 - fy) +
                  (c01.pigmentB * (1 - fx) + c11.pigmentB * fx) * fy;
        
        // Apply flow decay (use validated flow values)
        let newFlowX = flowX * this.flowDecay;
        let newFlowY = flowY * this.flowDecay;
        
        // Apply turbulence (noise-based flow modification)
        const cellTurbulence = Number.isFinite(cell.turbulence) ? cell.turbulence : 0;
        const validGlobalTurbulence = Number.isFinite(globalTurbulence) ? globalTurbulence : 0;
        const turbulence = cellTurbulence + validGlobalTurbulence;
        if (turbulence > 0.01 && Number.isFinite(this.time)) {
          // Simple noise function for turbulence
          const noiseX = Math.sin(x * 0.1 + this.time * 2) * Math.cos(y * 0.1 + this.time * 1.5);
          const noiseY = Math.cos(x * 0.1 + this.time * 1.5) * Math.sin(y * 0.1 + this.time * 2);
          const turbulenceStrength = turbulence * 0.1;
          newFlowX += noiseX * turbulenceStrength;
          newFlowY += noiseY * turbulenceStrength;
        }
        
        // Ensure flow values are finite
        if (!Number.isFinite(newFlowX)) newFlowX = 0;
        if (!Number.isFinite(newFlowY)) newFlowY = 0;
        
        // Calculate and validate turbulence
        const newTurbulence = cellTurbulence * 0.95 + validGlobalTurbulence * 0.05;
        const finalTurbulence = Number.isFinite(newTurbulence) ? Math.max(0, newTurbulence) : 0;
        
        this.grid[y][x] = {
          pigmentR: Math.max(0, Math.min(1, r)),
          pigmentG: Math.max(0, Math.min(1, g)),
          pigmentB: Math.max(0, Math.min(1, b)),
          flowX: newFlowX,
          flowY: newFlowY,
          turbulence: finalTurbulence
        };
      }
    }
  }
  
  /**
   * Set diffusion rate (0-1)
   */
  setDiffusionRate(rate: number): void {
    this.diffusionRate = Math.max(0, Math.min(1, rate));
  }
  
  /**
   * Set flow decay rate (0-1)
   */
  setFlowDecay(decay: number): void {
    this.flowDecay = Math.max(0, Math.min(1, decay));
  }
}

