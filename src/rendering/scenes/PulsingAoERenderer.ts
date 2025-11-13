import * as THREE from 'three';
import { Vector2 } from '../../types';

/**
 * PulsingAoERenderer
 * 
 * Reusable renderer for pulsing circular Area of Effect abilities.
 * Creates geometry at maximum size and scales dynamically for performance.
 * 
 * Pattern: Create geometry once at max size, scale mesh transform for current size.
 */
export class PulsingAoERenderer {
  private mesh: THREE.Mesh | null = null;
  private scene: THREE.Scene;
  private maxRadius: number;
  private color: number;
  private opacity: number;
  private segments: number;
  private zIndex: number;
  private width: number;
  private height: number;

  /**
   * @param scene - Three.js scene to add mesh to
   * @param maxRadius - Maximum radius for geometry creation
   * @param color - Hex color (e.g., 0x9370db)
   * @param opacity - Opacity (0.0 to 1.0)
   * @param segments - Circle segments (default: 64)
   * @param zIndex - Z position for layering (default: -0.1)
   * @param width - Canvas width for coordinate conversion
   * @param height - Canvas height for coordinate conversion
   */
  constructor(
    scene: THREE.Scene,
    maxRadius: number,
    color: number,
    opacity: number,
    segments: number = 64,
    zIndex: number = -0.1,
    width: number,
    height: number
  ) {
    this.scene = scene;
    this.maxRadius = maxRadius;
    this.color = color;
    this.opacity = opacity;
    this.segments = segments;
    this.zIndex = zIndex;
    this.width = width;
    this.height = height;
  }

  /**
   * Create or recreate geometry if max radius changed.
   * 
   * @param newMaxRadius - New maximum radius (recreates if different)
   */
  private ensureGeometry(newMaxRadius: number): void {
    if (this.mesh && (this.mesh.geometry as THREE.CircleGeometry).parameters.radius === newMaxRadius) {
      return; // Geometry already correct
    }

    // Dispose old mesh if it exists
    if (this.mesh) {
      this.mesh.geometry.dispose();
      (this.mesh.material as THREE.Material).dispose();
      this.scene.remove(this.mesh);
    }

    // Create new geometry at max size
    const geometry = new THREE.CircleGeometry(newMaxRadius, this.segments);
    const material = new THREE.MeshBasicMaterial({
      color: this.color,
      transparent: true,
      opacity: this.opacity,
      side: THREE.DoubleSide
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.mesh);
    this.maxRadius = newMaxRadius;
  }

  /**
   * Update renderer with current radius and position.
   * 
   * @param center - Center position in canvas coordinates
   * @param currentRadius - Current radius (will be clamped and scaled)
   * @param maxRadius - Maximum radius (recreates geometry if changed)
   */
  update(center: Vector2, currentRadius: number, maxRadius: number): void {
    // Ensure geometry exists and is correct size
    this.ensureGeometry(maxRadius);

    if (!this.mesh) return;

    // Update position (convert canvas coords to Three.js coords)
    const x = center.x - this.width / 2;
    const y = -(center.y - this.height / 2); // Flip Y axis
    this.mesh.position.set(x, y, this.zIndex);

    // Update scale to match current radius
    const geometryRadius = (this.mesh.geometry as THREE.CircleGeometry).parameters.radius;
    const scale = Math.max(0, Math.min(1, currentRadius / geometryRadius)); // Clamp scale to 0-1
    this.mesh.scale.set(scale, scale, 1);

    // Ensure visible
    this.mesh.visible = true;
  }

  /**
   * Hide the AoE (without disposing geometry).
   */
  hide(): void {
    if (this.mesh) {
      this.mesh.visible = false;
    }
  }

  /**
   * Show the AoE.
   */
  show(): void {
    if (this.mesh) {
      this.mesh.visible = true;
    }
  }

  /**
   * Update opacity.
   */
  setOpacity(opacity: number): void {
    if (this.mesh && this.mesh.material instanceof THREE.MeshBasicMaterial) {
      this.mesh.material.opacity = opacity;
    }
    this.opacity = opacity;
  }

  /**
   * Update color.
   */
  setColor(color: number): void {
    if (this.mesh && this.mesh.material instanceof THREE.MeshBasicMaterial) {
      this.mesh.material.color.setHex(color);
    }
    this.color = color;
  }

  /**
   * Dispose of resources.
   */
  dispose(): void {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      (this.mesh.material as THREE.Material).dispose();
      this.scene.remove(this.mesh);
      this.mesh = null;
    }
  }

  /**
   * Update canvas size (for coordinate conversion).
   */
  setSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }
}

