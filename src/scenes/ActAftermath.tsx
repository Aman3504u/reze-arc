import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useActScene } from '../hooks/useActScene'
import { lerp } from '../utils/easing'

/**
 * Act V — Aftermath.
 *
 * A train station bench. A paper bag. One last ember drifts up. Silence.
 * Deliberately low-polygon and quiet — we want the eye to rest here. The
 * only moving things are an ember's y-position and the bag's paper flutter.
 */
export default function ActAftermath() {
  const { visibility, sub } = useActScene('aftermath')
  const groupRef = useRef<THREE.Group>(null)
  const emberRef = useRef<THREE.Mesh>(null)
  const bagRef = useRef<THREE.Mesh>(null)

  const textCanvas = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 256
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = 'rgba(0,0,0,0)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#f0ead8'
    ctx.font = '600 180px "Shippori Mincho", serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('またね', canvas.width / 2, canvas.height / 2)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.needsUpdate = true
    return tex
  }, [])

  // Second canvas — the sign-off line "— デンジ。". Rendered into its own
  // texture so it can fade in independently of the main title.
  const quoteCanvas = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 128
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#bfb8a4'
    ctx.font = '400 52px "Shippori Mincho", serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('— デンジ。', canvas.width / 2, canvas.height / 2)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.needsUpdate = true
    return tex
  }, [])

  useFrame((state) => {
    if (!groupRef.current) return
    groupRef.current.visible = visibility > 0.001
    if (emberRef.current) {
      const t = state.clock.elapsedTime
      emberRef.current.position.y = 1.2 + sub * 3.2 + Math.sin(t * 1.4) * 0.04
      emberRef.current.position.x = 0.4 + Math.sin(t * 0.7) * 0.2
      const mat = emberRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = Math.max(0, 1 - sub * 0.9) * visibility
    }
    if (bagRef.current) {
      bagRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.3) * 0.04
    }
  })

  return (
    <group ref={groupRef}>
      {/* platform */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#13141a" roughness={0.95} />
      </mesh>

      {/* bench */}
      <group position={[0, 0.4, -0.2]}>
        <mesh>
          <boxGeometry args={[2.0, 0.08, 0.5]} />
          <meshStandardMaterial color="#2a221e" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.45, -0.18]}>
          <boxGeometry args={[2.0, 0.9, 0.06]} />
          <meshStandardMaterial color="#2a221e" roughness={0.9} />
        </mesh>
        <mesh position={[-0.9, -0.2, 0]}>
          <boxGeometry args={[0.06, 0.4, 0.4]} />
          <meshStandardMaterial color="#16110e" roughness={0.9} />
        </mesh>
        <mesh position={[0.9, -0.2, 0]}>
          <boxGeometry args={[0.06, 0.4, 0.4]} />
          <meshStandardMaterial color="#16110e" roughness={0.9} />
        </mesh>
      </group>

      {/* paper bag on the bench */}
      <mesh ref={bagRef} position={[0.2, 0.55, -0.15]}>
        <boxGeometry args={[0.22, 0.28, 0.2]} />
        <meshStandardMaterial color="#c7b48a" roughness={0.85} />
      </mesh>

      {/* far wall with faint "station" light */}
      <mesh position={[0, 2, -6]}>
        <planeGeometry args={[20, 6]} />
        <meshStandardMaterial
          color="#0b0c12"
          emissive="#2f2a24"
          emissiveIntensity={0.25}
          roughness={1}
        />
      </mesh>

      {/* drifting ember */}
      <mesh ref={emberRef} position={[0.4, 1.2, 0]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshBasicMaterial color="#ffb48a" toneMapped={false} transparent />
      </mesh>

      {/* end-title — fades in across the act */}
      <mesh position={[0, 2.3, -2.2]} scale={[3.5, 0.9, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={textCanvas}
          transparent
          toneMapped={false}
          opacity={lerp(0, 1, Math.min(1, sub * 1.6)) * visibility}
        />
      </mesh>

      {/* sign-off — "— デンジ。". Fades in after the title is fully settled
          so the eye lands on it as the second beat. */}
      <mesh position={[0, 1.8, -2.2]} scale={[2.4, 0.3, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={quoteCanvas}
          transparent
          toneMapped={false}
          opacity={lerp(0, 1, Math.max(0, sub - 0.55) * 2.2) * visibility}
        />
      </mesh>
    </group>
  )
}
