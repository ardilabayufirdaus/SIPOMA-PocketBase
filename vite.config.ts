import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const isProduction = mode === "production";

  return {
    plugins: [
      react({
        jsxRuntime: "automatic",
      }),
      VitePWA({
        registerType: "autoUpdate",
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/api\./,
              handler: "NetworkFirst",
              options: {
                cacheName: "api-cache",
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 7,
                },
              },
            },
            {
              urlPattern: /\\.(?:png|jpg|jpeg|svg|gif|webp)$/,
              handler: "CacheFirst",
              options: {
                cacheName: "images-cache",
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
              },
            },
          ],
        },
        includeAssets: [
          "favicon.ico",
          "apple-touch-icon.png",
          "masked-icon.svg",
        ],
        manifest: {
          name: "SIPOMA Management System",
          short_name: "SIPOMA",
          description: "Plant Operations Management System",
          theme_color: "#ffffff",
          background_color: "#ffffff",
          display: "standalone",
          icons: [
            {
              src: "pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
          ],
        },
      }),
    ],
    define: {
      "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      __DEV__: !isProduction,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
        "@components": path.resolve(__dirname, "src/components"),
        "@hooks": path.resolve(__dirname, "src/hooks"),
        "@utils": path.resolve(__dirname, "src/utils"),
        "@types": path.resolve(__dirname, "src/types"),
      },
    },
    server: {
      hmr: {
        overlay: false,
      },
      compress: true,
    },
    build: {
      target: "esnext",
      sourcemap: isProduction ? "hidden" : true,
      cssCodeSplit: true,
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
                id.includes("@headlessui") ||
                id.includes("framer-motion") ||
                id.includes("lucide")
              ) {
                return "ui-vendor";
              }
              if (id.includes("recharts") || id.includes("@nivo")) {
                return "charts-vendor";
              }
              if (
                id.includes("@tanstack") ||
                id.includes("xlsx") ||
                id.includes("crypto-js")
              ) {
                return "data-vendor";
              }
              if (id.includes("@supabase")) {
                return "supabase-vendor";
              }
              return "vendor";
            }

            if (id.includes("src/pages/plant-operations")) {
              return "plant-operations";
            }
            if (
              id.includes("src/components/charts") ||
              id.includes("src/hooks/useChart")
            ) {
              return "charts";
            }
            if (id.includes("src/components/dashboard")) {
              return "dashboard";
            }
            if (
              id.includes("src/hooks/useAuth") ||
              id.includes("src/hooks/useCurrentUser")
            ) {
              return "auth";
            }
          },
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name?.split(".") || [];
            const ext = info[info.length - 1];
            if (
              /\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name || "")
            ) {
              return `assets/images/[name]-[hash][extname]`;
            }
            if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name || "")) {
              return `assets/fonts/[name]-[hash][extname]`;
            }
            return `assets/[name]-[hash][extname]`;
          },
          chunkFileNames: "assets/js/[name]-[hash].js",
          entryFileNames: "assets/js/[name]-[hash].js",
        },
      },
      chunkSizeWarningLimit: 1000,
      minify: isProduction ? "terser" : false,
      terserOptions: isProduction
        ? {
            compress: {
              drop_console: true,
              drop_debugger: true,
              pure_funcs: ["console.log", "console.info", "console.debug"],
              passes: 2,
              unsafe: true,
              unsafe_comps: true,
              unsafe_Function: true,
              unsafe_math: true,
              unsafe_symbols: true,
              unsafe_methods: true,
              unsafe_proto: true,
              unsafe_regexp: true,
              unsafe_undefined: true,
            },
            mangle: {
              safari10: true,
            },
            format: {
              comments: false,
            },
          }
        : undefined,
      commonjsOptions: {
        include: [/node_modules/],
        extensions: [".js", ".cjs"],
      },
      reportCompressedSize: true,
      write: true,
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-router-dom",
        "@tanstack/react-query",
        "recharts",
        "framer-motion",
      ],
      exclude: [],
      force: isProduction,
    },
    esbuild: {
      drop: isProduction ? ["console", "debugger"] : [],
      jsxFactory: "React.createElement",
      jsxFragment: "React.Fragment",
      target: "esnext",
      minifyIdentifiers: isProduction,
      minifySyntax: isProduction,
      minifyWhitespace: isProduction,
    },
  };
});
