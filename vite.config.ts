import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    global: 'globalThis',
  },
  build: {
    // Optimize chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks for better caching
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-scroll-area', '@radix-ui/react-label'],
          'instant-vendor': ['@instantdb/react'],
          'utils-vendor': ['clsx', 'tailwind-merge', 'class-variance-authority'],
        },
      },
    },
    // Increase chunk size warning limit since we're using manual chunks
    chunkSizeWarningLimit: 600,
  },
  // Optimize dev server
  server: {
    port: 3000,
    open: true,
  },
  // Optimize preview server
  preview: {
    port: 3000,
    open: true,
  },
})
