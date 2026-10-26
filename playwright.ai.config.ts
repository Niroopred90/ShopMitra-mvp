import { defineConfig } from "@playwright/test";

// Offline validation only: no browser, app server, database, or provider key required.
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: ["ai-validation.spec.ts", "ai-evaluation.spec.ts"],
  forbidOnly: Boolean(process.env.CI),
  workers: 1,
  reporter: "list",
});
