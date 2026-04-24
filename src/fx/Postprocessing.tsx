import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
  Noise,
  DepthOfField,
} from '@react-three/postprocessing'
import { BlendFunction, KernelSize } from 'postprocessing'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { Vector2 } from 'three'
import { useTimeline } from '../state/timelineStore'
import { lerp } from '../utils/easing'

/**
 * Postprocessing stack — one EffectComposer whose individual effect strengths
 * are modulated per-frame by the timeline.
 *
 * Trade-off notes:
 *   - We ship DoF only when needed (Acts II + III) via a ref toggle. At all
 *     times it's in the pipeline, but with focusDistance far and blur near 0
 *     so the cost is a cheap pass.
 *   - Bloom KernelSize.MEDIUM rather than LARGE — the difference is
 *     imperceptible on emissive sources like the detonation, but it's ~30%
 *     cheaper on mobile GPUs.
 */
export function Postprocessing() {
  const bloomRef = useRef<React.ComponentRef<typeof Bloom> | null>(null)
  const chromaRef = useRef<React.ComponentRef<typeof ChromaticAberration> | null>(null)
  const noiseRef = useRef<React.ComponentRef<typeof Noise> | null>(null)
  const vignetteRef = useRef<React.ComponentRef<typeof Vignette> | null>(null)
  const dofRef = useRef<React.ComponentRef<typeof DepthOfField> | null>(null)

  const chromaOffset = useRef(new Vector2(0.0008, 0.0008))

  useFrame(() => {
    const { progress, act, subProgress } = useTimeline.getState()

    // Bloom: rises through Act II, peaks during Act IV ignition, falls in V.
    const detonationPeak = Math.max(0, 1 - Math.abs(progress - 0.66) / 0.12)
    const baseBloom = [0.45, 0.75, 1.1, 2.6, 0.55][act]
    const nextBloom = [0.45, 0.75, 1.1, 2.6, 0.55][Math.min(4, act + 1)]
    const bloomIntensity =
      lerp(baseBloom, nextBloom, subProgress) + detonationPeak * 1.6
    if (bloomRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(bloomRef.current as any).intensity = bloomIntensity
    }

    // Chromatic aberration: subtle everywhere, violent during detonation.
    const chromaAmp = lerp(0.0006, 0.0016, subProgress) + detonationPeak * 0.006
    chromaOffset.current.set(chromaAmp, chromaAmp)
    if (chromaRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(chromaRef.current as any).offset = chromaOffset.current
    }

    // Film grain: intensifies in Act V for the "memory" feel.
    const grain = act === 4 ? lerp(0.15, 0.35, subProgress) : 0.08
    if (noiseRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(noiseRef.current as any).opacity = grain
    }

    // Vignette darkens during reveal/detonation, softens in aftermath.
    const vig = [0.25, 0.3, 0.55, 0.7, 0.35][act]
    if (vignetteRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(vignetteRef.current as any).darkness = vig
    }

    // DoF — focus on the couple in Act II/III; background far elsewhere.
    if (dofRef.current) {
      const focusDistance = act === 1 || act === 2 ? 0.015 : 0.08
      const bokehScale = act === 1 || act === 2 ? 3.5 : 0.5
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(dofRef.current as any).focusDistance = focusDistance
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(dofRef.current as any).bokehScale = bokehScale
    }
  })

  return (
    <EffectComposer multisampling={0}>
      <DepthOfField
        ref={dofRef}
        focusDistance={0.02}
        focalLength={0.04}
        bokehScale={2.0}
      />
      <Bloom
        ref={bloomRef}
        intensity={0.8}
        luminanceThreshold={0.55}
        luminanceSmoothing={0.2}
        mipmapBlur
        kernelSize={KernelSize.MEDIUM}
      />
      <ChromaticAberration
        ref={chromaRef}
        blendFunction={BlendFunction.NORMAL}
        offset={new Vector2(0.001, 0.001)}
        radialModulation
        modulationOffset={0.2}
      />
      <Noise ref={noiseRef} premultiply opacity={0.1} />
      <Vignette ref={vignetteRef} darkness={0.35} offset={0.25} />
    </EffectComposer>
  )
}
