import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { timelineBus } from "../../hooks/useScrollTimeline";
import { clamp, pulse, smoothstep } from "../../utils/math";

// =============================================================================
// Sparks
//
// GPU-friendly `Points` cloud — one draw call. Positions/velocities are
// simulated on the CPU in a tight loop (6000 particles ≈ sub-ms per frame on
// mid-range laptops). Each spark has a random seed & lifetime; scroll progress
// controls the *emission rate* and *gravity influence*.
//
// During Act III we smash them outward with a radial impulse to sell the
// detonation. During Act IV we let them drift and fade like ash.
// =============================================================================

const COUNT = 6000;

interface SparkState {
  px: Float32Array;
  py: Float32Array;
  pz: Float32Array;
  vx: Float32Array;
  vy: Float32Array;
  vz: Float32Array;
  life: Float32Array;
  seed: Float32Array;
}

function createState(): SparkState {
  const s: SparkState = {
    px: new Float32Array(COUNT),
    py: new Float32Array(COUNT),
    pz: new Float32Array(COUNT),
    vx: new Float32Array(COUNT),
    vy: new Float32Array(COUNT),
    vz: new Float32Array(COUNT),
    life: new Float32Array(COUNT),
    seed: new Float32Array(COUNT),
  };
  for (let i = 0; i < COUNT; i++) {
    s.life[i] = Math.random();
    s.seed[i] = Math.random();
    // Initial cloud — ambient embers around the scene.
    s.px[i] = (Math.random() - 0.5) * 6;
    s.py[i] = Math.random() * 3.0 + 0.2;
    s.pz[i] = (Math.random() - 0.5) * 6;
    s.vx[i] = (Math.random() - 0.5) * 0.05;
    s.vy[i] = Math.random() * 0.05;
    s.vz[i] = (Math.random() - 0.5) * 0.05;
  }
  return s;
}

export function Sparks() {
  const pointsRef = useRef<THREE.Points>(null);
  const state = useMemo(() => createState(), []);

  const { positions, colors, sizes } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const sizes = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3 + 0] = state.px[i];
      positions[i * 3 + 1] = state.py[i];
      positions[i * 3 + 2] = state.pz[i];
      colors[i * 3 + 0] = 1.0;
      colors[i * 3 + 1] = 0.6;
      colors[i * 3 + 2] = 0.25;
      sizes[i] = 0.02 + Math.random() * 0.06;
    }
    return { positions, colors, sizes };
  }, [state]);

  const material = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        attribute float aSize;
        varying vec3  vColor;
        varying float vSize;
        void main() {
          vColor = color;
          vSize = aSize;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = aSize * (300.0 / -mv.z);
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3  vColor;
        void main() {
          vec2 p = gl_PointCoord - 0.5;
          float d = length(p);
          float a = smoothstep(0.5, 0.0, d);
          // Hot core → warm tail falloff.
          vec3 col = vColor * (1.0 + 1.5 * (1.0 - d));
          gl_FragColor = vec4(col, a);
        }
      `,
      vertexColors: true,
    });
    return mat;
  }, []);

  // Shared temp vars to avoid GC churn.
  const tmp = useRef({ lastImpulse: -1 });

  useFrame((_, dt) => {
    const p = timelineBus.progress;
    const points = pointsRef.current;
    if (!points) return;

    const geom = points.geometry as THREE.BufferGeometry;
    const posAttr = geom.attributes.position as THREE.BufferAttribute;
    const colAttr = geom.attributes.color as THREE.BufferAttribute;
    const posArr = posAttr.array as Float32Array;
    const colArr = colAttr.array as Float32Array;

    // Emission and forces vary with act.
    const tension = smoothstep(0.18, 0.48, p);
    const shatter = pulse(p, 0.48, 0.6, 0.85);
    const aftermath = smoothstep(0.78, 1.0, p);

    // One-shot radial impulse when crossing 0.52.
    if (p > 0.52 && tmp.current.lastImpulse < 0.52) {
      for (let i = 0; i < COUNT; i++) {
        const r = Math.random();
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const speed = 3.0 + Math.random() * 4.0;
        state.vx[i] += Math.sin(phi) * Math.cos(theta) * speed * r;
        state.vy[i] += Math.cos(phi) * speed * r + 1.5;
        state.vz[i] += Math.sin(phi) * Math.sin(theta) * speed * r;
        state.life[i] = 1.0;
      }
    }
    tmp.current.lastImpulse = p;

    const gravity = -1.6 * (0.2 + shatter);
    const drag = 0.96 - 0.02 * shatter;

    const hotR = 1.0, hotG = 0.45, hotB = 0.2;
    const coolR = 0.6, coolG = 0.8, coolB = 1.0;
    const ashR = 0.35, ashG = 0.38, ashB = 0.45;

    for (let i = 0; i < COUNT; i++) {
      // Integrate.
      state.vx[i] = state.vx[i] * drag;
      state.vy[i] = state.vy[i] * drag + gravity * dt;
      state.vz[i] = state.vz[i] * drag;

      // Gentle ambient swirl during calm/tension (wind rising).
      const sw = 0.3 * tension;
      state.vx[i] += Math.sin(state.py[i] * 0.9 + state.seed[i] * 10) * sw * dt;
      state.vz[i] += Math.cos(state.py[i] * 0.7 + state.seed[i] * 10) * sw * dt;

      state.px[i] += state.vx[i] * dt;
      state.py[i] += state.vy[i] * dt;
      state.pz[i] += state.vz[i] * dt;

      state.life[i] -= dt * (0.12 + 0.5 * shatter);

      // Respawn when dead (or fallen through floor).
      if (state.life[i] <= 0 || state.py[i] < -0.2) {
        state.life[i] = 0.6 + Math.random() * 0.4;
        const spawnNear = shatter > 0.1;
        if (spawnNear) {
          // Spawn close to the core to feed the explosion tail.
          state.px[i] = (Math.random() - 0.5) * 0.4;
          state.py[i] = 0.7 + (Math.random() - 0.5) * 0.3;
          state.pz[i] = (Math.random() - 0.5) * 0.4;
          state.vx[i] = (Math.random() - 0.5) * 1.2;
          state.vy[i] = Math.random() * 1.6 + 0.2;
          state.vz[i] = (Math.random() - 0.5) * 1.2;
        } else {
          state.px[i] = (Math.random() - 0.5) * 6;
          state.py[i] = Math.random() * 3.0 + 0.1;
          state.pz[i] = (Math.random() - 0.5) * 6;
          state.vx[i] = (Math.random() - 0.5) * 0.05;
          state.vy[i] = Math.random() * 0.05;
          state.vz[i] = (Math.random() - 0.5) * 0.05;
        }
      }

      posArr[i * 3 + 0] = state.px[i];
      posArr[i * 3 + 1] = state.py[i];
      posArr[i * 3 + 2] = state.pz[i];

      // Color blending: cool embers → hot sparks → cool ash.
      const heat = clamp(shatter * 1.4 + tension * 0.15, 0, 1);
      const ash = aftermath;
      const r0 = coolR * (1 - heat) + hotR * heat;
      const g0 = coolG * (1 - heat) + hotG * heat;
      const b0 = coolB * (1 - heat) + hotB * heat;
      colArr[i * 3 + 0] = r0 * (1 - ash) + ashR * ash;
      colArr[i * 3 + 1] = g0 * (1 - ash) + ashG * ash;
      colArr[i * 3 + 2] = b0 * (1 - ash) + ashB * ash;
    }
    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} material={material} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
      </bufferGeometry>
    </points>
  );
}
