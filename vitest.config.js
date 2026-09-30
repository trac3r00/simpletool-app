import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      // Playwright specs live under tests/**; keep them out of Vitest collection.
      "**/tests/**/*.spec.*",
      "**/tests/e2e/**",
      // Git worktrees under this path carry their own copies of the suite
      // (including suites from already-merged branches). Collecting them
      // inflated local runs to ~2.5x the real test count and reported
      // duplicate suites; CI never saw them because checkout leaves the
      // gitlink dirs empty.
      "**/.bob-worker-worktrees/**",
      "**/.{idea,git,cache,output,temp}/**",
      "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*",
    ],
  },
});
