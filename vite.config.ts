import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
            if (id.includes('@supabase')) {
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
            // Packing plant pages
            if (id.includes('PackingPlantPage') || id.includes('packing_plant/')) {
              return 'page-packing';
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
            if (id.includes('MainDashboardPage') || id.includes('ModernMainDashboardPage')) {
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
    include: [
      'react',
      'react-dom',
      'framer-motion',
      '@tanstack/react-query',
      '@supabase/supabase-js',
    ],
  },
});
