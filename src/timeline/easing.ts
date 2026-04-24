// Easing catalogue — film-grade curves for camera & light moves.
export type Easing = (t: number) => number;

export const linear: Easing = (t) => t;
export const easeInQuad: Easing = (t) => t * t;
export const easeOutQuad: Easing = (t) => t * (2 - t);
export const easeInOutQuad: Easing = (t) =>
  t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
export const easeInCubic: Easing = (t) => t * t * t;
export const easeOutCubic: Easing = (t) => 1 - Math.pow(1 - t, 3);
export const easeInOutCubic: Easing = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const easeOutExpo: Easing = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
export const easeInExpo: Easing = (t) => (t === 0 ? 0 : Math.pow(2, 10 * t - 10));
export const easeOutBack: Easing = (t) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

export const easings = {
  linear,
  easeInQuad,
  easeOutQuad,
  easeInOutQuad,
  easeInCubic,
  easeOutCubic,
  easeInOutCubic,
  easeOutExpo,
  easeInExpo,
  easeOutBack,
} as const;

export type EasingName = keyof typeof easings;
