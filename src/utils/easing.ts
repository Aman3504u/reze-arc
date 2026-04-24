// Hand-rolled easing curves — we avoid pulling in a big animation lib just for these.
// All functions take t in [0,1] and return a mapped [0,1] value.

export const clamp = (v: number, min = 0, max = 1) =>
  v < min ? min : v > max ? max : v

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Smoothstep (Ken Perlin). Good default for scrub-like motion. */
export const smoothstep = (t: number) => {
  const x = clamp(t)
  return x * x * (3 - 2 * x)
}

/** Smootherstep — steeper in/out, no derivative discontinuity. */
export const smootherstep = (t: number) => {
  const x = clamp(t)
  return x * x * x * (x * (x * 6 - 15) + 10)
}

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp(t), 3)
export const easeInCubic = (t: number) => Math.pow(clamp(t), 3)
export const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

export const easeOutExpo = (t: number) =>
  t >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(t))

/** Remap a value from one range to another, optionally eased. */
export const remap = (
  v: number,
  inMin: number,
  inMax: number,
  outMin = 0,
  outMax = 1,
  ease: (t: number) => number = (t) => t,
) => {
  if (inMax === inMin) return outMin
  const t = clamp((v - inMin) / (inMax - inMin))
  return outMin + (outMax - outMin) * ease(t)
}

/** A damped approach to target — framerate-independent when called with dt. */
export const damp = (
  current: number,
  target: number,
  lambda: number,
  dt: number,
) => lerp(current, target, 1 - Math.exp(-lambda * dt))
