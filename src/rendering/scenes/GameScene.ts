import * as THREE from 'three';
import { GameState, Vector2 } from '../../types';
import { GameConfig } from '../../GameConfig';
import { smoothstep } from '../../utils/MathUtils';
import { PlayerCircleShader } from './PlayerCircleShader';

export class GameScene {
  private scene: THREE.Scene;
  private centerMesh: THREE.Mesh | null = null;
  private width: number;
  private height: number;
  private paperTexture: THREE.Texture | null = null;
  
  constructor(scene: THREE.Scene, width: number, height: number, paperTexture?: THREE.Texture) {
    this.scene = scene;
    this.width = width;
    this.height = height;
    this.paperTexture = paperTexture || null;
  }
  
  setPaperTexture(texture: THREE.Texture): void {
    this.paperTexture = texture;
    // Update material if mesh already exists
    if (this.centerMesh && this.centerMesh.material instanceof THREE.ShaderMaterial) {
      this.centerMesh.material.uniforms.paperTexture.value = texture;
    }
  }
  
  setSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }
  
  update(
    state: GameState,
    center: Vector2
  ): void {
    const serenityRatio = state.serenity / state.maxSerenity;
    
    // Update center (create if doesn't exist)
    if (!this.centerMesh) {
      const geometry = new THREE.CircleGeometry(GameConfig.CENTER_RADIUS, 32);
      
      // Use custom watercolor shader to simulate paint on paper
      const baseColor = new THREE.Color(0xd2691e); // Darker, more intense orange/peach
      const material = new THREE.ShaderMaterial({
        uniforms: {
          circleColor: { value: baseColor },
          circleRadius: { value: GameConfig.CENTER_RADIUS },
          pulseAmount: { value: 0.0 },
          edgeSoftness: { value: 0.4 }, // Controls how much paint bleeds (watercolor effect)
          paperTextureScale: { value: 2.0 },
          paperTexture: { value: this.paperTexture || new THREE.Texture() }
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
    
    // Watercolor paint pulse animation - simulates paint spreading on paper
    // 8 second cycle: 2π / (8 * 1000) ≈ 0.000785 radians per millisecond
    const pulsePhase = (Math.sin(Date.now() * 0.000785) + 1.0) * 0.5; // 0.0 to 1.0
    const pulseAmount = pulsePhase * serenityRatio; // Paint spreads more when serenity is higher
    
    // Update shader uniforms for watercolor effect
    const material = this.centerMesh.material as THREE.ShaderMaterial;
    if (material && material.uniforms) {
      // Update pulse amount (simulates paint spreading/bleeding)
      material.uniforms.pulseAmount.value = pulseAmount;
      
      // Update color based on serenity (darker, more intense colors)
      const t = smoothstep(0.3, 0.7, serenityRatio);
      const highColor = new THREE.Color(0xff8c42); // Intense orange
      const lowColor = new THREE.Color(0xcc5500); // Dark, intense burnt orange
      const currentColor = new THREE.Color();
      currentColor.lerpColors(lowColor, highColor, t);
      material.uniforms.circleColor.value = currentColor;
      
      // Update edge softness based on serenity (more wet = more bleeding)
      material.uniforms.edgeSoftness.value = 0.3 + (serenityRatio * 0.3); // 0.3 to 0.6
    }
    
    // Scale animation (subtle, paint doesn't change size much, just spreads)
    const scalePulse = 1 + Math.sin(Date.now() * 0.000785) * 0.05 * serenityRatio; // Reduced from 0.1 to 0.05
    this.centerMesh.scale.set(scalePulse, scalePulse, 1);
  }

  /**
   * Get current pulse data for radial wetness effect
   * Used by ThreeRenderer to pass pulse information to WatercolorPass
   */
  getPulseData(): { phase: number; radius: number } {
    // 8 second cycle: 2π / (8 * 1000) ≈ 0.000785 radians per millisecond
    const pulsePhase = (Math.sin(Date.now() * 0.000785) + 1.0) * 0.5; // 0.0 to 1.0
    const pulseRadius = GameConfig.CENTER_RADIUS * (1.0 + pulsePhase * 0.15);
    return { phase: pulsePhase, radius: pulseRadius };
  }
  
  dispose(): void {
    if (this.centerMesh) {
      this.centerMesh.geometry.dispose();
      (this.centerMesh.material as THREE.Material).dispose();
      this.centerMesh = null;
    }
  }
}
