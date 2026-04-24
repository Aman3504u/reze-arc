import { useEffect, useRef } from 'react'
import { useAudio } from '../state/audioStore'
import { useTimeline } from '../state/timelineStore'
import { ACTS, type Act } from '../systems/timeline'
import { lerp } from '../utils/easing'

/**
 * Layered audio engine.
 *
 * We use the Web Audio API directly (no Howler dependency at runtime) so we
 * can do per-stem gain automation on every frame without UI re-renders.
 * Stems are fetched lazily the first time the user unlocks audio.
 *
 * Trade-off: we synthesize the stems procedurally in-browser rather than
 * shipping licensed music. This keeps the repo lean and legal, and gives
 * us precise control over emotional dynamics — each stem is a small
 * oscillator graph rather than a pre-rendered track.
 */

type Stem = keyof Act['audio']
const STEM_ORDER: Stem[] = ['ambient', 'strings', 'heart', 'noise', 'detonation']

type StemNode = {
  gain: GainNode
  stop?: () => void
}

function createAmbient(ctx: AudioContext, out: AudioNode): StemNode {
  // Low pad — two detuned sines + a LFO on filter cutoff.
  const gain = ctx.createGain()
  gain.gain.value = 0
  gain.connect(out)
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 420
  filter.Q.value = 0.7
  filter.connect(gain)
  const a = ctx.createOscillator()
  a.type = 'sine'
  a.frequency.value = 110
  const b = ctx.createOscillator()
  b.type = 'sine'
  b.frequency.value = 110 * 1.003
  const mix = ctx.createGain()
  mix.gain.value = 0.18
  a.connect(mix)
  b.connect(mix)
  mix.connect(filter)
  const lfo = ctx.createOscillator()
  lfo.frequency.value = 0.07
  const lfoGain = ctx.createGain()
  lfoGain.gain.value = 180
  lfo.connect(lfoGain)
  lfoGain.connect(filter.frequency)
  a.start()
  b.start()
  lfo.start()
  return {
    gain,
    stop: () => {
      a.stop()
      b.stop()
      lfo.stop()
    },
  }
}

function createStrings(ctx: AudioContext, out: AudioNode): StemNode {
  // Three-voice soft pad in a warm minor chord.
  const gain = ctx.createGain()
  gain.gain.value = 0
  gain.connect(out)
  const chord = [220, 261.63, 329.63] // A3, C4, E4
  const oscs: OscillatorNode[] = []
  chord.forEach((f) => {
    const o = ctx.createOscillator()
    o.type = 'sawtooth'
    o.frequency.value = f
    const oGain = ctx.createGain()
    oGain.gain.value = 0.08
    const filt = ctx.createBiquadFilter()
    filt.type = 'lowpass'
    filt.frequency.value = 1200
    filt.Q.value = 0.6
    o.connect(filt)
    filt.connect(oGain)
    oGain.connect(gain)
    o.start()
    oscs.push(o)
  })
  return {
    gain,
    stop: () => oscs.forEach((o) => o.stop()),
  }
}

function createHeart(ctx: AudioContext, out: AudioNode): StemNode {
  // Sub pulse — short 60Hz thump every ~0.8s, modulated by amplitude gain.
  const gain = ctx.createGain()
  gain.gain.value = 0
  gain.connect(out)
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.value = 60
  const env = ctx.createGain()
  env.gain.value = 0
  osc.connect(env)
  env.connect(gain)
  osc.start()
  let alive = true
  const beat = () => {
    if (!alive) return
    const t = ctx.currentTime
    env.gain.cancelScheduledValues(t)
    env.gain.setValueAtTime(0, t)
    env.gain.linearRampToValueAtTime(1, t + 0.02)
    env.gain.linearRampToValueAtTime(0, t + 0.28)
    setTimeout(beat, 760)
  }
  beat()
  return {
    gain,
    stop: () => {
      alive = false
      osc.stop()
    },
  }
}

