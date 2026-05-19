import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  // 루트 public 폴더를 정적 파일 디렉토리로 사용 (이미지, 오디오 등)
  publicDir: resolve(__dirname, '../public'),
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
  },
})
