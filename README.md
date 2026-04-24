# Reze Arc — レゼ

A cinematic, scroll-driven 3D web experience.
Love, rain, detonation, silence. Five acts in one continuous timeline.

> *"A love story that ends the way all bombs do."*

Inspired by the Reze Arc of *Chainsaw Man* — this isn't a landing page, it's a
short film you scroll through. Built as a portfolio-grade, Awwwards-level
reference for timeline-driven WebGL direction.

---

## The experience

```
  Act I   —  The Café in the Rain         0.00 – 0.18
  Act II  —  A Promise on the Rooftop     0.18 – 0.42
  Act III —  The Reveal                   0.42 – 0.58
  Act IV  —  Detonation                   0.58 – 0.82
  Act V   —  See You Again (またね)        0.82 – 1.00
```

Scroll drives a single normalized `[0,1]` timeline. Every camera move, every
shader, every audio stem crossfade is computed from that one value.
Scrolling backwards *rewinds the explosion*.

---

## Architecture — the four pillars

### 1 · Timeline engine (`src/hooks/useScrollTimeline.ts`)
A tall invisible scroll driver is injected into `<body>`. Each `requestAnimationFrame`
we read `window.scrollY`, normalize it, damp it (λ = 6.5, framerate-independent),
compute velocity, and publish it into a single Zustand store. Every consumer
reads from that store rather than listening to scroll events — no duplicated
listeners, no jank. One source of truth.

### 2 · Camera rig (`src/systems/CameraRig.tsx`)
Camera position / target / FOV are defined per-act in `src/systems/timeline.ts`.
The rig interpolates between the current act's home-pose and the next act's
pose with `smootherstep(subProgress)`, adds mouse parallax, scroll-velocity
drift, and handheld shake that peaks around the ignition beat. Never hardcoded
keyframes — the rig is declarative.

### 3 · Scene orchestrator (`src/systems/SceneOrchestrator.tsx`)
Each act lives in its own lazy-loaded chunk (`scenes/Act*.tsx`). The
orchestrator only mounts the current act ± 1 neighbor so GPU memory stays
bounded even after scrolling through the whole film. Shared atmosphere
(fog, sky color) is driven separately so transitions cross-fade.

### 4 · Layered audio engine (`src/hooks/useAudioEngine.ts`)
Five procedurally-synthesized stems (ambient pad, string quartet, heartbeat
sub, pink noise, detonation rumble) are built from oscillators + filters at
audio unlock. Per-act mix targets (e.g. Act III = `{heart: 0.9, noise: 0.4}`)
are defined alongside the timeline. Every rAF we crossfade the master gains
toward the current act's mix using `setTargetAtTime` — no sample crossfading,
no pre-rendered tracks, no licensing headaches.

---

## Folder layout

```
src/
├── App.tsx                      # Root. Wires hooks, Canvas, postprocessing, UI.
├── main.tsx                     # React 18 entry.
├── state/
│   ├── timelineStore.ts         # Zustand: progress / act / subProgress / velocity.
│   └── audioStore.ts            # Zustand: unlocked / muted.
├── hooks/
│   ├── useScrollTimeline.ts     # DOM scroll → timeline store (rAF + damping).
│   ├── useAudioEngine.ts        # Stems + per-act gain crossfades.
│   └── useActScene.ts           # Helper: "am I visible? what's my local progress?"
├── systems/
│   ├── timeline.ts              # THE timeline: acts, camera poses, palettes, audio mix.
│   ├── SceneOrchestrator.tsx    # Mounts/unmounts acts based on progress ± 1.
│   ├── CameraRig.tsx            # Dolly + parallax + shake. Pure declarative.
│   ├── Lighting.tsx             # 3-point rig whose colors follow the palette.
│   └── AssetPipeline.tsx        # Draco / KTX2 / meshopt preload helpers.
├── scenes/
│   ├── ActCafe.tsx              # Rain, counter, silhouettes, neon sign.
│   ├── ActRooftop.tsx           # Stars, petals, moon, two figures.
│   ├── ActReveal.tsx            # Shard-ring glyph, heatwave shader.
│   ├── ActDetonation.tsx        # 2.4k instanced debris + shockwave shader + embers.
│   └── ActAftermath.tsx         # Bench, paper bag, one drifting ember, またね.
├── fx/
│   ├── Postprocessing.tsx       # Bloom / DoF / Chromatic / Noise / Vignette stack.
│   └── shaders/
│       ├── heatwave.ts          # Domain-warped radial plume.
│       └── shockwave.ts         # Expanding ring with hot core.
├── ui/
│   ├── AudioGate.tsx            # Enter screen (required for AudioContext).
│   └── Overlay.tsx              # Act caption, timeline scrubber, mute.
├── utils/
│   ├── easing.ts                # smoothstep / smootherstep / damp / remap / lerp.
│   └── random.ts                # Seeded xorshift PRNG.
└── styles/global.css
```

