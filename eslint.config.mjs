import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
// import preact from "eslint-config-preact";
import preact from "@notwoods/eslint-config-preact";

import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    ignores: [
      "coverage/**",
      "dist/**",
      "node_modules/**",
      "playwright-report/**",
      "public/**",
      "test-results/**",
    ],
  },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  ...preact.configs.recommended,
  {
    rules: {
      "no-var": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "react/no-unescaped-entities": "off",
      // "no-console": "warn",
    },
  },
]);
