import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    plugins: [react()],
    define: {
      "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    server: {
      hmr: {
        overlay: false,
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // Core React libraries
            "react-vendor": ["react", "react-dom", "react-router-dom"],
            // UI libraries
            "ui-vendor": [
              "@headlessui/react",
              "@heroicons/react",
              "framer-motion",
              "lucide-react",
            ],
            // Chart libraries
            "charts-vendor": [
              "recharts",
              "@nivo/core",
              "@nivo/bar",
              "@nivo/line",
              "@nivo/pie",
            ],
            // Data and utilities
            "data-vendor": [
              "@tanstack/react-query",
              "xlsx",
              "html2canvas",
              "crypto-js",
              "uuid",
            ],
            // Supabase
            "supabase-vendor": ["@supabase/supabase-js"],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: mode === "production",
          drop_debugger: mode === "production",
        },
      },
    },
  };
});
