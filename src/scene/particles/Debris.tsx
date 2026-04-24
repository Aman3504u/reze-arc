import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { timelineBus } from "../../hooks/useScrollTimeline";
import { pulse, smoothstep } from "../../utils/math";

// =============================================================================
// Debris — instanced tetrahedra that erupt outward during the shatter.
// One draw call, mesh-accurate shards, tumbling rotation per instance.
// =============================================================================

const COUNT = 140;
const dummy = new THREE.Object3D();

export function Debris() {
  const ref = useRef<THREE.InstancedMesh>(null);

  const data = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const vel = new Float32Array(COUNT * 3);
    const rot = new Float32Array(COUNT * 3);
    const rotV = new Float32Array(COUNT * 3);
    const scale = new Float32Array(COUNT);
    const seed = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      seed[i] = Math.random();
      scale[i] = 0.04 + Math.random() * 0.1;
      rot[i * 3 + 0] = Math.random() * Math.PI * 2;
      rot[i * 3 + 1] = Math.random() * Math.PI * 2;
      rot[i * 3 + 2] = Math.random() * Math.PI * 2;
    }
    return { pos, vel, rot, rotV, scale, seed };
  }, []);

  const lastImpulse = useRef(-1);

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#1a1d23",
        metalness: 0.6,
        roughness: 0.35,
        emissive: new THREE.Color("#ff3010"),
        emissiveIntensity: 0.0,
      }),
    []
  );

  useFrame((_, dt) => {
    const p = timelineBus.progress;
    const inst = ref.current;
    if (!inst) return;

    const shatter = pulse(p, 0.48, 0.6, 0.9);
    const aftermath = smoothstep(0.78, 1.0, p);

    // Trigger the eruption on crossing 0.5.
    if (p > 0.5 && lastImpulse.current < 0.5) {
      for (let i = 0; i < COUNT; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const speed = 3.5 + Math.random() * 4.5;
        data.pos[i * 3 + 0] = (Math.random() - 0.5) * 0.3;
        data.pos[i * 3 + 1] = 0.9 + (Math.random() - 0.5) * 0.4;
        data.pos[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
        data.vel[i * 3 + 0] = Math.sin(phi) * Math.cos(theta) * speed;
        data.vel[i * 3 + 1] = Math.cos(phi) * speed * 0.8 + 2.0;
        data.vel[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * speed;
        data.rotV[i * 3 + 0] = (Math.random() - 0.5) * 10;
        data.rotV[i * 3 + 1] = (Math.random() - 0.5) * 10;
        data.rotV[i * 3 + 2] = (Math.random() - 0.5) * 10;
      }
    }
    lastImpulse.current = p;

    material.emissiveIntensity = 2.0 * shatter * (1 - aftermath);

    const gravity = -5.5;
    for (let i = 0; i < COUNT; i++) {
      data.vel[i * 3 + 0] *= 0.985;
      data.vel[i * 3 + 1] += gravity * dt;
      data.vel[i * 3 + 2] *= 0.985;

      data.pos[i * 3 + 0] += data.vel[i * 3 + 0] * dt;
      data.pos[i * 3 + 1] += data.vel[i * 3 + 1] * dt;
      data.pos[i * 3 + 2] += data.vel[i * 3 + 2] * dt;

      // Clamp at floor with light bounce + damping.
      if (data.pos[i * 3 + 1] < 0.02) {
        data.pos[i * 3 + 1] = 0.02;
        data.vel[i * 3 + 1] *= -0.3;
        data.vel[i * 3 + 0] *= 0.6;
        data.vel[i * 3 + 2] *= 0.6;
      }

      data.rot[i * 3 + 0] += data.rotV[i * 3 + 0] * dt;
      data.rot[i * 3 + 1] += data.rotV[i * 3 + 1] * dt;
      data.rot[i * 3 + 2] += data.rotV[i * 3 + 2] * dt;

      dummy.position.set(
        data.pos[i * 3 + 0],
        data.pos[i * 3 + 1],
        data.pos[i * 3 + 2]
      );
      dummy.rotation.set(
        data.rot[i * 3 + 0],
        data.rot[i * 3 + 1],
        data.rot[i * 3 + 2]
      );
      const s = data.scale[i] * (p > 0.5 ? 1 : 0);
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    }
    inst.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, COUNT]} castShadow material={material}>
      <tetrahedronGeometry args={[1, 0]} />
    </instancedMesh>
  );
}
