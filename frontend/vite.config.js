import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'window',
  },
  server: {
    port: 3000,
    proxy: {
      // All /api/* calls are forwarded to the Spring Boot backend
      '/api': {
        target: 'http://localhost:8089',
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: 'http://localhost:8089',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  // When building for production: 'dist' for Vercel/standalone, or Spring static if BUILD_TO_SPRING is set
  build: {
    outDir: process.env.BUILD_TO_SPRING ? '../src/main/resources/static' : 'dist',
    emptyOutDir: true,
  },
})
