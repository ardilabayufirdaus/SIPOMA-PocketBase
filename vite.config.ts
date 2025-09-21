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
            // Keep utility components in utils-misc with other utilities
            if (id.includes('ResponsiveLayout') || id.includes('Microinteractions')) {
              return 'utils-misc';
            }
            return 'utils-misc';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
