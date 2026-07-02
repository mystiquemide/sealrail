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
    // Test files share service-level state (in-memory DB resets, config overrides),
    // so they must run sequentially. Parallel workers produce spurious cross-file failures.
    fileParallelism: false,
  },
});
