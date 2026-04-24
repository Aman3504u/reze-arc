import * as THREE from "three";

// Hemispheric gradient backdrop that shifts color through the arc.
// Rendered on a large back-face-only sphere so the camera flies inside it.

export interface SkyUniforms {
  uTime: { value: number };
  uTension: { value: number };
  uShatter: { value: number };
  uAftermath: { value: number };
}

export function createSkyMaterial(): {
  material: THREE.ShaderMaterial;
  uniforms: SkyUniforms;
} {
  const uniforms: SkyUniforms = {
    uTime: { value: 0 },
    uTension: { value: 0 },
    uShatter: { value: 0 },
    uAftermath: { value: 0 },
  };

  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: uniforms as unknown as Record<string, THREE.IUniform>,
    vertexShader: /* glsl */ `
      varying vec3 vPos;
      void main() {
        vPos = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying vec3 vPos;
      uniform float uTime;
      uniform float uTension;
      uniform float uShatter;
      uniform float uAftermath;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }

      void main() {
        float y = clamp(vPos.y * 0.5 + 0.5, 0.0, 1.0);

        // Calm: deep navy -> slate blue
        vec3 calmA = vec3(0.015, 0.02, 0.045);
        vec3 calmB = vec3(0.08, 0.12, 0.18);
        vec3 calm  = mix(calmA, calmB, smoothstep(0.0, 1.0, y));

        // Tension: bruised violet
        vec3 tensA = vec3(0.06, 0.01, 0.08);
        vec3 tensB = vec3(0.18, 0.07, 0.22);
        vec3 tens  = mix(tensA, tensB, smoothstep(0.0, 1.0, y));

        // Shatter: burnt orange near horizon
        vec3 shatA = vec3(0.28, 0.05, 0.03);
        vec3 shatB = vec3(0.45, 0.18, 0.05);
        vec3 shat  = mix(shatA, shatB, smoothstep(0.0, 1.0, y));

        // Aftermath: cool grey/teal, near monochrome
        vec3 aftA = vec3(0.02, 0.03, 0.03);
        vec3 aftB = vec3(0.08, 0.10, 0.11);
        vec3 aft  = mix(aftA, aftB, smoothstep(0.0, 1.0, y));

        vec3 col = calm;
        col = mix(col, tens, uTension);
        col = mix(col, shat, uShatter);
        col = mix(col, aft, uAftermath);

        // Sparse star specks (visible in calm & aftermath).
        float s = step(0.9965, hash(floor(vPos.xy * 420.0)));
        float stars = s * (1.0 - uTension) * (1.0 - uShatter);
        col += vec3(0.7, 0.8, 1.0) * stars * 0.8;

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  return { material, uniforms };
}
