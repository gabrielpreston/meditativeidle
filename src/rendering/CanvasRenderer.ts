import { GameState, Vector2, Stressor, AbilityState } from '../types';
import { SystemContext } from '../systems/ISystem';
import { Game } from '../Game';
import { LiquidField } from './fluid/LiquidField';
import { FluidRenderer } from './fluid/FluidRenderer';
import { EffectPrimitives } from './fluid/EffectPrimitives';
import { StressorFluidBridge } from './fluid/StressorFluidBridge';
import { StressorRenderer } from './canvas/StressorRenderer';
import { AbilityFluidBridge } from './fluid/AbilityFluidBridge';
import { AbilityRenderer } from './canvas/AbilityRenderer';
import { LiquidWatermediaStateController } from './watercolor/LiquidWatermediaStateController';
import { LiquidWatermediaUIRenderer } from './ui/LiquidWatermediaUIRenderer';
import { FluidStatsTable } from './ui/elements/FluidStatsTable';
import { FluidReflectionScreen } from './ui/elements/FluidReflectionScreen';
import { DeveloperPanel } from '../ui/DeveloperPanel';
import { getKeyboardManager } from '../utils/KeyboardManager';
import { getFPSCounter } from '../utils/FPSCounter';

/**
 * CanvasRenderer - Grid-based canvas renderer replacing ThreeRenderer
 * 
 * Implements the same interface as ThreeRenderer but uses HTML5 Canvas 2D
 * with a grid-based fluid simulation instead of WebGL/Three.js.
 */
