import * as THREE from 'three';
import { Pass } from 'postprocessing';
import { WatercolorShader } from './WatercolorShader';

export interface WatercolorUniforms {
  paperTexture: THREE.Texture;
  edgeDarkeningIntensity: number;
  bleedRadius: number;
  diffusionRate: number;
  pigmentSaturation: number;
  wetness: number;
  toonThreshold: number;
}

/**
 * WatercolorPass - Post-processing effect that applies watercolor-style rendering
 * 
 * Based on the original mattatz THREE.Watercolor implementation, adapted to work
 * with the postprocessing library's EffectComposer.
 * 
 * This pass extends Pass directly (not ShaderPass) and implements its own render
 * method, giving us full control over the rendering pipeline.
 */
export class WatercolorPass extends Pass {
  private material: THREE.ShaderMaterial;
  protected camera: THREE.OrthographicCamera;  // Pass base class expects camera to be accessible
  protected scene: THREE.Scene;  // Pass base class expects scene to be accessible
  private quad: THREE.Mesh;

  private width: number;
  private height: number;

  constructor(options: {
    width: number;
    height: number;
    paperTexture: THREE.Texture;
  }) {
    super();
    
    this.width = options.width;
    this.height = options.height;
    
    // Initialize uniforms with default values
    const uniforms = {
      tDiffuse: { value: null },
      paperTexture: { value: options.paperTexture },
      edgeDarkeningIntensity: { value: 0.3 },
      bleedRadius: { value: 2.0 },
      diffusionRate: { value: 0.5 },
      pigmentSaturation: { value: 1.0 },
      wetness: { value: 0.7 },
      toonThreshold: { value: 0.5 },
      // Radial wetness uniforms for paint pulse effect
      playerCenter: { value: new THREE.Vector2(0.5, 0.5) }, // Center of screen in UV space
      pulseRadius: { value: 0.1 }, // Normalized pulse radius
      pulsePhase: { value: 0.0 } // 0.0 = shrunk/dry, 1.0 = expanded/wet
    };
    
    // Create shader material (Three.js will automatically inject built-in attributes/uniforms)
    // This matches the original mattatz implementation pattern
    this.material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: WatercolorShader.vertex,
      fragmentShader: WatercolorShader.fragment
    });
    
    // Setup fullscreen quad (matches original pattern)
    // Orthographic camera covering -1 to 1 in both dimensions
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.scene = new THREE.Scene();
    
    // Create fullscreen quad mesh with our shader material
    this.quad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      this.material
    );
    this.scene.add(this.quad);
    
    // Configure pass properties
    this.enabled = true;
    this.needsSwap = true;
    // EffectComposer will set renderToScreen automatically for the last pass
    // But we can also set it explicitly if needed
  }

  /**
   * Render the watercolor effect
   * 
   * @param renderer - Three.js WebGL renderer
   * @param inputBuffer - Render target from previous pass (contains the scene)
   * @param outputBuffer - Render target to write to (or null for screen)
   * @param deltaTime - Time since last frame (optional)
   */
  render(
    renderer: THREE.WebGLRenderer,
    inputBuffer: THREE.WebGLRenderTarget | null,
    outputBuffer: THREE.WebGLRenderTarget | null,
    deltaTime?: number
  ): void {
    if (!this.enabled) {
      return;
    }
    
    // Set input texture from previous pass
    if (inputBuffer) {
      this.material.uniforms.tDiffuse.value = inputBuffer.texture;
    }
    
    // Ensure quad uses our material and is visible
    this.quad.material = this.material;
    this.quad.visible = true;
    
    // Render fullscreen quad
    // EffectComposer sets renderToScreen automatically for the last pass
    if (this.renderToScreen) {
      // Render directly to screen
      renderer.setRenderTarget(null);
      renderer.render(this.scene, this.camera);
    } else if (outputBuffer) {
      // Render to output buffer
      renderer.setRenderTarget(outputBuffer);
      renderer.render(this.scene, this.camera);
      renderer.setRenderTarget(null);
    } else {
      // Fallback: render to screen if no output buffer
      renderer.setRenderTarget(null);
      renderer.render(this.scene, this.camera);
    }
  }

  /**
   * Update pass size (called by EffectComposer when canvas resizes)
   */
  setSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  /**
   * Update pulse data for radial wetness effect
   * Simulates paint re-wetting the paper as it pulses outward
   * 
   * @param center - Player center position in screen coordinates
   * @param pulseRadius - Current pulse radius in pixels
   * @param pulsePhase - Pulse phase from 0.0 (shrunk/dry) to 1.0 (expanded/wet)
   */
  setPulseData(center: { x: number; y: number }, pulseRadius: number, pulsePhase: number): void {
    const uniforms = this.material.uniforms;
    
    // Convert center from screen coordinates to UV space (0-1)
    // UV space: (0,0) is bottom-left, (1,1) is top-right
    uniforms.playerCenter.value = new THREE.Vector2(
      center.x / this.width,
      1.0 - (center.y / this.height) // Flip Y for UV space
    );
    
    // Normalize pulse radius to screen space (use max dimension for consistent scaling)
    const maxDimension = Math.max(this.width, this.height);
    uniforms.pulseRadius.value = pulseRadius / maxDimension;
    
    // Set pulse phase (0.0 = shrunk/dry, 1.0 = expanded/wet)
    uniforms.pulsePhase.value = pulsePhase;
  }

  /**
   * Update watercolor effect parameters
   */
  setUniforms(params: Partial<WatercolorUniforms>): void {
    const uniforms = this.material.uniforms;
    
    if (params.edgeDarkeningIntensity !== undefined) {
      uniforms.edgeDarkeningIntensity.value = params.edgeDarkeningIntensity;
    }
    if (params.bleedRadius !== undefined) {
      uniforms.bleedRadius.value = params.bleedRadius;
    }
    if (params.diffusionRate !== undefined) {
      uniforms.diffusionRate.value = params.diffusionRate;
    }
    if (params.pigmentSaturation !== undefined) {
      uniforms.pigmentSaturation.value = params.pigmentSaturation;
    }
    if (params.wetness !== undefined) {
      uniforms.wetness.value = params.wetness;
    }
    if (params.toonThreshold !== undefined) {
      uniforms.toonThreshold.value = params.toonThreshold;
    }
    if (params.paperTexture !== undefined) {
      uniforms.paperTexture.value = params.paperTexture;
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.material.dispose();
    this.quad.geometry.dispose();
    // Note: We don't dispose the scene/camera as they're lightweight
  }
}
