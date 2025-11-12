import * as THREE from 'three';
import { Vector2, Stressor } from '../../types';
import { GameConfig } from '../../GameConfig';
import { getAbilityColor, getExhaleWaveColor, getReleaseColor } from '../watercolor/ColorPalette';
import { getAbilityDefinition } from '../../config/AbilityDefinitions';
import { AbilityConfig } from '../../config/AbilityConfig';

/**
 * AbilityEffects - Visual effects rendering for abilities
 * 
 * Uses AbilityDefinitions and ColorPalette for watercolor-style rendering.
 * Design Reference: docs/design/ABILITIES.md
 */
export class AbilityEffects {
  private scene: THREE.Scene;
  private width: number;
  private height: number;
  
  // Aura
  private auraMesh: THREE.Mesh | null = null;
  
  // Recenter pulse
  private recenterPulseMesh: THREE.Mesh | null = null;
  
  // Exhale waves
  private exhaleWaveMeshes: Map<number, THREE.Mesh> = new Map();
  private nextWaveId: number = 0;
  
  // Reflect barrier
  private reflectBarrierMesh: THREE.Mesh | null = null;
  
  // Mantra beam
  private mantraBeamLine: THREE.Line | null = null;
  
  // Ground field
  private groundFieldMesh: THREE.Mesh | null = null;
  private groundFieldParticles: THREE.Points | null = null;
  
  // Release shockwave
  private releaseShockwaveMesh: THREE.Mesh | null = null;
  
  // Affirm glow
  private affirmGlowMesh: THREE.Mesh | null = null;
  
  constructor(scene: THREE.Scene, width: number, height: number) {
    this.scene = scene;
    this.width = width;
    this.height = height;
  }
  
  setSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }
  
  updateAura(
    center: Vector2,
    radius: number,
    serenityRatio: number,
    breatheIntensity: number,
    affirmActive: boolean
  ): void {
    const pulseFactor = 1 + (breatheIntensity * 0.2);
    const pulsedRadius = radius * pulseFactor;
    
    if (!this.auraMesh) {
      const geometry = new THREE.RingGeometry(0, pulsedRadius, 64);
      const material = new THREE.MeshBasicMaterial({
        color: 0x87ceeb,
        transparent: true,
        side: THREE.DoubleSide
      });
      this.auraMesh = new THREE.Mesh(geometry, material);
      this.scene.add(this.auraMesh);
    }
    
    // Update position
    const x = center.x - this.width / 2;
    const y = -(center.y - this.height / 2);
    this.auraMesh.position.set(x, y, 0);
    
    // Update radius
    const geometry = new THREE.RingGeometry(0, pulsedRadius, 64);
    this.auraMesh.geometry.dispose();
    this.auraMesh.geometry = geometry;
    
    // Use watercolor color palette
    const colors = getAbilityColor('breathe', serenityRatio, affirmActive);
    const material = this.auraMesh.material as THREE.MeshBasicMaterial;
    material.color.setHex(colors.primary);
    material.opacity = colors.opacity;
  }
  
  updateRecenterPulse(
    center: Vector2,
    pulseRadius: number,
    serenityRatio: number,
    affirmActive: boolean,
    affirmAmplification: number
  ): void {
    if (pulseRadius <= 0) {
      if (this.recenterPulseMesh) {
        this.scene.remove(this.recenterPulseMesh);
        this.recenterPulseMesh.geometry.dispose();
        (this.recenterPulseMesh.material as THREE.Material).dispose();
        this.recenterPulseMesh = null;
      }
      return;
    }
    
    const effectiveRadius = pulseRadius * affirmAmplification;
    
    if (!this.recenterPulseMesh) {
      const geometry = new THREE.RingGeometry(effectiveRadius - 15, effectiveRadius, 32);
      const material = new THREE.MeshBasicMaterial({
        color: 0x7fffd4,
        transparent: true,
        side: THREE.DoubleSide
      });
      this.recenterPulseMesh = new THREE.Mesh(geometry, material);
      this.scene.add(this.recenterPulseMesh);
    }
    
    // Update position
    const x = center.x - this.width / 2;
    const y = -(center.y - this.height / 2);
    this.recenterPulseMesh.position.set(x, y, 0);
    
    // Update radius
    const geometry = new THREE.RingGeometry(effectiveRadius - 15, effectiveRadius, 32);
    this.recenterPulseMesh.geometry.dispose();
    this.recenterPulseMesh.geometry = geometry;
    
    // Use watercolor color palette (Recenter uses translucent blue-green, golden under Affirm)
    const colors = getAbilityColor('recenter', serenityRatio, affirmActive);
    const material = this.recenterPulseMesh.material as THREE.MeshBasicMaterial;
    material.color.setHex(colors.primary);
    material.opacity = colors.opacity;
  }
  
  updateExhaleWaves(
    center: Vector2,
    waves: Array<{ radius: number; maxRadius: number }>,
    serenityRatio: number
  ): void {
    // Remove old waves
    const activeIds = new Set(waves.map((_, i) => i));
    for (const [id, mesh] of this.exhaleWaveMeshes.entries()) {
      if (!activeIds.has(id)) {
        this.scene.remove(mesh);
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
        this.exhaleWaveMeshes.delete(id);
      }
    }
    
    // Update/create waves
    waves.forEach((wave, index) => {
      if (!this.exhaleWaveMeshes.has(index)) {
        const geometry = new THREE.RingGeometry(wave.radius - 20, wave.radius, 32);
        const material = new THREE.MeshBasicMaterial({
          color: 0xb0e0e6,
          transparent: true,
          side: THREE.DoubleSide
        });
        const mesh = new THREE.Mesh(geometry, material);
        this.exhaleWaveMeshes.set(index, mesh);
        this.scene.add(mesh);
      }
      
      const mesh = this.exhaleWaveMeshes.get(index)!;
      const x = center.x - this.width / 2;
      const y = -(center.y - this.height / 2);
      mesh.position.set(x, y, 0);
      
      // Update radius
      const geometry = new THREE.RingGeometry(wave.radius - 20, wave.radius, 32);
      mesh.geometry.dispose();
      mesh.geometry = geometry;
      
      // Use watercolor color palette with progress-based fading
      const progress = wave.radius / wave.maxRadius;
      const waveColors = getExhaleWaveColor(progress, serenityRatio);
      const material = mesh.material as THREE.MeshBasicMaterial;
      material.color.setHex(waveColors.color);
      material.opacity = waveColors.opacity;
    });
  }
  
  updateReflectBarrier(
    center: Vector2,
    radius: number,
    serenityRatio: number
  ): void {
    if (radius <= 0) {
      if (this.reflectBarrierMesh) {
        this.scene.remove(this.reflectBarrierMesh);
        this.reflectBarrierMesh.geometry.dispose();
        (this.reflectBarrierMesh.material as THREE.Material).dispose();
        this.reflectBarrierMesh = null;
      }
      return;
    }
    
    const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.1;
    const pulsedRadius = radius * pulse;
    
    if (!this.reflectBarrierMesh) {
      const geometry = new THREE.CircleGeometry(pulsedRadius, 64);
      const material = new THREE.MeshBasicMaterial({
        color: 0xe0f7fa, // Clean water effect
        transparent: true,
        opacity: 0.3 * serenityRatio * 0.8
      });
      this.reflectBarrierMesh = new THREE.Mesh(geometry, material);
      this.scene.add(this.reflectBarrierMesh);
    }
    
    const x = center.x - this.width / 2;
    const y = -(center.y - this.height / 2);
    this.reflectBarrierMesh.position.set(x, y, 0);
    
    // Update radius
    const geometry = new THREE.CircleGeometry(pulsedRadius, 64);
    this.reflectBarrierMesh.geometry.dispose();
    this.reflectBarrierMesh.geometry = geometry;
    
    // Use watercolor color palette (clean water effect, shifts hue when hit)
    const colors = getAbilityColor('reflect', serenityRatio, false);
    const material = this.reflectBarrierMesh.material as THREE.MeshBasicMaterial;
    material.color.setHex(colors.primary);
    material.opacity = colors.opacity;
  }
  
  updateMantraBeam(
    center: Vector2,
    target: Stressor | null,
    breatheCycleProgress: number,
    serenityRatio: number,
    affirmActive: boolean = false
  ): void {
    if (!target) {
      if (this.mantraBeamLine) {
        this.scene.remove(this.mantraBeamLine);
        this.mantraBeamLine.geometry.dispose();
        (this.mantraBeamLine.material as THREE.Material).dispose();
        this.mantraBeamLine = null;
      }
      return;
    }
    
    const pulse = 0.8 + (breatheCycleProgress * 0.2);
    
    const centerX = center.x - this.width / 2;
    const centerY = -(center.y - this.height / 2);
    const targetX = target.position.x - this.width / 2;
    const targetY = -(target.position.y - this.height / 2);
    
    if (!this.mantraBeamLine) {
      const geometry = new THREE.BufferGeometry();
      const material = new THREE.LineBasicMaterial({
        color: 0x4b0082, // Focused indigo
        transparent: true,
        linewidth: 3
      });
      this.mantraBeamLine = new THREE.Line(geometry, material);
      this.scene.add(this.mantraBeamLine);
    }
    
    const positions = new Float32Array([
      centerX, centerY, 0,
      targetX, targetY, 0
    ]);
    this.mantraBeamLine.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // Use watercolor color palette (focused indigo → deep violet, gilded under Affirm)
    const colors = getAbilityColor('mantra', serenityRatio, affirmActive);
    const material = this.mantraBeamLine.material as THREE.LineBasicMaterial;
    material.color.setHex(colors.primary);
    material.opacity = colors.opacity * pulse;
  }
  
  updateGroundField(
    fieldPos: Vector2 | null,
    fieldRadius: number,
    serenityRatio: number
  ): void {
    if (!fieldPos || fieldRadius <= 0) {
      if (this.groundFieldMesh) {
        this.scene.remove(this.groundFieldMesh);
        this.groundFieldMesh.geometry.dispose();
        (this.groundFieldMesh.material as THREE.Material).dispose();
        this.groundFieldMesh = null;
      }
      if (this.groundFieldParticles) {
        this.scene.remove(this.groundFieldParticles);
        this.groundFieldParticles.geometry.dispose();
        (this.groundFieldParticles.material as THREE.Material).dispose();
        this.groundFieldParticles = null;
      }
      return;
    }
    
    const x = fieldPos.x - this.width / 2;
    const y = -(fieldPos.y - this.height / 2);
    
    if (!this.groundFieldMesh) {
      const geometry = new THREE.CircleGeometry(fieldRadius, 32);
      const material = new THREE.MeshBasicMaterial({
        color: 0x8b7355, // Earthy brown-green
        transparent: true
      });
      this.groundFieldMesh = new THREE.Mesh(geometry, material);
      this.scene.add(this.groundFieldMesh);
    }
    
    this.groundFieldMesh.position.set(x, y, 0);
    
    // Use watercolor color palette (earthy brown-green → warm ochre, dries to muted gray)
    const colors = getAbilityColor('ground', serenityRatio, false);
    const material = this.groundFieldMesh.material as THREE.MeshBasicMaterial;
    material.color.setHex(colors.primary);
    material.opacity = colors.opacity;
    
    // Update particles
    const time = Date.now() * 0.001;
    const particleCount = 5;
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (time * 0.5 + i * Math.PI * 0.4) % (Math.PI * 2);
      const dist = fieldRadius * 0.6;
      positions[i * 3] = x + Math.cos(angle) * dist;
      positions[i * 3 + 1] = y + Math.sin(angle) * dist;
      positions[i * 3 + 2] = 0;
    }
    
    if (!this.groundFieldParticles) {
      const geometry = new THREE.BufferGeometry();
      const particleMaterial = new THREE.PointsMaterial({
        color: colors.primary,
        size: 6,
        transparent: true
      });
      this.groundFieldParticles = new THREE.Points(geometry, particleMaterial);
      this.scene.add(this.groundFieldParticles);
    }
    
    this.groundFieldParticles.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMaterial = this.groundFieldParticles.material as THREE.PointsMaterial;
    particleMaterial.color.setHex(colors.primary);
    particleMaterial.opacity = colors.opacity * 0.6;
  }
  
  updateReleaseShockwave(
    center: Vector2,
    active: boolean,
    serenityRatio: number
  ): void {
    if (!active) {
      if (this.releaseShockwaveMesh) {
        this.scene.remove(this.releaseShockwaveMesh);
        this.releaseShockwaveMesh.geometry.dispose();
        (this.releaseShockwaveMesh.material as THREE.Material).dispose();
        this.releaseShockwaveMesh = null;
      }
      return;
    }
    
    const maxRadius = AbilityConfig.RELEASE_RADIUS;
    
    if (!this.releaseShockwaveMesh) {
      const geometry = new THREE.CircleGeometry(maxRadius, 64);
      const material = new THREE.MeshBasicMaterial({
        color: 0x808080, // Muted gray (full spectrum blend)
        transparent: true
      });
      this.releaseShockwaveMesh = new THREE.Mesh(geometry, material);
      this.scene.add(this.releaseShockwaveMesh);
    }
    
    const x = center.x - this.width / 2;
    const y = -(center.y - this.height / 2);
    this.releaseShockwaveMesh.position.set(x, y, 0);
    
    // Use watercolor color palette (full spectrum → muted gray → pastel recovery)
    const colors = getReleaseColor(serenityRatio);
    const material = this.releaseShockwaveMesh.material as THREE.MeshBasicMaterial;
    material.color.setHex(colors.color);
    material.opacity = colors.opacity;
  }
  
  updateAffirmGlow(
    center: Vector2,
    radius: number,
    serenityRatio: number
  ): void {
    if (radius <= 0) {
      if (this.affirmGlowMesh) {
        this.scene.remove(this.affirmGlowMesh);
        this.affirmGlowMesh.geometry.dispose();
        (this.affirmGlowMesh.material as THREE.Material).dispose();
        this.affirmGlowMesh = null;
      }
      return;
    }
    
    if (!this.affirmGlowMesh) {
      const geometry = new THREE.RingGeometry(radius, radius * 1.5, 64);
      const material = new THREE.MeshBasicMaterial({
        color: 0xffd700, // Golden glaze
        transparent: true,
        side: THREE.DoubleSide
      });
      this.affirmGlowMesh = new THREE.Mesh(geometry, material);
      this.scene.add(this.affirmGlowMesh);
    }
    
    const x = center.x - this.width / 2;
    const y = -(center.y - this.height / 2);
    this.affirmGlowMesh.position.set(x, y, 0);
    
    const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.2;
    const geometry = new THREE.RingGeometry(radius * pulse, radius * 1.5 * pulse, 64);
    this.affirmGlowMesh.geometry.dispose();
    this.affirmGlowMesh.geometry = geometry;
    
    // Use watercolor color palette (golden glaze → warm ochre)
    const colors = getAbilityColor('affirm', serenityRatio, false);
    const material = this.affirmGlowMesh.material as THREE.MeshBasicMaterial;
    material.color.setHex(colors.primary);
    material.opacity = colors.opacity;
  }
  
  dispose(): void {
    // Clean up all meshes
    const meshes = [
      this.auraMesh,
      this.recenterPulseMesh,
      this.reflectBarrierMesh,
      this.mantraBeamLine,
      this.groundFieldMesh,
      this.groundFieldParticles,
      this.releaseShockwaveMesh,
      this.affirmGlowMesh
    ];
    
    meshes.forEach(mesh => {
      if (mesh) {
        this.scene.remove(mesh);
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      }
    });
    
    for (const mesh of this.exhaleWaveMeshes.values()) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
    
    this.exhaleWaveMeshes.clear();
  }
}

