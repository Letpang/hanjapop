import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const appDir = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [react()],
  // 루트 public 폴더를 정적 파일 디렉토리로 사용 (이미지, 오디오 등)
  publicDir: resolve(appDir, '../public'),
  base: '/',
  server: {
    port: 3001,
    strictPort: true,
    allowedHosts: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) return 'vendor'
          if (id.includes('hanja_unified.json')) return 'hanja-data'
          if (id.includes('dailyCurriculum.js')) return 'curriculum-data'
        },
      },
    },
  },
})
