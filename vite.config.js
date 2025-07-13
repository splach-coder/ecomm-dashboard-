import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import fs from 'fs';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdnjs\.cloudflare\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'external-libs',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheKeyWillBeUsed: async ({ request }) => {
                return `${request.url}`;
              }
            }
          }
        ]
      },
      manifest: {
        name: 'Yassir Phones - Barcode Scanner',
        short_name: 'Yassir Phones',
        description: 'Professional barcode and IMEI scanner for mobile devices',
        start_url: '/',
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#0f172a',
        orientation: 'portrait',
        scope: '/',
        categories: ['utilities', 'productivity', 'business'],
        // Add proper icons for PWA
        icons: [
          {
            src: 'icons/favicon.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: 'icons/favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          // Add PNG fallbacks for better compatibility
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ],
        // PWA display features
        display_override: ['window-controls-overlay', 'standalone'],
        // Add screenshots for app store listing
        screenshots: [
          {
            src: 'screenshots/mobile-scanner.png',
            sizes: '375x812',
            type: 'image/png',
            form_factor: 'narrow'
          }
        ]
      },
      // Add service worker for offline functionality
      strategies: 'injectManifest',
      injectRegister: 'auto',
      srcDir: 'src',
      filename: 'sw.js',
      // Configure for camera access
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      // Add permissions for camera access
      permissions: ['camera']
    })
  ],
  server: {
    https: {
      key: fs.readFileSync('./localhost-key.pem'),
      cert: fs.readFileSync('./localhost.pem')
    },
    // Add headers for camera permissions
    headers: {
      'Permissions-Policy': 'camera=*, microphone=*, geolocation=*'
    }
  },
  // Optimize build for PWA
  build: {
    target: 'es2015',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          zxing: ['@zxing/library']
        }
      }
    }
  },
  // Add PWA optimizations
  define: {
    __PWA_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString())
  }
});