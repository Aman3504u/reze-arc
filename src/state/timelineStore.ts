import { create } from 'zustand'

/**
 * Timeline store — the single source of truth for where we are in the film.
 *
 * `progress` is a normalized [0,1] scroll progress updated by useScrollTimeline.
 * `act` is the derived act index (0..4) — Act I through Act V.
 * `subProgress` is the 0..1 progress *within* the current act.
 *
 * Everything visual in the scene graph reads from here rather than from the
 * DOM scroll position directly, so the timeline can also be driven by a
 * preview mode, GSAP scrub, or a "play" button without coupling to layout.
 */
export type TimelineState = {
  progress: number
  act: number
  subProgress: number
  playing: boolean
  /** Raw scroll velocity in progress/second, used for motion blur + inertia. */
  velocity: number
  /** Setter used exclusively by useScrollTimeline on rAF. */
  set: (progress: number, velocity: number) => void
  setPlaying: (p: boolean) => void
}

import { ACTS } from '../systems/timeline'

const actFromProgress = (p: number) => {
  for (let i = 0; i < ACTS.length; i++) {
    const act = ACTS[i]
    if (p >= act.start && p < act.end) {
      return {
        act: i,
        subProgress: (p - act.start) / Math.max(1e-6, act.end - act.start),
      }
    }
  }
  return { act: ACTS.length - 1, subProgress: 1 }
}

export const useTimeline = create<TimelineState>((set) => ({
  progress: 0,
  act: 0,
  subProgress: 0,
  velocity: 0,
  playing: false,
  set: (progress, velocity) => {
    const { act, subProgress } = actFromProgress(progress)
    set({ progress, velocity, act, subProgress })
  },
  setPlaying: (playing) => set({ playing }),
}))

/** Non-reactive getter — call this inside useFrame to avoid re-renders. */
export const getTimeline = () => useTimeline.getState()
