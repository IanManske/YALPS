import { defineConfig } from "tsup"

const entry = ["src/index.ts"]

export default defineConfig([
  {
    entry,
    format: ["esm", "cjs"],
    sourcemap: true,
    dts: true,
    clean: true,
  },
  {
    entry,
    format: "esm",
    outExtension: () => ({ js: ".min.module.js" }),
    sourcemap: true,
    minify: true,
  },
  {
    entry,
    format: "iife",
    outExtension: () => ({ js: ".min.js" }),
    globalName: "YALPS",
    sourcemap: true,
    minify: true,
  },
])
