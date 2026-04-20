import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { existsSync, readFileSync } from 'fs'

const portsFile = path.resolve(__dirname, '../ports.json')
const ports = existsSync(portsFile)
  ? JSON.parse(readFileSync(portsFile, 'utf-8'))
  : {}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'ParkPal',
        short_name: 'ParkPal',
        description: 'Track your national park visits',
        theme_color: '#30BF17',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png?v=3',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png?v=3',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png?v=3',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'unsplash-images',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/park-photos\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'park-photos',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) return 'react';
          if (id.includes('/@supabase/')) return 'supabase';
          if (id.includes('/@radix-ui/')) return 'radix';
          if (id.includes('/lucide-react/')) return 'icons';
          // date-fns + react-day-picker stay unchunked so react-day-picker
          // travels with the lazy Calendar chunk instead of inflating initial load.
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: ports['ParkPal'],
  },
})
