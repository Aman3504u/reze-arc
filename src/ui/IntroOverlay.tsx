import { useUIStore } from "../state/store";

// Full-screen intro gate. The browser requires a user gesture before audio
// can play, so we use it as both a cinematic opening and an audio unlock.

export function IntroOverlay() {
  const started = useUIStore((s) => s.started);
  const setStarted = useUIStore((s) => s.setStarted);
  const setAudioEnabled = useUIStore((s) => s.setAudioEnabled);

  return (
    <div className={`intro ${started ? "intro--gone" : ""}`} aria-hidden={started}>
      <div className="intro__wrap">
        <div className="intro__eyebrow">A Cinematic WebGL Experience</div>
        <h1 className="intro__title">
          <span>The</span>
          <em>Reze</em>
          <span>Arc</span>
        </h1>
        <p className="intro__subtitle">
          Four movements — stillness, undertow, detonation, ash.<br />
          Scroll to move through it.
        </p>
        <div className="intro__actions">
          <button
            className="intro__btn intro__btn--primary"
            onClick={() => {
              setAudioEnabled(true);
              setStarted(true);
            }}
          >
            Begin with sound
          </button>
          <button
            className="intro__btn"
            onClick={() => {
              setAudioEnabled(false);
              setStarted(true);
            }}
          >
            Begin silent
          </button>
        </div>
        <div className="intro__hint">Best with headphones · fullscreen</div>
      </div>
    </div>
  );
}