function createNoise(ctx: AudioContext, out: AudioNode): StemNode {
  // Filtered pink-ish noise for tension + rain hiss.
  const gain = ctx.createGain()
  gain.gain.value = 0
  gain.connect(out)
  const bufferSize = 2 * ctx.sampleRate
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  let lastOut = 0
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1
    lastOut = (lastOut + 0.02 * white) / 1.02
    data[i] = lastOut * 3.5
  }
  const src = ctx.createBufferSource()
  src.buffer = buffer
  src.loop = true
  const filt = ctx.createBiquadFilter()
  filt.type = 'bandpass'
  filt.frequency.value = 1800
  filt.Q.value = 0.5
  src.connect(filt)
  filt.connect(gain)
  src.start()
  return {
    gain,
    stop: () => src.stop(),
  }
}

function createDetonation(ctx: AudioContext, out: AudioNode): StemNode {
  // Low rumble + bandpassed noise shock. Gated by gain so it only roars in Act IV.
  const gain = ctx.createGain()
  gain.gain.value = 0
  gain.connect(out)
  const sub = ctx.createOscillator()
  sub.type = 'sine'
  sub.frequency.value = 42
  const subGain = ctx.createGain()
  subGain.gain.value = 0.6
  sub.connect(subGain)
  subGain.connect(gain)
  sub.start()
  // Wide noise rumble
  const bufferSize = 2 * ctx.sampleRate
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.8
  const src = ctx.createBufferSource()
  src.buffer = buffer
  src.loop = true
  const filt = ctx.createBiquadFilter()
  filt.type = 'lowpass'
  filt.frequency.value = 280
  src.connect(filt)
  filt.connect(gain)
  src.start()
  return {
    gain,
    stop: () => {
      sub.stop()
      src.stop()
    },
  }
}

const BUILDERS: Record<Stem, (ctx: AudioContext, out: AudioNode) => StemNode> = {
  ambient: createAmbient,
  strings: createStrings,
  heart: createHeart,
  noise: createNoise,
  detonation: createDetonation,
}

export function useAudioEngine() {
  const unlocked = useAudio((s) => s.unlocked)
  const muted = useAudio((s) => s.muted)
  const ctxRef = useRef<AudioContext | null>(null)
  const masterRef = useRef<GainNode | null>(null)
  const stemsRef = useRef<Record<Stem, StemNode> | null>(null)

  // Build the audio graph exactly once, the first time the user unlocks audio.
  useEffect(() => {
    if (!unlocked || ctxRef.current) return
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    const ctx = new Ctx()
    const master = ctx.createGain()
    master.gain.value = 0.7
    master.connect(ctx.destination)
    const stems = {} as Record<Stem, StemNode>
    STEM_ORDER.forEach((s) => {
      stems[s] = BUILDERS[s](ctx, master)
    })
    ctxRef.current = ctx
    masterRef.current = master
    stemsRef.current = stems
    return () => {
      Object.values(stems).forEach((s) => s.stop?.())
      ctx.close()
    }
  }, [unlocked])

  // Mute is a one-line master-gain tween, not per-stem.
  useEffect(() => {
    const master = masterRef.current
    const ctx = ctxRef.current
    if (!master || !ctx) return
    const t = ctx.currentTime
    master.gain.cancelScheduledValues(t)
    master.gain.linearRampToValueAtTime(muted ? 0 : 0.7, t + 0.15)
  }, [muted])

  // Subscribe to timeline updates and crossfade stem gains to the active act's mix.
  useEffect(() => {
    if (!unlocked) return
    let raf = 0
    const loop = () => {
      const ctx = ctxRef.current
      const stems = stemsRef.current
      if (ctx && stems) {
        const { act, subProgress } = useTimeline.getState()
        const cur = ACTS[act]
        const nxt = ACTS[Math.min(ACTS.length - 1, act + 1)]
        const t = ctx.currentTime
        STEM_ORDER.forEach((key) => {
          const target = lerp(cur.audio[key], nxt.audio[key], subProgress)
          const g = stems[key].gain.gain
          // 120ms constant — smooth but responsive.
          g.cancelScheduledValues(t)
          g.setTargetAtTime(target, t, 0.12)
        })
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [unlocked])
}
