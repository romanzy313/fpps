import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // environment: "jsdom",
    include: ["web/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "fflate/browser": "fflate/node",
    },
  },
});
