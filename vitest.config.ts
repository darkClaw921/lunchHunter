import { defineConfig } from "vitest/config";
import path from "node:path";

/**
 * Vitest configuration for unit tests.
 * - Uses Node environment (most of our tested units are pure/library code).
 * - `@/*` path alias mirrors tsconfig.json so tests can import from src.
 * - Only picks up files under `tests/unit/**` and `src/**\/*.test.ts` — keeps e2e
 *   specs (under `e2e/`) out of the unit-test runner.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts", "src/**/*.test.ts"],
    exclude: ["node_modules", ".next", "e2e", "dist"],
    globals: false,
    passWithNoTests: false,
  },
});
