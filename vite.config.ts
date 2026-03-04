import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          // Only split PDF and DOC parsers (they're large)
          'pdf-worker': ['pdfjs-dist'],
          'doc-parser': ['mammoth'],
          // Note: jszip is dynamically imported, don't include here
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  server: {
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  },
  preview: {
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  },
  optimizeDeps: {
    include: ['pdfjs-dist', 'mammoth'],
  },
})
