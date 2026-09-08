import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Honours the "@/*" aliases from tsconfig.json.
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      // The store and services carry the logic worth guarding.
      include: ["lib/**/*.ts"],
      exclude: [
        "lib/store/migrations.ts",
        "lib/types/**",
        // Browser-only: React hooks and the fetch wrapper, exercised against a
        // running app rather than in node.
        "lib/client/**",
        // Thin wrappers over next/headers cookies and Response.
        "lib/auth/session.ts",
        "lib/api/respond.ts",
        "lib/api/guards.ts",
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
