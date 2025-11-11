import { Game } from './Game';
import { Renderer } from './rendering/Renderer';
// import { AudioSystem } from './audio/AudioSystem'; // Audio disabled for now
import { UpgradeWheel } from './ui/UpgradeWheel';
import { Vector2, AbilityState } from './types';
import { GameConfig } from './GameConfig';
import { dev } from './utils/dev';

class GameApp {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private game: Game;
  private renderer: Renderer;
  // private audioSystem: AudioSystem; // Audio disabled for now
  private upgradeWheel: UpgradeWheel;
  
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private fps: number = 60;
  private lastFpsUpdate: number = 0;
  
  private isRunning: boolean = false;
  
  private upgradeWheelVisible: boolean = false;
  private upgradeWheelTimer: number = 0;
  private statsTableVisible: boolean = false;
  
  private reflectionData: { duration: number; wave: number; insight: number } | null = null;
  private showingReflection: boolean = false;
  
  private mousePos: Vector2 = { x: 0, y: 0 };
  private keys: Set<string> = new Set();
  
  private performanceMode: boolean = false;

  constructor() {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    
    this.setupCanvas();
    
    const center = { x: this.canvas.width / 2, y: this.canvas.height / 2 };
    this.game = new Game(this.canvas.width, this.canvas.height);
    this.renderer = new Renderer(this.canvas);
    // this.audioSystem = new AudioSystem(); // Audio disabled for now
    this.upgradeWheel = new UpgradeWheel(center, this.canvas.width, this.canvas.height);
    
    this.setupEventListeners();
    this.setupGameCallbacks();
    this.setupWindowHandlers();
    
    // Audio initialization disabled
    // document.addEventListener('click', () => {
    //   this.audioSystem.initialize();
    // }, { once: true });
    
    this.start();
  }
  
