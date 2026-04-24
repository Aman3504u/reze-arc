import { useEffect, useRef, useState } from "react";
import { timelineBus } from "../hooks/useScrollTimeline";
import { TIMELINE } from "../timeline/timeline";

// A slender vertical rail that mirrors scroll progress and labels the four
// chapters. Updates via raw DOM writes to avoid React re-renders.

export function ProgressRail() {
  const fill = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    return timelineBus.subscribe((p) => {
      if (fill.current) fill.current.style.transform = `scaleY(${p})`;
      const idx = TIMELINE.chapters.findIndex((c) => p >= c.t0 && p <= c.t1);
      setActiveIdx(idx === -1 ? 0 : idx);
    });
  }, []);

  return (
    <div className="rail" aria-hidden>
      <div className="rail__track">
        <div className="rail__fill" ref={fill} />
      </div>
      <ul className="rail__chapters">
        {TIMELINE.chapters.map((c, i) => (
          <li
            key={c.id}
            className={`rail__chapter ${i === activeIdx ? "is-active" : ""}`}
            style={{ top: `${c.t0 * 100}%` }}
          >
            <span className="rail__dot" />
            <span className="rail__label">{c.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
