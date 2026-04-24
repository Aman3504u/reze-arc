import { useEffect, useRef } from 'react'
import { useTimeline } from '../state/timelineStore'
import { damp } from '../utils/easing'

/**
 * Scroll → timeline engine.
 *
 * Reads the document scroll position, normalizes it against a configurable
 * virtual length, damps it so the camera feels cinematic instead of twitchy,
 * and writes it into the timeline store each rAF frame.
 *
 * We deliberately *do not* use IntersectionObserver or per-section triggers —
 * the whole film is one continuous 0..1 curve.
 */
export function useScrollTimeline(virtualScrollHeight = '850vh') {
  const rafRef = useRef(0)
  const lastRawRef = useRef(0)
  const lastTimeRef = useRef(performance.now())

  useEffect(() => {
    // Create the tall scroll driver. We own the DOM for it so the timeline
    // is completely decoupled from any page layout.
    const driver = document.createElement('div')
    driver.setAttribute('data-scroll-driver', '')
    driver.style.position = 'relative'
    driver.style.width = '100%'
    driver.style.height = virtualScrollHeight
    driver.style.pointerEvents = 'none'
    document.body.appendChild(driver)

    const readRaw = () => {
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight
      if (maxScroll <= 0) return 0
      return Math.min(1, Math.max(0, window.scrollY / maxScroll))
    }

    // Seed with whatever the browser restored.
    let smoothed = readRaw()
    lastRawRef.current = smoothed
    useTimeline.getState().set(smoothed, 0)

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTimeRef.current) / 1000)
      lastTimeRef.current = now

      const raw = readRaw()
      const velocity = (raw - lastRawRef.current) / Math.max(1e-4, dt)
      lastRawRef.current = raw

      // Damp toward the raw scroll position. λ controls how snappy.
      smoothed = damp(smoothed, raw, 6.5, dt)

      useTimeline.getState().set(smoothed, velocity)
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    const onVisibility = () => {
      // Prevent dt-spike after returning to tab.
      lastTimeRef.current = performance.now()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelAnimationFrame(rafRef.current)
      document.removeEventListener('visibilitychange', onVisibility)
      driver.remove()
    }
  }, [virtualScrollHeight])
}
