import { Suspense, lazy, useMemo } from 'react'
import { useTimeline } from '../state/timelineStore'
import { ACTS } from './timeline'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { lerp } from '../utils/easing'

// Each act is a separate lazy-loaded chunk. The orchestrator only mounts
// acts within the active window (+/- 1) so GPU work and memory stay bounded.
const ActCafe = lazy(() => import('../scenes/ActCafe'))
const ActRooftop = lazy(() => import('../scenes/ActRooftop'))
const ActReveal = lazy(() => import('../scenes/ActReveal'))
const ActDetonation = lazy(() => import('../scenes/ActDetonation'))
const ActAftermath = lazy(() => import('../scenes/ActAftermath'))

const COMPONENTS = [ActCafe, ActRooftop, ActReveal, ActDetonation, ActAftermath]

/**
 * Drives scene fog + background color based on the current act's palette.
 * This is a single THREE.Fog instance we mutate on the fly — allocating new
 * Fog every frame is avoidable GC pressure.
 */
function SceneAtmosphere() {
  const scene = useThree((s) => s.scene)
  const fog = useMemo(() => new THREE.Fog(0x000000, 2, 22), [])

  useMemo(() => {
    scene.fog = fog
  }, [scene, fog])

  useFrame(() => {
    const { act, subProgress } = useTimeline.getState()
    const a = ACTS[act]
    const b = ACTS[Math.min(ACTS.length - 1, act + 1)]
    const fogA = new THREE.Color(a.palette.fog)
    const fogB = new THREE.Color(b.palette.fog)
    fog.color.copy(fogA.lerp(fogB, subProgress))
    const skyA = new THREE.Color(a.palette.sky)
    const skyB = new THREE.Color(b.palette.sky)
    ;(scene.background as THREE.Color | null)?.copy(
      skyA.lerp(skyB, subProgress),
    )
    // Fog near/far tightens during detonation — claustrophobic.
    const tight = act === 3 ? lerp(1, 0.4, subProgress) : 1
    fog.near = 2 * tight
    fog.far = 22 * tight
  })

  useMemo(() => {
    scene.background = new THREE.Color(ACTS[0].palette.sky)
  }, [scene])

  return null
}

export function SceneOrchestrator() {
  const act = useTimeline((s) => s.act)

  // Mount the previous, current, and next acts so transitions cross-fade
  // without popping. Anything outside that window is unmounted and frees GPU memory.
  const mountedIndices = useMemo(() => {
    const set = new Set<number>()
    set.add(act)
    if (act > 0) set.add(act - 1)
    if (act < COMPONENTS.length - 1) set.add(act + 1)
    return [...set].sort()
  }, [act])

  return (
    <>
      <SceneAtmosphere />
      {mountedIndices.map((i) => {
        const Comp = COMPONENTS[i]
        return (
          <Suspense key={i} fallback={null}>
            <Comp />
          </Suspense>
        )
      })}
    </>
  )
}
