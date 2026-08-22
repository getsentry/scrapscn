import { expect, test } from "playwright/test"

test("shares and restores the Checkbox template workflow", async ({ browser, page }) => {
  await page.goto("/")
  const viewport = page.viewportSize()
  const pageFrame = page.locator('[data-slot="sentry-page-frame"]')
  const pageFrameBox = await pageFrame.boundingBox()
  const pageTitleBox = await page.getByRole("heading", { name: "Notification Settings" }).boundingBox()
  const collapsedIslandBox = await page.locator('[data-slot="playground-island"]').boundingBox()

  expect(pageFrameBox?.x).toBe(0)
  expect(pageFrameBox?.width).toBe(viewport?.width)
  expect(pageFrameBox?.height).toBeGreaterThanOrEqual(viewport?.height ?? 0)
  expect(collapsedIslandBox?.y).toBeGreaterThanOrEqual(
    (pageTitleBox?.y ?? 0) + (pageTitleBox?.height ?? 0)
  )
  await expect(pageFrame).toHaveCSS("border-radius", "0px")
  await expect(page.locator('[data-slot="playground-island"]')).toBeVisible()
  await expect(page.getByLabel("Size")).toBeHidden()
  await expect(page.getByTestId("layout-stack-separator-proof")).toHaveAttribute(
    "aria-orientation",
    "vertical"
  )
  await expect(page.getByTestId("slot-playground-outlet")).toContainText(
    "Portaled Scraps content"
  )
  await expect(page.getByTestId("slot-playground-outlet")).not.toContainText(
    "No utility content"
  )

  const initialCheckbox = page.getByRole("checkbox", { name: "Alert me about new issues" })
  const interactionTarget = initialCheckbox.locator("..")
  const interactionStateLayer = interactionTarget.locator('[role="presentation"]')
  await expect(interactionStateLayer).toHaveCSS("opacity", "0")
  await interactionTarget.hover()
  await expect(interactionStateLayer).toHaveCSS("opacity", "0.06")
  await page.mouse.down()
  await expect(interactionStateLayer).toHaveCSS("opacity", "0.09")
  await page.mouse.up()

  await page.getByRole("button", { name: "Open setup" }).click()
  await page.getByRole("button", { name: "Reset" }).click()
  await expect(page.getByRole("button", { name: "Close setup" })).toHaveAttribute("aria-expanded", "true")

  await page.getByLabel("Size").selectOption("md")
  await page.getByLabel("Label").fill("Critical regressions")
  await page.getByLabel("Checked state").selectOption("indeterminate")
  await page.getByLabel("Disabled").check()
  await page.getByLabel("Disabled").uncheck()
  await page.getByRole("button", { name: "Move Critical regressions down" }).click()

  const composedCheckbox = page.getByRole("checkbox", { name: "Critical regressions" })
  await composedCheckbox.focus()
  await page.keyboard.press("Space")
  await expect(composedCheckbox).toBeChecked()
  await expect(page.getByLabel("Size")).toBeHidden()

  await page.getByRole("button", { name: "Open setup" }).click()
  await page.getByLabel("Component or template").selectOption("/templates/checkbox-settings")
  await expect(page).toHaveURL(/\/templates\/checkbox-settings/)
  await expect(page.locator("form label")).toHaveText([
    "Issue status changes",
    "Critical regressions",
    "Weekly project report",
  ])
  await page.getByRole("button", { name: "Save changes" }).click()
  await expect(page.getByRole("status")).toContainText("Saved:")

  await page.getByRole("button", { name: "Open setup" }).click()
  await page.getByRole("button", { name: "Switch to dark theme" }).click()
  await page.getByLabel("Preview width").selectOption("mobile")
  const mobilePageFrameBox = await page.locator('[data-slot="sentry-page-frame"]').boundingBox()
  expect(mobilePageFrameBox?.width).toBe(390)
  expect(mobilePageFrameBox?.x).toBe((viewport?.width ?? 390) / 2 - 195)
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
  await restoredPage.getByRole("button", { name: "Open setup" }).click()
  await expect(restoredPage.getByLabel("Size")).toHaveValue("md")
  await expect(restoredPage.getByLabel("Label")).toHaveValue("Critical regressions")
  await expect(restoredPage.getByLabel("Preview width")).toHaveValue("mobile")
  await expect(restoredPage.locator("html")).toHaveClass(/dark/)
  await expect(restoredPage.getByRole("checkbox", { name: "Critical regressions" })).toBeChecked()
  await expect(restoredPage.locator("form label")).toHaveText([
    "Issue status changes",
    "Critical regressions",
    "Weekly project report",
  ])
  await secondContext.close()
})

test("keeps the playground and page-frame navigation usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 })
  await page.goto("/templates/checkbox-settings")
  await expect(page.getByTestId("layout-stack-separator-proof")).toHaveAttribute(
    "aria-orientation",
    "horizontal"
  )

  const collapsedIslandBox = await page.locator('[data-slot="playground-island"]').boundingBox()
  expect(collapsedIslandBox?.width).toBeLessThanOrEqual(56)
  await page.getByRole("button", { name: "Open setup" }).click()
  const sectionControlBox = await page.getByLabel("Component or template").boundingBox()
  expect(sectionControlBox?.width).toBeGreaterThan(100)
  expect(sectionControlBox?.height).toBeGreaterThanOrEqual(44)
  await expect(page.getByLabel("Component or template")).toHaveCSS("font-size", "16px")
  await page.getByLabel("Preview width").selectOption("mobile")
  const island = page.locator('[data-slot="playground-island"]')
  const islandBox = await island.boundingBox()
  const setupBox = await page.locator("#playground-setup").boundingBox()
  const toolbarBox = await page.locator('[data-slot="playground-toolbar"]').boundingBox()
  const pageFrameBox = await page.locator('[data-slot="sentry-page-frame"]').boundingBox()

  expect(islandBox?.x).toBeGreaterThanOrEqual(8)
  expect(islandBox?.width).toBeLessThanOrEqual(304)
  expect((setupBox?.y ?? 0) + (setupBox?.height ?? 0)).toBeLessThanOrEqual(toolbarBox?.y ?? 0)
  expect(pageFrameBox?.x).toBe(0)
  expect(pageFrameBox?.width).toBe(320)
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute("data-viewport", "mobile")

  await expect(page.getByLabel("Label")).toBeVisible()
  await page.getByLabel("Label").focus()
  await page.getByRole("heading", { name: "Checkbox setup" }).click()
  await expect(page.getByLabel("Label")).toBeVisible()
  await page.getByRole("heading", { name: "Notification Settings" }).click()
  await expect(page.getByLabel("Label")).toBeHidden()

  await page.getByRole("button", { name: "Open setup" }).click()
  await page.getByRole("button", { name: "Collapse setup" }).press("Tab")
  await expect(page.getByLabel("Label")).toBeHidden()
  const trigger = page.getByRole("button", { name: "Open navigation" })
  await expect(trigger).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible()
  await expect(page.getByLabel("Label")).toBeHidden()

  await page.keyboard.press("Escape")
  await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeHidden()
  await expect(trigger).toBeFocused()

  await page.getByRole("button", { name: "Open setup" }).click()
  await page.keyboard.press("Escape")
  await expect(page.getByLabel("Label")).toBeHidden()
  await expect(page.getByRole("button", { name: "Open setup" })).toBeFocused()
})