export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  
  // Grid-based fluid system
  private liquidField: LiquidField;
  private fluidRenderer: FluidRenderer;
  private effectPrimitives: EffectPrimitives;
  private stressorFluidBridge: StressorFluidBridge;
  private stressorRenderer: StressorRenderer;
  private abilityFluidBridge: AbilityFluidBridge;
  private abilityRenderer: AbilityRenderer;
  private liquidWatermediaController: LiquidWatermediaStateController;
  
  // UI overlay canvas (separate from game canvas)
  private uiCanvas: HTMLCanvasElement;
  private uiCtx: CanvasRenderingContext2D;
  private liquidWatermediaUIRenderer: LiquidWatermediaUIRenderer | null = null;
  
  // Modal screens
  private fluidStatsTable: FluidStatsTable | null = null;
  private fluidReflectionScreen: FluidReflectionScreen | null = null;
  
  // Developer panel
  private developerPanel: DeveloperPanel | null = null;
  
  // Game instance for settings propagation
  private gameInstance: Game | null = null;
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.width = canvas.width;
    this.height = canvas.height;
    
    // Get 2D context
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context from canvas');
    }
    this.ctx = ctx;
    
    // Initialize grid-based fluid system (512x288 grid)
    this.liquidField = new LiquidField(512, 288);
    this.fluidRenderer = new FluidRenderer(512, 288);
    this.effectPrimitives = new EffectPrimitives(this.width, this.height);
    this.stressorFluidBridge = new StressorFluidBridge(this.width, this.height);
    this.stressorRenderer = new StressorRenderer(this.width, this.height);
    this.abilityFluidBridge = new AbilityFluidBridge(this.effectPrimitives, this.width, this.height);
    this.abilityRenderer = new AbilityRenderer(this.width, this.height);
    
    // Initialize liquid watermedia state controller (preserved for UI system)
    this.liquidWatermediaController = new LiquidWatermediaStateController();
    
    // Setup UI overlay canvas (separate from game canvas)
    this.uiCanvas = document.createElement('canvas');
    this.uiCanvas.width = this.width;
    this.uiCanvas.height = this.height;
    this.uiCanvas.style.position = 'absolute';
    this.uiCanvas.style.top = '0';
    this.uiCanvas.style.left = '0';
    this.uiCanvas.style.pointerEvents = 'none';
    this.uiCanvas.id = 'uiOverlay';
    document.body.appendChild(this.uiCanvas);
    const uiCtx = this.uiCanvas.getContext('2d');
    if (!uiCtx) {
      throw new Error('Failed to get 2D context from UI canvas');
    }
    this.uiCtx = uiCtx;
    
    // Initialize liquid watermedia UI renderer
    this.liquidWatermediaUIRenderer = new LiquidWatermediaUIRenderer(
      this.uiCtx,
      this.width,
      this.height,
      this.liquidWatermediaController
    );
    
    // Initialize modal screens
    this.fluidStatsTable = new FluidStatsTable({
      x: this.width / 2,
      y: this.height / 2
    });
    this.fluidStatsTable.setDimensions(this.width, this.height);
    
    this.fluidReflectionScreen = new FluidReflectionScreen({
      x: this.width / 2,
      y: this.height / 2
    });
    this.fluidReflectionScreen.setDimensions(this.width, this.height);
    
    // Initialize developer panel
    this.developerPanel = new DeveloperPanel({ x: 0, y: 0 });
    this.developerPanel.setDimensions(this.width, this.height);
    this.developerPanel.setSettingChangeCallback((key: string, value: number | boolean) => {
      if (typeof value === 'number') {
        this.handleSettingChange(key, value);
      } else {
        this.handleSettingChange(key, value ? 1 : 0);
      }
    });
  }
  
  /**
   * Main render method - renders game state to canvas
   */
  render(
    state: GameState,
    center: Vector2,
    deltaTime: number = 0.016,
    performanceMode: boolean = false,
    stressors?: Stressor[],
    abilityState?: AbilityState,
    systemContext?: SystemContext
  ): void {
    const serenityRatio = state.serenity / state.maxSerenity;
    
    // Update liquid watermedia state controller (for UI system)
    this.liquidWatermediaController.update(serenityRatio);
    
    // Update fluid field parameters based on serenity
    const diffusionRate = this.liquidWatermediaController.getDiffusionRate();
    this.liquidField.setDiffusionRate(diffusionRate * 0.1); // Scale to reasonable range
    
    // Calculate global turbulence based on serenity (low serenity = more turbulence)
    const globalTurbulence = (1 - serenityRatio) * 0.3; // 0 to 0.3
    
    // Update fluid simulation
    this.liquidField.update(deltaTime, globalTurbulence);
    
    // Update effect primitives
    this.effectPrimitives.update(this.liquidField, deltaTime);
    
    // Phase 3: Inject stressor dye into fluid field
    if (stressors && stressors.length > 0) {
      this.stressorFluidBridge.update(stressors, this.liquidField, serenityRatio);
    }
    
    // Phase 4: Apply ability effects
    if (systemContext) {
      this.abilityFluidBridge.update(systemContext, center, serenityRatio, deltaTime);
    }
    
    // Render fluid field to canvas with serenity-based color grading
    this.fluidRenderer.render(this.ctx, this.liquidField, this.width, this.height, serenityRatio);
    
    // Phase 3: Render stressors visually
    if (stressors && stressors.length > 0) {
      this.stressorRenderer.update(deltaTime);
      this.stressorRenderer.render(this.ctx, stressors, center, serenityRatio);
    }
    
    // Phase 4: Render ability effects
    if (systemContext) {
      this.abilityRenderer.update(deltaTime);
      this.abilityRenderer.render(this.ctx, systemContext, center, serenityRatio);
    }
    
    // Render UI overlay
    this.renderUI(state, undefined, deltaTime);
  }
  
  /**
   * Render UI overlay
   */
  renderUI(state: GameState, abilitySystem?: any, deltaTime: number = 0.016): void {
    if (this.liquidWatermediaUIRenderer) {
      this.liquidWatermediaUIRenderer.render(state, abilitySystem, deltaTime);
    }
    
    // Render developer panel if visible
    if (this.developerPanel && this.developerPanel.getIsVisible()) {
      this.uiCtx.clearRect(0, 0, this.width, this.height);
      this.developerPanel.render(this.uiCtx, Date.now() * 0.001);
    }
  }
  
  /**
   * Update mouse position for hover detection
   */
  updateMousePos(pos: Vector2): void {
    if (this.liquidWatermediaUIRenderer) {
      this.liquidWatermediaUIRenderer.updateMousePos(pos);
    }
    if (this.fluidStatsTable) {
      this.fluidStatsTable.updateMousePos(pos);
    }
    if (this.developerPanel) {
      this.developerPanel.updateMousePos(pos);
    }
  }
  
  /**
   * Check if ability was clicked
   */
  checkAbilityClick(mousePos: Vector2): string | null {
    // Check developer panel first
    if (this.developerPanel && this.developerPanel.getIsVisible()) {
      if (this.developerPanel.checkClick(mousePos)) {
        return null;
      }
    }
    
    // Check UI renderer
    if (this.liquidWatermediaUIRenderer) {
      return this.liquidWatermediaUIRenderer.checkAbilityClick(mousePos);
    }
    return null;
  }
  
  /**
   * Toggle developer panel visibility
   */
  toggleDeveloperPanel(): void {
    if (this.developerPanel) {
      this.developerPanel.toggle();
      const keyboardManager = getKeyboardManager();
      const isVisible = this.developerPanel.getIsVisible();
      keyboardManager.setContext(isVisible ? 'devPanel' : 'global');
    }
  }
  
  /**
   * Check if developer panel is visible
   */
  isDeveloperPanelVisible(): boolean {
    return this.developerPanel ? this.developerPanel.getIsVisible() : false;
  }
  
  /**
   * Check if developer panel search is focused
   */
  isDeveloperPanelSearchFocused(): boolean {
    return false; // Placeholder - DeveloperPanel handles its own focus
  }
  
  /**
   * Handle wheel event for developer panel scrolling
   */
  handleWheel(deltaY: number): void {
    if (this.developerPanel && this.developerPanel.getIsVisible()) {
      this.developerPanel.handleWheel(deltaY);
    }
  }
  
  /**
   * Handle keyboard input for developer panel
   */
  handleDeveloperPanelKey(event: KeyboardEvent): boolean {
    if (this.developerPanel && this.developerPanel.getIsVisible()) {
      return this.developerPanel.handleKeyEvent(event);
    }
    return false;
  }
  
  /**
   * Set game instance for settings propagation
   */
  setGameInstance(game: Game): void {
    this.gameInstance = game;
  }
  
  /**
   * Handle setting changes from developer panel
   */
  private handleSettingChange(key: string, value: number): void {
    if (!this.gameInstance) return;
    
    switch (key) {
      case 'MAX_SERENITY':
        this.gameInstance.updateMaxSerenity(value);
        break;
      case 'PLAYER_RADIUS':
        this.updateCenterRadius(value);
        break;
      // Other settings handled by GameConfig automatically
    }
  }
  
  /**
   * Update center radius (placeholder - will be used when player rendering is added)
   */
  updateCenterRadius(value: number): void {
    // TODO: Implement when player rendering is added
  }
  
  /**
   * Render stats table
   */
  renderStatsTable(state: GameState, stressors: any[]): void {
    if (this.fluidStatsTable && this.liquidWatermediaUIRenderer) {
      this.fluidStatsTable.show(state, stressors);
      const fluidField = this.liquidWatermediaUIRenderer.getFluidField();
      this.fluidStatsTable.update(0.016, fluidField, []);
      this.fluidStatsTable.render(this.uiCtx, Date.now() * 0.001);
    }
  }
  
  /**
   * Render reflection screen (game over)
   */
  renderReflection(duration: number, wave: number, insight: number): void {
    if (this.fluidReflectionScreen && this.liquidWatermediaUIRenderer) {
      this.fluidReflectionScreen.show(duration, wave, insight);
      const fluidField = this.liquidWatermediaUIRenderer.getFluidField();
      this.fluidReflectionScreen.update(0.016, fluidField, []);
      this.fluidReflectionScreen.render(this.uiCtx, Date.now() * 0.001);
    }
  }
  
  /**
   * Render FPS display
   */
  renderFPS(fps: number): void {
    this.uiCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.uiCtx.fillRect(10, 10, 100, 30);
    this.uiCtx.fillStyle = '#fff';
    this.uiCtx.font = '14px monospace';
    this.uiCtx.fillText(`FPS: ${fps.toFixed(1)}`, 15, 30);
  }
  
  /**
   * Resize renderer
   */
  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    
    // Resize game canvas
    this.canvas.width = width;
    this.canvas.height = height;
    
    // Resize UI overlay canvas
    this.uiCanvas.width = width;
    this.uiCanvas.height = height;
    
    // Update effect primitives world dimensions
    this.effectPrimitives.setWorldDimensions(width, height);
    
    // Resize stressor bridge and renderer
    this.stressorFluidBridge.setSize(width, height);
    this.stressorRenderer.resize(width, height);
    
    // Resize ability bridge and renderer
    this.abilityFluidBridge.setSize(width, height);
    this.abilityRenderer.resize(width, height);
    
    // Resize UI renderer
    if (this.liquidWatermediaUIRenderer) {
      this.liquidWatermediaUIRenderer.resize(width, height);
    }
    
    // Resize modal screens
    if (this.fluidStatsTable) {
      this.fluidStatsTable.setDimensions(width, height);
      this.fluidStatsTable.setTargetPosition({ x: width / 2, y: height / 2 });
    }
    
    if (this.fluidReflectionScreen) {
      this.fluidReflectionScreen.setDimensions(width, height);
      this.fluidReflectionScreen.setTargetPosition({ x: width / 2, y: height / 2 });
    }
    
    // Resize developer panel
    if (this.developerPanel) {
      this.developerPanel.setDimensions(width, height);
    }
  }
  
  /**
   * Dispose resources
   */
  dispose(): void {
    // Remove UI canvas from DOM
    if (this.uiCanvas.parentNode) {
      this.uiCanvas.parentNode.removeChild(this.uiCanvas);
    }
  }
}

