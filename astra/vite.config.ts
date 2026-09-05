import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: process.env.ASTRA_BASE || './',
  plugins: [react(), VitePWA({
    registerType: 'prompt',
    injectRegister: null,
    includeAssets: ['astra.svg', 'icons/*.png'],
    manifest: {
      id: './', name: 'Astra 장기', short_name: 'Astra', lang: 'ko',
      description: '로컬 2인 한국 장기',
      start_url: './', scope: './', display: 'standalone',
      theme_color: '#f6f7f4', background_color: '#f6f7f4',
      icons: [
        { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      ],
    },
    workbox: {
      cacheId: 'astra-janggi',
      globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      cleanupOutdatedCaches: true,
      clientsClaim: true,
      navigateFallback: 'index.html',
    },
  })],
  build: { target: 'es2022' },
})
