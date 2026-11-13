import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Manifest scope/start_url ve service worker yolu Vite `base` ayarından gelir (alt klasör: vite build --base=/alt/).
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Yeni service worker kendiliğinden devreye girer; açık sayfa yeniden yüklenmez, yeni sürüm sonraki açılışta.
      registerType: 'autoUpdate',
      injectRegister: 'script',
      manifest: {
        name: 'Anamnez Kontrol Listesi',
        short_name: 'Anamnez',
        lang: 'tr',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#1d4f91',
        icons: [
          { src: 'simge-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'simge-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'simge-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,json,png}'],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
      },
    }),
  ],
})
