import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    testTimeout: 30_000,
    coverage: {
      provider: "v8",
      thresholds: {
        lines: 95,
        functions: 95,
        branches: 95,
        statements: 95,
        perFile: true,
      },
      include: ["src"],
      exclude: ["src/constraint.ts"],
    },
  },
})
