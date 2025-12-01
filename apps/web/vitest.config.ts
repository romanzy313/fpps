import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // environment: "jsdom",
  },
  resolve: {
    alias: {
      "fflate/browser": "fflate/node",
    },
  },
});
