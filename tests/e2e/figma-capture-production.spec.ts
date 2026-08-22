import { expect, test } from "playwright/test"

const captureSource = "https://mcp.figma.com/mcp/html-to-design/capture.js"

for (const path of ["/templates/checkbox-settings", "/templates/checkbox-settings#figmacapture=smoke"]) {
  test(`does not load Figma capture code in production at ${path}`, async ({ page }) => {
    let captureRequestCount = 0
    page.on("request", (request) => {
      if (request.url() === captureSource) captureRequestCount++
    })

    await page.goto(path)
    await page.waitForLoadState("networkidle")
    await expect(page.locator("#figma-capture-bootstrap")).toHaveCount(0)
    await expect(page.locator(`script[src="${captureSource}"]`)).toHaveCount(0)
    expect(captureRequestCount).toBe(0)
  })
}
