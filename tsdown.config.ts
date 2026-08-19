import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/next/index.tsx",
    "src/validate/index.ts",
    "src/opening-hours/index.ts",
  ],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  treeshake: true,
  target: "node18",
  platform: "neutral",
  external: ["react", "react/jsx-runtime"],
  unbundle: true,
});
