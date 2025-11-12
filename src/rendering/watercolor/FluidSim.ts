import * as THREE from 'three';

export interface FluidParams {
  viscosity: number;
  dyeDissipation: number;
  velocityDissipation: number;
  curl: number;
  pressureIters: number;
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface Vector2 {
  x: number;
  y: number;
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
  
  // Shader materials for each simulation step
  private advectionMaterial!: THREE.ShaderMaterial;
  private curlMaterial!: THREE.ShaderMaterial;
  private vorticityMaterial!: THREE.ShaderMaterial;
  private divergenceMaterial!: THREE.ShaderMaterial;
  private pressureMaterial!: THREE.ShaderMaterial;
  private gradientSubtractMaterial!: THREE.ShaderMaterial;
  private splatMaterial!: THREE.ShaderMaterial;
  
  // Fullscreen quad for rendering
  private quad!: THREE.Mesh;
  private camera!: THREE.OrthographicCamera;
  private scene!: THREE.Scene;
  
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
  
  constructor(width: number, height: number, renderer: THREE.WebGLRenderer) {
    this.renderer = renderer;
    this.width = width;
    this.height = height;
    
    // Ensure WebGL context is ready
    const gl = renderer.getContext();
    if (!gl) {
      throw new Error('WebGL context not available');
    }
    
    // Start with half resolution for performance
    const simWidth = Math.floor(width / 2);
    const simHeight = Math.floor(height / 2);
    
    // Setup fullscreen quad first (needed for materials)
    this.setupQuad();
    
    // Create shader materials (after quad setup)
    this.createShaders();
    
    // Create FBOs
    this.createFBOs(simWidth, simHeight);
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
  }
  
  private createFBOs(width: number, height: number): void {
    const format = THREE.RGBAFormat;
    const type = THREE.HalfFloatType; // Try half float for performance, fallback to float
    
    const createRenderTarget = (w: number, h: number): THREE.WebGLRenderTarget => {
      const rt = new THREE.WebGLRenderTarget(w, h, {
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
    
    // Step 7: Advect dye
    this.advectionMaterial.uniforms.uVelocity.value = this.velocity.read.texture;
    this.advectionMaterial.uniforms.uSource.value = this.dye.read.texture;
    this.advectionMaterial.uniforms.dissipation.value = this.params.dyeDissipation;
    this.blit(this.dye.write, this.advectionMaterial);
    this.swapBuffers(this.dye);
  }
  
  injectDye(x: number, y: number, radius: number, color: RGB, strength: number): void {
    // Convert screen coordinates to normalized (0-1)
    const u = x / this.width;
    const v = 1.0 - (y / this.height); // Flip Y
    
    const aspectRatio = this.width / this.height;
    const normalizedRadius = radius / Math.max(this.width, this.height);
    
    this.splatMaterial.uniforms.uTarget.value = this.dye.read.texture;
    this.splatMaterial.uniforms.aspectRatio.value = aspectRatio;
    this.splatMaterial.uniforms.color.value = new THREE.Vector3(
      color.r * strength,
      color.g * strength,
      color.b * strength
    );
    this.splatMaterial.uniforms.point.value = new THREE.Vector2(u, v);
    this.splatMaterial.uniforms.radius.value = normalizedRadius;
    
    this.blit(this.dye.write, this.splatMaterial);
    this.swapBuffers(this.dye);
  }
  
  injectVelocity(x: number, y: number, radius: number, velocity: Vector2, strength: number): void {
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
  
  getDyeTexture(): THREE.Texture {
    return this.dye.read.texture;
  }
  
  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    
    const simWidth = this.performanceMode ? Math.floor(width / 2) : width;
    const simHeight = this.performanceMode ? Math.floor(height / 2) : height;
    
    // Resize FBOs (create new ones)
    this.velocity.read.dispose();
    this.velocity.write.dispose();
    this.dye.read.dispose();
    this.dye.write.dispose();
    this.pressure.read.dispose();
    this.pressure.write.dispose();
    this.divergence.dispose();
    this.curl.dispose();
    
    this.createFBOs(simWidth, simHeight);
    
    // Update texelSize uniforms
    const texelSize = new THREE.Vector2(1.0 / simWidth, 1.0 / simHeight);
    this.advectionMaterial.uniforms.texelSize.value = texelSize;
    this.curlMaterial.uniforms.texelSize.value = texelSize;
    this.vorticityMaterial.uniforms.texelSize.value = texelSize;
    this.divergenceMaterial.uniforms.texelSize.value = texelSize;
    this.pressureMaterial.uniforms.texelSize.value = texelSize;
    this.gradientSubtractMaterial.uniforms.texelSize.value = texelSize;
  }
  
  setPerformanceMode(enabled: boolean): void {
    if (this.performanceMode !== enabled) {
      this.performanceMode = enabled;
      this.resize(this.width, this.height);
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
    
    // Dispose materials
    this.advectionMaterial.dispose();
    this.curlMaterial.dispose();
    this.vorticityMaterial.dispose();
    this.divergenceMaterial.dispose();
    this.pressureMaterial.dispose();
    this.gradientSubtractMaterial.dispose();
    this.splatMaterial.dispose();
    
    // Dispose geometry
    this.quad.geometry.dispose();
  }
}

