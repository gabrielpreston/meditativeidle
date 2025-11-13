import * as THREE from 'three';
import { GameState, Vector2, Stressor } from '../../types';
import { GameConfig } from '../../GameConfig';
import { smoothstep } from '../../utils/MathUtils';
import { getBreathMinRadius, getBreathMaxRadius, clampBreathRadius } from '../../utils/BreathUtils';
import { PlayerCircleShader } from './PlayerCircleShader';
import { StressorRenderer } from './StressorRenderer';
import { PulsingAoERenderer } from './PulsingAoERenderer';

export class GameScene {
  private scene: THREE.Scene;
  private centerMesh: THREE.Mesh | null = null;
  private breathAoERenderer: PulsingAoERenderer | null = null; // Reusable pulsing AoE renderer
  private debugRings: THREE.Mesh[] = []; // Debug concentric rings
  private width: number;
  private height: number;
  private stressorRenderer: StressorRenderer;
  private initialGeometryRadius: number = GameConfig.PLAYER_RADIUS; // Track initial geometry radius for scaling
  
  constructor(scene: THREE.Scene, width: number, height: number) {
    this.scene = scene;
    this.width = width;
    this.height = height;
    this.stressorRenderer = new StressorRenderer(scene, width, height);
  }
  
  setSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.stressorRenderer.setSize(width, height);
    // Update renderer size for coordinate conversion
    if (this.breathAoERenderer) {
      this.breathAoERenderer.setSize(width, height);
    }
  }
  
  update(
    state: GameState,
    center: Vector2,
    stressors: Stressor[],
    breathRadius?: number // Optional: current breath AoE radius for visual
  ): void {
    const serenityRatio = state.serenity / state.maxSerenity;
    
    // Update center (create if doesn't exist, or recreate if PLAYER_RADIUS changed)
    const currentPlayerRadius = GameConfig.PLAYER_RADIUS;
    if (!this.centerMesh || this.initialGeometryRadius !== currentPlayerRadius) {
      // Dispose old mesh if it exists
      if (this.centerMesh) {
        this.centerMesh.geometry.dispose();
        (this.centerMesh.material as THREE.Material).dispose();
        this.scene.remove(this.centerMesh);
      }
      
      // Use PLAYER_RADIUS from config for geometry size (matches visual radius)
      this.initialGeometryRadius = currentPlayerRadius;
      const geometry = new THREE.CircleGeometry(this.initialGeometryRadius, 32);
      
      // Use custom shader for player circle
      const baseColor = new THREE.Color(0x000000); // Black
      const material = new THREE.ShaderMaterial({
        uniforms: {
          circleColor: { value: baseColor },
          circleRadius: { value: currentPlayerRadius }, // Used by shader for world-space calculation
          pulseAmount: { value: 0.0 },
          edgeSoftness: { value: 0.4 }, // Controls edge softness
          opacity: { value: GameConfig.PLAYER_OPACITY } // Player circle opacity (0.0 to 1.0)
        },
        vertexShader: PlayerCircleShader.vertex,
        fragmentShader: PlayerCircleShader.fragment,
        transparent: true,
        side: THREE.DoubleSide
      });
      
      this.centerMesh = new THREE.Mesh(geometry, material);
      this.scene.add(this.centerMesh);
    }
    
    // Update center position
    // Convert Canvas 2D coordinates (0,0 top-left, y down) to Three.js orthographic (0,0 center, y up)
    // Camera covers exactly width x height, centered at (0, 0)
    const x = center.x - this.width / 2;
    const y = -(center.y - this.height / 2); // Flip Y axis (canvas Y down -> Three.js Y up)
    this.centerMesh.position.set(x, y, 0);
    
    // Ensure mesh is visible
    this.centerMesh.visible = true;
    
            // Update shader uniforms
            const material = this.centerMesh.material as THREE.ShaderMaterial;
            if (material && material.uniforms) {
              // No pulse - player circle is static
              material.uniforms.pulseAmount.value = 0.0;
              
              // Player circle is always black
              material.uniforms.circleColor.value = new THREE.Color(0x000000);
              
              // Update opacity from config (allows live updates from dev panel)
              material.uniforms.opacity.value = GameConfig.PLAYER_OPACITY;
              
              // Update circle radius uniform (used by shader for world-space calculation)
              material.uniforms.circleRadius.value = GameConfig.PLAYER_RADIUS;
              
              // Update edge softness based on serenity
              // REMOVED: No soft edges to eliminate fading aura effect
              material.uniforms.edgeSoftness.value = 0.0; // Hard edges, no fade
            }
            
            // Geometry size matches visual size, so no scaling needed
            // If PLAYER_RADIUS changes, geometry will be recreated (mesh disposal handled elsewhere)
            this.centerMesh.scale.set(1, 1, 1);
    
    // Update breath AoE ring (purple pulsing circle)
    if (breathRadius !== undefined) {
      this.updateBreathAoE(center, breathRadius);
    } else {
      // Hide if no radius provided
      if (this.breathAoERenderer) {
        this.breathAoERenderer.hide();
      }
    }
    
    // Update stressor rendering with dynamic colors based on Serenity
    this.stressorRenderer.update(stressors, center, serenityRatio);
    
    // Update debug rings
    this.updateDebugRings(center);
  }
  
  /**
   * Update breath AoE visual - purple filled circle that pulses with breathing cycle
   * Uses PulsingAoERenderer for reusable rendering pattern
   */
  private updateBreathAoE(center: Vector2, radius: number): void {
    // Calculate expected min and max radius
    const maxRadius = getBreathMaxRadius();
    
    // Clamp radius to valid range (safety check)
    const clampedRadius = clampBreathRadius(radius);
    
    // Create renderer if it doesn't exist
    if (!this.breathAoERenderer) {
      this.breathAoERenderer = new PulsingAoERenderer(
        this.scene,
        maxRadius,
        0x9370db, // Purple (#9370db)
        0.4, // Semi-transparent so player circle is visible
        64, // Segments
        -0.1, // Slightly behind player circle
        this.width,
        this.height
      );
    }
    
    // Update renderer with current radius and max radius
    // Renderer will recreate geometry if max radius changed
    this.breathAoERenderer.update(center, clampedRadius, maxRadius);
  }

  /**
   * Update center radius by recreating the geometry.
   * Note: This method is called when PLAYER_RADIUS changes via dev panel.
   * The geometry will be recreated on the next update() call.
   */
  updateCenterRadius(value: number): void {
    // Geometry will be recreated in update() method when PLAYER_RADIUS changes
    // This method exists for compatibility with ThreeRenderer's setting change handler
  }

  /**
   * Get current pulse data
   */
  getPulseData(): { phase: number; radius: number } {
    // 8 second cycle: 2π / (8 * 1000) ≈ 0.000785 radians per millisecond
    const pulsePhase = (Math.sin(Date.now() * 0.000785) + 1.0) * 0.5; // 0.0 to 1.0
    const currentRadius = GameConfig.PLAYER_RADIUS; // Use current config value
    const pulseRadius = currentRadius * (1.0 + pulsePhase * 0.15);
    return { phase: pulsePhase, radius: pulseRadius };
  }
  
  /**
   * Update debug rings - concentric circles every 50px
   */
  private updateDebugRings(center: Vector2): void {
    const showRings = GameConfig.DEBUG_SHOW_RINGS === 1;
    
    // Remove all rings if disabled
    if (!showRings) {
      this.clearDebugRings();
      return;
    }
    
    // Calculate how many rings we need (up to screen edge)
    const maxDistance = Math.max(this.width, this.height) / 2;
    const ringSpacing = 50;
    const numRings = Math.ceil(maxDistance / ringSpacing);
    
    // Create rings if needed - start at 50px, then 100px, 150px, etc.
    while (this.debugRings.length < numRings) {
      const ringIndex = this.debugRings.length;
      const innerRadius = (ringIndex + 1) * ringSpacing; // Start at 50px, then 100px, 150px, etc.
      const outerRadius = innerRadius + 2; // 2px thick rings
      
      const geometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
      const material = new THREE.MeshBasicMaterial({
        color: 0x00ff00, // Green
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
      });
      
      const ring = new THREE.Mesh(geometry, material);
      this.scene.add(ring);
      this.debugRings.push(ring);
    }
    
    // Remove excess rings
    while (this.debugRings.length > numRings) {
      const ring = this.debugRings.pop();
      if (ring) {
        ring.geometry.dispose();
        (ring.material as THREE.Material).dispose();
        this.scene.remove(ring);
      }
    }
    
    // Update ring positions
    const x = center.x - this.width / 2;
    const y = -(center.y - this.height / 2); // Flip Y axis
    for (let i = 0; i < this.debugRings.length; i++) {
      this.debugRings[i].position.set(x, y, -0.2); // Behind breath AoE
      this.debugRings[i].visible = true;
    }
  }
  
  /**
   * Clear all debug rings
   */
  private clearDebugRings(): void {
    for (const ring of this.debugRings) {
      ring.visible = false;
    }
  }
  
  dispose(): void {
    if (this.centerMesh) {
      this.centerMesh.geometry.dispose();
      (this.centerMesh.material as THREE.Material).dispose();
      this.centerMesh = null;
    }
    if (this.breathAoERenderer) {
      this.breathAoERenderer.dispose();
      this.breathAoERenderer = null;
    }
    // Dispose debug rings
    for (const ring of this.debugRings) {
      ring.geometry.dispose();
      (ring.material as THREE.Material).dispose();
      this.scene.remove(ring);
    }
    this.debugRings = [];
  }
}
