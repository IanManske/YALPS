import { defineConfig } from "tsup"

export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    sourcemap: true,
    dts: true,
    clean: true,
  },
  {
    entry: ["src/index.ts"],
    format: "esm",
    outExtension: () => ({ js: ".min.module.js" }),
    sourcemap: true,
    minify: true,
  },
  {
    entry: ["src/index.ts"],
    format: "iife",
    outExtension: () => ({ js: ".min.js" }),
    globalName: "YALPS",
    sourcemap: true,
    minify: true,
  },
])
