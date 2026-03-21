import { defineConfig, UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';

// https://vitejs.dev/config/
export default defineConfig(async (_env) => {
  let xAiApiKey = process.env.VITE_XAI_API_KEY || process.env.XAI_API_KEY;

  if (!xAiApiKey) {
    try {
      const { default: PocketBase } = await import('pocketbase');
      const pb = new PocketBase('https://db.sipoma.online');
      // Attempt to fetch without auth
      const record = await pb.collection('api_key').getFirstListItem('provider="xai"');
      xAiApiKey = record.key;
      console.log('✅ x.AI API Key loaded successfully from PocketBase');
    } catch (e) {
      console.warn(
        '⚠️ Failed to fetch x.AI key via PB in Dev Server. Chatbot might not work localy.'
      );
    }
  }

  return {
    base: '/',
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
          // Force service worker update dan cleanup cache lama
          skipWaiting: true,
          clientsClaim: true,
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/api\./i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache-v1.0.0', // Versioned cache name
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
                cacheName: 'images-cache-v1.0.0', // Versioned cache name
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
              },
            },
          ],
        },
        includeAssets: ['pwa-192x192.png', 'pwa-512x512.png'],
        manifest: {
          name: 'SIPOMA - Sistem Informasi Produksi dan Operasi',
          short_name: 'SIPOMA',
          description: 'Aplikasi manajemen produksi dan operasi pabrik',
          theme_color: '#1e1e1e',
          background_color: '#300a24',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/', // ✅ disesuaikan dengan base /
          scope: '/', // ✅ disesuaikan dengan base /
          categories: ['business', 'productivity'],
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
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
      }),
    ],
    build: {
      // Enable build cache for faster rebuilds
      // Enable build cache for faster rebuilds
      // Enable minification for production
      minify: 'esbuild' as const,
      cssMinify: 'esbuild' as const,
      esbuild: {
        drop: ['console', 'debugger'],
      },

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
            if (id.includes('pages/')) {
              // Only group the common shell or small pages
              if (id.includes('PlaceholderPage')) {
                return 'page-shell';
              }
              // Let Vite generate individual chunks for most sub-pages
              // This ensures clicking "Dashboard" doesn't download "Reports" if not opened.
            }

            // Locale chunks
            if (id.includes('src/locales/')) {
              if (id.includes('/en.ts')) return 'locale-en';
              if (id.includes('/id.ts')) return 'locale-id';
              return 'locales-misc';
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
            if (id.includes('utils/Microinteractions.tsx')) {
              return 'utils-interactions';
            }
            if (id.includes('utils/ResponsiveLayout.tsx')) {
              return 'utils-layout';
            }
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
    // Development server configuration
    server: {
      host: true, // Allow external access
      port: 5173,
      proxy: {
        '/api/xai': {
          target: 'https://api.x.ai/v1/chat/completions',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/xai/, ''),
          secure: true,
          configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              // 1. CLEAR all incoming headers to prevent Cloudflare/WAF interference
              const headers = proxyReq.getHeaders();
              Object.keys(headers).forEach((h) => proxyReq.removeHeader(h));

              // 2. SET only clean, required headers
              proxyReq.setHeader('Host', 'api.x.ai');
              proxyReq.setHeader('Accept', 'application/json');
              proxyReq.setHeader('User-Agent', 'Vite/SIPOMA-Assistant');

              if (xAiApiKey) {
                proxyReq.setHeader('Authorization', `Bearer ${xAiApiKey}`);
              } else {
                console.error('❌ Proxy Config Error: xAiApiKey is missing!');
              }

              const contentType = req.headers['content-type'] || 'application/json';
              proxyReq.setHeader('Content-Type', contentType);

              if (req.headers['content-length']) {
                proxyReq.setHeader('Content-Length', req.headers['content-length']);
              }

              // 3. Prevent any other headers from leaking (like cookies)
            });

            proxy.on('error', (err, _req, _res) => {
              console.error('🔴 Proxy Error (xAI):', err);
            });

            proxy.on('proxyRes', (proxyRes, req, _res) => {
              if (proxyRes.statusCode !== 200) {
                console.warn(`⚠️ xAI Proxy: ${req.method} ${req.url} -> ${proxyRes.statusCode}`);

                // Try to log the error body from x.AI
                let body = '';
                proxyRes.on('data', (chunk) => {
                  body += chunk;
                });
                proxyRes.on('end', () => {
                  try {
                    console.error('🔴 xAI Error Response:', JSON.parse(body));
                  } catch (e) {
                    console.error('🔴 xAI Error Raw:', body);
                  }
                });
              }
            });
          },
        },
        '/api': {
          target: 'https://db.sipoma.online',
          changeOrigin: true,
          secure: false, // karena SSL self-signed
          ws: true, // Enable WebSocket proxying for realtime connections
        },
      },
    },
  } as UserConfig;
});