---

## Run it

```bash
npm install
npm run dev       # vite → http://localhost:5173
npm run build     # production bundle
npm run preview   # serve the bundle
```

Node ≥ 20.

---

## Optimization checklist — what this project already does

- [x] **Code-split per act** — each `scenes/Act*.tsx` ships as its own chunk.
- [x] **Mount window of ±1 act** — the orchestrator never keeps more than
      three acts alive at once.
- [x] **GPU instancing** — rain streaks (1.4k), petals (220), debris (2.4k),
      reveal shards (60), embers (900). Zero per-instance components.
- [x] **Flat materials where possible** — `meshBasicMaterial` for emissives
      keeps fragment cost low.
- [x] **AdaptiveDpr + PerformanceMonitor** (drei) — pixel ratio drops
      automatically on weak GPUs.
- [x] **Bounded DPR** via `dpr={[1, 1.75]}` — 4K Retina displays cap there.
- [x] **Single `THREE.Fog` instance**, mutated per-frame instead of replaced.
- [x] **Three-point lighting with color tweening on existing lights** — no
      light-object creation in hot loops.
- [x] **Procedural audio stems** — no pre-rendered track downloads, no CORS
      or licensing, and stem mixing is a single `gain.setTargetAtTime` per
      stem per frame.
- [x] **Manual Rollup chunks** — `three`, `r3f`, `post`, `motion` are isolated
      so the app shell stays ~18 KB gzipped.
- [x] **No shadow maps**; the scene's moody palette doesn't need them, and
      this saves the second render pass.
- [x] **Zustand `getState()` inside `useFrame`** — timeline reads don't
      re-render React components.
- [x] **Reversible parameterized animations** — scrolling backward smoothly
      rewinds every effect, including the detonation.

### Optional upgrades (future PRs)

- [ ] Swap silhouettes for Draco + KTX2-compressed GLBs
      (`gltf-transform optimize … --compress meshopt --texture-compress ktx2`).
- [ ] Baked ambient occlusion on the café counter / rooftop deck.
- [ ] Motion blur postprocess during Act IV only.
- [ ] VR mode (`@react-three/xr`) — re-use the timeline, drive the camera
      rig from headset pose instead of scroll.
- [ ] Multiplayer "shared scroll" (WebSocket broadcast of normalized
      progress) — everyone sees the film at the same beat.
- [ ] Real-time captions synced to the timeline's `BEATS` array.

---

## Design notes — why these decisions

**Timeline over sections.** Scroll-triggered sections (IntersectionObserver,
GSAP ScrollTrigger pinning, etc.) are the standard pattern but they encode
*layout* into *story*. By making progress a single normalized number, we can
drive the same film from a `<input type="range">` scrubber, a keyboard arrow,
or an XR controller with zero refactor.

**Procedural audio.** The original brief asked for a layered audio engine
with state-based transitions. We could ship three licensed stems and pay a
content budget. Instead we synthesize them — the whole audio graph is ~5KB
of code and gives us per-frame, per-stem automation precision that no
pre-rendered track can match. The heartbeat in Act III is literally
scheduled by the AudioContext.

**No hero GLB.** The stylized low-poly silhouettes are a deliberate choice.
A photoreal character would fight the grain + bloom for attention. The
minimalism also means the entire experience weighs ~14 KB gzipped of
JavaScript beyond the three.js + r3f baseline. Drop a Draco-compressed
character into `/public/models/` if you want to push fidelity further —
the pipeline is ready.

**Detonation is reversible.** Every particle, shader value, and light
intensity in Act IV is a pure function of `subProgress`. Scrolling back
literally un-explodes the scene. This was the hardest architectural
decision — it means we can't use velocity-integrated physics — but it's
what makes the scroll feel like film rather than video.

---

## Credits

Timeline, code, direction: Killer.
Emotional reference: *Chainsaw Man*, Tatsuki Fujimoto. This is an unofficial
fan interpretation; no assets from the anime or manga are used.
