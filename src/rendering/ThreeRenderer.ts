import * as THREE from 'three';
import { EffectComposer, RenderPass } from 'postprocessing';
import { GameState, Vector2 } from '../types';
import { GameConfig } from '../GameConfig';
import { GameScene } from './scenes/GameScene';
import { WatercolorPass } from './watercolor/WatercolorPass';
import { WatercolorStateController } from './watercolor/WatercolorStateController';
import { WatercolorUIRenderer } from './ui/WatercolorUIRenderer';
import { FluidStatsTable } from './ui/elements/FluidStatsTable';
import { FluidReflectionScreen } from './ui/elements/FluidReflectionScreen';
import { smoothstep } from '../utils/MathUtils';

export class ThreeRenderer {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private composer: EffectComposer;
  private gameScene: GameScene;
  private watercolorController: WatercolorStateController;
  private width: number;
  private height: number;
  
  // UI overlay canvas (separate from WebGL canvas)
  private uiCanvas: HTMLCanvasElement;
  private uiCtx: CanvasRenderingContext2D;
  
  // Fluid UI renderer (will replace old UI rendering in Phase 3)
  private watercolorUIRenderer: WatercolorUIRenderer | null = null;
  
  // Modal screens (Phase 6)
  private fluidStatsTable: FluidStatsTable | null = null;
  private fluidReflectionScreen: FluidReflectionScreen | null = null;
  
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
    this.renderer.setClearColor(0xf5f5dc, 1.0); // Set clear color to beige
    
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
    this.scene.background = new THREE.Color(0xf5f5dc); // Default background
    
    // Setup game scene
    const paperTexture = this.loadPaperTexture();
    this.gameScene = new GameScene(this.scene, this.width, this.height, paperTexture);
    
    // Setup post-processing pipeline
    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);
    
    // Setup watercolor pass (uses same paper texture)
    // Note: Bloom effect can be added later if needed - watercolor provides visual polish
    const watercolorPass = new WatercolorPass({
      width: this.width,
      height: this.height,
      paperTexture
    });
    
    // Add watercolor post-processing pass
    this.composer.addPass(watercolorPass);
    
    // Debug: Check for WebGL errors
    const gl = this.renderer.getContext();
    const error = gl.getError();
    if (error !== gl.NO_ERROR) {
      console.error('WebGL error after composer setup:', error);
    }
    
    // Debug: Log pass info
    console.log('WatercolorPass added, total passes:', this.composer.passes.length);
    
    // CRITICAL: Set composer size - without this, it defaults to 0x0 and renders black
    this.composer.setSize(this.width, this.height);
    
    // Debug: Check if composer is set up correctly
    console.log('Composer size:', this.width, this.height);
    console.log('Composer passes:', this.composer.passes.length);
    
    // Setup watercolor state controller
    this.watercolorController = new WatercolorStateController();
    
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
    
    // Initialize watercolor UI renderer (will be populated with elements in Phase 3)
    this.watercolorUIRenderer = new WatercolorUIRenderer(
      this.uiCtx,
      this.width,
      this.height,
      this.watercolorController
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
  }
  
  render(
    state: GameState,
    center: Vector2
  ): void {
    const serenityRatio = state.serenity / state.maxSerenity;
    
    // Update watercolor state controller
    this.watercolorController.update(serenityRatio);
    const watercolorParams = this.watercolorController.getUniforms();
    
    // Reduce intensity for better visibility with small circle
    const adjustedParams = {
      ...watercolorParams,
      diffusionRate: (watercolorParams.diffusionRate || 0.5) * 0.3, // Reduce diffusion significantly
      edgeDarkeningIntensity: (watercolorParams.edgeDarkeningIntensity || 0.3) * 0.5, // Reduce edge darkening
      wetness: (watercolorParams.wetness || 0.7) * 0.5 // Reduce wetness
    };
    
    // Update game scene (just the center/player)
    this.gameScene.update(
      state,
      center
    );
    
    // Get pulse data for radial wetness effect
    const pulseData = this.gameScene.getPulseData();
    
    // Update watercolor pass uniforms and pulse data
    const watercolorPass = this.composer.passes.find(p => p instanceof WatercolorPass);
    if (watercolorPass && watercolorPass instanceof WatercolorPass) {
      // Set pulse data for radial wetness (paint re-wetting paper)
      watercolorPass.setPulseData(center, pulseData.radius, pulseData.phase);
      // Set other watercolor parameters
      watercolorPass.setUniforms(adjustedParams);
    }
    
    // Update scene colors based on serenity
    this.updateSceneColors(serenityRatio);
    
    // Render with post-processing
    this.composer.render();
  }
  
  private loadPaperTexture(): THREE.Texture {
    const loader = new THREE.TextureLoader();
    // Create a simple procedural paper texture for now
    // TODO: Replace with actual paper texture image in public/textures/
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    // Create simple noise pattern for paper texture
    const imageData = ctx.createImageData(512, 512);
    for (let i = 0; i < imageData.data.length; i += 4) {
      const noise = Math.random() * 0.3 + 0.7; // 0.7-1.0 range
      imageData.data[i] = noise * 255;     // R
      imageData.data[i + 1] = noise * 255; // G
      imageData.data[i + 2] = noise * 255; // B
      imageData.data[i + 3] = 255;         // A
    }
    ctx.putImageData(imageData, 0, 0);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
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
    // Use watercolor UI renderer (all phases complete)
    if (this.watercolorUIRenderer) {
      this.watercolorUIRenderer.render(state, abilitySystem, deltaTime);
    }
  }
  
  updateMousePos(pos: Vector2): void {
    // Update watercolor UI renderer
    if (this.watercolorUIRenderer) {
      this.watercolorUIRenderer.updateMousePos(pos);
    }
    // Update modal screens for hover detection
    if (this.fluidStatsTable) {
      this.fluidStatsTable.updateMousePos(pos);
    }
  }
  
  checkAbilityClick(mousePos: Vector2): string | null {
    // Use watercolor UI renderer (all phases complete)
    if (this.watercolorUIRenderer) {
      return this.watercolorUIRenderer.checkAbilityClick(mousePos);
    }
    return null;
  }
  
  renderStatsTable(state: GameState, stressors: any[]): void {
    // Use fluid stats table (Phase 6)
    if (this.fluidStatsTable && this.watercolorUIRenderer) {
      this.fluidStatsTable.show(state, stressors);
      const fluidField = this.watercolorUIRenderer.getFluidField();
      this.fluidStatsTable.update(0.016, fluidField, []);
      this.fluidStatsTable.render(this.uiCtx, Date.now() * 0.001);
    }
  }
  
  renderReflection(duration: number, wave: number, insight: number): void {
    // Use fluid reflection screen (Phase 6)
    if (this.fluidReflectionScreen && this.watercolorUIRenderer) {
      this.fluidReflectionScreen.show(duration, wave, insight);
      const fluidField = this.watercolorUIRenderer.getFluidField();
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
    
    // Resize UI overlay canvas
    this.uiCanvas.width = width;
    this.uiCanvas.height = height;
    
    // Resize watercolor UI renderer
    if (this.watercolorUIRenderer) {
      this.watercolorUIRenderer.resize(width, height);
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
    
    // Update game scene dimensions
    this.gameScene.setSize(width, height);
  }
  
  dispose(): void {
    this.renderer.dispose();
    this.composer.dispose();
    this.gameScene.dispose();
    document.body.removeChild(this.uiCanvas);
  }
}

