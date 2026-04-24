import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { timelineBus } from "../hooks/useScrollTimeline";
import { createIconMaterial } from "./shaders/iconMaterial";
import { smoothstep, pulse } from "../utils/math";

// The central symbolic object. Chosen geometry: icosahedron at higher
// subdivision so the vertex-displacement shader has enough resolution to
// fracture convincingly.

export function Icon() {
  const meshRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const { material, uniforms } = useMemo(() => createIconMaterial(), []);

  // Inner emissive core, visible through the cracks.
  const coreMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("#ff5a30"),
        toneMapped: false,
      }),
    []
  );

  useFrame((_, dt) => {
    const p = timelineBus.progress;
    const t = (uniforms.uTime.value += dt);
    uniforms.uTension.value = smoothstep(0.1, 0.48, p);
    uniforms.uShatter.value = pulse(p, 0.48, 0.62, 0.95) * 1.4;

    if (meshRef.current) {
      // Slow idle spin; accelerates briefly through the explosion.
      const spin = 0.15 + pulse(p, 0.45, 0.58, 0.75) * 3.0;
      meshRef.current.rotation.y += spin * dt;
      meshRef.current.rotation.x = Math.sin(t * 0.3) * 0.1;

      // Vanish after full shatter — we let debris + sparks carry the payload.
      const alive = 1 - smoothstep(0.8, 0.95, p);
      meshRef.current.scale.setScalar(alive);
    }
    if (coreRef.current) {
      const alive = 1 - smoothstep(0.8, 0.95, p);
      const pulseS = 1 + 0.2 * Math.sin(t * 4) * uniforms.uShatter.value;
      coreRef.current.scale.setScalar(0.42 * alive * pulseS);
      (coreMat as THREE.MeshBasicMaterial).opacity = alive;
    }
  });

  return (
    <group position={[0, 0.95, 0]}>
      <mesh ref={meshRef} material={material} castShadow receiveShadow>
        <icosahedronGeometry args={[0.75, 6]} />
      </mesh>
      <mesh ref={coreRef} material={coreMat}>
        <sphereGeometry args={[1, 32, 32]} />
      </mesh>
    </group>
  );
}
