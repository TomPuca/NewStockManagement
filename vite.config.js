import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    proxy: {
      '/gold-api': {
        target: 'https://phuquygroup.vn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/gold-api/, '')
      }
    }
  }
})
