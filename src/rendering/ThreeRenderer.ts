import * as THREE from 'three';
import { EffectComposer, RenderPass } from 'postprocessing';
import { GameState, Vector2, Stressor, AbilityState } from '../types';
import { SystemContext } from '../systems/ISystem';
import { GameConfig } from '../GameConfig';
import { Game } from '../Game';
import { GameScene } from './scenes/GameScene';
import { LiquidWatermediaStateController } from './watercolor/LiquidWatermediaStateController';
import { FluidSim } from './watercolor/FluidSim';
import { FluidCompositePass } from './watercolor/FluidCompositePass';
import { LiquidWatermediaUIRenderer } from './ui/LiquidWatermediaUIRenderer';
import { FluidStatsTable } from './ui/elements/FluidStatsTable';
import { FluidReflectionScreen } from './ui/elements/FluidReflectionScreen';
import { DeveloperPanel } from '../ui/DeveloperPanel';
import { getKeyboardManager } from '../utils/KeyboardManager';
import { getFPSCounter } from '../utils/FPSCounter';
import { smoothstep } from '../utils/MathUtils';
import { getBreathRadius } from '../utils/BreathUtils';
import { StressorFluidIntegration } from './watercolor/StressorFluidIntegration';
import { AbilityEffects } from './scenes/AbilityEffects';

export class ThreeRenderer {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private composer: EffectComposer;
  private gameScene: GameScene;
  private liquidWatermediaController: LiquidWatermediaStateController;
  private fluid: FluidSim | null = null;
  private fluidPass: FluidCompositePass | null = null;
  private stressorFluidIntegration: StressorFluidIntegration | null = null;
  private abilityEffects: AbilityEffects | null = null;
  private width: number;
  private height: number;
  private lastLODUpdate: number = 0;
  private cachedLOD: { resolution: number; injectionRate: number } | null = null;
  
  // UI overlay canvas (separate from WebGL canvas)
  private uiCanvas: HTMLCanvasElement;
  private uiCtx: CanvasRenderingContext2D;
  
  // Fluid UI renderer (will replace old UI rendering in Phase 3)
  private liquidWatermediaUIRenderer: LiquidWatermediaUIRenderer | null = null;
  
  // Modal screens (Phase 6)
  private fluidStatsTable: FluidStatsTable | null = null;
  private fluidReflectionScreen: FluidReflectionScreen | null = null;
  
  // Developer panel
  private developerPanel: DeveloperPanel | null = null;
  
  constructor(canvas: HTMLCanvasElement) {
    this.width = canvas.width;
    this.height = canvas.height;
    
    // Setup WebGL renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false, // Set to false so background shows through
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0xffffff, 1.0); // Set clear color to white
    
    // Setup camera (orthographic for 2D-like game)
    // Use pixel-perfect mapping: camera covers exactly the canvas size
    const viewSize = Math.max(this.width, this.height);
    const aspect = this.width / this.height;
    this.camera = new THREE.OrthographicCamera(
      -this.width / 2, this.width / 2,
      this.height / 2, -this.height / 2,
      0.1, 2000
    );
    this.camera.position.set(0, 0, 1000);
    
    // Setup scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xffffff); // Default background - white
    
    // Setup game scene
    this.gameScene = new GameScene(this.scene, this.width, this.height);
    
