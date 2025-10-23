import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': '/src',
      '~': '/',
      '@pages': '/pages',
      '@components': '/components',
      '@features': '/features',
    },
  },
  plugins: [
    react(),
    ViteImageOptimizer({
      png: { quality: 80 },
      jpeg: { quality: 80 },
      jpg: { quality: 80 },
      webp: { quality: 80 },
      avif: { quality: 80 },
    }),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,svg}'], // Exclude png from global patterns
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
            },
          },
          {
            urlPattern: /\.(?:png|gif|jpg|jpeg|svg)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
      },
      includeAssets: [
        'favicon.ico',
        'apple-touch-icon.png',
        'masked-icon.svg',
        'pwa-192x192.png',
        'pwa-512x512.png',
      ],
      manifest: {
        name: 'SIPOMA - Sistem Informasi Produksi dan Operasi',
        short_name: 'SIPOMA',
        description: 'Aplikasi manajemen produksi dan operasi pabrik',
        theme_color: '#1f2937',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/pwa-192x192.png', // Use absolute path with leading slash
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png', // Use absolute path with leading slash
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  build: {
    // Enable build cache for faster rebuilds
    watch: null,
    // Enable minification for production
    minify: 'esbuild',
    cssMinify: 'esbuild',
    // Enable compressed size reporting
    reportCompressedSize: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // Database and auth
            if (id.includes('pocketbase')) {
              return 'data-vendor';
            }
            // Security utilities
            if (id.includes('crypto-js') || id.includes('bcrypt')) {
              return 'crypto-vendor';
            }
            // Excel libraries (lazy loaded)
            if (id.includes('exceljs')) {
              return 'excel-vendor';
            }
            // Small utilities
            if (id.includes('uuid') || id.includes('focus-trap') || id.includes('classnames')) {
              return 'utils-light';
            }
            // Chart libraries
            if (
              id.includes('chart.js') ||
              id.includes('react-chartjs-2') ||
              id.includes('recharts') ||
              id.includes('d3')
            ) {
              return 'charts-vendor';
            }
            // UI libraries
            if (
              id.includes('@heroicons') ||
              id.includes('lucide-react') ||
              id.includes('framer-motion') ||
              id.includes('@headlessui')
            ) {
              return 'ui-vendor';
            }
            // Form and query libraries
            if (id.includes('@tanstack/react-query') || id.includes('react-hook-form')) {
              return 'query-vendor';
            }
            // Date/time utilities
            if (id.includes('date-fns') || id.includes('dayjs') || id.includes('moment')) {
              return 'date-vendor';
            }
            // Router
            if (id.includes('react-router')) {
              return 'router-vendor';
            }
            // State management
            if (id.includes('zustand') || id.includes('immer')) {
              return 'state-vendor';
            }
            // Everything else
            return 'vendor-misc';
          }

          // Application chunks - split pages more granularly
          if (id.includes('pages/') && !id.includes('test')) {
            // Plant operations pages
            if (id.includes('PlantOperationsPage') || id.includes('plant_operations/')) {
              return 'page-plant-ops';
            }
            // User management pages
            if (
              id.includes('UserListPage') ||
              id.includes('UserRolesPage') ||
              id.includes('UserActivityPage')
            ) {
              return 'page-users';
            }
            // Project management pages
            if (
              id.includes('ProjectDashboardPage') ||
              id.includes('ProjectDetailPage') ||
              id.includes('ProjectListPage') ||
              id.includes('project_management/')
            ) {
              return 'page-projects';
            }
            // Settings pages
            if (id.includes('SettingsPage') || id.includes('Settings/')) {
              return 'page-settings';
            }
            // Dashboard pages
            if (id.includes('MainDashboardPage')) {
              return 'page-dashboard';
            }
            // Auth pages
            if (id.includes('LoginPage')) {
              return 'page-auth';
            }
            return 'pages-misc';
          }

          // Component chunks
          if (id.includes('components/plant-operations')) {
            return 'components-plant-ops';
          }
          if (id.includes('components/charts') || id.includes('Chart')) {
            return 'components-charts';
          }
          if (id.includes('components/dashboard')) {
            return 'components-dashboard';
          }

          // Hook chunks
          if (id.includes('hooks/use') && id.includes('Data')) {
            return 'hooks-data';
          }

          // Utility chunks
          if (id.includes('utils/') && !id.includes('permissions')) {
            return 'app-utils';
          }
        },
      },
    },
    chunkSizeWarningLimit: 500, // Reduced to catch large chunks
    // Enable source maps for production debugging
    sourcemap: false,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', '@tanstack/react-query', 'pocketbase'],
  },
  // Development server proxy for API calls
  server: {
    proxy: {
      '/api/pb-proxy': {
        target: 'http://141.11.25.69:8090',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/pb-proxy/, ''),
        configure: (proxy, options) => {
          // eslint-disable-next-line no-unused-vars
          proxy.on('error', (err, _req, _res) => {
            // eslint-disable-next-line no-console
            console.log('Proxy error:', err);
          });
          // eslint-disable-next-line no-unused-vars
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // eslint-disable-next-line no-console
            console.log(
              'Proxying request:',
              req.method,
              req.url,
              '->',
              options.target + proxyReq.path
            );
          });
        },
      },
    },
  },
});
