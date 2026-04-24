import { create } from 'zustand'

export type AudioState = {
  unlocked: boolean
  muted: boolean
  unlock: () => void
  toggleMute: () => void
}

/**
 * Audio state is separate from the timeline store so that timeline updates
 * (every rAF) don't re-render audio UI. Consumers that only care about
 * unlock/mute subscribe here.
 */
export const useAudio = create<AudioState>((set) => ({
  unlocked: false,
  muted: false,
  unlock: () => set({ unlocked: true }),
  toggleMute: () => set((s) => ({ muted: !s.muted })),
}))
