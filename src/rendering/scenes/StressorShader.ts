/**
 * StressorShader - Custom shader for rendering stressors with liquid watermedia effects
 * 
 * Creates soft, organic edges with pulse animation and health-based opacity.
 */
export const StressorShader = {
  vertex: `
    varying vec2 vUv;
    varying vec3 vPosition;
    
    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  
  fragment: `
    precision highp float;
    
    varying vec2 vUv;
    varying vec3 vPosition;
    
    uniform vec3 stressorColor;
    uniform float stressorSize;
    uniform float edgeSoftness;
    uniform float pulseAmount;
    uniform float healthRatio;
    
    void main() {
      // Distance from center (CircleGeometry has center at (0.5, 0.5) in UV space)
      vec2 center = vec2(0.5, 0.5);
      float dist = length(vUv - center);
      
      // Soft, organic edge through fluid diffusion
      float normalizedRadius = 0.5; // CircleGeometry radius is 0.5 in normalized space
      float currentRadius = normalizedRadius * (1.0 + pulseAmount);
      float edgeDistance = currentRadius - dist;
      
      // Soft falloff using smoothstep
      float bleedDistance = edgeSoftness * currentRadius;
      float alpha = smoothstep(-bleedDistance, bleedDistance * 0.3, edgeDistance);
      
      // Health-based opacity (damaged stressors fade)
      alpha *= healthRatio;
      
      // Color variation based on health
      vec3 color = stressorColor * (0.8 + healthRatio * 0.2);
      
      gl_FragColor = vec4(color, alpha);
    }
  `
};