  private setupWindowHandlers(): void {
    // Reset breathe state if window loses focus (prevents stuck state)
    window.addEventListener('blur', () => {
      if (this.game.getAbilitySystem().getBreatheHeld()) {
        this.game.getAbilitySystem().forceReleaseBreathe();
      }
    });
    
    // Also handle visibility change (tab switch, minimize, etc.)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (this.game.getAbilitySystem().getBreatheHeld()) {
          this.game.getAbilitySystem().forceReleaseBreathe();
        }
      }
    });
  }

  private setupCanvas(): void {
    const resize = () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    };
    
    resize();
    window.addEventListener('resize', resize);
  }


  private setupEventListeners(): void {
    // Keyboard - use document for better compatibility
    document.addEventListener('keydown', (e) => {
      this.keys.add(e.key.toLowerCase());
      this.handleKeyDown(e);
    });
    
    document.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
      this.handleKeyUp(e);
    });
    
    // Mouse
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mousePos = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
      // Update mouse position for hover detection
      this.renderer.updateMousePos(this.mousePos);
    });
    
    this.canvas.addEventListener('click', (e) => {
      // Safety: Release breathe if stuck (allows UI interaction to resume)
      if (this.game.getAbilitySystem().getBreatheHeld()) {
        // Only force release if it's been held for more than 5 seconds (likely stuck)
        const holdDuration = (Date.now() - this.game.getAbilitySystem().getBreatheHoldStart()) / 1000;
        if (holdDuration > 5) {
          this.game.getAbilitySystem().forceReleaseBreathe();
        }
      }
      
      if (this.showingReflection) {
        this.game.reset();
        this.showingReflection = false;
        this.reflectionData = null;
        return;
      }
      
      // Check if clicking on ability upgrade menu
      const clickedAbility = this.renderer.checkAbilityClick(this.mousePos);
      if (clickedAbility) {
        const state = this.game.getState();
        const abilitySystem = this.game.getAbilitySystem();
        const abilities = abilitySystem.getAbilities();
        const ability = abilities[clickedAbility as keyof typeof abilities];
        const upgradeCost = Math.floor(
          GameConfig.UPGRADE_COST_BASE * 
          Math.pow(GameConfig.UPGRADE_COST_MULTIPLIER, ability.level)
        );
        
        if (state.insight >= upgradeCost && ability.level < ability.maxLevel) {
          this.game.upgradeAbility(clickedAbility as keyof AbilityState);
        }
        return;
      }
      
      // Old upgrade wheel click handling (can be removed if not needed)
      if (this.upgradeWheelVisible) {
        const clicked = this.upgradeWheel.checkClick(this.mousePos);
        if (clicked) {
          this.game.upgradeAbility(clicked as keyof AbilityState);
          this.hideUpgradeWheel();
        }
      }
    });
    
    // Touch support
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      this.mousePos = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
      
      if (this.showingReflection) {
        this.game.reset();
        this.showingReflection = false;
        this.reflectionData = null;
        return;
      }
      
      // Long press for breathe
      const touchStartTime = Date.now();
      const touchTimeout = setTimeout(() => {
        this.game.startBreathe();
      }, 300);
      
      const touchEnd = () => {
        clearTimeout(touchTimeout);
        const duration = Date.now() - touchStartTime;
        if (duration >= 300) {
          this.game.useBreathe();
        }
        document.removeEventListener('touchend', touchEnd);
      };
      
      document.addEventListener('touchend', touchEnd);
    });
  }

  private handleKeyDown(e: KeyboardEvent): void {
    // Prevent default for keys we handle to avoid browser shortcuts
    const handledKeys = ['[', ']', '-', '=', '+', '_', 't', 'T', 'Escape'];
    if (handledKeys.includes(e.key) || handledKeys.includes(e.code)) {
      e.preventDefault();
    }
    
    if (this.showingReflection) {
      if (e.key === ' ' || e.key === 'Space') {
        e.preventDefault();
        this.game.reset();
        this.showingReflection = false;
        this.reflectionData = null;
      }
      return;
    }
    
    if (this.upgradeWheelVisible) {
      if (e.key === 'Escape') {
        this.hideUpgradeWheel();
      }
      return;
    }
    
    if (this.statsTableVisible && e.key === 'Escape') {
      this.statsTableVisible = false;
      return;
    }
    
    // Handle pace adjustment keys
    // Bracket keys: [ and ]
    // Alternative keys: - and = (or +)
    if (e.key === '[' || e.code === 'BracketLeft' || e.key === '-' || e.key === '_') {
      this.game.decrementPace();
      return;
    }
    
    if (e.key === ']' || e.code === 'BracketRight' || e.key === '=' || e.key === '+' || (e.key === '=' && e.shiftKey)) {
      this.game.incrementPace();
      return;
    }
    
    switch (e.key.toLowerCase()) {
      case 't':
        this.statsTableVisible = !this.statsTableVisible;
        break;
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    // Breathe is now automatic - no key handling needed
  }

  private setupGameCallbacks(): void {
    this.game.setStateChangeCallback((state) => {
      // Check if upgrade wheel should be shown
      if (state.insight >= GameConfig.UPGRADE_COST_BASE && !this.upgradeWheelVisible) {
        this.showUpgradeWheel();
      }
    });
    
    this.game.setGameOverCallback((data) => {
      this.showingReflection = true;
      this.reflectionData = data;
      // this.audioSystem.stop(); // Audio disabled
    });
  }

  private showUpgradeWheel(): void {
    this.upgradeWheelVisible = true;
    this.upgradeWheel.setVisible(true);
    this.upgradeWheelTimer = 5; // Auto-hide after 5 seconds
  }

  private hideUpgradeWheel(): void {
    this.upgradeWheelVisible = false;
    this.upgradeWheel.setVisible(false);
    this.upgradeWheelTimer = 0;
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
    
    // Update upgrade wheel timer
    if (this.upgradeWheelVisible) {
      this.upgradeWheelTimer -= deltaTime;
      if (this.upgradeWheelTimer <= 0) {
        this.hideUpgradeWheel();
      }
    }
    
    // Update game
    if (!this.showingReflection) {
      this.game.update(deltaTime);
      
      // Audio update disabled
      // const state = this.game.getState();
      // this.audioSystem.update(state);
    }
    
    // Render
    if (this.showingReflection && this.reflectionData) {
      this.renderer.renderReflection(
        this.reflectionData.duration,
        this.reflectionData.wave,
        this.reflectionData.insight
      );
    } else {
      const state = this.game.getState();
      const stressors = this.game.getStressorSystem().getStressors();
      const center = this.game.getCenter();
      const auraRadius = this.game.getAuraRadius();
      const abilitySystem = this.game.getAbilitySystem();
      
      // Get breathing cycle progress for automatic breathing visualization
      const breatheCycleProgress = abilitySystem.getBreatheCycleProgress();
      this.renderer.render(
        state,
        center,
        stressors,
        auraRadius,
        true, // Always show breathing (automatic)
        breatheCycleProgress,
        abilitySystem // Pass ability system for Recenter cone rendering
      );
      
      this.renderer.renderUI(state, abilitySystem);
      
      // Upgrade wheel is now integrated into the HUD, no need to render separately
      
      // Render stats table
      if (this.statsTableVisible) {
        this.renderer.renderStatsTable(state, stressors);
      }
      
      // FPS display (dev mode only, when stats table visible)
      // @ts-ignore - Vite provides import.meta.env
      if (import.meta.env?.DEV && this.statsTableVisible) {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(10, 10, 100, 30);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '14px monospace';
        this.ctx.fillText(`FPS: ${this.fps}`, 15, 30);
      }
    }
    
    requestAnimationFrame(this.animate);
  };
}

// Start the game
new GameApp();

