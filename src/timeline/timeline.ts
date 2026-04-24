import type { TimelineSpec } from "./types";

// =============================================================================
// MASTER TIMELINE — the single source of truth for the entire experience.
//
// A 0..1 normalized progress drives the camera rig, lighting, particles, shaders,
// audio, and UI. Each subsystem subscribes via useScrollTimeline and renders
// inside a frameloop with zero React re-renders.
//
// Narrative:
//   0.00 .. 0.18  calm         — rooftop drift, rain, a single pulse of light.
//   0.18 .. 0.48  tension      — wind rising, particles coalescing, camera tilts.
//   0.48 .. 0.78  transformation — core fractures, shockwave, spark storm.
//   0.78 .. 1.00  aftermath    — ash drift, silence, a last ember.
// =============================================================================

export const TIMELINE: TimelineSpec = {
  chapters: [
    {
      id: "calm",
      label: "I — Stillness",
      subtitle: "Rain on a rooftop. A world holding its breath.",
      t0: 0.0,
      t1: 0.18,
    },
    {
      id: "tension",
      label: "II — Undertow",
      subtitle: "Something is pulling. The air forgets how to be still.",
      t0: 0.18,
      t1: 0.48,
    },
    {
      id: "transformation",
      label: "III — Detonation",
      subtitle: "A promise breaks. Light becomes matter.",
      t0: 0.48,
      t1: 0.78,
    },
    {
      id: "aftermath",
      label: "IV — Ash",
      subtitle: "What remains remembers.",
      t0: 0.78,
      t1: 1.0,
    },
  ],

  // Camera rig — lerp'd with easing between keys.
  // Think of these as storyboarded shots, not literal positions.
  cameraKeys: [
    // Act I — wide establishing drift, shallow angle, low horizon.
    { t: 0.0, position: [0.0, 1.8, 7.5], target: [0, 0.6, 0], fov: 38, ease: "easeInOutCubic" },
    { t: 0.12, position: [-1.6, 1.4, 6.2], target: [0, 0.7, 0], fov: 36, ease: "easeInOutCubic" },

    // Act II — tighter, higher, orbiting, fov compresses (tension).
    { t: 0.28, position: [2.3, 2.2, 4.6], target: [0, 1.0, 0], fov: 32, ease: "easeInOutCubic" },
    { t: 0.42, position: [1.1, 3.0, 3.2], target: [0, 1.2, 0], fov: 28, ease: "easeInOutCubic" },

    // Act III — detonation: whip-pan, push-in, near the core.
    { t: 0.5, position: [-0.6, 1.6, 2.4], target: [0, 1.1, 0], fov: 46, ease: "easeOutExpo" },
    { t: 0.62, position: [-0.2, 0.9, 1.8], target: [0, 1.0, 0], fov: 62, ease: "easeOutExpo" },
    { t: 0.74, position: [0.8, 2.2, 2.6], target: [0, 0.8, 0], fov: 40, ease: "easeInOutCubic" },

    // Act IV — pull back, lonely, quiet.
    { t: 0.88, position: [0.0, 2.8, 8.0], target: [0, 0.4, 0], fov: 30, ease: "easeInOutCubic" },
    { t: 1.0, position: [0.0, 3.4, 11.0], target: [0, 0.2, 0], fov: 26, ease: "easeInOutCubic" },
  ],
};

export const TOTAL_SCROLL_VH = 620; // total scrollable height = 6.2x viewport.
