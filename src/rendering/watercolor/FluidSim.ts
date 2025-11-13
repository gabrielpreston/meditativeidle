import * as THREE from 'three';
import { RGB, Vector2, EnhancedDyeInjection } from '../../types';
import { GameConfig } from '../../GameConfig';

export interface FluidParams {
  viscosity: number;
  dyeDissipation: number;
  velocityDissipation: number;
  curl: number;
  pressureIters: number;
}

interface DyeLayer {
  read: THREE.WebGLRenderTarget;
  write: THREE.WebGLRenderTarget;
  params: {
    diffusionRate: number;
    viscosity: number;
    dissipation: number;
  };
}

/**
 * FluidSim - WebGL fluid simulation using Three.js
 * 
 * Adapted from WebGL-Fluid-Enhanced shader code.
 * Implements velocity, pressure, and dye fields with ping-pong buffers.
 */
export class FluidSim {
  private renderer: THREE.WebGLRenderer;
  private width: number;
  private height: number;
  
  // FBOs for fluid simulation (ping-pong buffers)
  private velocity!: { read: THREE.WebGLRenderTarget; write: THREE.WebGLRenderTarget };
  private dye!: { read: THREE.WebGLRenderTarget; write: THREE.WebGLRenderTarget };
  private pressure!: { read: THREE.WebGLRenderTarget; write: THREE.WebGLRenderTarget };
  private divergence!: THREE.WebGLRenderTarget;
  private curl!: THREE.WebGLRenderTarget;
  
  // Multi-layer dye system
  private dyeLayers: Map<string, DyeLayer> = new Map();
  private defaultLayer!: DyeLayer;
  private finalDyeBuffer!: { read: THREE.WebGLRenderTarget; write: THREE.WebGLRenderTarget };
  
  // Shader materials for each simulation step
  private advectionMaterial!: THREE.ShaderMaterial;
  private curlMaterial!: THREE.ShaderMaterial;
  private vorticityMaterial!: THREE.ShaderMaterial;
  private divergenceMaterial!: THREE.ShaderMaterial;
  private pressureMaterial!: THREE.ShaderMaterial;
  private gradientSubtractMaterial!: THREE.ShaderMaterial;
  private splatMaterial!: THREE.ShaderMaterial;
  private blossomingSplatMaterial!: THREE.ShaderMaterial;
  private rippleVelocityMaterial!: THREE.ShaderMaterial;
  private compositeMaterial!: THREE.ShaderMaterial;
  
  // Fullscreen quad for rendering
  private quad!: THREE.Mesh;
  private camera!: THREE.OrthographicCamera;
  private scene!: THREE.Scene;
  
  // Dummy render target for safety (used if getDyeTexture called before initialization)
  private static dummyRenderTarget: THREE.WebGLRenderTarget | null = null;
  
  // Current simulation parameters
  private params: FluidParams = {
    viscosity: 0.001,
    dyeDissipation: 0.95,
    velocityDissipation: 0.96,
    curl: 20,
    pressureIters: 15
  };
  
  // Performance mode (half resolution)
  private performanceMode: boolean = false;
  
  // Track current resolution scale to avoid unnecessary updates
  private currentResolutionScale: number = 1.0;
  
  constructor(width: number, height: number, renderer: THREE.WebGLRenderer) {
    this.renderer = renderer;
    
    // Guard: Ensure valid dimensions
    if (width <= 0 || height <= 0) {
      console.warn(`FluidSim.constructor: Invalid dimensions ${width}x${height}, using minimum 1x1`);
      width = Math.max(1, width);
      height = Math.max(1, height);
    }
    
    this.width = width;
    this.height = height;
    
    // Ensure WebGL context is ready
    const gl = renderer.getContext();
    if (!gl) {
      throw new Error('WebGL context not available');
    }
    
    // Start with half resolution for performance (equivalent to scale 1.0 at half resolution)
    this.performanceMode = true; // Start in performance mode
    const simWidth = Math.max(1, Math.floor(width / 2));
    const simHeight = Math.max(1, Math.floor(height / 2));
    
    // Setup fullscreen quad first (needed for materials)
    this.setupQuad();
    
    // Create shader materials (after quad setup)
    this.createShaders();
    
    // Create FBOs
    this.createFBOs(simWidth, simHeight);
    
    // Initialize multi-layer system
    this.initializeLayers(simWidth, simHeight);
    
    // Initialize resolution scale (1.0 means full quality at current performance mode)
    this.currentResolutionScale = 1.0;
  }
  
