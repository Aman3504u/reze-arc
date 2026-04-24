import { useUIStore } from "../state/store";

export function AudioToggle() {
  const enabled = useUIStore((s) => s.audioEnabled);
  const setAudioEnabled = useUIStore((s) => s.setAudioEnabled);
  const started = useUIStore((s) => s.started);
  if (!started) return null;
  return (
    <button
      className={`audio-toggle ${enabled ? "is-on" : ""}`}
      onClick={() => setAudioEnabled(!enabled)}
      aria-label={enabled ? "Mute audio" : "Enable audio"}
    >
      <span className="audio-toggle__bars" aria-hidden>
        <i /><i /><i /><i />
      </span>
      <span className="audio-toggle__label">{enabled ? "Sound on" : "Sound off"}</span>
    </button>
  );
}
