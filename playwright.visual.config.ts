import { defineConfig } from "playwright/test";

import { e2eBaseURL } from "./playwright.config";

export default defineConfig({
  expect: {
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
      scale: "css",
    },
  },
  fullyParallel: false,
  snapshotPathTemplate: "{testDir}/__screenshots__/{testFilePath}/{arg}{ext}",
  testDir: "./tests/visual",
  timeout: 30_000,
  use: {
    baseURL: e2eBaseURL,
    browserName: "chromium",
    deviceScaleFactor: 1,
    ignoreHTTPSErrors: true,
    locale: "en-US",
    timezoneId: "UTC",
    trace: "retain-on-failure",
  },
  workers: 1,
});