  private createShaders(): void {
    // Base vertex shader (for most passes)
    // Uses Three.js built-in attributes: position (vec3) and uv (vec2)
    // Three.js automatically provides: position, uv, projectionMatrix, modelViewMatrix
    const baseVertexShader = `
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform vec2 texelSize;
      
      void main() {
        vUv = uv;
        vL = vUv - vec2(texelSize.x, 0.0);
        vR = vUv + vec2(texelSize.x, 0.0);
        vT = vUv + vec2(0.0, texelSize.y);
        vB = vUv - vec2(0.0, texelSize.y);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
    
    // Advection shader
    const advectionFragmentShader = `
      precision highp float;
      precision highp sampler2D;
      
      varying vec2 vUv;
      uniform sampler2D uVelocity;
      uniform sampler2D uSource;
      uniform vec2 texelSize;
      uniform float dt;
      uniform float dissipation;
      
      void main() {
        vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
        vec4 result = texture2D(uSource, coord);
        float decay = 1.0 + dissipation * dt;
        gl_FragColor = result / decay;
      }
    `;
    
    // Curl shader
    const curlFragmentShader = `
      precision mediump float;
      precision mediump sampler2D;
      
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform sampler2D uVelocity;
      
      void main() {
        float L = texture2D(uVelocity, vL).y;
        float R = texture2D(uVelocity, vR).y;
        float T = texture2D(uVelocity, vT).x;
        float B = texture2D(uVelocity, vB).x;
        float vorticity = R - L - T + B;
        gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
      }
    `;
    
    // Vorticity shader
    const vorticityFragmentShader = `
      precision highp float;
      precision highp sampler2D;
      
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform sampler2D uVelocity;
      uniform sampler2D uCurl;
      uniform float curl;
      uniform float dt;
      
      void main() {
        float L = texture2D(uCurl, vL).x;
        float R = texture2D(uCurl, vR).x;
        float T = texture2D(uCurl, vT).x;
        float B = texture2D(uCurl, vB).x;
        float C = texture2D(uCurl, vUv).x;
        
        vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
        force /= length(force) + 0.0001;
        force *= curl * C;
        force.y *= -1.0;
        
        vec2 velocity = texture2D(uVelocity, vUv).xy;
        velocity += force * dt;
        velocity = min(max(velocity, -1000.0), 1000.0);
        gl_FragColor = vec4(velocity, 0.0, 1.0);
      }
    `;
    
    // Divergence shader
    const divergenceFragmentShader = `
      precision mediump float;
      precision mediump sampler2D;
      
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform sampler2D uVelocity;
      
      void main() {
        float L = texture2D(uVelocity, vL).x;
        float R = texture2D(uVelocity, vR).x;
        float T = texture2D(uVelocity, vT).y;
        float B = texture2D(uVelocity, vB).y;
        
        vec2 C = texture2D(uVelocity, vUv).xy;
        if (vL.x < 0.0) { L = -C.x; }
        if (vR.x > 1.0) { R = -C.x; }
        if (vT.y > 1.0) { T = -C.y; }
        if (vB.y < 0.0) { B = -C.y; }
        
        float div = 0.5 * (R - L + T - B);
        gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
      }
    `;
    
    // Pressure shader
    const pressureFragmentShader = `
      precision mediump float;
      precision mediump sampler2D;
      
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform sampler2D uPressure;
      uniform sampler2D uDivergence;
      
      void main() {
        float L = texture2D(uPressure, vL).x;
        float R = texture2D(uPressure, vR).x;
        float T = texture2D(uPressure, vT).x;
        float B = texture2D(uPressure, vB).x;
        float divergence = texture2D(uDivergence, vUv).x;
        float pressure = (L + R + B + T - divergence) * 0.25;
        gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
      }
    `;
    
    // Gradient subtract shader
    const gradientSubtractFragmentShader = `
      precision mediump float;
      precision mediump sampler2D;
      
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform sampler2D uPressure;
      uniform sampler2D uVelocity;
      
      void main() {
        float L = texture2D(uPressure, vL).x;
        float R = texture2D(uPressure, vR).x;
        float T = texture2D(uPressure, vT).x;
        float B = texture2D(uPressure, vB).x;
        vec2 velocity = texture2D(uVelocity, vUv).xy;
        velocity.xy -= vec2(R - L, T - B);
        gl_FragColor = vec4(velocity, 0.0, 1.0);
      }
    `;
    
    // Splat shader (for dye/velocity injection)
    const splatFragmentShader = `
      precision highp float;
      precision highp sampler2D;
      
      varying vec2 vUv;
      uniform sampler2D uTarget;
      uniform float aspectRatio;
      uniform vec3 color;
      uniform vec2 point;
      uniform float radius;
      
      void main() {
        vec2 p = vUv - point.xy;
        p.x *= aspectRatio;
        vec3 splat = exp(-dot(p, p) / radius) * color;
        vec3 base = texture2D(uTarget, vUv).xyz;
        gl_FragColor = vec4(base + splat, 1.0);
      }
    `;
    
    // Blossoming splat shader (enhanced with radial diffusion)
    const blossomingSplatFragmentShader = `
      precision highp float;
      precision highp sampler2D;
      
      varying vec2 vUv;
      uniform sampler2D uTarget;
      uniform float aspectRatio;
      uniform vec3 color;
      uniform vec2 point;
      uniform float radius;
      uniform float diffusionRate;
      
      void main() {
        vec2 p = vUv - point.xy;
        p.x *= aspectRatio;
        float dist = length(p);
        
        // Core splat (tight falloff)
        float coreRadius = radius * 0.3;
        float core = exp(-dot(p, p) / (coreRadius * coreRadius));
        
        // Blossom halo (wider diffusion based on diffusionRate)
        float blossomRadius = radius * (1.0 + diffusionRate * 2.0);
        float blossom = exp(-dist / blossomRadius) * diffusionRate;
        
        // Combine core + blossom
        float splatStrength = core + blossom * 0.5;
        vec3 splat = splatStrength * color;
        vec3 base = texture2D(uTarget, vUv).xyz;
        gl_FragColor = vec4(base + splat, 1.0);
      }
    `;
    
    // Ripple velocity shader (creates wave-like expanding ripples)
    const rippleVelocityFragmentShader = `
      precision highp float;
      precision highp sampler2D;
      
      varying vec2 vUv;
      uniform sampler2D uTarget;
      uniform float aspectRatio;
      uniform vec2 point;
      uniform float radius;
      uniform float ringRadius;  // Current ripple radius
      uniform float ringWidth;    // Width of the ripple ring
      uniform float strength;
      uniform float waveFrequency; // Number of wave peaks around the ring
      uniform float waveAmplitude; // Amplitude of wave variation
      
      void main() {
        vec2 p = vUv - point.xy;
        p.x *= aspectRatio;
        float dist = length(p);
        
        // Calculate distance from the ripple ring
        float distFromRing = abs(dist - ringRadius);
        
        // Create a smooth falloff around the ring
        // Strongest at the ring, fading outward
        float ringFactor = 1.0 - smoothstep(0.0, ringWidth, distFromRing);
        
        // Add sinusoidal variation for wave-like appearance
        // Only apply wave if we're near the ring
        float angle = atan(p.y, p.x);
        float wave = 1.0;
        if (ringFactor > 0.01) {
          // Create wave pattern around the ring
          // waveFrequency controls how many peaks (e.g., 8 = 8 peaks around ring)
          wave = sin(angle * waveFrequency) * waveAmplitude + 1.0;
        }
        
        // Outward radial direction (normalized)
        vec2 direction = vec2(0.0);
        if (dist > 0.001) {
          direction = normalize(p);
        }
        
        // Velocity magnitude decreases with distance from ring
        // Also decreases as ring expands (via strength uniform)
        float velocityMag = ringFactor * wave * strength;
        
        // Get existing velocity
        vec2 base = texture2D(uTarget, vUv).xy;
        
        // Add ripple velocity (outward radial)
        vec2 rippleVelocity = direction * velocityMag;
        
        gl_FragColor = vec4(base + rippleVelocity, 0.0, 1.0);
      }
    `;
    
    // Composite shader (blends layers with watercolor color mixing)
    const compositeFragmentShader = `
      precision highp float;
      precision highp sampler2D;
      
      varying vec2 vUv;
      uniform sampler2D uLayer1;
      uniform sampler2D uLayer2;
      uniform sampler2D uLayer3;
      uniform sampler2D uLayer4;
      uniform sampler2D uLayer5;
      uniform int uLayerCount;
      
      // Subtractive color mixing (watercolor-like)
      vec3 subtractiveMix(vec3 base, vec3 overlay) {
        // Watercolor subtractive mixing: darker when colors overlap
        return base * (1.0 - overlay) + overlay * (1.0 - base);
      }
      
      // Wet-on-wet blending (colors blend smoothly when both are "wet")
      vec3 wetOnWetBlend(vec3 color1, vec3 color2, float wetness1, float wetness2) {
        float blendFactor = min(wetness1, wetness2);
        return mix(
          subtractiveMix(color1, color2),
          (color1 + color2) * 0.5, // Simple average when both wet
          blendFactor
        );
      }
      
      void main() {
        vec3 result = vec3(0.0);
        float totalWeight = 0.0;
        
        // Sample all active layers
        vec3 layer1 = texture2D(uLayer1, vUv).rgb;
        vec3 layer2 = texture2D(uLayer2, vUv).rgb;
        vec3 layer3 = texture2D(uLayer3, vUv).rgb;
        vec3 layer4 = texture2D(uLayer4, vUv).rgb;
        vec3 layer5 = texture2D(uLayer5, vUv).rgb;
        
        // Composite layers with wet-on-wet blending
        // Start with first layer
        result = layer1;
        
        // Blend subsequent layers
        if (uLayerCount > 1) {
          result = wetOnWetBlend(result, layer2, 1.0, 1.0);
        }
        if (uLayerCount > 2) {
          result = wetOnWetBlend(result, layer3, 1.0, 1.0);
        }
        if (uLayerCount > 3) {
          result = wetOnWetBlend(result, layer4, 1.0, 1.0);
        }
        if (uLayerCount > 4) {
          result = wetOnWetBlend(result, layer5, 1.0, 1.0);
        }
        
        gl_FragColor = vec4(result, 1.0);
      }
    `;
    
    // Create materials
    // Following Three.js pattern: use built-in attributes (position, uv) and uniforms (projectionMatrix, modelViewMatrix)
    this.advectionMaterial = new THREE.ShaderMaterial({
      vertexShader: baseVertexShader,
      fragmentShader: advectionFragmentShader,
      uniforms: {
        uVelocity: { value: null },
        uSource: { value: null },
        texelSize: { value: new THREE.Vector2(1.0 / this.width, 1.0 / this.height) },
        dt: { value: 0.016 },
        dissipation: { value: 0.95 }
      }
    });
    
    this.curlMaterial = new THREE.ShaderMaterial({
      vertexShader: baseVertexShader,
      fragmentShader: curlFragmentShader,
      uniforms: {
        uVelocity: { value: null },
        texelSize: { value: new THREE.Vector2(1.0 / this.width, 1.0 / this.height) }
      }
    });
    
    this.vorticityMaterial = new THREE.ShaderMaterial({
      vertexShader: baseVertexShader,
      fragmentShader: vorticityFragmentShader,
      uniforms: {
        uVelocity: { value: null },
        uCurl: { value: null },
        curl: { value: 20 },
        dt: { value: 0.016 },
        texelSize: { value: new THREE.Vector2(1.0 / this.width, 1.0 / this.height) }
      }
    });
    
    this.divergenceMaterial = new THREE.ShaderMaterial({
      vertexShader: baseVertexShader,
      fragmentShader: divergenceFragmentShader,
      uniforms: {
        uVelocity: { value: null },
        texelSize: { value: new THREE.Vector2(1.0 / this.width, 1.0 / this.height) }
      }
    });
    
    this.pressureMaterial = new THREE.ShaderMaterial({
      vertexShader: baseVertexShader,
      fragmentShader: pressureFragmentShader,
      uniforms: {
        uPressure: { value: null },
        uDivergence: { value: null },
        texelSize: { value: new THREE.Vector2(1.0 / this.width, 1.0 / this.height) }
      }
    });
    
    this.gradientSubtractMaterial = new THREE.ShaderMaterial({
      vertexShader: baseVertexShader,
      fragmentShader: gradientSubtractFragmentShader,
      uniforms: {
        uPressure: { value: null },
        uVelocity: { value: null },
        texelSize: { value: new THREE.Vector2(1.0 / this.width, 1.0 / this.height) }
      }
    });
    
    this.splatMaterial = new THREE.ShaderMaterial({
      vertexShader: baseVertexShader,
      fragmentShader: splatFragmentShader,
      uniforms: {
        uTarget: { value: null },
        aspectRatio: { value: 1.0 },
        color: { value: new THREE.Vector3(0, 0, 0) },
        point: { value: new THREE.Vector2(0.5, 0.5) },
        radius: { value: 0.01 },
        texelSize: { value: new THREE.Vector2(1.0 / this.width, 1.0 / this.height) }
      }
    });
    
    this.blossomingSplatMaterial = new THREE.ShaderMaterial({
      vertexShader: baseVertexShader,
      fragmentShader: blossomingSplatFragmentShader,
      uniforms: {
        uTarget: { value: null },
        aspectRatio: { value: 1.0 },
        color: { value: new THREE.Vector3(0, 0, 0) },
        point: { value: new THREE.Vector2(0.5, 0.5) },
        radius: { value: 0.01 },
        diffusionRate: { value: 0.5 },
        texelSize: { value: new THREE.Vector2(1.0 / this.width, 1.0 / this.height) }
      }
    });
    
    this.rippleVelocityMaterial = new THREE.ShaderMaterial({
      vertexShader: baseVertexShader,
      fragmentShader: rippleVelocityFragmentShader,
      uniforms: {
        uTarget: { value: null },
        aspectRatio: { value: 1.0 },
        point: { value: new THREE.Vector2(0.5, 0.5) },
        radius: { value: 0.01 },
        ringRadius: { value: 0.1 },
        ringWidth: { value: 0.02 },
        strength: { value: 1.0 },
        waveFrequency: { value: 8.0 }, // 8 wave peaks around the ring
        waveAmplitude: { value: 0.15 }, // 15% variation in strength
        texelSize: { value: new THREE.Vector2(1.0 / this.width, 1.0 / this.height) }
      }
    });
    
    this.compositeMaterial = new THREE.ShaderMaterial({
      vertexShader: baseVertexShader,
      fragmentShader: compositeFragmentShader,
      uniforms: {
        uLayer1: { value: null },
        uLayer2: { value: null },
        uLayer3: { value: null },
        uLayer4: { value: null },
        uLayer5: { value: null },
        uLayerCount: { value: 1 },
        texelSize: { value: new THREE.Vector2(1.0 / this.width, 1.0 / this.height) }
      }
    });
  }
  
  private createFBOs(width: number, height: number): void {
    // Guard: Ensure valid dimensions
    if (width <= 0 || height <= 0) {
      console.warn(`FluidSim.createFBOs: Invalid dimensions ${width}x${height}, using minimum 1x1`);
      width = Math.max(1, width);
      height = Math.max(1, height);
    }
    
    const format = THREE.RGBAFormat;
    const type = THREE.HalfFloatType; // Try half float for performance, fallback to float
    
    const createRenderTarget = (w: number, h: number): THREE.WebGLRenderTarget => {
      // Ensure minimum size
      const safeWidth = Math.max(1, w);
      const safeHeight = Math.max(1, h);
      const rt = new THREE.WebGLRenderTarget(safeWidth, safeHeight, {
        format,
        type,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        wrapS: THREE.ClampToEdgeWrapping,
        wrapT: THREE.ClampToEdgeWrapping
      });
      return rt;
    };
    
    // Create ping-pong buffers
    this.velocity = {
      read: createRenderTarget(width, height),
      write: createRenderTarget(width, height)
    };
    
    this.dye = {
      read: createRenderTarget(width, height),
      write: createRenderTarget(width, height)
    };
    
    this.pressure = {
      read: createRenderTarget(width, height),
      write: createRenderTarget(width, height)
    };
    
    // Single buffers
    this.divergence = createRenderTarget(width, height);
    this.curl = createRenderTarget(width, height);
    
    // Final dye buffer for composited layers
    this.finalDyeBuffer = {
      read: createRenderTarget(width, height),
      write: createRenderTarget(width, height)
    };
  }
  
  private initializeLayers(width: number, height: number): void {
    // Create default layer
    this.defaultLayer = this.createDyeLayer('default', width, height);
    this.dyeLayers.set('default', this.defaultLayer);
  }
  
  private createDyeLayer(layerId: string, width: number, height: number): DyeLayer {
    // Guard: Ensure valid dimensions
    const safeWidth = Math.max(1, width);
    const safeHeight = Math.max(1, height);
    
    const format = THREE.RGBAFormat;
    const type = THREE.HalfFloatType;
    
    const createRenderTarget = (w: number, h: number): THREE.WebGLRenderTarget => {
      const safeW = Math.max(1, w);
      const safeH = Math.max(1, h);
      return new THREE.WebGLRenderTarget(safeW, safeH, {
        format,
        type,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        wrapS: THREE.ClampToEdgeWrapping,
        wrapT: THREE.ClampToEdgeWrapping
      });
    };
    
    return {
      read: createRenderTarget(safeWidth, safeHeight),
      write: createRenderTarget(safeWidth, safeHeight),
      params: {
        diffusionRate: 0.5,
        viscosity: 0.5,
        dissipation: 0.95
      }
    };
  }
  
  private getOrCreateLayer(layerId: string): DyeLayer {
    if (!this.dyeLayers.has(layerId)) {
      // Guard: Ensure velocity buffers are initialized before creating new layer
      if (!this.velocity || !this.velocity.read || this.velocity.read.width === 0 || this.velocity.read.height === 0) {
        // Return default layer if available, otherwise throw error
        if (this.defaultLayer) {
          return this.defaultLayer;
        }
        throw new Error('FluidSim not initialized: velocity buffers not ready');
      }
      const simWidth = this.velocity.read.width;
      const simHeight = this.velocity.read.height;
      const layer = this.createDyeLayer(layerId, simWidth, simHeight);
      this.dyeLayers.set(layerId, layer);
      return layer;
    }
    return this.dyeLayers.get(layerId)!;
  }
  
  private setupQuad(): void {
    // Following Three.js pattern: OrthographicCamera for fullscreen quad
    // Same as mattatz WatercolorPass example
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.scene = new THREE.Scene();
    // Create quad without material initially (material will be set per-pass in blit)
    // Following mattatz pattern: new THREE.Mesh( new THREE.PlaneBufferGeometry( 2, 2 ), null )
    const geometry = new THREE.PlaneGeometry(2, 2);
    this.quad = new THREE.Mesh(geometry);
    this.scene.add(this.quad);
  }
  
  private swapBuffers(buffers: { read: THREE.WebGLRenderTarget; write: THREE.WebGLRenderTarget }): void {
    const temp = buffers.read;
    buffers.read = buffers.write;
    buffers.write = temp;
  }
  
  private blit(target: THREE.WebGLRenderTarget | null, material: THREE.ShaderMaterial): void {
    // Guard: Don't render to zero-sized targets
    if (target && (target.width === 0 || target.height === 0)) {
      return; // Skip rendering to invalid target
    }
    
    // Following Three.js pattern: set material on quad, then render
    this.quad.material = material;
    
    if (target) {
      this.renderer.setRenderTarget(target);
      this.renderer.render(this.scene, this.camera);
      this.renderer.setRenderTarget(null);
    } else {
      this.renderer.setRenderTarget(null);
      this.renderer.render(this.scene, this.camera);
    }
  }
  
  setParams(params: FluidParams): void {
    this.params = params;
    
    // Update material uniforms
    this.advectionMaterial.uniforms.dissipation.value = params.velocityDissipation;
    this.vorticityMaterial.uniforms.curl.value = params.curl;
  }
  
  step(deltaTime: number): void {
    // Guard: Ensure all buffers are initialized before stepping
    if (!this.velocity || !this.velocity.read || !this.velocity.write ||
        !this.dye || !this.dye.read || !this.dye.write ||
        !this.pressure || !this.pressure.read || !this.pressure.write ||
        !this.divergence || !this.curl ||
        this.velocity.read.width === 0 || this.velocity.read.height === 0) {
      return; // Not ready yet
    }
    
    const dt = Math.min(deltaTime, 0.016); // Cap deltaTime
    
    // Update uniforms
    const texelSize = new THREE.Vector2(
      1.0 / this.velocity.read.width,
      1.0 / this.velocity.read.height
    );
    
    // Step 1: Curl
    this.curlMaterial.uniforms.uVelocity.value = this.velocity.read.texture;
    this.curlMaterial.uniforms.texelSize.value = texelSize;
    this.blit(this.curl, this.curlMaterial);
    
    // Step 2: Vorticity
    this.vorticityMaterial.uniforms.uVelocity.value = this.velocity.read.texture;
    this.vorticityMaterial.uniforms.uCurl.value = this.curl.texture;
    this.vorticityMaterial.uniforms.curl.value = this.params.curl;
    this.vorticityMaterial.uniforms.dt.value = dt;
    this.vorticityMaterial.uniforms.texelSize.value = texelSize;
    this.blit(this.velocity.write, this.vorticityMaterial);
    this.swapBuffers(this.velocity);
    
    // Step 3: Divergence
    this.divergenceMaterial.uniforms.uVelocity.value = this.velocity.read.texture;
    this.divergenceMaterial.uniforms.texelSize.value = texelSize;
    this.blit(this.divergence, this.divergenceMaterial);
    
    // Step 4: Pressure solve (iterative)
    this.pressureMaterial.uniforms.uDivergence.value = this.divergence.texture;
    this.pressureMaterial.uniforms.texelSize.value = texelSize;
    
    // Clear pressure
    this.renderer.setRenderTarget(this.pressure.write);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.clear();
    this.renderer.setRenderTarget(null);
    
    // Iterate pressure solve
    for (let i = 0; i < this.params.pressureIters; i++) {
      this.pressureMaterial.uniforms.uPressure.value = this.pressure.read.texture;
      this.blit(this.pressure.write, this.pressureMaterial);
      this.swapBuffers(this.pressure);
    }
    
    // Step 5: Gradient subtract
    this.gradientSubtractMaterial.uniforms.uPressure.value = this.pressure.read.texture;
    this.gradientSubtractMaterial.uniforms.uVelocity.value = this.velocity.read.texture;
    this.gradientSubtractMaterial.uniforms.texelSize.value = texelSize;
    this.blit(this.velocity.write, this.gradientSubtractMaterial);
    this.swapBuffers(this.velocity);
    
    // Step 6: Advect velocity
    this.advectionMaterial.uniforms.uVelocity.value = this.velocity.read.texture;
    this.advectionMaterial.uniforms.uSource.value = this.velocity.read.texture;
    this.advectionMaterial.uniforms.texelSize.value = texelSize;
    this.advectionMaterial.uniforms.dt.value = dt;
    this.advectionMaterial.uniforms.dissipation.value = this.params.velocityDissipation;
    this.blit(this.velocity.write, this.advectionMaterial);
    this.swapBuffers(this.velocity);
    
    // Step 7: Advect dye (both single buffer and layers)
    this.advectionMaterial.uniforms.uVelocity.value = this.velocity.read.texture;
    
    // Advect single dye buffer (for backward compatibility)
    this.advectionMaterial.uniforms.uSource.value = this.dye.read.texture;
    this.advectionMaterial.uniforms.dissipation.value = this.params.dyeDissipation;
    this.blit(this.dye.write, this.advectionMaterial);
    this.swapBuffers(this.dye);
    
    // Advect each layer separately
    for (const layer of this.dyeLayers.values()) {
      // Guard: Ensure layer buffers are valid
      if (!layer.read || !layer.write || layer.read.width === 0 || layer.read.height === 0) {
        continue; // Skip invalid layers
      }
      this.advectionMaterial.uniforms.uSource.value = layer.read.texture;
      this.advectionMaterial.uniforms.dissipation.value = layer.params.dissipation;
      this.blit(layer.write, this.advectionMaterial);
      this.swapBuffers(layer);
    }
  }
  
  injectDyeEnhanced(injection: EnhancedDyeInjection): void {
    // Guard: Ensure velocity buffers are initialized (they're created first)
    if (!this.velocity || !this.velocity.read || this.velocity.read.width === 0 || this.velocity.read.height === 0) {
      return; // Not ready yet
    }
    
    const layer = this.getOrCreateLayer(injection.layerId);
    
    // Guard: Ensure layer render targets are valid
    if (!layer.read || !layer.write || layer.read.width === 0 || layer.read.height === 0) {
      return; // Layer not ready
    }
    
    // Convert screen coordinates to normalized (0-1)
    const u = injection.position.x / this.width;
    const v = 1.0 - (injection.position.y / this.height); // Flip Y
    
    const aspectRatio = this.width / this.height;
    const normalizedRadius = injection.radius / Math.max(this.width, this.height);
    
    // Use blossoming splat shader for enhanced injection
    this.blossomingSplatMaterial.uniforms.uTarget.value = layer.read.texture;
    this.blossomingSplatMaterial.uniforms.aspectRatio.value = aspectRatio;
    this.blossomingSplatMaterial.uniforms.color.value = new THREE.Vector3(
      injection.color.r * injection.strength,
      injection.color.g * injection.strength,
      injection.color.b * injection.strength
    );
    this.blossomingSplatMaterial.uniforms.point.value = new THREE.Vector2(u, v);
    this.blossomingSplatMaterial.uniforms.radius.value = normalizedRadius;
    this.blossomingSplatMaterial.uniforms.diffusionRate.value = injection.diffusionRate;
    
    // Update layer params
    layer.params.diffusionRate = injection.diffusionRate;
    layer.params.viscosity = injection.viscosity;
    // Update dissipation if provided, otherwise keep existing value
    if (injection.dissipation !== undefined) {
      layer.params.dissipation = injection.dissipation;
    }
    
    this.blit(layer.write, this.blossomingSplatMaterial);
    this.swapBuffers(layer);
  }
  
  compositeLayers(): void {
    // Guard: Ensure finalDyeBuffer is initialized and valid
    if (!this.finalDyeBuffer || !this.finalDyeBuffer.read || !this.finalDyeBuffer.write ||
        this.finalDyeBuffer.read.width === 0 || this.finalDyeBuffer.read.height === 0 ||
        this.finalDyeBuffer.write.width === 0 || this.finalDyeBuffer.write.height === 0) {
      return; // Not ready yet
    }
    
    // Collect up to 5 layers for compositing (filter out invalid layers)
    const layers = Array.from(this.dyeLayers.values())
      .filter(layer => layer.read && layer.write && layer.read.width > 0 && layer.read.height > 0)
      .slice(0, 5);
    const layerCount = layers.length;
    
    if (layerCount === 0) return;
    
    // Set layer textures
    this.compositeMaterial.uniforms.uLayer1.value = layers[0]?.read.texture || null;
    this.compositeMaterial.uniforms.uLayer2.value = layers[1]?.read.texture || null;
    this.compositeMaterial.uniforms.uLayer3.value = layers[2]?.read.texture || null;
    this.compositeMaterial.uniforms.uLayer4.value = layers[3]?.read.texture || null;
    this.compositeMaterial.uniforms.uLayer5.value = layers[4]?.read.texture || null;
    this.compositeMaterial.uniforms.uLayerCount.value = layerCount;
    
    // Composite into final dye buffer
    this.blit(this.finalDyeBuffer.write, this.compositeMaterial);
    this.swapBuffers(this.finalDyeBuffer);
  }
  
  injectVelocity(x: number, y: number, radius: number, velocity: Vector2, strength: number): void {
    // Guard: Ensure velocity buffers are initialized
    if (!this.velocity || !this.velocity.read || !this.velocity.write ||
        this.velocity.read.width === 0 || this.velocity.read.height === 0 ||
        this.width === 0 || this.height === 0) {
      return; // Not ready yet
    }
    
    // Convert screen coordinates to normalized (0-1)
    const u = x / this.width;
    const v = 1.0 - (y / this.height); // Flip Y
    
    const aspectRatio = this.width / this.height;
    const normalizedRadius = radius / Math.max(this.width, this.height);
    
    // Inject velocity as RGB (R=x, G=y, B=unused)
    this.splatMaterial.uniforms.uTarget.value = this.velocity.read.texture;
    this.splatMaterial.uniforms.aspectRatio.value = aspectRatio;
    this.splatMaterial.uniforms.color.value = new THREE.Vector3(
      velocity.x * strength,
      velocity.y * strength,
      0.0
    );
    this.splatMaterial.uniforms.point.value = new THREE.Vector2(u, v);
    this.splatMaterial.uniforms.radius.value = normalizedRadius;
    
    this.blit(this.velocity.write, this.splatMaterial);
    this.swapBuffers(this.velocity);
  }
  
  /**
   * Inject a ripple velocity pattern (expanding circular wave)
   * This creates a more realistic ripple effect than simple radial injection
   */
  injectRippleVelocity(
    x: number,
    y: number,
    ringRadius: number,  // Current radius of the ripple ring
    ringWidth: number,  // Width of the ripple ring
    strength: number,   // Overall strength of the ripple
    waveFrequency: number = 8.0,  // Number of wave peaks around ring
    waveAmplitude: number = 0.15  // Amplitude of wave variation (0-1)
  ): void {
    // Guard: Ensure velocity buffers are initialized
    if (!this.velocity || !this.velocity.read || !this.velocity.write ||
        this.velocity.read.width === 0 || this.velocity.read.height === 0 ||
        this.width === 0 || this.height === 0) {
      return; // Not ready yet
    }
    
    // Convert screen coordinates to normalized (0-1)
    const u = x / this.width;
    const v = 1.0 - (y / this.height); // Flip Y
    
    const aspectRatio = this.width / this.height;
    const normalizedRingRadius = ringRadius / Math.max(this.width, this.height);
    const normalizedRingWidth = ringWidth / Math.max(this.width, this.height);
    
    // Set up ripple shader uniforms
    this.rippleVelocityMaterial.uniforms.uTarget.value = this.velocity.read.texture;
    this.rippleVelocityMaterial.uniforms.aspectRatio.value = aspectRatio;
    this.rippleVelocityMaterial.uniforms.point.value = new THREE.Vector2(u, v);
    this.rippleVelocityMaterial.uniforms.ringRadius.value = normalizedRingRadius;
    this.rippleVelocityMaterial.uniforms.ringWidth.value = normalizedRingWidth;
    this.rippleVelocityMaterial.uniforms.strength.value = strength;
    this.rippleVelocityMaterial.uniforms.waveFrequency.value = waveFrequency;
    this.rippleVelocityMaterial.uniforms.waveAmplitude.value = waveAmplitude;
    
    // Use a radius that covers the entire ripple area (ring + width)
    const injectionRadius = (ringRadius + ringWidth * 2) / Math.max(this.width, this.height);
    this.rippleVelocityMaterial.uniforms.radius.value = injectionRadius;
    
    // Render ripple velocity to velocity buffer
    this.blit(this.velocity.write, this.rippleVelocityMaterial);
    this.swapBuffers(this.velocity);
  }
  
  getDyeTexture(): THREE.Texture {
    // Guard: Ensure buffers are initialized
    if (!this.dye || !this.dye.read || this.dye.read.width === 0 || this.dye.read.height === 0) {
      // Return a static dummy texture if not ready (shouldn't happen, but safety check)
      if (!FluidSim.dummyRenderTarget) {
        FluidSim.dummyRenderTarget = new THREE.WebGLRenderTarget(1, 1);
      }
      return FluidSim.dummyRenderTarget.texture;
    }
    
    // Return composited layers if multi-layer system is active, otherwise return single dye buffer
    if (this.dyeLayers.size > 1) {
      this.compositeLayers();
      // Guard: Ensure finalDyeBuffer is valid
      if (this.finalDyeBuffer && this.finalDyeBuffer.read && 
          this.finalDyeBuffer.read.width > 0 && this.finalDyeBuffer.read.height > 0) {
        return this.finalDyeBuffer.read.texture;
      }
    }
    return this.dye.read.texture;
  }
  
  resize(width: number, height: number): void {
    // Guard: Ensure valid dimensions
    if (width <= 0 || height <= 0) {
      return; // Silently skip invalid dimensions
    }
    
    this.width = width;
    this.height = height;
    
    // Calculate simulation dimensions based on performance mode and LOD scale
    const baseSimWidth = this.performanceMode ? Math.floor(width / 2) : width;
    const baseSimHeight = this.performanceMode ? Math.floor(height / 2) : height;
    const simWidth = Math.max(1, Math.floor(baseSimWidth * this.currentResolutionScale));
    const simHeight = Math.max(1, Math.floor(baseSimHeight * this.currentResolutionScale));
    
    // Resize FBOs with simulation dimensions
    this.resizeFBOs(simWidth, simHeight);
  }
  
  private resizeFBOs(simWidth: number, simHeight: number): void {
    // Guard: Ensure valid simulation dimensions
    if (simWidth <= 0 || simHeight <= 0) {
      return; // Silently skip invalid dimensions
    }
    
    // Resize FBOs (create new ones)
    if (this.velocity) {
      this.velocity.read.dispose();
      this.velocity.write.dispose();
    }
    if (this.dye) {
      this.dye.read.dispose();
      this.dye.write.dispose();
    }
    if (this.pressure) {
      this.pressure.read.dispose();
      this.pressure.write.dispose();
    }
    if (this.divergence) {
      this.divergence.dispose();
    }
    if (this.curl) {
      this.curl.dispose();
    }
    
    // Dispose layers
    for (const layer of this.dyeLayers.values()) {
      layer.read.dispose();
      layer.write.dispose();
    }
    this.dyeLayers.clear();
    
    // Dispose final buffer
    if (this.finalDyeBuffer) {
      this.finalDyeBuffer.read.dispose();
      this.finalDyeBuffer.write.dispose();
    }
    
    this.createFBOs(simWidth, simHeight);
    this.initializeLayers(simWidth, simHeight);
    
    // Update texelSize uniforms
    const texelSize = new THREE.Vector2(1.0 / simWidth, 1.0 / simHeight);
    this.advectionMaterial.uniforms.texelSize.value = texelSize;
    this.curlMaterial.uniforms.texelSize.value = texelSize;
    this.vorticityMaterial.uniforms.texelSize.value = texelSize;
    this.divergenceMaterial.uniforms.texelSize.value = texelSize;
    this.pressureMaterial.uniforms.texelSize.value = texelSize;
    this.gradientSubtractMaterial.uniforms.texelSize.value = texelSize;
  }
  
  calculateLOD(fps: number, stressorCount: number): { resolution: number; injectionRate: number } {
    // Apply hysteresis: bias thresholds based on current resolution
    // If currently at high quality, require higher FPS to maintain it
    // If currently at low quality, require lower FPS to improve it
    const hysteresisBias = GameConfig.LOD_HYSTERESIS_FPS;
    const bias = this.currentResolutionScale >= 1.0 ? hysteresisBias : -hysteresisBias;
    const effectiveFps = fps + bias;
    
    // High quality: 60+ FPS (with bias), <30 stressors
    if (effectiveFps >= 60 && stressorCount < 30) {
      return { resolution: 1.0, injectionRate: 1.0 };
    }
    
    // Medium quality: 50-60 FPS (with bias), 30-50 stressors
    if (effectiveFps >= 50 && stressorCount < 50) {
      return { resolution: 0.75, injectionRate: 0.8 };
    }
    
    // Low quality: <50 FPS (with bias) or 50+ stressors
    return { resolution: 0.5, injectionRate: 0.6 };
  }
  
  setResolution(scale: number): void {
    // Guard: Ensure valid scale
    if (scale <= 0 || !isFinite(scale)) {
      return; // Silently skip invalid scales
    }
    
    // Guard: Ensure dimensions are valid
    if (this.width <= 0 || this.height <= 0) {
      return; // Silently skip if dimensions not ready
    }
    
    // Only update if resolution scale actually changed
    if (Math.abs(scale - this.currentResolutionScale) < 0.01) {
      return; // No change needed
    }
    
    // Guard: Ensure velocity buffers are initialized
    if (!this.velocity || !this.velocity.read) {
      // Store the scale for later when buffers are ready
      this.currentResolutionScale = scale;
      return;
    }
    
    // Calculate target simulation dimensions
    // Base simulation size accounts for performance mode (half resolution if enabled)
    const baseSimWidth = this.performanceMode ? Math.floor(this.width / 2) : this.width;
    const baseSimHeight = this.performanceMode ? Math.floor(this.height / 2) : this.height;
    
    // Apply LOD scale, ensuring minimum dimensions of 1x1
    const targetSimWidth = Math.max(1, Math.floor(baseSimWidth * scale));
    const targetSimHeight = Math.max(1, Math.floor(baseSimHeight * scale));
    
    // Only resize if dimensions actually changed
    if (targetSimWidth !== this.velocity.read.width || targetSimHeight !== this.velocity.read.height) {
      this.currentResolutionScale = scale;
      // Resize FBOs directly with target simulation dimensions
      this.resizeFBOs(targetSimWidth, targetSimHeight);
    }
  }
  
  setPerformanceMode(enabled: boolean): void {
    if (this.performanceMode !== enabled) {
      this.performanceMode = enabled;
      // Recalculate simulation dimensions based on current canvas size and LOD scale
      const baseSimWidth = enabled ? Math.floor(this.width / 2) : this.width;
      const baseSimHeight = enabled ? Math.floor(this.height / 2) : this.height;
      const simWidth = Math.max(1, Math.floor(baseSimWidth * this.currentResolutionScale));
      const simHeight = Math.max(1, Math.floor(baseSimHeight * this.currentResolutionScale));
      this.resizeFBOs(simWidth, simHeight);
    }
  }
  
  dispose(): void {
    // Dispose FBOs
    this.velocity.read.dispose();
    this.velocity.write.dispose();
    this.dye.read.dispose();
    this.dye.write.dispose();
    this.pressure.read.dispose();
    this.pressure.write.dispose();
    this.divergence.dispose();
    this.curl.dispose();
    
    // Dispose layers
    for (const layer of this.dyeLayers.values()) {
      layer.read.dispose();
      layer.write.dispose();
    }
    
    // Dispose final buffer
    if (this.finalDyeBuffer) {
      this.finalDyeBuffer.read.dispose();
      this.finalDyeBuffer.write.dispose();
    }
    
    // Dispose materials
    this.advectionMaterial.dispose();
    this.curlMaterial.dispose();
    this.vorticityMaterial.dispose();
    this.divergenceMaterial.dispose();
    this.pressureMaterial.dispose();
    this.gradientSubtractMaterial.dispose();
    this.splatMaterial.dispose();
    this.blossomingSplatMaterial.dispose();
    this.rippleVelocityMaterial.dispose();
    this.compositeMaterial.dispose();
    
    // Dispose geometry
    this.quad.geometry.dispose();
  }
}

