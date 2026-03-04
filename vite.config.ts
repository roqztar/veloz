import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Security: Generate source maps for debugging but don't expose in production
    sourcemap: false,
    // Optimize chunk size
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks for better caching
          'pdf-worker': ['pdfjs-dist'],
          'doc-parser': ['mammoth'],
          'zip-utils': ['jszip'],
        },
      },
    },
    // Security: Limit chunk size to detect potential issues
    chunkSizeWarningLimit: 1000,
  },
  server: {
    // Security headers for development server
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  },
  preview: {
    // Security headers for preview server
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['pdfjs-dist', 'mammoth', 'jszip'],
  },
})
