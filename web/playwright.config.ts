import { defineConfig } from "@playwright/test";

// Browser suite for the officer and visitor flows. Runs against the dev
// server, reusing one already running on the port. The system Chrome is
// launched directly so no browser binaries are downloaded into the machine
// cache; override PW_EXECUTABLE to point elsewhere if needed.
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    viewport: { width: 1280, height: 900 },
    launchOptions: {
      executablePath: process.env.PW_EXECUTABLE ?? "/usr/bin/google-chrome",
    },
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
