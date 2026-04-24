import * as THREE from "three";

// =============================================================================
// Core Icon Material
//
// A shader material for the central symbolic geometry. The surface:
//   • pulses outward with simplex-like noise that intensifies with `uTension`,
//   • cracks open during `uShatter`, exposing an emissive inner core,
//   • tints from cold cyan → blood-red along the narrative arc.
//
// We ride on THREE.MeshStandardMaterial to inherit PBR lighting but inject
// vertex displacement + emissive modulation via onBeforeCompile — this keeps
// shadow casting, tone mapping, and env maps working for free.
// =============================================================================

const vertHead = /* glsl */ `
  uniform float uTime;
  uniform float uTension;
  uniform float uShatter;
  varying float vCrack;
  varying vec3 vLocalPos;

  // Cheap 3D hash-based noise — no external deps, lightweight, good enough
  // for displacement aesthetics.
  float hash31(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise31(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float n000 = hash31(i + vec3(0.0,0.0,0.0));
    float n100 = hash31(i + vec3(1.0,0.0,0.0));
    float n010 = hash31(i + vec3(0.0,1.0,0.0));
    float n110 = hash31(i + vec3(1.0,1.0,0.0));
    float n001 = hash31(i + vec3(0.0,0.0,1.0));
    float n101 = hash31(i + vec3(1.0,0.0,1.0));
    float n011 = hash31(i + vec3(0.0,1.0,1.0));
    float n111 = hash31(i + vec3(1.0,1.0,1.0));
    return mix(
      mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
      mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y),
      f.z
    );
  }
`;

const vertBodyReplace = /* glsl */ `
  vec3 transformed = vec3( position );
  vLocalPos = position;

  float n = noise31(position * 2.2 + uTime * 0.25);
  float breathing = 0.04 * sin(uTime * 0.7);
  float bulge = 0.15 * uTension * (n - 0.5);
  float crack = smoothstep(0.35, 0.85, n) * uShatter;
  vCrack = crack;
  transformed += normal * (breathing + bulge + crack * 0.8);
`;

const fragHead = /* glsl */ `
  uniform float uTime;
  uniform float uTension;
  uniform float uShatter;
  uniform vec3  uColdColor;
  uniform vec3  uHotColor;
  varying float vCrack;
  varying vec3 vLocalPos;
`;

// `totalEmissiveRadiance` is already declared earlier in the standard shader
// (by the <emissivemap_fragment> chunk via its parent). We only override its
// value here — a plain assignment, no re-declaration.
const fragEmissiveReplace = /* glsl */ `
  #include <emissivemap_fragment>
  {
    vec3 arcColor = mix(uColdColor, uHotColor, clamp(uTension * 0.6 + uShatter, 0.0, 1.0));
    float glow = 0.35 + 0.8 * uTension + 2.5 * vCrack;
    totalEmissiveRadiance = arcColor * glow;
  }
`;

export interface IconMaterialUniforms {
  uTime: { value: number };
  uTension: { value: number };
  uShatter: { value: number };
  uColdColor: { value: THREE.Color };
  uHotColor: { value: THREE.Color };
}

export function createIconMaterial(): {
  material: THREE.MeshStandardMaterial;
  uniforms: IconMaterialUniforms;
} {
  const uniforms: IconMaterialUniforms = {
    uTime: { value: 0 },
    uTension: { value: 0 },
    uShatter: { value: 0 },
    uColdColor: { value: new THREE.Color("#5ad5ff") },
    uHotColor: { value: new THREE.Color("#ff3344") },
  };

  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#0a0d12"),
    metalness: 0.4,
    roughness: 0.25,
    emissive: new THREE.Color("#000000"),
    emissiveIntensity: 1.0,
  });

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime;
    shader.uniforms.uTension = uniforms.uTension;
    shader.uniforms.uShatter = uniforms.uShatter;
    shader.uniforms.uColdColor = uniforms.uColdColor;
    shader.uniforms.uHotColor = uniforms.uHotColor;

    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${vertHead}`)
      .replace("#include <begin_vertex>", vertBodyReplace);

    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${fragHead}`)
      .replace("#include <emissivemap_fragment>", fragEmissiveReplace);
  };

  return { material: mat, uniforms };
}
