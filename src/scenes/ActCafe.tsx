import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useActScene } from '../hooks/useActScene'
import { SeededRandom } from '../utils/random'
import { lerp, smoothstep } from '../utils/easing'
import { RezePortrait } from './primitives/RezePortrait'

/**
 * Act I — The Café in the Rain.
 *
 * - Rain streaks drawn as a GPU-instanced line field on a cylindrical volume
 *   around the camera. Fake parallax via per-instance z offset.
 * - Two silhouettes seated at a counter — minimal geometry, backlit.
 * - A neon "珈琲" sign blooms through the window.
 *
 * Everything in this file is budget-friendly: ~2.5k triangles + 1 instanced
 * mesh of 1500 streaks. Runs 60fps on integrated GPUs.
 */
export default function ActCafe() {
  const { visibility, sub } = useActScene('cafe')
  const rainRef = useRef<THREE.InstancedMesh>(null)
  const groupRef = useRef<THREE.Group>(null)
  const signRef = useRef<THREE.MeshBasicMaterial>(null)

  const COUNT = 1400
  const rand = useMemo(() => new SeededRandom(41), [])
  const dummy = useMemo(() => new THREE.Object3D(), [])

  // Per-instance fall speed, seeded once so each streak keeps a consistent
  // velocity. Calling rand.range() inside useFrame (as earlier versions did)
  // advances the shared PRNG on every call, so each instance received a
  // different random speed every frame — visually this reads as a high-
  // frequency jitter. A separate PRNG keeps position seeding deterministic.
  const rainSpeeds = useMemo(() => {
    const prng = new SeededRandom(83)
    const speeds = new Float32Array(COUNT)
    for (let i = 0; i < COUNT; i++) speeds[i] = prng.range(3.8, 4.4)
    return speeds
  }, [])

  // Seed per-instance matrices once the InstancedMesh ref is attached.
  // Must be useEffect (post-commit) — useMemo runs during render, before refs.
  useEffect(() => {
    if (!rainRef.current) return
    for (let i = 0; i < COUNT; i++) {
      const r = rand.range(0.8, 7.5)
      const theta = rand.range(0, Math.PI * 2)
      dummy.position.set(
        Math.cos(theta) * r,
        rand.range(-1, 6),
        Math.sin(theta) * r - 1,
      )
      dummy.scale.set(0.005, rand.range(0.25, 0.55), 0.005)
      dummy.rotation.set(0, 0, 0)
      dummy.updateMatrix()
      rainRef.current.setMatrixAt(i, dummy.matrix)
    }
    rainRef.current.instanceMatrix.needsUpdate = true
  }, [rand, dummy])

  useFrame((_, dt) => {
    if (!rainRef.current) return
    // Animate rain fall by shifting each instance's Y each frame. We mutate
    // the InstancedMesh matrix buffer directly — no per-instance components.
    const arr = rainRef.current.instanceMatrix.array as Float32Array
    for (let i = 0; i < COUNT; i++) {
      const base = i * 16
      arr[base + 13] -= dt * rainSpeeds[i]
      if (arr[base + 13] < -1.2) arr[base + 13] = 6
    }
    rainRef.current.instanceMatrix.needsUpdate = true

    if (groupRef.current) {
      groupRef.current.visible = visibility > 0.001
      const s = lerp(0.96, 1.0, visibility)
      groupRef.current.scale.setScalar(s)
    }
    if (signRef.current) {
      signRef.current.opacity = visibility * (0.7 + 0.3 * Math.sin(sub * 12))
    }
  })

  return (
    <group ref={groupRef}>
      {/* rain streaks */}
      <instancedMesh
        ref={rainRef}
        args={[undefined, undefined, COUNT]}
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          color="#9db8d9"
          transparent
          opacity={0.35}
          toneMapped={false}
          depthWrite={false}
        />
      </instancedMesh>

      {/* café floor — reflective plane (fake reflection via dark metalness) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial
          color="#0e1014"
          metalness={0.85}
          roughness={0.25}
        />
      </mesh>

      {/* counter */}
      <mesh position={[0, 1.0, -0.4]}>
        <boxGeometry args={[3.2, 0.08, 1.1]} />
        <meshStandardMaterial color="#3a2a20" roughness={0.5} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.5, -0.4]}>
        <boxGeometry args={[3.2, 1.0, 1.0]} />
        <meshStandardMaterial color="#1b1511" roughness={0.8} />
      </mesh>

      {/* protagonist silhouette */}
      <group position={[-0.85, 0, 0.6]}>
        <mesh position={[0, 1.1, 0]} castShadow>
          <cylinderGeometry args={[0.26, 0.32, 1.0, 8]} />
          <meshStandardMaterial color="#0a0a0c" roughness={0.9} />
        </mesh>
        <mesh position={[0, 1.82, 0]} castShadow>
          <sphereGeometry args={[0.19, 16, 16]} />
          <meshStandardMaterial color="#0a0a0c" roughness={0.8} />
        </mesh>
      </group>

      {/* Reze — portrait billboard replaces the abstract silhouette so she
          reads as a character, not just a shape. Positioned where the head
          + shoulders of a seated figure would be at the counter. */}
      <group position={[0.85, 0, 0.58]} rotation={[0, -0.12, 0]}>
        <RezePortrait
          variant="cafe"
          position={[0, 1.45, 0]}
          height={1.75}
          opacity={smoothstep(visibility)}
        />
      </group>

      {/* neon sign 珈琲 in window (as a plane with emissive material) */}
      <mesh position={[0, 2.4, -3.2]}>
        <planeGeometry args={[1.2, 0.5]} />
        <meshBasicMaterial
          ref={signRef}
          color="#ff8fa3"
          toneMapped={false}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* window frame */}
      <mesh position={[0, 2.4, -3.22]}>
        <planeGeometry args={[2.8, 1.6]} />
        <meshStandardMaterial
          color="#05080c"
          roughness={1}
          emissive="#24324a"
          emissiveIntensity={0.15}
        />
      </mesh>

      {/* warm pendant lamp above counter */}
      <mesh position={[0, 2.1, -0.3]}>
        <coneGeometry args={[0.25, 0.3, 12]} />
        <meshBasicMaterial color="#ffcaa3" toneMapped={false} />
      </mesh>
    </group>
  )
}
