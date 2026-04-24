import * as THREE from "three";

// Expanding ring shockwave used during the detonation beat.
// Transparent, additively blended, radius driven from JS.

export interface ShockwaveUniforms {
  uProgress: { value: number }; // 0..1 inside the detonation window
  uColor: { value: THREE.Color };
}

export function createShockwaveMaterial(): {
  material: THREE.ShaderMaterial;
  uniforms: ShockwaveUniforms;
} {
  const uniforms: ShockwaveUniforms = {
    uProgress: { value: 0 },
    uColor: { value: new THREE.Color("#ffb070") },
  };

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: uniforms as unknown as Record<string, THREE.IUniform>,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying vec2 vUv;
      uniform float uProgress;
      uniform vec3  uColor;
      void main() {
        float r = distance(vUv, vec2(0.5)) * 2.0;
        // Ring centered at radius = uProgress, thickness shrinks over time.
        float thickness = mix(0.18, 0.04, uProgress);
        float ring = smoothstep(uProgress - thickness, uProgress, r) *
                     (1.0 - smoothstep(uProgress, uProgress + thickness * 0.6, r));
        float fade = smoothstep(1.0, 0.4, uProgress);
        vec3 col = uColor * ring * 2.2;
        gl_FragColor = vec4(col, ring * fade);
      }
    `,
  });
  return { material, uniforms };
}
