// Heatwave shader — a domain-warped radial plume used during Act III (The Reveal)
// as a "something wrong under the surface" effect and during Act IV as residual
// thermal shimmer. Kept simple and cheap — 2 noise taps per fragment.

export const heatwaveVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const heatwaveFrag = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uColorA;
  uniform vec3 uColorB;

  // Hashless 2D noise (iq style).
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  void main() {
    vec2 p = vUv - 0.5;
    float r = length(p);
    float a = atan(p.y, p.x);
    // Domain warp with time.
    float n = noise(vec2(a * 2.0 + uTime * 0.6, r * 6.0 - uTime * 0.8));
    // Radial plume profile.
    float plume = smoothstep(0.52, 0.05, r + n * 0.18);
    vec3 col = mix(uColorB, uColorA, plume);
    float alpha = plume * uIntensity;
    gl_FragColor = vec4(col, alpha);
  }
`