    // Setup post-processing pipeline
    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);
    
    // Setup fluid simulation
    this.fluid = new FluidSim(this.width, this.height, this.renderer);
    this.fluidPass = new FluidCompositePass(this.fluid.getDyeTexture());
    this.composer.addPass(this.fluidPass);
    
    // Setup stressor-fluid integration
    this.stressorFluidIntegration = new StressorFluidIntegration(this.width, this.height);
    
    // Setup ability effects (with fluid reference for dye injection)
    this.abilityEffects = new AbilityEffects(this.width, this.height, this.fluid);
    
    // CRITICAL: Set composer size - without this, it defaults to 0x0 and renders black
    this.composer.setSize(this.width, this.height);
    
    // Debug: Check if composer is set up correctly
    console.log('Composer size:', this.width, this.height);
    console.log('Composer passes:', this.composer.passes.length);
    
    // Setup liquid watermedia state controller
    this.liquidWatermediaController = new LiquidWatermediaStateController();
    
    // Setup UI overlay canvas (separate from WebGL canvas)
    this.uiCanvas = document.createElement('canvas');
    this.uiCanvas.width = this.width;
    this.uiCanvas.height = this.height;
    this.uiCanvas.style.position = 'absolute';
    this.uiCanvas.style.top = '0';
    this.uiCanvas.style.left = '0';
    this.uiCanvas.style.pointerEvents = 'none';
    this.uiCanvas.id = 'uiOverlay';
    document.body.appendChild(this.uiCanvas);
    this.uiCtx = this.uiCanvas.getContext('2d')!;
    
    // Initialize liquid watermedia UI renderer (will be populated with elements in Phase 3)
    this.liquidWatermediaUIRenderer = new LiquidWatermediaUIRenderer(
      this.uiCtx,
      this.width,
      this.height,
      this.liquidWatermediaController
    );
    
    // Initialize modal screens (Phase 6)
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
        // Handle boolean values - convert to number for compatibility (0/1)
        this.handleSettingChange(key, value ? 1 : 0);
      }
    });
  }
  
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
    
    // Get smoothed FPS from unified counter (already updated in main.ts)
    const fps = getFPSCounter().getFPS();
    
    // Update liquid watermedia state controller (for fluid parameters)
    this.liquidWatermediaController.update(serenityRatio);
    
    // Update fluid simulation
    if (this.fluid && this.fluidPass) {
      // Set performance mode
      this.fluid.setPerformanceMode(performanceMode);
      
      // Update fluid parameters
      const fluidParams = {
        viscosity: this.liquidWatermediaController.getViscosity(),
        dyeDissipation: this.liquidWatermediaController.getDyeDissipation(),
        velocityDissipation: this.liquidWatermediaController.getVelocityDissipation(),
        curl: this.liquidWatermediaController.getCurl(),
        pressureIters: this.liquidWatermediaController.getPressureIters(),
      };
      
      // Adjust for performance mode
      if (performanceMode) {
        fluidParams.pressureIters = Math.round(fluidParams.pressureIters * 0.5);
        fluidParams.curl *= 0.7;
        fluidParams.dyeDissipation *= 1.1; // Faster fade
      }
      
      this.fluid.setParams(fluidParams);
      
      // Apply LOD based on FPS and stressor count (throttled)
      if (stressors) {
        const now = performance.now();
        // Only update LOD at throttled interval
        if (now - this.lastLODUpdate >= GameConfig.LOD_UPDATE_INTERVAL_MS) {
          this.lastLODUpdate = now;
          this.cachedLOD = this.fluid.calculateLOD(fps, stressors.length);
        }
        
        // Use cached LOD values
        if (this.cachedLOD) {
          this.fluid.setResolution(this.cachedLOD.resolution);
          if (this.stressorFluidIntegration) {
            this.stressorFluidIntegration.setInjectionRate(this.cachedLOD.injectionRate);
          }
        }
      }
      
      this.fluid.step(deltaTime);
      
      // Update stressor-fluid integration (culling and LOD throttling handled internally)
      if (stressors && this.stressorFluidIntegration && this.fluid) {
        this.stressorFluidIntegration.update(stressors, deltaTime, this.fluid);
      }
      
      // Update fluid composite pass uniforms
      this.fluidPass.setUniforms({
        dyeIntensity: 0.75 + (1 - serenityRatio) * 0.25,
        refractionScale: this.liquidWatermediaController.getRefractionScale(),
        blendMode: 'overlay',
      });
    }
    
    // Calculate current breath AoE radius for visual
    let breathRadius: number | undefined = undefined;
    if (systemContext) {
      const rawProgress = systemContext.getBreatheRawCycleProgress();
      breathRadius = getBreathRadius(rawProgress);
    }
    
    // Update game scene (center/player and stressors)
    this.gameScene.update(
      state,
      center,
      stressors || [],
      breathRadius
    );
    
    // Update ability effects (with fluid dye injection)
    if (this.abilityEffects && systemContext) {
      this.abilityEffects.update(systemContext, center, deltaTime);
    }
    
    // Background stays white - color mixing happens through fluid simulation
    // this.updateSceneColors(serenityRatio); // Disabled - background stays white
    
    // Render with post-processing
    this.composer.render();
    
    // Render developer panel if visible or animating closed
    // Continue updating/rendering while animating to allow closing animation to complete
    if (this.developerPanel && this.developerPanel.isVisibleOrAnimating()) {
      // Clear UI canvas before rendering to prevent cascading artifacts
      this.uiCtx.clearRect(0, 0, this.width, this.height);
      
      const fluidField = this.liquidWatermediaUIRenderer?.getFluidField();
      if (fluidField) {
        this.developerPanel.update(deltaTime, fluidField, []);
      }
      this.developerPanel.render(this.uiCtx, Date.now() * 0.001);
    } else {
      // Clear UI canvas when panel is not visible to remove any lingering artifacts
      this.uiCtx.clearRect(0, 0, this.width, this.height);
    }
  }
  
  private updateSceneColors(serenityRatio: number): void {
    const t = smoothstep(0.3, 0.7, serenityRatio);
    const high = GameConfig.COLOR_HIGH_SERENITY;
    const low = GameConfig.COLOR_LOW_SERENITY;
    
    // Interpolate background color
    const bgColor = this.lerpColor(low.background, high.background, t);
    this.scene.background = new THREE.Color(bgColor);
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
  
  // UI Rendering Methods
  
  renderUI(state: GameState, abilitySystem?: any, deltaTime: number = 0.016): void {
    // Use liquid watermedia UI renderer (all phases complete)
    if (this.liquidWatermediaUIRenderer) {
      this.liquidWatermediaUIRenderer.render(state, abilitySystem, deltaTime);
    }
  }
  
  updateMousePos(pos: Vector2): void {
    // Update liquid watermedia UI renderer
    if (this.liquidWatermediaUIRenderer) {
      this.liquidWatermediaUIRenderer.updateMousePos(pos);
    }
    // Update modal screens for hover detection
    if (this.fluidStatsTable) {
      this.fluidStatsTable.updateMousePos(pos);
    }
    // Update developer panel for hover detection
    if (this.developerPanel) {
      this.developerPanel.updateMousePos(pos);
    }
  }
  
  checkAbilityClick(mousePos: Vector2): string | null {
    // Check developer panel first (if visible, it handles clicks)
    if (this.developerPanel && this.developerPanel.getIsVisible()) {
      if (this.developerPanel.checkClick(mousePos)) {
        return null; // Panel handled the click
      }
    }
    
    // Use liquid watermedia UI renderer (all phases complete)
    if (this.liquidWatermediaUIRenderer) {
      return this.liquidWatermediaUIRenderer.checkAbilityClick(mousePos);
    }
    return null;
  }
  
  /**
   * Toggle developer panel visibility.
   */
  toggleDeveloperPanel(): void {
    if (this.developerPanel) {
      this.developerPanel.toggle();
      // Update keyboard context based on panel visibility
      const keyboardManager = getKeyboardManager();
      const isVisible = this.developerPanel.getIsVisible();
      keyboardManager.setContext(isVisible ? 'devPanel' : 'global');
    }
  }

  /**
   * Check if developer panel is visible.
   */
  isDeveloperPanelVisible(): boolean {
    return this.developerPanel ? this.developerPanel.getIsVisible() : false;
  }

  /**
   * Check if developer panel search is focused.
   */
  isDeveloperPanelSearchFocused(): boolean {
    // This would need to be exposed from DeveloperPanel if needed
    // For now, return false - the panel will handle its own focus
    return false;
  }

  /**
   * Handle wheel event for developer panel scrolling.
   */
  handleWheel(deltaY: number): void {
    if (this.developerPanel && this.developerPanel.getIsVisible()) {
      this.developerPanel.handleWheel(deltaY);
    }
  }

  /**
   * Handle keyboard input for developer panel.
   */
  handleDeveloperPanelKey(event: KeyboardEvent): boolean {
    if (this.developerPanel && this.developerPanel.getIsVisible()) {
      return this.developerPanel.handleKeyEvent(event);
    }
    return false;
  }
  
  private gameInstance: Game | null = null;
  
  /**
   * Set game instance for settings propagation.
   */
  setGameInstance(game: Game): void {
    this.gameInstance = game;
  }
  
  /**
   * Handle setting changes from developer panel.
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
      case 'PLAYER_OPACITY':
        // Opacity is updated directly in GameScene from GameConfig each frame
        // No action needed - it will be picked up on next render
        break;
      // Breath settings are already updated in GameConfig, they propagate automatically
      case 'BREATHE_AOE_BUFFER':
      case 'BREATHE_CYCLE_DURATION':
      case 'BREATHE_AOE_GROWTH':
        // Cycle duration is read from config each frame in AbilitySystem, no action needed
        // Radius changes are reflected immediately in breath AoE visual
        break;
      case 'DEBUG_SHOW_RINGS':
        // Debug rings are updated each frame in GameScene.updateDebugRings()
        // No action needed - it will be picked up on next render
        break;
    }
  }
  
  /**
   * Update center radius (wrapper for GameScene).
   */
  updateCenterRadius(value: number): void {
    if (this.gameScene) {
      this.gameScene.updateCenterRadius(value);
    }
  }
  
  renderStatsTable(state: GameState, stressors: any[]): void {
    // Use fluid stats table (Phase 6)
    if (this.fluidStatsTable && this.liquidWatermediaUIRenderer) {
      this.fluidStatsTable.show(state, stressors);
      const fluidField = this.liquidWatermediaUIRenderer.getFluidField();
      this.fluidStatsTable.update(0.016, fluidField, []);
      this.fluidStatsTable.render(this.uiCtx, Date.now() * 0.001);
    }
  }
  
  renderReflection(duration: number, wave: number, insight: number): void {
    // Use fluid reflection screen (Phase 6)
    if (this.fluidReflectionScreen && this.liquidWatermediaUIRenderer) {
      this.fluidReflectionScreen.show(duration, wave, insight);
      const fluidField = this.liquidWatermediaUIRenderer.getFluidField();
      this.fluidReflectionScreen.update(0.016, fluidField, []);
      this.fluidReflectionScreen.render(this.uiCtx, Date.now() * 0.001);
    }
  }
  
  renderFPS(fps: number): void {
    // Render FPS display on UI overlay
    this.uiCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.uiCtx.fillRect(10, 10, 100, 30);
    this.uiCtx.fillStyle = '#fff';
    this.uiCtx.font = '14px monospace';
    this.uiCtx.fillText(`FPS: ${fps}`, 15, 30);
  }
  
  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    
    // Resize WebGL renderer
    this.renderer.setSize(width, height);
    
    // Update camera (pixel-perfect mapping)
    const viewSize = Math.max(width, height);
    this.camera.left = -width / 2;
    this.camera.right = width / 2;
    this.camera.top = height / 2;
    this.camera.bottom = -height / 2;
    this.camera.updateProjectionMatrix();
    
    // Resize composer
    this.composer.setSize(width, height);
    
    // Resize fluid simulation
    if (this.fluid) {
      this.fluid.resize(width, height);
    }
    if (this.fluidPass) {
      this.fluidPass.setSize(width, height);
    }
    
    // Resize UI overlay canvas
    this.uiCanvas.width = width;
    this.uiCanvas.height = height;
    
    // Resize liquid watermedia UI renderer
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
    
    // Update game scene dimensions
    this.gameScene.setSize(width, height);
  }
  
  dispose(): void {
    if (this.fluid) {
      this.fluid.dispose();
    }
    if (this.fluidPass) {
      this.fluidPass.dispose();
    }
    this.renderer.dispose();
    this.composer.dispose();
    this.gameScene.dispose();
    document.body.removeChild(this.uiCanvas);
  }
}

