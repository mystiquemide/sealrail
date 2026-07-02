import { defineConfig } from "vitest/config";

export default defineConfig({
  root: import.meta.dirname,
  css: {
    postcss: {
      plugins: [],
    },
  },
  test: {
    root: import.meta.dirname,
  },
});
