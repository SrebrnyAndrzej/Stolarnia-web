import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/v2",
  timeout: 30000,
  workers: 1,
  use: {
    baseURL: process.env.PAN_STOLARZ_QA_URL ?? "http://127.0.0.1:4173",
    viewport: { width: 1488, height: 1056 },
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
      args: ["--no-sandbox", "--enable-unsafe-swiftshader"],
    },
  },
});
