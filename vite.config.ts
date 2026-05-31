import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      // SVG favicon + Apple touch icon are static assets we ship as-is.
      includeAssets: ["synapse.svg", "apple-touch-icon.png"],
      manifest: {
        name: "SynapTech SpA — Red Sináptica",
        short_name: "SynapTech",
        description:
          "Dashboard interactivo del portafolio de SynapTech SpA como una red de conexiones sinápticas.",
        lang: "es",
        theme_color: "#09090b",
        background_color: "#09090b",
        display: "standalone",
        orientation: "any",
        start_url: "/",
        scope: "/",
        categories: ["business", "productivity"],
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
          {
            src: "pwa-maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // Precache the app shell + assets, and serve index.html for SPA routes.
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff,woff2}"],
        navigateFallback: "index.html",
        // Cache the Google Fonts used by the UI for offline use.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === "https://fonts.googleapis.com",
            handler: "StaleWhileRevalidate",
            options: { cacheName: "google-fonts-stylesheets" },
          },
          {
            urlPattern: ({ url }) => url.origin === "https://fonts.gstatic.com",
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-webfonts",
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        // Enable the service worker in `vite dev` for local PWA testing.
        enabled: true,
      },
    }),
  ],
});
