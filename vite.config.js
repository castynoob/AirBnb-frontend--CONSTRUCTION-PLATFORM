import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // 👈 runs on http://localhost:3000
  },
  build: {
    target: 'es2015', // Support older iOS Safari (iOS 12+)
    cssTarget: 'safari13',
    minify: 'terser',
    terserOptions: {
      safari10: true, // Fix Safari 10+ bugs
    },
  },
})
