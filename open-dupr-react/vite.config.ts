import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["logo.png"],
      devOptions: {
        enabled: true,
        type: "module",
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
      },
      manifest: {
        name: "Open DUPR",
        short_name: "Open DUPR",
        description: "A clean, fast, and open-source frontend for DUPR.",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#1f2937",
        lang: "en",
        scope: "/",
        categories: ["sports", "social", "productivity"],
        orientation: "portrait-primary",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      "/api": {
        target: "https://api.dupr.gg",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
        configure: (proxy, _options) => {
          proxy.on("proxyReq", (proxyReq, req, _res) => {
            proxyReq.removeHeader("Origin");
            proxyReq.removeHeader("Referer");
            proxyReq.setHeader("Origin", "https://dashboard.dupr.com");
            proxyReq.setHeader("Referer", "https://dashboard.dupr.com/");
          });
          proxy.on("proxyRes", (proxyRes, req, _res) => {
            proxyRes.headers["Access-Control-Allow-Origin"] =
              req.headers?.origin || "*";
          });
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
