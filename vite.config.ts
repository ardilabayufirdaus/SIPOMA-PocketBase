import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            if (
              id.includes("react") ||
              id.includes("react-dom") ||
              id.includes("react-router")
            ) {
              return "react-vendor";
            }
            if (
              id.includes("@heroicons") ||
              id.includes("lucide-react") ||
              id.includes("framer-motion")
            ) {
              return "ui-vendor";
            }
            if (id.includes("@nivo")) {
              return "charts-vendor";
            }
            if (id.includes("@supabase") || id.includes("@tanstack")) {
              return "data-vendor";
            }
            if (id.includes("crypto-js")) {
              return "crypto-vendor";
            }
            if (id.includes("xlsx") || id.includes("exceljs")) {
              return "excel-vendor";
            }
            if (id.includes("uuid") || id.includes("focus-trap")) {
              return "utils-light";
            }
            return "utils-misc";
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
