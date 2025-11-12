import { Game } from './Game';
import { ThreeRenderer } from './rendering/ThreeRenderer';
import { Vector2 } from './types';
import { GameConfig } from './GameConfig';
import { dev } from './utils/dev';

class GameApp {
  private canvas: HTMLCanvasElement;
  private game: Game;
  private renderer: ThreeRenderer;
  
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private fps: number = 60;
  private lastFpsUpdate: number = 0;
  
  private isRunning: boolean = false;
  
  private mousePos: Vector2 = { x: 0, y: 0 };
  private keys: Set<string> = new Set();
  
  private performanceMode: boolean = false;

  constructor() {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    
    this.setupCanvas();
    
    this.game = new Game(this.canvas.width, this.canvas.height);
    this.renderer = new ThreeRenderer(this.canvas);
    
    this.setupEventListeners();
    
    this.start();
  }

  private setupCanvas(): void {
    const resize = () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      // Notify renderer of resize (works for both Renderer and ThreeRenderer)
      if (this.renderer && typeof (this.renderer as any).resize === 'function') {
        (this.renderer as any).resize(this.canvas.width, this.canvas.height);
      }
    };
    
    resize();
    window.addEventListener('resize', resize);
  }

  private setupEventListeners(): void {
    // Keyboard - use document for better compatibility
    document.addEventListener('keydown', (e) => {
      this.keys.add(e.key.toLowerCase());
    });
    
    document.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });
    
    // Mouse - keep basic mouse tracking for potential future use
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mousePos = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
      // Update mouse position for hover detection
      this.renderer.updateMousePos(this.mousePos);
    });
  }

  private start(): void {
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.animate();
  }

  private animate = (currentTime: number = performance.now()): void => {
    if (!this.isRunning) return;
    
    const deltaTime = (currentTime - this.lastFrameTime) / 1000;
    this.lastFrameTime = currentTime;
    
    // Update FPS
    this.frameCount++;
    if (currentTime - this.lastFpsUpdate >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsUpdate = currentTime;
      
      // Performance mode
      if (this.fps < GameConfig.PERFORMANCE_THRESHOLD && !this.performanceMode) {
        this.performanceMode = true;
        dev.warn('Performance mode activated');
      } else if (this.fps >= GameConfig.TARGET_FPS && this.performanceMode) {
        this.performanceMode = false;
      }
    }
    
    // Update game
    this.game.update(deltaTime);
    
    // Render - just the player at center
    const state = this.game.getState();
    const center = this.game.getCenter();
    
    this.renderer.render(
      state,
      center
    );
    
    requestAnimationFrame(this.animate);
  };
}

// Start the game
new GameApp();
