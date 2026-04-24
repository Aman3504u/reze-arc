import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect } from 'react'
import { AdaptiveDpr, AdaptiveEvents, PerformanceMonitor } from '@react-three/drei'
import { CameraRig } from './systems/CameraRig'
import { SceneOrchestrator } from './systems/SceneOrchestrator'
import { Lighting } from './systems/Lighting'
import { Postprocessing } from './fx/Postprocessing'
import { useScrollTimeline } from './hooks/useScrollTimeline'
import { useAudioEngine } from './hooks/useAudioEngine'
import { AudioGate } from './ui/AudioGate'
import { Overlay } from './ui/Overlay'
import { ACTS } from './systems/timeline'
import { useTimeline } from './state/timelineStore'

/**
 * Root component.
 *
 * We wire three timelines in total:
 *  1. useScrollTimeline — DOM scroll → normalized [0,1] store progress.
 *  2. useAudioEngine — progress → layered stem gains.
 *  3. SceneOrchestrator — progress → lazy-mounted acts + shared atmosphere.
 *
 * The Canvas below is flat-lit; all light comes from <Lighting/>. We use
 * drei's PerformanceMonitor to auto-throttle pixelRatio on weak GPUs via
 * AdaptiveDpr — this is the single biggest win on mid-range laptops.
 */
export default function App() {
  useScrollTimeline('850vh')
  useAudioEngine()

  // Apply the initial act camera FOV on mount so the first paint isn't blank.
  useEffect(() => {
    useTimeline.getState().set(0, 0)
  }, [])

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
        }}
      >
        <Canvas
          camera={{
            position: ACTS[0].camera.position,
            fov: ACTS[0].camera.fov,
            near: 0.1,
            far: 80,
          }}
          gl={{
            antialias: false,
            powerPreference: 'high-performance',
            stencil: false,
            depth: true,
          }}
          dpr={[1, 1.75]}
          shadows={false}
        >
          <PerformanceMonitor
            onIncline={() => {}}
            onDecline={() => {}}
            flipflops={3}
          />
          <AdaptiveDpr pixelated />
          <AdaptiveEvents />

          <Lighting />

          <Suspense fallback={null}>
            <SceneOrchestrator />
          </Suspense>

          <CameraRig />
          <Postprocessing />
        </Canvas>
      </div>

      <Overlay />
      <AudioGate />
    </>
  )
}
