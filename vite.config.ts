/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages serves the app from /<repo>/; CI sets BASE_PATH=/pharos/.
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  base,
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Pharos',
        short_name: 'Pharos',
        description: 'Ό,τι χρειάζεσαι σε έκτακτη ανάγκη. Χωρίς internet.',
        lang: 'el',
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0E1B2B',
        theme_color: '#0E1B2B',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml' }
        ]
      },
      workbox: {
        // Everything the app needs is precached on first visit, so every
        // screen works offline afterwards. Nothing is fetched at runtime.
        globPatterns: ['**/*.{js,css,html,svg,png,json,webmanifest}'],
        // The map screen (MapLibre, ~320 KB) is NOT precached, so a first
        // visit stays small. It is cached when the user downloads a map
        // region (see src/screens/Maps.tsx), so that map opens offline later.
        globIgnores: ['**/MapView-*', '**/maplibre-gl-worker*'],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/\/maps\//],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => /\/assets\/(MapView-|maplibre-gl-worker)/.test(url.pathname),
            handler: 'CacheFirst',
            options: { cacheName: 'pharos-map-code', expiration: { maxEntries: 6 } }
          },
          {
            // Map label fonts: fetched when a region is downloaded, then kept.
            urlPattern: ({ url }) => url.pathname.includes('/map/fonts/'),
            handler: 'CacheFirst',
            options: { cacheName: 'pharos-map-fonts', expiration: { maxEntries: 20 } }
          }
        ]
      }
    })
  ],
  build: {
    // Old phones: Chrome 80+ (Android 5+ with updates), Safari 14+ (iPhone 6s and newer).
    target: ['es2020', 'chrome80', 'safari14'],
    // MapLibre is one big lazy chunk by design; everything else is far smaller.
    chunkSizeWarningLimit: 1200,
    cssMinify: true,
    sourcemap: false,
    reportCompressedSize: true
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts']
  }
});
