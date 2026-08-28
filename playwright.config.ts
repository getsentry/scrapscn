import { defineConfig } from "playwright/test";

const baseURL = process.env.SCRAPSCN_E2E_BASE_URL;
if (!baseURL) throw new Error("Run Playwright through a package test script");
const parsedBaseURL = new URL(baseURL);
const port = Number(parsedBaseURL.port);
if (
  parsedBaseURL.protocol !== "http:" ||
  parsedBaseURL.hostname !== "127.0.0.1" ||
  parsedBaseURL.pathname !== "/" ||
  parsedBaseURL.search ||
  parsedBaseURL.hash ||
  !Number.isInteger(port) ||
  port < 1 ||
  port > 65535
) {
  throw new Error("Invalid end-to-end base URL");
}

export const e2eBaseURL = baseURL;

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
});
