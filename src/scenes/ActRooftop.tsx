import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useActScene } from '../hooks/useActScene'
import { SeededRandom } from '../utils/random'
import { lerp } from '../utils/easing'

/**
 * Act II — A Promise on the Rooftop.
 *
 * - Starfield (points) with slow parallax.
 * - Water tower silhouette in the distance.
 * - Floating petals: GPU-instanced quads with per-instance wind offset.
 * - Two silhouettes standing close. The red hair clip is now glowing a touch.
 */
export default function ActRooftop() {
  const { visibility, sub } = useActScene('rooftop')
  const groupRef = useRef<THREE.Group>(null)
  const petalsRef = useRef<THREE.InstancedMesh>(null)
  const starsRef = useRef<THREE.Points>(null)

  const PETAL_COUNT = 220
  const STAR_COUNT = 900
  const rand = useMemo(() => new SeededRandom(77), [])
  const dummy = useMemo(() => new THREE.Object3D(), [])

  // Petals init.
  useMemo(() => {
    if (!petalsRef.current) return
    for (let i = 0; i < PETAL_COUNT; i++) {
      dummy.position.set(
        rand.range(-6, 6),
        rand.range(0.5, 6),
        rand.range(-5, 2),
      )
      dummy.rotation.set(
        rand.range(0, Math.PI * 2),
        rand.range(0, Math.PI * 2),
        rand.range(0, Math.PI * 2),
      )
      dummy.scale.setScalar(rand.range(0.06, 0.12))
      dummy.updateMatrix()
      petalsRef.current.setMatrixAt(i, dummy.matrix)
    }
    petalsRef.current.instanceMatrix.needsUpdate = true
  }, [rand, dummy])

  // Star geometry.
  const starGeometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = new Float32Array(STAR_COUNT * 3)
    for (let i = 0; i < STAR_COUNT; i++) {
      const r = 40
      const theta = rand.range(0, Math.PI * 2)
      const phi = rand.range(0.1, Math.PI - 0.1)
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.cos(phi) + 4
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return g
  }, [rand])

  useFrame((state, dt) => {
    if (groupRef.current) {
      groupRef.current.visible = visibility > 0.001
      groupRef.current.position.y = lerp(-1.2, 0, visibility)
    }
    if (petalsRef.current) {
      const arr = petalsRef.current.instanceMatrix.array as Float32Array
      const t = state.clock.elapsedTime
      for (let i = 0; i < PETAL_COUNT; i++) {
        const base = i * 16
        arr[base + 13] -= dt * 0.18
        arr[base + 12] += Math.sin(t * 0.8 + i) * dt * 0.12
        if (arr[base + 13] < 0.2) arr[base + 13] = 6
      }
      petalsRef.current.instanceMatrix.needsUpdate = true
    }
    if (starsRef.current) {
      starsRef.current.rotation.y += dt * 0.012
      const mat = starsRef.current.material as THREE.PointsMaterial
      mat.opacity = 0.4 + 0.4 * visibility * (0.8 + 0.2 * Math.sin(sub * 6))
    }
  })

  return (
    <group ref={groupRef}>
      {/* rooftop deck */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#0d0f18" roughness={0.9} />
      </mesh>

      {/* parapet */}
      <mesh position={[0, 0.4, -4]}>
        <boxGeometry args={[14, 0.8, 0.3]} />
        <meshStandardMaterial color="#1a1c26" roughness={0.8} />
      </mesh>

      {/* water tower */}
      <group position={[-5, 2.2, -6]}>
        <mesh>
          <cylinderGeometry args={[1.2, 1.2, 2.4, 10]} />
          <meshStandardMaterial color="#0e0f16" roughness={0.85} />
        </mesh>
        <mesh position={[0, 1.4, 0]}>
          <coneGeometry args={[1.3, 0.7, 10]} />
          <meshStandardMaterial color="#0a0b12" roughness={0.9} />
        </mesh>
      </group>

      {/* stars */}
      <points ref={starsRef} geometry={starGeometry}>
        <pointsMaterial
          size={0.08}
          color="#d6e0ff"
          sizeAttenuation
          transparent
          opacity={0.6}
          depthWrite={false}
        />
      </points>

      {/* petals */}
      <instancedMesh
        ref={petalsRef}
        args={[undefined, undefined, PETAL_COUNT]}
        frustumCulled={false}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          color="#ff8fa3"
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
          toneMapped={false}
          depthWrite={false}
        />
      </instancedMesh>

      {/* two silhouettes — close together */}
      <group position={[-0.25, 0, -0.4]}>
        <mesh position={[0, 1.1, 0]}>
          <cylinderGeometry args={[0.26, 0.32, 1.0, 8]} />
          <meshStandardMaterial color="#0a0a0c" roughness={0.9} />
        </mesh>
        <mesh position={[0, 1.82, 0]}>
          <sphereGeometry args={[0.19, 16, 16]} />
          <meshStandardMaterial color="#0a0a0c" roughness={0.8} />
        </mesh>
      </group>
      <group position={[0.25, 0, -0.4]}>
        <mesh position={[0, 1.05, 0]}>
          <cylinderGeometry args={[0.24, 0.3, 0.9, 8]} />
          <meshStandardMaterial color="#120507" roughness={0.9} />
        </mesh>
        <mesh position={[0, 1.72, 0]}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial color="#120507" roughness={0.8} />
        </mesh>
        <mesh position={[0.08, 1.86, 0.15]}>
          <boxGeometry args={[0.08, 0.02, 0.06]} />
          <meshBasicMaterial color="#e53250" toneMapped={false} />
        </mesh>
      </group>

      {/* moon disc */}
      <mesh position={[4, 6, -10]}>
        <circleGeometry args={[1.4, 48]} />
        <meshBasicMaterial color="#f1e9cf" toneMapped={false} />
      </mesh>
    </group>
  )
}
