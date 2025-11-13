import { Game } from './Game';
import { ThreeRenderer } from './rendering/ThreeRenderer';
import { Vector2 } from './types';
import { GameConfig } from './GameConfig';
import { dev } from './utils/dev';
import { getKeyboardManager } from './utils/KeyboardManager';

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
  private keyboardManager = getKeyboardManager();
  private unregisterHandlers: (() => void)[] = [];
  
  private performanceMode: boolean = false;

  constructor() {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    
    this.setupCanvas();
    
    this.game = new Game(this.canvas.width, this.canvas.height);
    this.renderer = new ThreeRenderer(this.canvas);
    
    // Set game instance in renderer for settings propagation
    this.renderer.setGameInstance(this.game);
    
    this.setupKeyboardHandlers();
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

  /**
   * Setup keyboard handlers using KeyboardManager.
   */
  private setupKeyboardHandlers(): void {
    // Global backtick toggle (highest priority, works in all contexts)
    const unregisterBacktick = this.keyboardManager.register({
      priority: 1000, // Highest priority
      key: ['`', '~', 'Backquote'], // Support multiple key identifiers
      handler: (event) => {
        this.renderer.toggleDeveloperPanel();
        // Context update handled by toggleDeveloperPanel()
        return true; // Handled
      },
      preventDefault: true,
      stopPropagation: true,
      debounceMs: 200 // Prevent rapid toggling
    });
    this.unregisterHandlers.push(unregisterBacktick);

    // Dev panel context handlers (only active when panel is visible)
    // Catch-all handler for all keys in devPanel context
    const unregisterDevPanel = this.keyboardManager.register({
      priority: 100,
      context: 'devPanel',
      // No key specified = catch-all handler
      handler: (event) => {
        // Route to dev panel handler
        const handled = this.renderer.handleDeveloperPanelKey(event);
        if (handled) {
          event.preventDefault();
        }
        return handled;
      },
      preventDefault: false // Let individual handlers decide
    });
    this.unregisterHandlers.push(unregisterDevPanel);
  }

  private setupEventListeners(): void {
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
    
    // Click handler for developer panel
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mousePos = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
      // Check if developer panel handled the click
      this.renderer.checkAbilityClick(mousePos);
    });

    // Wheel handler for developer panel scrolling
    this.canvas.addEventListener('wheel', (e) => {
      if (this.renderer && this.renderer.isDeveloperPanelVisible()) {
        this.renderer.handleWheel(e.deltaY);
        e.preventDefault(); // Prevent page scroll when panel is open
      }
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
      
      // Performance mode - only log on transitions to prevent spam
      const shouldBeInPerformanceMode = this.fps < GameConfig.PERFORMANCE_THRESHOLD;
      if (shouldBeInPerformanceMode && !this.performanceMode) {
        this.performanceMode = true;
        dev.warn('Performance mode activated', { fps: this.fps });
      } else if (!shouldBeInPerformanceMode && this.performanceMode && this.fps >= GameConfig.TARGET_FPS) {
        this.performanceMode = false;
        dev.log('Performance mode deactivated', { fps: this.fps });
      }
    }
    
    // Update game
    this.game.update(deltaTime);
    
    // Render - player, stressors, and abilities
    const state = this.game.getState();
    const center = this.game.getCenter();
    const stressors = this.game.getStressors();
    const abilityState = this.game.getAbilities();
    const systemContext = this.game.getSystemContext();
    
    this.renderer.render(
      state,
      center,
      deltaTime,
      this.performanceMode,
      stressors,
      abilityState,
      systemContext
    );
    
    requestAnimationFrame(this.animate);
  };
}

// Start the game
new GameApp();
