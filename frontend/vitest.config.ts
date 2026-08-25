import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "~": `${import.meta.dirname}/app`,
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./app/test/setup.ts"],
    include: ["app/**/*.test.{ts,tsx}"],
  },
});
