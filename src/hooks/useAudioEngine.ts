import { useEffect, useRef } from "react";
import { createAudioEngine, type AudioHandle } from "../audio/engine";
import { timelineBus } from "./useScrollTimeline";
import { useUIStore } from "../state/store";

/**
 * Hook that wires the procedural audio engine to the scroll timeline and the
 * global UI state (started, audioEnabled). Mount once near the root.
 */
export function useAudioEngine(): AudioHandle {
  const handleRef = useRef<AudioHandle | null>(null);
  if (!handleRef.current) handleRef.current = createAudioEngine();

  const started = useUIStore((s) => s.started);
  const audioEnabled = useUIStore((s) => s.audioEnabled);

  useEffect(() => {
    const h = handleRef.current!;
    if (started && !h.started) {
      void h.start();
    }
  }, [started]);

  useEffect(() => {
    handleRef.current!.setEnabled(audioEnabled);
  }, [audioEnabled]);

  useEffect(() => {
    const unsub = timelineBus.subscribe((progress) => {
      handleRef.current!.update(progress);
    });
    return () => {
      unsub();
      handleRef.current!.stop();
    };
  }, []);

  return handleRef.current;
}
