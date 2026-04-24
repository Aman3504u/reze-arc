import { useTimeline } from '../state/timelineStore'
import { ACTS, type Act } from '../systems/timeline'

/**
 * Helper for individual scene components.
 *
 * Returns the act's local progress and a "visibility" value that smoothly
 * ramps 0 → 1 → 0 over the act window plus a small cross-fade band. Scene
 * components use this to fade in/out their expensive work at the edges so
 * nothing gets drawn outside its relevant window.
 */
export function useActScene(actId: Act['id'], fade = 0.04) {
  const progress = useTimeline((s) => s.progress)
  const act = ACTS.find((a) => a.id === actId)!
  const idx = ACTS.indexOf(act)

  const { start, end } = act
  const isFirst = idx === 0
  const isLast = idx === ACTS.length - 1

  // Visibility ramps 0 → 1 over the first `fade` of the act, stays at 1, then
  // (for middle acts) fades back to 0 over the last `fade`. The first act
  // skips fade-in so we never show a blank frame on load, and the last act
  // skips fade-out so the aftermath holds through the end of the scroll.
  let visibility = 0
  if (progress >= start && progress <= end) {
    const fadeIn = isFirst ? 1 : Math.min(1, (progress - start) / fade)
    const fadeOut = isLast ? 1 : Math.min(1, (end - progress) / fade)
    visibility = Math.min(fadeIn, fadeOut)
  }

  const sub =
    progress < start ? 0 : progress > end ? 1 : (progress - start) / (end - start)

  return { act, idx, visibility, sub, progress }
}
