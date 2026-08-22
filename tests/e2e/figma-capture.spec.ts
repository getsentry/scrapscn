import { expect, test } from "playwright/test"

const captureSource = "https://mcp.figma.com/mcp/html-to-design/capture.js"
const captureScript = `script[src="${captureSource}"]`

test("loads the Figma capture script only for an opted-in development visit", async ({ browser, page }) => {
  let normalRequestCount = 0
  page.on("request", (request) => {
    if (request.url() === captureSource) normalRequestCount++
  })
  await page.goto("/templates/checkbox-settings")
  await expect(page.locator(captureScript)).toHaveCount(0)
  expect(normalRequestCount).toBe(0)

  const captureContext = await browser.newContext({ ignoreHTTPSErrors: true })
  const capturePage = await captureContext.newPage()
  let captureRequestCount = 0
  capturePage.on("request", (request) => {
    if (request.url() === captureSource) captureRequestCount++
  })
  await capturePage.goto("/templates/checkbox-settings#figmacapture=smoke")
  await expect(capturePage.locator(captureScript)).toHaveCount(1)
  await expect.poll(() => captureRequestCount).toBe(1)
  await captureContext.close()
})
