// =============================================================================
// Procedural Audio Engine
//
// A fully procedural, zero-asset soundscape. We build four layered tracks
// from primitives (oscillators + filtered noise + FM synthesis) and
// crossfade them based on timeline progress. This means:
//
//   • No audio files to download → instant load.
//   • Deterministic, licensing-free.
//   • State transitions are literally gain automation — sample-accurate.
//
// Layers:
//   rain    — filtered pink noise, constant bed.
//   drone   — two detuned oscillators + low-pass sweep, tension driver.
//   swell   — sub-bass sine that rises into the detonation.
//   impact  — FM burst + resonant band-pass noise, triggered once at peak.
//   bell    — decaying sine after impact, loneliness.
// =============================================================================

import { clamp, pulse, smoothstep } from "../utils/math";

export interface AudioHandle {
  start: () => Promise<void>;
  stop: () => void;
  update: (progress: number) => void;
  setEnabled: (v: boolean) => void;
  readonly enabled: boolean;
  readonly started: boolean;
}

export function createAudioEngine(): AudioHandle {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let rainGain: GainNode | null = null;
  let droneGain: GainNode | null = null;
  let swellGain: GainNode | null = null;
  let bellGain: GainNode | null = null;

  let droneFilter: BiquadFilterNode | null = null;
  let swellOsc: OscillatorNode | null = null;
  let impactFired = false;

  let enabled = true;
  let started = false;

  const build = async () => {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = enabled ? 0.0 : 0.0;
    master.connect(ctx.destination);

    // ---- Rain: filtered pink noise ------------------------------------------
    const rainBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const rainData = rainBuf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < rainData.length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + white * 0.099046;
      b1 = 0.96300 * b1 + white * 0.29552;
      b2 = 0.57000 * b2 + white * 1.0526;
      rainData[i] = (b0 + b1 + b2 + white * 0.18) * 0.11;
    }
    const rainSrc = ctx.createBufferSource();
    rainSrc.buffer = rainBuf;
    rainSrc.loop = true;
    const rainHPF = ctx.createBiquadFilter();
    rainHPF.type = "highpass";
    rainHPF.frequency.value = 700;
    const rainLPF = ctx.createBiquadFilter();
    rainLPF.type = "lowpass";
    rainLPF.frequency.value = 4500;
    rainGain = ctx.createGain();
    rainGain.gain.value = 0;
    rainSrc.connect(rainHPF).connect(rainLPF).connect(rainGain).connect(master);
    rainSrc.start();

    // ---- Drone: two detuned saws into lowpass sweep -------------------------
    const a = ctx.createOscillator();
    const b = ctx.createOscillator();
    a.type = "sawtooth";
    b.type = "sawtooth";
    a.frequency.value = 55;   // A1
    b.frequency.value = 55 * 1.005; // slight detune
    droneFilter = ctx.createBiquadFilter();
    droneFilter.type = "lowpass";
    droneFilter.frequency.value = 180;
    droneFilter.Q.value = 6;
    droneGain = ctx.createGain();
    droneGain.gain.value = 0;
    a.connect(droneFilter);
    b.connect(droneFilter);
    droneFilter.connect(droneGain).connect(master);
    a.start();
    b.start();

    // ---- Swell: sub sine ----------------------------------------------------
    swellOsc = ctx.createOscillator();
    swellOsc.type = "sine";
    swellOsc.frequency.value = 38;
    swellGain = ctx.createGain();
    swellGain.gain.value = 0;
    swellOsc.connect(swellGain).connect(master);
    swellOsc.start();

    // ---- Bell (silent until impact) -----------------------------------------
    bellGain = ctx.createGain();
    bellGain.gain.value = 0;
    bellGain.connect(master);
  };

  const fireImpact = () => {
    if (!ctx || !master) return;
    const t = ctx.currentTime;

    // FM burst — carrier modulated by a detuned op, high index, fast decay.
    const carrier = ctx.createOscillator();
    const mod = ctx.createOscillator();
    const modGain = ctx.createGain();
    const impactGain = ctx.createGain();
    carrier.type = "sine";
    mod.type = "triangle";
    carrier.frequency.value = 90;
    mod.frequency.value = 140;
    modGain.gain.value = 600;
    mod.connect(modGain).connect(carrier.frequency);
    carrier.connect(impactGain).connect(master);
    impactGain.gain.setValueAtTime(0.0001, t);
    impactGain.gain.exponentialRampToValueAtTime(0.9, t + 0.02);
    impactGain.gain.exponentialRampToValueAtTime(0.001, t + 1.6);
    carrier.start(t);
    mod.start(t);
    carrier.stop(t + 1.8);
    mod.stop(t + 1.8);

    // Resonant band-pass noise for the "crack".
    const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    const nSrc = ctx.createBufferSource();
    nSrc.buffer = noiseBuf;
    const bpf = ctx.createBiquadFilter();
    bpf.type = "bandpass";
    bpf.frequency.value = 1800;
    bpf.Q.value = 4;
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.0001, t);
    nGain.gain.exponentialRampToValueAtTime(0.6, t + 0.01);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
    nSrc.connect(bpf).connect(nGain).connect(master);
    nSrc.start(t);

    // Bell tail — settles in over the next beat or so.
    if (bellGain) {
      const bell = ctx.createOscillator();
      bell.type = "sine";
      bell.frequency.value = 392; // G4
      const bg = ctx.createGain();
      bg.gain.setValueAtTime(0.0001, t + 0.15);
      bg.gain.exponentialRampToValueAtTime(0.25, t + 0.25);
      bg.gain.exponentialRampToValueAtTime(0.001, t + 4.0);
      bell.connect(bg).connect(bellGain);
      bell.start(t + 0.15);
      bell.stop(t + 4.2);
    }
  };

  return {
    get enabled() { return enabled; },
    get started() { return started; },
    async start() {
      if (started) return;
      await build();
      started = true;
      if (ctx && master) {
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
        master.gain.linearRampToValueAtTime(enabled ? 0.7 : 0.0, ctx.currentTime + 1.2);
      }
    },
    stop() {
      if (ctx) {
        ctx.close();
        ctx = null;
        started = false;
      }
    },
    setEnabled(v: boolean) {
      enabled = v;
      if (ctx && master) {
        const now = ctx.currentTime;
        master.gain.cancelScheduledValues(now);
        master.gain.setValueAtTime(master.gain.value, now);
        master.gain.linearRampToValueAtTime(v ? 0.7 : 0.0, now + 0.35);
      }
    },
    update(progress: number) {
      if (!started || !ctx) return;
      const p = clamp(progress, 0, 1);
      const now = ctx.currentTime;

      // Rain: present throughout, softer at start/end.
      if (rainGain) {
        const g = 0.3 + 0.4 * pulse(p, 0.0, 0.5, 1.0);
        rainGain.gain.setTargetAtTime(g, now, 0.4);
      }
      // Drone: swells through tension, peaks in act III, fades in act IV.
      if (droneGain && droneFilter) {
        const g = 0.15 * smoothstep(0.1, 0.48, p) + 0.4 * pulse(p, 0.4, 0.58, 0.82);
        droneGain.gain.setTargetAtTime(g, now, 0.25);
        const cutoff = 180 + 1200 * smoothstep(0.1, 0.55, p);
        droneFilter.frequency.setTargetAtTime(cutoff, now, 0.6);
      }
      // Swell: narrow pulse right before detonation.
      if (swellGain && swellOsc) {
        const g = 0.45 * pulse(p, 0.32, 0.52, 0.58);
        swellGain.gain.setTargetAtTime(g, now, 0.15);
        const freq = 38 + 40 * smoothstep(0.32, 0.55, p);
        swellOsc.frequency.setTargetAtTime(freq, now, 0.3);
      }

      // Impact — triggered once when we cross 0.55.
      if (!impactFired && p > 0.55) {
        impactFired = true;
        fireImpact();
      }
      // If scrubbing back past the trigger, arm again.
      if (impactFired && p < 0.45) impactFired = false;
    },
  };
}
