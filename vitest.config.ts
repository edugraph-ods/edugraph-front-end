import { defineConfig } from "vitest/config";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["src/test/setup.ts"],
    coverage: {
      enabled: false,
      provider: "v8",
    },
  },
  resolve: {
    alias: {
      "@": resolve(rootDir, "src"),
    },
  },
});
