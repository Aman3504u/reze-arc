import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useActScene } from '../hooks/useActScene'
import { lerp, smoothstep } from '../utils/easing'
import { heatwaveVert, heatwaveFrag } from '../fx/shaders/heatwave'
import { RezePortrait } from './primitives/RezePortrait'

/**
 * Act III — The Reveal.
 *
 * Color drains, the world goes monochrome. A detonation glyph assembles
 * itself from shards. Subtle heatwave distortion ripples out from her chest.
 */
export default function ActReveal() {
  const { visibility, sub } = useActScene('reveal')
  const groupRef = useRef<THREE.Group>(null)
  const shardsRef = useRef<THREE.InstancedMesh>(null)
  const heatRef = useRef<THREE.ShaderMaterial>(null)

  const SHARD_COUNT = 60
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const shardTargets = useMemo(() => {
    // Final positions form a five-pointed glyph ring.
    const pts: { start: THREE.Vector3; end: THREE.Vector3; rot: number }[] = []
    for (let i = 0; i < SHARD_COUNT; i++) {
      const a = (i / SHARD_COUNT) * Math.PI * 2
      const end = new THREE.Vector3(
        Math.cos(a) * 1.1,
        1.6 + Math.sin(a * 5) * 0.12,
        Math.sin(a) * 1.1 - 0.2,
      )
      const start = new THREE.Vector3(
        Math.cos(a) * 4,
        1.6 + (Math.random() - 0.5) * 2,
        Math.sin(a) * 4 - 0.2,
      )
      pts.push({ start, end, rot: a })
    }
    return pts
  }, [])

  const heatUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: 0 },
      uColorA: { value: new THREE.Color('#ff2040') },
      uColorB: { value: new THREE.Color('#2a0608') },
    }),
    [],
  )

  useFrame((state, dt) => {
    if (!groupRef.current) return
    groupRef.current.visible = visibility > 0.001

    const s = smoothstep(sub)
    if (shardsRef.current) {
      for (let i = 0; i < SHARD_COUNT; i++) {
        const { start, end, rot } = shardTargets[i]
        dummy.position.lerpVectors(start, end, s)
        dummy.rotation.set(rot + state.clock.elapsedTime * 0.3, 0, rot * 2)
        const scl = lerp(0.04, 0.12, s)
        dummy.scale.set(scl, scl * 3, scl * 0.2)
        dummy.updateMatrix()
        shardsRef.current.setMatrixAt(i, dummy.matrix)
      }
      shardsRef.current.instanceMatrix.needsUpdate = true
    }

    if (heatRef.current) {
      heatUniforms.uTime.value += dt
      heatUniforms.uIntensity.value = visibility * lerp(0.2, 1.0, s)
    }
  })

  return (
    <group ref={groupRef}>
      {/* monochrome ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#0a0a0e" roughness={1} />
      </mesh>

      {/* Reze — reveal portrait. Bomb-plug exposed, red bleed + scanlines
          baked into the SVG to read as a "mask slipping" moment without
          needing a real video texture. */}
      <group position={[0, 0, -0.4]}>
        <RezePortrait
          variant="reveal"
          position={[0, 1.55, 0]}
          height={2.0}
          opacity={smoothstep(visibility)}
        />
      </group>

      {/* detonation glyph — shards ring around her */}
      <instancedMesh
        ref={shardsRef}
        args={[undefined, undefined, SHARD_COUNT]}
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color="#ff7a3c"
          emissive="#ff2040"
          emissiveIntensity={1.2}
          toneMapped={false}
        />
      </instancedMesh>

      {/* heatwave plane — full-screen-ish quad billboarded in front of the figure */}
      <mesh position={[0, 1.4, -0.1]}>
        <planeGeometry args={[3, 3, 48, 48]} />
        <shaderMaterial
          ref={heatRef}
          transparent
          depthWrite={false}
          uniforms={heatUniforms}
          vertexShader={heatwaveVert}
          fragmentShader={heatwaveFrag}
        />
      </mesh>
    </group>
  )
}
