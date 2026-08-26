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
      // Attempt to fetch using broader filter for robustness (contains "xai")
      const record = await pb.collection('api_key').getFirstListItem('provider ~ "xai"');
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
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MiB limit for larger vendor chunks
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
          background_color: '#0f172a',
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
              // React Core & Router - High Priority
              if (
                id.includes('/react/') ||
                id.includes('/react-dom/') ||
                id.includes('/scheduler/') ||
                id.includes('/react-router/') ||
                id.includes('/react-router-dom/') ||
                id.includes('/@remix-run/')
              ) {
                return 'vendor-react';
              }
              // Heavy export libraries
              if (id.includes('exceljs') || id.includes('xlsx') || id.includes('file-saver')) {
                return 'vendor-excel';
              }
              if (id.includes('jspdf') || id.includes('html2canvas')) {
                return 'vendor-pdf';
              }
              // Database & API
              if (
                id.includes('pocketbase') ||
                id.includes('@tanstack/react-query') ||
                id.includes('zustand')
              ) {
                return 'vendor-data';
              }
              // UI Icons & Animation
              if (
                id.includes('lucide-react') ||
                id.includes('@heroicons') ||
                id.includes('framer-motion')
              ) {
                return 'vendor-ui';
              }
              // Charts
              if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
                return 'vendor-charts';
              }
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
          target: 'http://172.18.6.98:8090',
          changeOrigin: true,
          secure: false,
          ws: true,
        },
      },
    },
  } as UserConfig;
});
