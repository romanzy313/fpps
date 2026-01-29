import { defineConfig } from "vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import preact from "@preact/preset-vite";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:6173",
        changeOrigin: true,
      },
    },
  },
  plugins: [
    // basicSsl(),
    preact({
      prerender: {
        enabled: true,
        renderTarget: "#app",
        additionalPrerenderRoutes: ["/404", "/room"],
        previewMiddlewareEnabled: true,
        previewMiddlewareFallback: "/404",
      },
    }),
  ],
});
