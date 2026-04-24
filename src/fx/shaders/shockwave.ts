// Shockwave shader — a radial ring that expands out from origin, with a hot
// core trailing edge and fast-falloff rim. Used only during Act IV.

export const shockwaveVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const shockwaveFrag = /* glsl */ `
  varying vec2 vUv;
  uniform float uProgress;
  uniform float uIntensity;
  uniform vec3 uColor;
  uniform vec3 uCore;

  void main() {
    vec2 p = vUv - 0.5;
    float r = length(p) * 2.0; // [0..~1.4]
    // Ring expands from 0 to ~1 over uProgress
    float ring = 1.0 - smoothstep(0.0, 0.08, abs(r - uProgress));
    float core = smoothstep(uProgress, uProgress - 0.12, r) * (1.0 - smoothstep(0.0, uProgress + 0.001, r));
    // Dim as it expands out.
    float fall = 1.0 - smoothstep(0.0, 1.0, uProgress);
    vec3 col = mix(uColor, uCore, core * 1.5);
    float a = (ring * 0.9 + core * 0.4) * fall * uIntensity;
    gl_FragColor = vec4(col, a);
  }
`
