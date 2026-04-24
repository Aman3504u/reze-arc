import { AnimatePresence, motion } from 'framer-motion'
import { useAudio } from '../state/audioStore'
import { useTimeline } from '../state/timelineStore'
import { ACTS } from '../systems/timeline'

/**
 * HUD overlay: act caption, timeline scrubber, mute toggle.
 * All non-essential chrome — rendered behind pointer-events: none except for
 * the interactive controls.
 */
export function Overlay() {
  const act = useTimeline((s) => s.act)
  const progress = useTimeline((s) => s.progress)
  const muted = useAudio((s) => s.muted)
  const toggleMute = useAudio((s) => s.toggleMute)
  const unlocked = useAudio((s) => s.unlocked)

  if (!unlocked) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 20,
        color: 'var(--ink)',
      }}
    >
      {/* act caption, top-left */}
      <div style={{ position: 'absolute', top: 24, left: 28 }}>
        <p className="mono" style={{ fontSize: 10, letterSpacing: '0.32em', color: 'var(--muted)' }}>
          {ACTS[act].label.toUpperCase()} · {String(Math.round(progress * 100)).padStart(2, '0')}
        </p>
        <AnimatePresence mode="wait">
          <motion.div
            key={act}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          >
            <p className="mincho" style={{ fontSize: 28, lineHeight: 1.05, marginTop: 8 }}>
              {ACTS[act].titleJP}
            </p>
            <p
              className="mincho"
              style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4, letterSpacing: '0.04em' }}
            >
              {ACTS[act].titleEN}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* timeline scrubber, bottom */}
      <div
        style={{
          position: 'absolute',
          left: 28,
          right: 28,
          bottom: 28,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <span className="mono" style={{ fontSize: 10, color: 'var(--muted)' }}>
          00:00
        </span>
        <div
          style={{
            flex: 1,
            height: 1,
            background: 'rgba(255,255,255,0.15)',
            position: 'relative',
          }}
        >
          {ACTS.map((a, i) => (
            <span
              key={a.id}
              style={{
                position: 'absolute',
                left: `${a.start * 100}%`,
                top: -3,
                width: 1,
                height: 7,
                background: i <= act ? 'var(--accent)' : 'rgba(255,255,255,0.25)',
              }}
            />
          ))}
          <motion.span
            animate={{ width: `${progress * 100}%` }}
            transition={{ type: 'tween', ease: 'linear', duration: 0.06 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: 1,
              background: 'var(--ink)',
            }}
          />
        </div>
        <span className="mono" style={{ fontSize: 10, color: 'var(--muted)' }}>
          04:00
        </span>
      </div>

      {/* mute control, top-right */}
      <button
        onClick={toggleMute}
        style={{
          position: 'absolute',
          top: 24,
          right: 28,
          pointerEvents: 'auto',
          border: '1px solid rgba(255,255,255,0.25)',
          borderRadius: 999,
          padding: '6px 14px',
          fontSize: 10,
          letterSpacing: '0.25em',
          color: muted ? 'var(--muted)' : 'var(--ink)',
        }}
        className="mono"
        aria-pressed={muted}
        aria-label={muted ? 'Unmute audio' : 'Mute audio'}
      >
        {muted ? 'SILENT' : 'SOUND ON'}
      </button>

      {/* scroll hint — only in first 4% of experience */}
      <AnimatePresence>
        {progress < 0.04 && (
          <motion.div
            key="hint"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{
              position: 'absolute',
              bottom: 72,
              left: '50%',
              transform: 'translateX(-50%)',
              textAlign: 'center',
            }}
          >
            <p className="mono" style={{ fontSize: 10, letterSpacing: '0.3em', color: 'var(--muted)' }}>
              SCROLL
            </p>
            <motion.span
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                display: 'block',
                width: 1,
                height: 24,
                marginTop: 8,
                marginInline: 'auto',
                background: 'linear-gradient(to bottom, transparent, var(--muted))',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
