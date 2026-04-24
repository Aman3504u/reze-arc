import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, AdaptiveEvents, Preload } from "@react-three/drei";
import { Suspense } from "react";
import * as THREE from "three";
import { CameraRig } from "./CameraRig";
import { Icon } from "./Icon";
import { Environment } from "./Environment";
import { Sparks } from "./particles/Sparks";
import { Debris } from "./particles/Debris";
import { PostFX } from "./PostFX";

// Top-level <Canvas> — GPU tuned, tone-mapped, shadow-enabled.

export function Stage() {
  return (
    <Canvas
      shadows
      gl={{
        antialias: false,
        alpha: false,
        powerPreference: "high-performance",
        stencil: false,
      }}
      dpr={[1, 1.75]}
      camera={{ position: [0, 1.8, 7.5], fov: 38, near: 0.1, far: 120 }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        gl.setClearColor(new THREE.Color("#05070b"), 1);
        scene.fog = new THREE.FogExp2(new THREE.Color("#06080d"), 0.045);
      }}
    >
      <Suspense fallback={null}>
        <CameraRig />
        <Environment />
        <Icon />
        <Debris />
        <Sparks />
        <PostFX />
        <AdaptiveDpr pixelated={false} />
        <AdaptiveEvents />
        <Preload all />
      </Suspense>
    </Canvas>
  );
}
