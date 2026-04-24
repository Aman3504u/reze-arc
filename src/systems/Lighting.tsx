import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { useTimeline } from '../state/timelineStore'
import { ACTS } from './timeline'
import { lerp } from '../utils/easing'

// Per-act rest intensities — indexed by act number (0..4). Interpolating
// between ACTS[act] and ACTS[act+1] via subProgress (same pattern as palette
// colors, CameraRig, and Postprocessing) guarantees continuity across every
// act boundary instead of a single-frame jump when subProgress wraps 1→0.
//                            cafe  roof  rev   det   aft
const KEY_I:     readonly number[] = [1.1, 0.95, 0.7, 0.5, 0.9]
const RIM_I:     readonly number[] = [0.9, 1.25, 1.6, 1.8, 0.7]
const FILL_I:    readonly number[] = [0.4, 0.7, 1.0, 1.2, 0.3]
const AMBIENT_I: readonly number[] = [0.18, 0.14, 0.08, 0.05, 0.12]

/**
 * Three-point lighting rig whose intensities + colors follow the act palette.
 * Colors are swapped on the existing light instances — not recreated — to
 * avoid renderer state churn.
 */
export function Lighting() {
  const keyRef = useRef<THREE.DirectionalLight>(null)
  const rimRef = useRef<THREE.DirectionalLight>(null)
  const ambientRef = useRef<THREE.AmbientLight>(null)
  const fillRef = useRef<THREE.PointLight>(null)

  useFrame(() => {
    const { act, subProgress, progress } = useTimeline.getState()
    const a = ACTS[act]
    const b = ACTS[Math.min(ACTS.length - 1, act + 1)]
    const nextAct = Math.min(ACTS.length - 1, act + 1)
    const keyCol = new THREE.Color(a.palette.key).lerp(
      new THREE.Color(b.palette.key),
      subProgress,
    )
    const rimCol = new THREE.Color(a.palette.rim).lerp(
      new THREE.Color(b.palette.rim),
      subProgress,
    )
    const accCol = new THREE.Color(a.palette.accent).lerp(
      new THREE.Color(b.palette.accent),
      subProgress,
    )
    if (keyRef.current) keyRef.current.color.copy(keyCol)
    if (rimRef.current) rimRef.current.color.copy(rimCol)
    if (fillRef.current) fillRef.current.color.copy(accCol)

    // Flash intensity during ignition (Act IV, around t=0.6).
    const ignition = Math.max(0, 1 - Math.abs(progress - 0.6) / 0.04)
    const flash = ignition * 8
    if (keyRef.current)
      keyRef.current.intensity = lerp(KEY_I[act], KEY_I[nextAct], subProgress) + flash
    if (rimRef.current)
      rimRef.current.intensity =
        lerp(RIM_I[act], RIM_I[nextAct], subProgress) + flash * 0.5
    if (fillRef.current)
      fillRef.current.intensity =
        lerp(FILL_I[act], FILL_I[nextAct], subProgress) + flash * 1.4
    if (ambientRef.current)
      ambientRef.current.intensity = lerp(
        AMBIENT_I[act],
        AMBIENT_I[nextAct],
        subProgress,
      )
  })

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.18} />
      <directionalLight
        ref={keyRef}
        position={[4, 6, 5]}
        intensity={1.1}
        color="#ffcaa3"
        castShadow={false}
      />
      <directionalLight
        ref={rimRef}
        position={[-5, 3, -4]}
        intensity={0.9}
        color="#4a79a8"
      />
      <pointLight
        ref={fillRef}
        position={[0, 1.6, 1.2]}
        intensity={0.4}
        distance={8}
        decay={2}
        color="#e53250"
      />
    </>
  )
}
