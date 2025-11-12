export const WatercolorShader = {
  // Vertex shader - let Three.js inject built-in attributes/uniforms
  // This matches the original mattatz implementation pattern
  vertex: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  
  fragment: `
    precision mediump float;
    
    uniform sampler2D tDiffuse;
    uniform sampler2D paperTexture;
    uniform float edgeDarkeningIntensity;
    uniform float bleedRadius;
    uniform float diffusionRate;
    uniform float pigmentSaturation;
    uniform float wetness;
    uniform float toonThreshold;
    
    // Radial wetness uniforms (for paint pulse effect)
    uniform vec2 playerCenter; // Player center in UV space (0-1)
    uniform float pulseRadius; // Current pulse radius in normalized screen space
    uniform float pulsePhase; // 0.0 (shrunk/dry) to 1.0 (expanded/wet)
    
    varying vec2 vUv;
    
    void main() {
      vec2 uv = vUv;
      
      // Calculate radial wetness from player center
      // This simulates paint re-wetting the paper as it pulses outward
      float distFromPlayer = length(uv - playerCenter);
      float normalizedDist = distFromPlayer / max(pulseRadius, 0.001); // Avoid division by zero
      
      // Radial wetness: high when pulse is expanded (pulsePhase near 1.0)
      // Fades with distance from player center
      // When pulsePhase is high, paper is wet (smooth). When low, paper is dry (textured)
      float radialWetness = pulsePhase * (1.0 - smoothstep(0.0, 1.5, normalizedDist));
      
      // Sample input scene texture
      vec4 sceneColor = texture2D(tDiffuse, uv);
      
      // Sample paper texture for granulation
      vec4 paper = texture2D(paperTexture, uv * 2.0);
      
      // Edge darkening (simulate pigment pooling at edges)
      vec2 edge = min(uv, 1.0 - uv);
      float edgeFactor = min(edge.x, edge.y);
      float darkening = 1.0 - (edgeFactor * edgeDarkeningIntensity);
      
      // Bleed/diffusion effect (simple blur approximation with 5x5 kernel)
      vec4 bleedColor = vec4(0.0);
      float totalWeight = 0.0;
      
      for (int i = -2; i <= 2; i++) {
        for (int j = -2; j <= 2; j++) {
          vec2 offset = vec2(float(i), float(j)) * bleedRadius * 0.01;
          float dist = float(i*i + j*j);
          float weight = 1.0 / (1.0 + dist);
          bleedColor += texture2D(tDiffuse, uv + offset) * weight;
          totalWeight += weight;
        }
      }
      bleedColor /= totalWeight;
      
      // Mix original with bleed based on diffusion rate
      vec4 diffusedColor = mix(sceneColor, bleedColor, diffusionRate);
      
      // Apply paper texture granulation
      // When wet (high radialWetness): less granulation (smoother paper, paint absorbed)
      // When dry (low radialWetness): more granulation (textured paper, paint dried)
      float granulationAmount = mix(0.15, 0.03, radialWetness); // Less granulation when wet
      vec4 granulatedColor = diffusedColor * (0.9 + paper.r * granulationAmount);
      
      // Apply edge darkening
      granulatedColor.rgb *= darkening;
      
      // Apply saturation and wetness
      float luminance = dot(granulatedColor.rgb, vec3(0.299, 0.587, 0.114));
      granulatedColor.rgb = mix(
        vec3(luminance),
        granulatedColor.rgb,
        pigmentSaturation
      );
      
      // Soften edges with wetness (combine global wetness with radial wetness)
      float combinedWetness = max(wetness, radialWetness * 0.5);
      granulatedColor.rgb = mix(
        granulatedColor.rgb,
        bleedColor.rgb,
        combinedWetness * 0.3
      );
      
      // Optional toon shading for legibility
      float toon = floor(granulatedColor.r * 4.0) / 4.0;
      granulatedColor.rgb = mix(
        granulatedColor.rgb,
        vec3(toon),
        toonThreshold
      );
      
      gl_FragColor = granulatedColor;
    }
  `
};

