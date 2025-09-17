import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // React ecosystem - keep all React-related packages together
            if (
              id.includes('react') ||
              id.includes('@react-spring') ||
              id.includes('@use-gesture') ||
              id.includes('react-error-boundary') ||
              id.includes('react-transition-group') ||
              id.includes('react-is') ||
              id.includes('scheduler') ||
              id.includes('focus-trap-react') ||
              id.includes('@heroicons') ||
              id.includes('framer-motion')
            ) {
              return 'react-vendor';
            }
            if (id.includes('@nivo')) {
              return 'charts-vendor';
            }
            if (id.includes('@supabase') || id.includes('@tanstack')) {
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
            return 'utils-misc';
          }
          // Handle utils files that contain React components
          if (id.includes('/utils/') && (id.includes('ResponsiveLayout') || id.includes('Microinteractions'))) {
            return 'react-vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
