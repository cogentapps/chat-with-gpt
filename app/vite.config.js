import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(() => {
  return {
    server: {
      proxy: {
        "/chatapi": {
          target: "http://localhost:3001",
          secure: false,
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: "build",
      target: "es2020",
      sourcemap: true,
    },
    esbuild: {
      target: "es2020",
    },
    resolve: {
      alias: {
        "@ffmpeg/ffmpeg": "./src/stub.js",
      },
    },
    plugins: [
      react({
        babel: {
          plugins: [
            [
              "formatjs",
              {
                idInterpolationPattern: "[sha512:contenthash:base64:6]",
                ast: true,
              },
            ],
          ],
        },
      }),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.ico", "lang/*.json"],
        manifest: {
          short_name: "Chat with GPT",
          name: "Chat with GPT",
          start_url: ".",
          display: "standalone",
          theme_color: "#000000",
          background_color: "#ffffff",
          icons: [
            {
              src: "logo192.png",
              type: "image/png",
              sizes: "192x192",
            },
            {
              src: "logo512.png",
              type: "image/png",
              sizes: "512x512",
            },
          ],
        },
        workbox: {
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "google-fonts-cache",
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "gstatic-fonts-cache",
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/cdnjs\.cloudflare\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "cloudflare-js-cdn",
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "jsdelivr-cdn",
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
      }),
    ],
  };
});
