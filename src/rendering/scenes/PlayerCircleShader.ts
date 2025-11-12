/**
 * Shader for the player circle that mimics watercolor paint on paper
 * Creates soft, diffused edges that simulate paint bleeding into the paper
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
    uniform float pulseAmount; // 0.0 to 1.0, controls how much the paint has spread
    uniform float edgeSoftness; // How soft the edges are (watercolor bleed)
    uniform float paperTextureScale;
    uniform sampler2D paperTexture;
    
    varying vec2 vUv;
    varying vec3 vPosition;
    
    void main() {
      // Calculate distance from center using UV coordinates
      // CircleGeometry has UVs from 0-1, with center at (0.5, 0.5)
      vec2 center = vec2(0.5, 0.5);
      vec2 uvFromCenter = vUv - center;
      float dist = length(uvFromCenter) * 2.0; // Scale to 0-1 range (diameter = 1)
      
      // Current radius with pulse (normalized to 0-1 range)
      float normalizedRadius = 0.5; // CircleGeometry radius is 0.5 in normalized space
      float currentRadius = normalizedRadius * (1.0 + pulseAmount * 0.15);
      
      // Create soft edge falloff (simulates watercolor bleeding)
      // The further from center, the more the paint bleeds/diffuses
      float edgeDistance = currentRadius - dist;
      
      // Soft falloff using smoothstep for watercolor-like edges
      // Edge softness controls how far the paint bleeds (larger = more bleeding)
      float bleedDistance = edgeSoftness * currentRadius;
      float alpha = smoothstep(-bleedDistance, bleedDistance * 0.3, edgeDistance);
      
      // Simulate paint pooling at edges (darker/more intense at edges)
      // This mimics how watercolor paint concentrates at the edge of a wet area
      float edgeIntensity = 1.0;
      float edgePoolZone = bleedDistance * 0.5;
      if (edgeDistance < edgePoolZone && edgeDistance > -edgePoolZone) {
        // Near the edge, increase intensity (paint pooling)
        float edgeFactor = 1.0 - abs(edgeDistance / edgePoolZone);
        edgeIntensity = 1.0 + edgeFactor * 0.3; // 30% more intense at edges
      }
      
      // Sample paper texture for granulation (paint interacting with paper fibers)
      vec4 paper = texture2D(paperTexture, vUv * paperTextureScale);
      
      // Apply paper texture granulation to color intensity
      // Paper texture affects how paint is absorbed
      float granulation = 0.95 + paper.r * 0.1; // Subtle variation
      
      // Calculate final color with watercolor properties
      vec3 finalColor = circleColor * edgeIntensity * granulation;
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `
};

