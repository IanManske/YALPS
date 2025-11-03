import globals from "globals"
import eslint from "@eslint/js"
import tseslint from "typescript-eslint"
import prettierConfig from "eslint-config-prettier"
import { defineConfig, globalIgnores } from "eslint/config"

export default defineConfig([
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        projectService: true,
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: "error",
      reportUnusedInlineConfigs: "error",
    },
  },
  globalIgnores(["**/.tsimp", "**/dist/", "**/coverage/"]),
  {
    files: ["**/*.ts"],
    extends: [eslint.configs.recommended, tseslint.configs.strictTypeChecked, tseslint.configs.stylisticTypeChecked],
    rules: {
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/prefer-for-of": "off",
      "@typescript-eslint/no-unsafe-type-assertion": "error",
      "@typescript-eslint/prefer-readonly": "error",
      "@typescript-eslint/require-array-sort-compare": "error",
    },
  },
  {
    files: ["**/tests/**/*.ts", "**/benchmarks/**/*.ts"],
    rules: {
      "@typescript-eslint/no-unsafe-type-assertion": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
  prettierConfig,
])
