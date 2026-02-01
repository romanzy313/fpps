import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
// import preact from "eslint-config-preact";
import preact from "@notwoods/eslint-config-preact";

import { defineConfig } from "eslint/config";

export default defineConfig([
  eslint.configs.recommended,
  tseslint.configs.recommended,
  ...preact.configs.recommended,
  {
    ignores: ["node_modules/**", "dist/**", "public/**"],
  },
  {
    // rules: {
    //   "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    //   "no-explicit-any": "warn",
    //   "no-console": "warn",
    // },
    rules: {
      "no-unused-vars": "off",
      "no-var": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "react/no-unescaped-entities": "off",
      // "no-console": "warn",
    },
  },
]);
