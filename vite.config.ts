import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { host: '0.0.0.0', port: 5173 },
  preview: { host: '0.0.0.0', port: 4173 },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'zustand'],
          motion: ['framer-motion'],
          charts: ['recharts'],
          grid: ['react-grid-layout', 'react-resizable'],
          dates: ['date-fns'],
        },
      },
    },
  },
})
