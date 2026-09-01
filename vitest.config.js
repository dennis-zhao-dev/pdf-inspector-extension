import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["tests/unit/**/*.test.js", "tests/integration/**/*.test.js"],
    coverage: {
      include: ["src/editor.js", "src/markdown-format.js", "src/markdown-preview.js"]
    }
  }
});
