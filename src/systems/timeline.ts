/**
 * The film's timeline — five acts mapped onto a normalized [0,1] scroll.
 *
 * We intentionally use a TIMELINE instead of hard "sections" so that any
 * consumer can ask "what should I look like at t=0.63?" without the page
 * layout dictating the scene graph. That decoupling is the core trick that
 * lets the experience feel like a film instead of a stack of cards.
 */

export type Act = {
  id: 'cafe' | 'rooftop' | 'reveal' | 'detonation' | 'aftermath'
  label: string
  /** Japanese title — used for captions. */
  titleJP: string
  /** English subtitle. */
  titleEN: string
  start: number
  end: number
  /** Camera "home" position for this act — the rig dollies between these. */
  camera: {
    position: [number, number, number]
    target: [number, number, number]
    fov: number
  }
  /** Hex color palette used by the scene + lights. */
  palette: {
    sky: string
    fog: string
    key: string
    rim: string
    accent: string
  }
  /** Audio layer volumes for this act — 0..1 for each stem. */
  audio: {
    ambient: number
    strings: number
    heart: number
    noise: number
    detonation: number
  }
}

export const ACTS: readonly Act[] = [
  {
    id: 'cafe',
    label: 'Act I',
    titleJP: '雨のカフェ',
    titleEN: 'The Café in the Rain',
    start: 0.0,
    end: 0.18,
    camera: {
      position: [0, 1.55, 4.2],
      target: [0, 1.35, 0],
      fov: 38,
    },
    palette: {
      sky: '#0b0d12',
      fog: '#171a22',
      key: '#ffcaa3',
      rim: '#4a79a8',
      accent: '#e53250',
    },
    audio: {
      ambient: 0.85,
      strings: 0.15,
      heart: 0.0,
      noise: 0.0,
      detonation: 0.0,
    },
  },
  {
    id: 'rooftop',
    label: 'Act II',
    titleJP: '屋上の約束',
    titleEN: 'A Promise on the Rooftop',
    start: 0.18,
    end: 0.42,
    camera: {
      position: [2.4, 2.4, 3.6],
      target: [0, 1.7, 0],
      fov: 32,
    },
    palette: {
      sky: '#12121f',
      fog: '#1e2036',
      key: '#ffe2b8',
      rim: '#7a8fd9',
      accent: '#ff8fa3',
    },
    audio: {
      ambient: 0.35,
      strings: 0.75,
      heart: 0.4,
      noise: 0.0,
      detonation: 0.0,
    },
  },
  {
    id: 'reveal',
    label: 'Act III',
    titleJP: '正体',
    titleEN: 'The Reveal',
    start: 0.42,
    end: 0.58,
    camera: {
      position: [1.6, 1.9, 3.0],
      target: [0, 1.6, 0],
      fov: 28,
    },
    palette: {
      sky: '#0a0a0e',
      fog: '#12131a',
      key: '#c9cbd1',
      rim: '#3b3d48',
      accent: '#ff2040',
    },
    audio: {
      ambient: 0.1,
      strings: 0.3,
      heart: 0.9,
      noise: 0.4,
      detonation: 0.0,
    },
  },
  {
    id: 'detonation',
    label: 'Act IV',
    titleJP: '爆発',
    titleEN: 'Detonation',
    start: 0.58,
    end: 0.82,
    camera: {
      position: [0.2, 1.7, 2.2],
      target: [0, 1.6, 0],
      fov: 52,
    },
    palette: {
      sky: '#1a0306',
      fog: '#2a0609',
      key: '#ffe5c0',
      rim: '#ff5a3c',
      accent: '#ff2b1f',
    },
    audio: {
      ambient: 0.0,
      strings: 0.0,
      heart: 0.0,
      noise: 0.2,
      detonation: 1.0,
    },
  },
  {
    id: 'aftermath',
    label: 'Act V',
    titleJP: 'またね',
    titleEN: 'See You Again',
    start: 0.82,
    end: 1.0,
    camera: {
      position: [0, 1.55, 5.0],
      target: [0, 1.35, 0],
      fov: 36,
    },
    palette: {
      sky: '#0b0c10',
      fog: '#15161c',
      key: '#e9e4da',
      rim: '#5d6170',
      accent: '#a1908a',
    },
    audio: {
      ambient: 0.55,
      strings: 0.0,
      heart: 0.0,
      noise: 0.08,
      detonation: 0.0,
    },
  },
] as const

export type ActId = Act['id']

/** Cinematic "beats" inside acts — single-frame events we fire once per crossing. */
export type Beat = {
  id: string
  at: number
  label: string
}

export const BEATS: readonly Beat[] = [
  { id: 'door-open', at: 0.04, label: 'Door opens, rain pulses in.' },
  { id: 'eyes-meet', at: 0.12, label: 'Eyes meet across the counter.' },
  { id: 'hand-taken', at: 0.26, label: 'A hand is taken. Rooftop rises.' },
  { id: 'promise', at: 0.34, label: 'A promise in the stars.' },
  { id: 'glitch-bleed', at: 0.47, label: 'Reality bleeds at the edges.' },
  { id: 'cold-cut', at: 0.54, label: 'Music cuts. Silence.' },
  { id: 'ignition', at: 0.6, label: 'Ignition.' },
  { id: 'shockwave', at: 0.64, label: 'Shockwave.' },
  { id: 'collapse', at: 0.75, label: 'Collapse inward.' },
  { id: 'station', at: 0.9, label: 'A station. Years later.' },
  { id: 'again', at: 0.98, label: 'またね.' },
] as const
