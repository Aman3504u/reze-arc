import { easings } from "./easing";
import type { CameraKey, Vec3 } from "./types";

// Resolves an arbitrary progress value against a sorted array of camera keys.
// Returns an interpolated {position, target, fov} using the destination key's easing.
export interface CameraPose {
  position: Vec3;
  target: Vec3;
  fov: number;
}

export function sampleCamera(keys: CameraKey[], t: number): CameraPose {
  if (t <= keys[0].t) {
    return {
      position: keys[0].position,
      target: keys[0].target,
      fov: keys[0].fov ?? 35,
    };
  }
  const last = keys[keys.length - 1];
  if (t >= last.t) {
    return {
      position: last.position,
      target: last.target,
      fov: last.fov ?? 35,
    };
  }

  // Binary search would be overkill for ~10 keys.
  let i = 0;
  while (i < keys.length - 1 && keys[i + 1].t < t) i++;
  const a = keys[i];
  const b = keys[i + 1];
  const raw = (t - a.t) / (b.t - a.t);
  const ease = easings[b.ease ?? "easeInOutCubic"];
  const k = ease(raw);

  const lerp3 = (x: Vec3, y: Vec3, u: number): Vec3 => [
    x[0] + (y[0] - x[0]) * u,
    x[1] + (y[1] - x[1]) * u,
    x[2] + (y[2] - x[2]) * u,
  ];

  return {
    position: lerp3(a.position, b.position, k),
    target: lerp3(a.target, b.target, k),
    fov: (a.fov ?? 35) + ((b.fov ?? 35) - (a.fov ?? 35)) * k,
  };
}
