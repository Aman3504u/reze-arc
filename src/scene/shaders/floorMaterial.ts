import * as THREE from "three";

// Floor shader: wet asphalt aesthetic.
// Radial dark gradient + animated rain ripples + progress-driven fire glow.

export interface FloorUniforms {
  uTime: { value: number };
  uTension: { value: number };
  uShatter: { value: number };
  uHotColor: { value: THREE.Color };
}

export function createFloorMaterial(): {
  material: THREE.ShaderMaterial;
  uniforms: FloorUniforms;
} {
  const uniforms: FloorUniforms = {
    uTime: { value: 0 },
    uTension: { value: 0 },
    uShatter: { value: 0 },
    uHotColor: { value: new THREE.Color("#ff4422") },
  };

  const material = new THREE.ShaderMaterial({
    uniforms: uniforms as unknown as Record<string, THREE.IUniform>,
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vWorldPos;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform float uTime;
      uniform float uTension;
      uniform float uShatter;
      uniform vec3  uHotColor;
      varying vec2 vUv;
      varying vec3 vWorldPos;

      float hash21(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      float ripples(vec2 p, float time) {
        float v = 0.0;
        // Three drops at pseudo-random anchors, staggered in time.
        for (int i = 0; i < 3; i++) {
          float fi = float(i);
          vec2 anchor = vec2(hash21(vec2(fi, 7.0)), hash21(vec2(fi, 13.0))) * 6.0 - 3.0;
          float t = mod(time * 0.6 + fi * 0.9, 2.6);
          float r = length(p - anchor);
          float wave = sin(r * 14.0 - t * 10.0) * exp(-r * 1.4) * exp(-t * 0.9);
          v += wave;
        }
        return v;
      }

      void main() {
        vec2 p = vWorldPos.xz;
        float d = length(p);
        // Wet asphalt base.
        vec3 base = mix(vec3(0.02, 0.03, 0.05), vec3(0.06, 0.07, 0.09),
                        smoothstep(0.0, 8.0, d));
        // Rain ripples — fade as tension grows (rain stops before detonation).
        float rain = ripples(p * 0.9, uTime) * (1.0 - smoothstep(0.35, 0.75, uTension + uShatter));
        base += vec3(0.5, 0.6, 0.9) * rain * 0.08;

        // Detonation glow pooled near origin.
        float glow = exp(-d * 0.55) * (uShatter);
        base += uHotColor * glow * 1.4;

        // Radial vignette + scroll-locked fade to hide edges.
        float vignette = smoothstep(10.0, 3.0, d);
        float alpha = vignette * (0.9);

        gl_FragColor = vec4(base, alpha);
      }
    `,
  });
  return { material, uniforms };
}
