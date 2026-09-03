import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// 개발 서버 포트는 PORT 로 덮어쓸 수 있다 (형제 프로젝트들과 동시 실행 대비).
const port = process.env.PORT ? Number(process.env.PORT) : 5183

export default defineConfig({
  plugins: [react()],
  base: './',
  server: { port, strictPort: false },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    environmentMatchGlobs: [['src/ui/**', 'jsdom']],
    setupFiles: ['./vitest.setup.ts'],
  },
})
