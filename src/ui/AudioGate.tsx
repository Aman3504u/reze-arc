import { AnimatePresence, motion } from 'framer-motion'
import { useAudio } from '../state/audioStore'

/**
 * Initial "click to enter" gate. Browsers block AudioContext construction
 * until a user gesture happens, so we use this gate to both satisfy that
 * constraint and to let us preload the first act while the user reads.
 */
export function AudioGate() {
  const unlocked = useAudio((s) => s.unlocked)
  const unlock = useAudio((s) => s.unlock)

  return (
    <AnimatePresence>
      {!unlocked && (
        <motion.div
          key="gate"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'radial-gradient(ellipse at center, #111217 0%, #05060a 100%)',
            zIndex: 30,
            display: 'grid',
            placeItems: 'center',
            textAlign: 'center',
            padding: '2rem',
          }}
        >
          <div>
            <p className="mono" style={{ color: 'var(--muted)', fontSize: 11, letterSpacing: '0.3em' }}>
              AN INTERACTIVE FILM
            </p>
            <h1
              className="mincho"
              style={{ fontSize: 'clamp(48px, 10vw, 120px)', margin: '0.4em 0 0', lineHeight: 0.95 }}
            >
              レゼ<span style={{ color: 'var(--accent)' }}>.</span>
            </h1>
            <p
              className="mincho"
              style={{
                marginTop: '0.4em',
                fontSize: 'clamp(14px, 1.4vw, 18px)',
                color: 'var(--muted)',
                maxWidth: '30ch',
                marginInline: 'auto',
              }}
            >
              A love story that ends the way all bombs do.
            </p>

            <button
              onClick={() => {
                unlock()
                // Force a small scroll nudge so the user understands the mechanism.
                window.scrollBy({ top: 1, behavior: 'instant' as ScrollBehavior })
              }}
              style={{
                marginTop: '3rem',
                border: '1px solid var(--ink)',
                color: 'var(--ink)',
                padding: '0.85rem 2rem',
                fontSize: 13,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                background: 'rgba(255,255,255,0.02)',
                backdropFilter: 'blur(6px)',
                transition: 'background 180ms ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(229,50,80,0.2)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
            >
              Begin · with sound
            </button>

            <p
              className="mono"
              style={{
                marginTop: '1.5rem',
                fontSize: 10,
                letterSpacing: '0.25em',
                color: 'var(--muted)',
              }}
            >
              SCROLL TO UNFOLD · EST. 4 MIN
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
