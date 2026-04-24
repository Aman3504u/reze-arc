import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Reze Arc — Vite build config
// - React plugin for fast HMR
// - Manual chunks to keep the three.js bundle out of the app shell
// - Shaders are inlined as TS template strings in src/fx/shaders/* so we don't
//   need a glsl plugin; the TS strings JIT-compile at first paint.
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
  build: {
    target: 'es2022',
    sourcemap: false,
    chunkSizeWarningLimit: 1400,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          r3f: ['@react-three/fiber', '@react-three/drei'],
          post: ['@react-three/postprocessing', 'postprocessing'],
          motion: ['framer-motion'],
        },
      },
    },
  },
})
