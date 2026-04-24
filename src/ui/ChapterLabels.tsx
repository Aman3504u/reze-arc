import { useEffect, useRef } from "react";
import { timelineBus } from "../hooks/useScrollTimeline";
import { TIMELINE } from "../timeline/timeline";
import { pulse } from "../utils/math";

// Large cinematic chapter titles — cross-fade as the viewer scrolls through
// each band. Updates opacity via direct DOM writes (no re-renders).

export function ChapterLabels() {
  const refs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    return timelineBus.subscribe((p) => {
      TIMELINE.chapters.forEach((c, i) => {
        const center = (c.t0 + c.t1) / 2;
        const span = (c.t1 - c.t0) / 2;
        // Bell curve centered on chapter midpoint.
        const alpha = pulse(p, c.t0, center, c.t1);
        const node = refs.current[i];
        if (node) {
          node.style.opacity = String(alpha);
          node.style.transform = `translateY(${(1 - alpha) * 16}px)`;
          void span;
        }
      });
    });
  }, []);

  return (
    <div className="chapters">
      {TIMELINE.chapters.map((c, i) => (
        <div
          key={c.id}
          className="chapter"
          ref={(el) => {
            refs.current[i] = el;
          }}
        >
          <div className="chapter__eyebrow">{c.label}</div>
          <div className="chapter__title">{c.subtitle}</div>
        </div>
      ))}
    </div>
  );
}
