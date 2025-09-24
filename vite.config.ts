import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Enable build cache for faster rebuilds
    watch: null,
    // Use esbuild for faster minification
    minify: 'esbuild',
    cssMinify: 'esbuild',
    // Disable compressed size reporting for faster builds
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('@supabase')) {
              return 'data-vendor';
            }
            if (id.includes('crypto-js')) {
              return 'crypto-vendor';
            }
            if (id.includes('xlsx') || id.includes('exceljs')) {
              return 'excel-vendor';
            }
            if (id.includes('uuid') || id.includes('focus-trap')) {
              return 'utils-light';
            }
            // Separate chart libraries
            if (
              id.includes('chart.js') ||
              id.includes('react-chartjs-2') ||
              id.includes('recharts')
            ) {
              return 'charts-vendor';
            }
            // Separate UI libraries
            if (
              id.includes('@heroicons') ||
              id.includes('lucide-react') ||
              id.includes('framer-motion')
            ) {
              return 'ui-vendor';
            }
            // Separate form/query libraries
            if (id.includes('@tanstack/react-query') || id.includes('react-hook-form')) {
              return 'query-vendor';
            }
            // Separate date/time utilities
            if (id.includes('date-fns') || id.includes('dayjs') || id.includes('moment')) {
              return 'date-vendor';
            }
            // Keep utility components in utils-misc with other utilities
            if (id.includes('ResponsiveLayout') || id.includes('Microinteractions')) {
              return 'utils-misc';
            }
            return 'utils-misc';
          }

          // Split large application chunks
          if (id.includes('components/plant-operations')) {
            return 'plant-ops-components';
          }
          if (id.includes('components/packing-plant')) {
            return 'packing-components';
          }
          if (id.includes('components/charts') || id.includes('Chart')) {
            return 'chart-components';
          }
          if (id.includes('hooks/use') && id.includes('Data')) {
            return 'data-hooks';
          }
          if (
            id.includes('utils/') &&
            !id.includes('permissions') &&
            !id.includes('Microinteractions')
          ) {
            return 'app-utils';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    // Enable source maps for production debugging
    sourcemap: false,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'framer-motion',
      '@tanstack/react-query',
      '@supabase/supabase-js',
    ],
  },
});
