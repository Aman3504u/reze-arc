import { useEffect } from "react";
import { Stage } from "./scene/Stage";
import { IntroOverlay } from "./ui/IntroOverlay";
import { ProgressRail } from "./ui/ProgressRail";
import { ChapterLabels } from "./ui/ChapterLabels";
import { AudioToggle } from "./ui/AudioToggle";
import { ScrollHint } from "./ui/ScrollHint";
import { useInitScrollTimeline } from "./hooks/useScrollTimeline";
import { useAudioEngine } from "./hooks/useAudioEngine";
import { TOTAL_SCROLL_VH } from "./timeline/timeline";

export default function App() {
  useInitScrollTimeline();
  useAudioEngine();

  // Lock body scroll metrics so Lenis knows how much travel is available.
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--total-scroll-vh",
      `${TOTAL_SCROLL_VH}vh`
    );
  }, []);

  return (
    <>
      {/* WebGL canvas — fixed, full-viewport */}
      <div className="canvas-shell">
        <Stage />
      </div>

      {/* Foreground UI (pointer-events selectively enabled) */}
      <ProgressRail />
      <ChapterLabels />
      <AudioToggle />
      <ScrollHint />
      <IntroOverlay />

      {/* Long scroll spacer — this is what Lenis measures */}
      <div className="scroll-spacer" aria-hidden />
      <footer className="credits" aria-hidden>
        <span>Reze Arc · A study in scrolled cinema.</span>
      </footer>
    </>
  );
}
