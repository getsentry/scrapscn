import { defineConfig } from "playwright/test"

const serviceName = process.env.SCRAPSCN_E2E_NAME
if (!serviceName) throw new Error("Run Playwright through pnpm test:playground")
const baseURL = `https://${serviceName}.localhost`

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL,
    ignoreHTTPSErrors: true,
    permissions: ["clipboard-read", "clipboard-write"],
    trace: "retain-on-failure",
  },
  webServer: {
    command: `portless ${serviceName} pnpm start`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 30_000,
    gracefulShutdown: { signal: "SIGTERM", timeout: 5_000 },
    ignoreHTTPSErrors: true,
  },
})
