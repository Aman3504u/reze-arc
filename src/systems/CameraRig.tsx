import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { ACTS } from './timeline'
import { getTimeline } from '../state/timelineStore'
import { damp, smootherstep } from '../utils/easing'

/**
 * Camera rig — drives position, target, and FOV from the timeline.
 *
 * Between act home-positions we cubic-smoothstep so the dolly never pops.
 * Inside each act we add a small parallax / handheld offset keyed to the
 * mouse and the scroll velocity, so the shot never feels locked off.
 *
 * During Act IV (detonation) we inject handheld camera shake proportional
 * to the distance from the ignition beat. This is where the rig earns its
 * keep — we get "cinematic" behavior without hardcoding a per-shot keyframe
 * track.
 */
export function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const pointer = useThree((s) => s.pointer)

  // Pre-allocate vectors so we don't churn GC during useFrame.
  const posA = useRef(new THREE.Vector3())
  const posB = useRef(new THREE.Vector3())
  const tgtA = useRef(new THREE.Vector3())
  const tgtB = useRef(new THREE.Vector3())
  const curPos = useRef(new THREE.Vector3())
  const curTgt = useRef(new THREE.Vector3())
  const shake = useRef(new THREE.Vector3())

  const seeded = useMemo(() => {
    // Initial pose — Act I camera.
    const a = ACTS[0]
    camera.position.set(...a.camera.position)
    camera.fov = a.camera.fov
    camera.updateProjectionMatrix()
    curPos.current.copy(camera.position)
    curTgt.current.set(...a.camera.target)
    return true
  }, [camera])
  void seeded

  useFrame((_, dt) => {
    const { act, subProgress, progress, velocity } = getTimeline()
    const cur = ACTS[act]
    const nxt = ACTS[Math.min(ACTS.length - 1, act + 1)]

    // Interpolate pose between this act and the next using smootherstep on subProgress.
    const t = smootherstep(subProgress)
    posA.current.set(...cur.camera.position)
    posB.current.set(...nxt.camera.position)
    tgtA.current.set(...cur.camera.target)
    tgtB.current.set(...nxt.camera.target)
    const targetPos = posA.current.clone().lerp(posB.current, t)
    const targetLook = tgtA.current.clone().lerp(tgtB.current, t)
    const targetFov = THREE.MathUtils.lerp(cur.camera.fov, nxt.camera.fov, t)

    // Parallax — subtle mouse + scroll-velocity driven offset.
    const parallaxX = pointer.x * 0.18 + velocity * 0.04
    const parallaxY = pointer.y * 0.08
    targetPos.x += parallaxX
    targetPos.y += parallaxY

    // Handheld shake during detonation (Act IV). Peaks around t=0.64.
    const deton = Math.max(0, 1 - Math.abs(progress - 0.66) / 0.14)
    const shakeAmp = deton * deton * 0.14
    shake.current.set(
      (Math.random() - 0.5) * shakeAmp,
      (Math.random() - 0.5) * shakeAmp,
      (Math.random() - 0.5) * shakeAmp * 0.4,
    )
    targetPos.add(shake.current)

    // Damp current → target for buttery scrub.
    curPos.current.x = damp(curPos.current.x, targetPos.x, 5.5, dt)
    curPos.current.y = damp(curPos.current.y, targetPos.y, 5.5, dt)
    curPos.current.z = damp(curPos.current.z, targetPos.z, 5.5, dt)
    curTgt.current.x = damp(curTgt.current.x, targetLook.x, 4.0, dt)
    curTgt.current.y = damp(curTgt.current.y, targetLook.y, 4.0, dt)
    curTgt.current.z = damp(curTgt.current.z, targetLook.z, 4.0, dt)

    camera.position.copy(curPos.current)
    camera.lookAt(curTgt.current)

    if (Math.abs(camera.fov - targetFov) > 0.01) {
      camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 1 - Math.exp(-3 * dt))
      camera.updateProjectionMatrix()
    }
  })

  return null
}
