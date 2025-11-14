import * as THREE from 'three';
import { Stressor, Vector2 } from '../../types';
import { getStressorColor } from '../../config/ColorConfig';
import { StressorShader } from './StressorShader';

/**
 * StressorRenderer - Renders stressors as Three.js meshes with liquid watermedia shader effects
 */
export class StressorRenderer {
  private scene: THREE.Scene;
  private width: number;
  private height: number;
  private stressorMeshes: Map<string, THREE.Mesh> = new Map();
  private shaderMaterial: THREE.ShaderMaterial;
  
  constructor(scene: THREE.Scene, width: number, height: number) {
    this.scene = scene;
    this.width = width;
    this.height = height;
    
    // Create shader material with liquid watermedia effects
    this.shaderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        stressorColor: { value: new THREE.Color(1, 0, 0) },
        stressorSize: { value: 10.0 },
        edgeSoftness: { value: 0.4 },
        pulseAmount: { value: 0.0 },
        healthRatio: { value: 1.0 }
      },
      vertexShader: StressorShader.vertex,
      fragmentShader: StressorShader.fragment,
      transparent: true,
      side: THREE.DoubleSide
    });
  }
  
  update(stressors: Stressor[], center: Vector2, serenityRatio: number): void {
    const currentIds = new Set(stressors.map(s => s.id));
    
    // Remove dead stressors
    for (const [id, mesh] of this.stressorMeshes.entries()) {
      if (!currentIds.has(id)) {
        this.scene.remove(mesh);
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(m => m.dispose());
        } else {
          mesh.material.dispose();
        }
        this.stressorMeshes.delete(id);
      }
    }
    
    // Update/create stressors
    for (const stressor of stressors) {
      let mesh = this.stressorMeshes.get(stressor.id);
      
      if (!mesh) {
        const geometry = new THREE.CircleGeometry(stressor.size, 16);
        const material = this.shaderMaterial.clone();
        mesh = new THREE.Mesh(geometry, material);
        this.scene.add(mesh);
        this.stressorMeshes.set(stressor.id, mesh);
      }
      
      // Update position (convert canvas coords to Three.js coords)
      const x = stressor.position.x - this.width / 2;
      const y = -(stressor.position.y - this.height / 2);
      mesh.position.set(x, y, 0);
      
      // Calculate dynamic color based on Serenity
      const dynamicColor = getStressorColor(stressor.type, serenityRatio);
      
      // Update shader uniforms
      const material = mesh.material as THREE.ShaderMaterial;
      material.uniforms.stressorColor.value.setHex(parseInt(dynamicColor.replace('#', '0x')));
      material.uniforms.stressorSize.value = stressor.size;
      material.uniforms.healthRatio.value = stressor.health / stressor.maxHealth;
      
      // Pulse animation based on health/state
      const pulse = Math.sin(Date.now() * 0.003 + stressor.spawnTime * 0.001) * 0.1;
      material.uniforms.pulseAmount.value = pulse;
    }
  }
  
  setSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }
  
  dispose(): void {
    for (const mesh of this.stressorMeshes.values()) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(m => m.dispose());
      } else {
        mesh.material.dispose();
      }
    }
    this.stressorMeshes.clear();
    this.shaderMaterial.dispose();
  }
}

