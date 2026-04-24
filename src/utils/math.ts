// Small math utilities — tree-shakeable, no Three.js deps.

export const clamp = (x: number, lo = 0, hi = 1) =>
  x < lo ? lo : x > hi ? hi : x;

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

// Inverse smoothstep for remapping.
export const invLerp = (a: number, b: number, v: number) =>
  clamp((v - a) / (b - a), 0, 1);

// Critically-damped spring for ultra-smooth scalar follow.
export const damp = (current: number, target: number, lambda: number, dt: number) =>
  lerp(current, target, 1 - Math.exp(-lambda * dt));

// Maps progress [a..b] -> [0..1] then applies easeInOut.
export const band = (p: number, a: number, b: number) => smoothstep(a, b, p);

// Triangle window — rises from a..peak, falls peak..b.
export const pulse = (p: number, a: number, peak: number, b: number) => {
  if (p <= a || p >= b) return 0;
  return p < peak
    ? smoothstep(a, peak, p)
    : 1 - smoothstep(peak, b, p);
};
