import * as THREE from 'three';
import { Pass } from 'postprocessing';

export interface FluidCompositeUniforms {
  dyeIntensity: number;
  blendMode: 'overlay' | 'add';
  refractionScale: number;
}

/**
 * FluidCompositePass - Composites fluid dye texture over scene
 * 
 * Blends the fluid simulation dye texture over the rendered scene using
 * overlay or additive blending. Optionally applies subtle refraction.
 */
export class FluidCompositePass extends Pass {
  private material: THREE.ShaderMaterial;
  protected camera: THREE.OrthographicCamera;
  protected scene: THREE.Scene;
  private quad: THREE.Mesh;
  
  private width: number;
  private height: number;
  
  constructor(dyeTexture: THREE.Texture) {
    super();
    
    this.width = 1;
    this.height = 1;
    
    // Vertex shader
    // Uses Three.js built-in attributes: position (vec3) and uv (vec2)
    const vertexShader = `
      varying vec2 vUv;
      
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
    
    // Fragment shader
    const fragmentShader = `
      precision highp float;
      precision highp sampler2D;
      
      varying vec2 vUv;
      uniform sampler2D tDiffuse;
      uniform sampler2D tDye;
      uniform float dyeIntensity;
      uniform float refractionScale;
      uniform int blendMode; // 0 = overlay, 1 = add
      
      void main() {
        vec4 sceneColor = texture2D(tDiffuse, vUv);
        vec4 dyeColor = texture2D(tDye, vUv);
        
        // Optional refraction: sample scene with offset based on dye gradient
        vec2 offset = vec2(0.0);
        if (refractionScale > 0.0) {
          vec2 texelSize = vec2(1.0 / 512.0, 1.0 / 512.0); // Approximate
          float dx = texture2D(tDye, vUv + vec2(texelSize.x, 0.0)).r - texture2D(tDye, vUv - vec2(texelSize.x, 0.0)).r;
          float dy = texture2D(tDye, vUv + vec2(0.0, texelSize.y)).r - texture2D(tDye, vUv - vec2(0.0, texelSize.y)).r;
          offset = vec2(dx, dy) * refractionScale;
          sceneColor = texture2D(tDiffuse, vUv + offset);
        }
        
        // Blend modes
        vec3 result;
        if (blendMode == 0) {
          // Overlay blend
          vec3 base = sceneColor.rgb;
          vec3 overlay = dyeColor.rgb * dyeIntensity;
          result = mix(base, base * overlay * 2.0, step(0.5, base));
          result = mix(result, 1.0 - (1.0 - base) * (1.0 - overlay) * 2.0, step(0.5, base));
        } else {
          // Additive blend
          result = sceneColor.rgb + dyeColor.rgb * dyeIntensity;
        }
        
        gl_FragColor = vec4(result, sceneColor.a);
      }
    `;
    
    // Create uniforms
    const uniforms = {
      tDiffuse: { value: null },
      tDye: { value: dyeTexture },
      dyeIntensity: { value: 0.75 },
      refractionScale: { value: 0.003 },
      blendMode: { value: 0 } // 0 = overlay
    };
    
    // Create shader material
    this.material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader
    });
    
    // Setup fullscreen quad
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.scene = new THREE.Scene();
    
    const geometry = new THREE.PlaneGeometry(2, 2);
    this.quad = new THREE.Mesh(geometry, this.material);
    this.scene.add(this.quad);
    
    this.enabled = true;
    this.needsSwap = true;
  }
  
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
    
    // Ensure quad uses our material
    this.quad.material = this.material;
    this.quad.visible = true;
    
    // Render fullscreen quad
    if (this.renderToScreen) {
      renderer.setRenderTarget(null);
      renderer.render(this.scene, this.camera);
    } else if (outputBuffer) {
      renderer.setRenderTarget(outputBuffer);
      renderer.render(this.scene, this.camera);
      renderer.setRenderTarget(null);
    } else {
      renderer.setRenderTarget(null);
      renderer.render(this.scene, this.camera);
    }
  }
  
  setSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }
  
  setUniforms(params: Partial<FluidCompositeUniforms>): void {
    const uniforms = this.material.uniforms;
    
    if (params.dyeIntensity !== undefined) {
      uniforms.dyeIntensity.value = params.dyeIntensity;
    }
    
    if (params.refractionScale !== undefined) {
      uniforms.refractionScale.value = params.refractionScale;
    }
    
    if (params.blendMode !== undefined) {
      uniforms.blendMode.value = params.blendMode === 'overlay' ? 0 : 1;
    }
  }
  
  dispose(): void {
    this.material.dispose();
    this.quad.geometry.dispose();
  }
}

