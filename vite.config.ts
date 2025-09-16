import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { splitVendorChunkPlugin } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), splitVendorChunkPlugin()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "ui-vendor": [
            "@headlessui/react",
            "@heroicons/react",
            "framer-motion",
          ],
          "charts-vendor": [
            "@nivo/bar",
            "@nivo/core",
            "@nivo/line",
            "@nivo/pie",
            "recharts",
          ],
          "data-vendor": ["@supabase/supabase-js", "@tanstack/react-query"],
          "utils-vendor": ["clsx", "crypto-js", "uuid", "xlsx", "html2canvas"],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
    reportCompressedSize: false,
  },
});
