import Lenis from "lenis";
import { useEffect, useRef } from "react";

// =============================================================================
// useScrollTimeline
//
// A single ref-based subscription system that drives the whole experience.
// Lenis handles buttery smooth-scroll; we expose the normalized progress
// through a mutable ref so subscribers (meshes, shaders, audio) can read it
// in their frame loops without triggering React re-renders.
//
// Subscribers can also register callbacks fired on each update — useful for
// imperative effects (whip-pan snap, audio crossfade triggers) that aren't
// just a lerp.
// =============================================================================

type Subscriber = (progress: number, velocity: number) => void;

class TimelineBus {
  progress = 0;
  velocity = 0;
  private subs = new Set<Subscriber>();

  set(progress: number, velocity: number) {
    this.progress = progress;
    this.velocity = velocity;
    this.subs.forEach((s) => s(progress, velocity));
  }

  subscribe(fn: Subscriber) {
    this.subs.add(fn);
    // Fire once so latecomers sync.
    fn(this.progress, this.velocity);
    return () => {
      this.subs.delete(fn);
    };
  }
}

export const timelineBus = new TimelineBus();

/**
 * Call once at the app root. Initializes Lenis, reports scroll to the bus.
 */
export function useInitScrollTimeline() {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const lenis = new Lenis({
      // Cinematic drag — heavier than default, feels deliberate.
      lerp: 0.08,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.1,
      infinite: false,
    });
    lenisRef.current = lenis;

    let rafId = 0;
    let lastY = 0;
    let lastTime = performance.now();

    const raf = (time: number) => {
      lenis.raf(time);
      const scrollY = lenis.scroll;
      const limit = lenis.limit || 1;
      const progress = Math.min(1, Math.max(0, scrollY / limit));
      const dt = Math.max(1, time - lastTime);
      const velocity = (scrollY - lastY) / dt;
      lastY = scrollY;
      lastTime = time;
      timelineBus.set(progress, velocity);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return lenisRef;
}

/**
 * Subscribe to progress updates from React (rarely needed — prefer reading
 * timelineBus.progress directly in useFrame for per-frame work).
 */
export function useTimelineSubscriber(fn: Subscriber) {
  useEffect(() => timelineBus.subscribe(fn), [fn]);
}
