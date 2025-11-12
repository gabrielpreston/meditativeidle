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
  
  constructor(scene: THREE.Scene, width: number, height: number) {
    this.scene = scene;
    this.width = width;
    this.height = height;
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
      
      // Use custom shader for player circle
      const baseColor = new THREE.Color(0xb19cd9); // Soft liquid purple
      const material = new THREE.ShaderMaterial({
        uniforms: {
          circleColor: { value: baseColor },
          circleRadius: { value: GameConfig.CENTER_RADIUS },
          pulseAmount: { value: 0.0 },
          edgeSoftness: { value: 0.4 } // Controls edge softness
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
    
    // Pulse animation - 8 second cycle: 2π / (8 * 1000) ≈ 0.000785 radians per millisecond
    const pulsePhase = (Math.sin(Date.now() * 0.000785) + 1.0) * 0.5; // 0.0 to 1.0
    const pulseAmount = pulsePhase * serenityRatio; // Pulse intensity based on serenity
    
    // Update shader uniforms
    const material = this.centerMesh.material as THREE.ShaderMaterial;
    if (material && material.uniforms) {
      // Update pulse amount
      material.uniforms.pulseAmount.value = pulseAmount;
      
      // Update color based on serenity
      const t = smoothstep(0.3, 0.7, serenityRatio);
      const highColor = new THREE.Color(0xe6d5f5); // Light soft lavender (high serenity)
      const lowColor = new THREE.Color(0x9370db); // Deeper soft purple (low serenity)
      const currentColor = new THREE.Color();
      currentColor.lerpColors(lowColor, highColor, t);
      material.uniforms.circleColor.value = currentColor;
      
      // Update edge softness based on serenity
      material.uniforms.edgeSoftness.value = 0.3 + (serenityRatio * 0.3); // 0.3 to 0.6
    }
    
    // Scale animation (subtle pulse)
    const scalePulse = 1 + Math.sin(Date.now() * 0.000785) * 0.05 * serenityRatio;
    this.centerMesh.scale.set(scalePulse, scalePulse, 1);
  }

  /**
   * Get current pulse data
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
