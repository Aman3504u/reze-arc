import type { EasingName } from "./easing";

export type Vec3 = [number, number, number];

// A single keyframe on the master timeline. `t` is normalized 0..1.
export interface CameraKey {
  t: number;
  position: Vec3;
  target: Vec3;
  fov?: number;
  ease?: EasingName;
}

// Named chapter on the timeline — used for UI labels, not for logic.
export interface Chapter {
  id: "calm" | "tension" | "transformation" | "aftermath";
  label: string;
  subtitle: string;
  t0: number;
  t1: number;
}

export interface TimelineSpec {
  cameraKeys: CameraKey[];
  chapters: Chapter[];
}
