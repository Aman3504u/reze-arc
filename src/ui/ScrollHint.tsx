import { useEffect, useRef } from "react";
import { timelineBus } from "../hooks/useScrollTimeline";
import { useUIStore } from "../state/store";

// Prominent "scroll" indicator that fades out once the user begins scrolling.

export function ScrollHint() {
  const ref = useRef<HTMLDivElement>(null);
  const started = useUIStore((s) => s.started);

  useEffect(() => {
    return timelineBus.subscribe((p) => {
      if (ref.current) {
        const a = Math.max(0, 1 - p * 10);
        ref.current.style.opacity = String(a);
      }
    });
  }, []);

  if (!started) return null;
  return (
    <div className="scroll-hint" ref={ref} aria-hidden>
      <span>Scroll</span>
      <span className="scroll-hint__arrow" />
    </div>
  );
}
