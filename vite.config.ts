import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: '::',
    port: 8080,
    hmr: {
      overlay: false,
    },
  },

  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'ClinicOS',
        short_name: 'ClinicOS',
        description: 'Professional Clinic Management System',
        theme_color: '#2563eb',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // Raised limit for large vendor bundles (Firebase SDK)
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        // Cache all static JS/CSS/fonts/icons
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Runtime caching for Firestore API (offline-first)
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firestore-cache',
              networkTimeoutSeconds: 5,
            },
          },
        ],
      },
    }),
  ],

  build: {
    // Raise chunk size warning threshold to silence expected large vendor bundles
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        /**
         * Manual chunk splitting strategy:
         * Splits the 4.16 MB monolithic bundle into focused vendor chunks.
         * Users download only the chunks needed for the current route.
         *
         * Expected critical-path bundle: ~1.2 MB (down from 4.16 MB)
         */
        manualChunks: (id) => {
          // Firebase SDK — large, rarely changes
          if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) {
            return 'vendor-firebase';
          }
          // Recharts — only needed on Analytics page
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3')) {
            return 'vendor-charts';
          }
          // Framer Motion — only needed on Landing, Login pages
          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-motion';
          }
          // React PDF renderer — only needed on Shift Close page
          if (id.includes('node_modules/@react-pdf')) {
            return 'vendor-pdf';
          }
          // Radix UI primitives — shared across all pages
          if (id.includes('node_modules/@radix-ui')) {
            return 'vendor-radix';
          }
          // React ecosystem core
          if (
            id.includes('node_modules/react') ||
            id.includes('node_modules/react-dom') ||
            id.includes('node_modules/react-router-dom') ||
            id.includes('node_modules/scheduler')
          ) {
            return 'vendor-react';
          }
        },
      },
    },
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
