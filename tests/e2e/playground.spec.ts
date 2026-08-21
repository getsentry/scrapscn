import { expect, test } from "playwright/test"

test("shares and restores the Checkbox template workflow", async ({ browser, page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: "Reset" }).click()

  await page.getByLabel("Size").selectOption("md")
  await page.getByLabel("Label").fill("Critical regressions")
  await page.getByLabel("Checked state").selectOption("indeterminate")
  await page.getByLabel("Disabled").check()
  await page.getByLabel("Disabled").uncheck()
  await page.getByRole("button", { name: "Move Alert me about new issues down" }).click()

  const composedCheckbox = page.getByRole("checkbox", { name: "Critical regressions" })
  await composedCheckbox.focus()
  await page.keyboard.press("Space")
  await expect(composedCheckbox).toBeChecked()

  await page.getByRole("link", { name: "Checkbox settings" }).click()
  await expect(page).toHaveURL(/\/templates\/checkbox-settings/)
  await page.getByRole("button", { name: "Save changes" }).click()
  await expect(page.getByRole("status")).toContainText("Saved:")

  await page.getByRole("button", { name: "Switch to dark theme" }).click()
  await page.getByLabel("Preview width").selectOption("mobile")
  await page.getByRole("button", { name: "Share" }).click()
  await expect(page.getByRole("button", { name: "Copied" })).toBeVisible()
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText())
  expect(sharedUrl).toContain("/templates/checkbox-settings?")

  const secondContext = await browser.newContext({
    ignoreHTTPSErrors: true,
    permissions: ["clipboard-read", "clipboard-write"],
  })
  const restoredPage = await secondContext.newPage()
  await restoredPage.goto(sharedUrl)
  await expect(restoredPage.getByLabel("Size")).toHaveValue("md")
  await expect(restoredPage.getByLabel("Label")).toHaveValue("Critical regressions")
  await expect(restoredPage.getByLabel("Preview width")).toHaveValue("mobile")
  await expect(restoredPage.locator("html")).toHaveClass(/dark/)
  await expect(restoredPage.getByRole("checkbox", { name: "Critical regressions" })).toBeChecked()
  await secondContext.close()
})

test("keeps the playground and page-frame navigation usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/templates/checkbox-settings")

  const playgroundTitle = page.getByRole("heading", { name: "Scrapscn playground" })
  const playgroundDescription = page.getByText("Build regular Scraps screens without the monolith.")
  const playgroundNavigation = page.getByRole("navigation", { name: "Playground sections" })
  const titleBox = await playgroundTitle.boundingBox()
  const descriptionBox = await playgroundDescription.boundingBox()
  const navigationBox = await playgroundNavigation.boundingBox()

  expect(titleBox?.width).toBeGreaterThan(200)
  expect(navigationBox?.y).toBeGreaterThanOrEqual(
    (descriptionBox?.y ?? 0) + (descriptionBox?.height ?? 0) + 12
  )

  const trigger = page.getByRole("button", { name: "Open navigation" })
  await trigger.scrollIntoViewIfNeeded()
  const triggerBox = await trigger.boundingBox()
  if (!triggerBox) throw new Error("Mobile navigation trigger is not visible")
  await page.mouse.click(triggerBox.x + triggerBox.width / 2, triggerBox.y + triggerBox.height / 2)
  await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible()

  await page.keyboard.press("Escape")
  await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeHidden()
  await expect(trigger).toBeFocused()
})
