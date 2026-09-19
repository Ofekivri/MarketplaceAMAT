import { defineConfig, devices } from "@playwright/test";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set to run the tests. They write to this database, " +
      "so point it at a scratch one — not at anything you care about.",
  );
}

export default defineConfig({
  testDir: "./tests",
  // The suite shares one database, and several tests assert on row counts.
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Normally Playwright uses the browser it downloaded itself. Set
        // CHROMIUM_PATH to point at an already-approved Chrome/Chromium
        // instead, for build agents that cannot download one.
        launchOptions: process.env.CHROMIUM_PATH
          ? { executablePath: process.env.CHROMIUM_PATH }
          : {},
      },
    },
  ],
  webServer: {
    // CI has already run the build, so exercise the production server there.
    command: process.env.CI ? "npm start" : "npm run dev",
    url: "http://localhost:3000/login",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
