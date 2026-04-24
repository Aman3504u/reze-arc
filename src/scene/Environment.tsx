import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { timelineBus } from "../hooks/useScrollTimeline";
import { createFloorMaterial } from "./shaders/floorMaterial";
import { createSkyMaterial } from "./shaders/skyMaterial";
import { createShockwaveMaterial } from "./shaders/shockwaveMaterial";
import { pulse, smoothstep } from "../utils/math";

// =============================================================================
// Environment — sky dome, reflective floor, rim spotlights, and shockwave ring.
// =============================================================================

export function Environment() {
  const floorData = useMemo(() => createFloorMaterial(), []);
  const skyData = useMemo(() => createSkyMaterial(), []);
  const waveData = useMemo(() => createShockwaveMaterial(), []);

  const wave = useRef<THREE.Mesh>(null);
  const keySpot = useRef<THREE.SpotLight>(null);
  const rim = useRef<THREE.SpotLight>(null);
  const fill = useRef<THREE.PointLight>(null);

  useFrame((_, dt) => {
    const p = timelineBus.progress;
    const tension = smoothstep(0.1, 0.48, p);
    const shatter = pulse(p, 0.48, 0.6, 0.9);
    const aftermath = smoothstep(0.78, 1.0, p);

    floorData.uniforms.uTime.value += dt;
    floorData.uniforms.uTension.value = tension;
    floorData.uniforms.uShatter.value = shatter;

    skyData.uniforms.uTime.value += dt;
    skyData.uniforms.uTension.value = tension;
    skyData.uniforms.uShatter.value = shatter;
    skyData.uniforms.uAftermath.value = aftermath;

    // Shockwave ring: only visible inside the detonation window.
    const inside = smoothstep(0.48, 0.52, p) * (1 - smoothstep(0.7, 0.85, p));
    if (inside > 0.01 && wave.current) {
      wave.current.visible = true;
      const local = smoothstep(0.48, 0.85, p);
      waveData.uniforms.uProgress.value = local;
      (wave.current.scale as THREE.Vector3).setScalar(4 + local * 10);
    } else if (wave.current) {
      wave.current.visible = false;
    }

    // Lights — key warms from blue → amber, fill disappears in aftermath.
    if (keySpot.current) {
      keySpot.current.intensity = 4 + 20 * shatter;
      const c = keySpot.current.color;
      c.setRGB(
        0.6 + 0.4 * shatter,
        0.7 - 0.3 * shatter,
        0.9 - 0.7 * shatter
      );
    }
    if (rim.current) {
      rim.current.intensity = 2 + 6 * tension + 10 * shatter;
    }
    if (fill.current) {
      fill.current.intensity = 1.2 * (1 - aftermath);
    }
  });

  return (
    <group>
      {/* Sky dome (back-faced sphere) */}
      <mesh material={skyData.material}>
        <sphereGeometry args={[80, 32, 32]} />
      </mesh>

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow material={floorData.material}>
        <planeGeometry args={[24, 24, 1, 1]} />
      </mesh>

      {/* Shockwave ring — flat disk facing up */}
      <mesh
        ref={wave}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.02, 0]}
        material={waveData.material}
      >
        <planeGeometry args={[1, 1, 1, 1]} />
      </mesh>

      {/* Lights */}
      <ambientLight intensity={0.25} />
      <spotLight
        ref={keySpot}
        position={[3.5, 6, 4]}
        angle={0.45}
        penumbra={0.8}
        decay={1.2}
        intensity={4}
        color="#9db0ff"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <spotLight
        ref={rim}
        position={[-4, 3, -5]}
        angle={0.6}
        penumbra={0.9}
        decay={1.5}
        intensity={2}
        color="#ff5a44"
      />
      <pointLight ref={fill} position={[0, 1.2, 2]} intensity={1.2} color="#203050" distance={6} />
    </group>
  );
}
