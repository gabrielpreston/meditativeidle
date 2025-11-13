/**
 * Shader for the player circle
 * Creates soft, diffused edges
 */
export const PlayerCircleShader = {
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
    precision mediump float;
    
    uniform vec3 circleColor;
    uniform float circleRadius;
    uniform float pulseAmount; // 0.0 to 1.0, controls pulse intensity
    uniform float edgeSoftness; // How soft the edges are
    uniform float opacity; // Player circle opacity (0.0 to 1.0)
    
    varying vec2 vUv;
    varying vec3 vPosition;
    
    void main() {
      // Calculate distance from center using world-space position
      // This ensures the shader scales correctly with geometry size
      float dist = length(vPosition.xy) / circleRadius;
      
      // Current radius with pulse (normalized to circleRadius)
      float currentRadius = 1.0 * (1.0 + pulseAmount * 0.15);
      
      // Create soft edge falloff
      float edgeDistance = currentRadius - dist;
      
      // Soft falloff using smoothstep
      float bleedDistance = edgeSoftness * currentRadius;
      float alpha = smoothstep(-bleedDistance, bleedDistance * 0.3, edgeDistance);
      
      // Subtle edge intensity variation
      // Fluid layer handles primary visual effects
      float edgeIntensity = 1.0;
      float edgePoolZone = bleedDistance * 0.5;
      if (edgeDistance < edgePoolZone && edgeDistance > -edgePoolZone) {
        float edgeFactor = 1.0 - abs(edgeDistance / edgePoolZone);
        edgeIntensity = 1.0 + edgeFactor * 0.1; // 10% more intense at edges
      }
      
      // Calculate final color
      vec3 finalColor = circleColor * edgeIntensity;
      
      // Apply opacity
      gl_FragColor = vec4(finalColor, alpha * opacity);
    }
  `
};

