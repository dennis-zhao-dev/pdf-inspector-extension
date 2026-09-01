// vite.config.js
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        popup: "src/popup.html"
      }
    }
  },
  worker: {
    format: "es"
  }
});