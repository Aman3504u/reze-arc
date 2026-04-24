import { create } from "zustand";

// Minimal shared UI state. Per-frame values (scroll progress, etc.) are NOT
// stored here — those live in refs/subscriptions to avoid React re-renders.
interface UIState {
  started: boolean;          // user has clicked "Begin" (unlocks audio).
  audioEnabled: boolean;     // user toggled audio.
  ready: boolean;            // assets / canvas loaded.
  cinematicChapter: 0 | 1 | 2 | 3;
  setStarted: (v: boolean) => void;
  setAudioEnabled: (v: boolean) => void;
  setReady: (v: boolean) => void;
  setChapter: (c: 0 | 1 | 2 | 3) => void;
}

export const useUIStore = create<UIState>((set) => ({
  started: false,
  audioEnabled: false,
  ready: false,
  cinematicChapter: 0,
  setStarted: (v) => set({ started: v }),
  setAudioEnabled: (v) => set({ audioEnabled: v }),
  setReady: (v) => set({ ready: v }),
  setChapter: (c) => set({ cinematicChapter: c }),
}));
