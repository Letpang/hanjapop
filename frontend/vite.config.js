import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  base: '/',
  server: {
    port: 3001,
    strictPort: true,
    allowedHosts: true,
  },
  build: {
    outDir: '../public',
    emptyOutDir: false, // public/ 기존 assets/ 폴더 유지
    assetsDir: 'js',
  },
})
