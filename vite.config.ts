import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  base: mode === 'pages' || process.env.GITHUB_PAGES === 'true' ? '/my-dash/docs/' : '/',
  plugins: [react()],
  server: { host: '0.0.0.0', port: 5173, allowedHosts: true },
  preview: { host: '0.0.0.0', port: 4173, allowedHosts: true },
  worker: { format: 'es' },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          const path = id.replaceAll('\\', '/')
          if (/\/node_modules\/(react|react-dom|scheduler|zustand|use-sync-external-store|clsx|prop-types|react-is)\//.test(path)) return 'react-vendor'
          if (/\/node_modules\/(framer-motion|motion-dom|motion-utils)\//.test(path)) return 'motion'
          if (/\/node_modules\/(recharts|recharts-scale|react-smooth|victory-vendor|d3-|lodash|eventemitter3|react-is|tiny-invariant)\//.test(path)) return 'charts'
          if (/\/node_modules\/(react-grid-layout|react-resizable|react-draggable)\//.test(path)) return 'grid'
          if (path.includes('/node_modules/date-fns/')) return 'dates'
          return undefined
        },
      },
    },
  },
}))
