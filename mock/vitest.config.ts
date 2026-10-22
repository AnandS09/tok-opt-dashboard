import { defineConfig } from "vitest/config";

// Unit tests run in node, against the real fixture files (see the smoke test).
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
