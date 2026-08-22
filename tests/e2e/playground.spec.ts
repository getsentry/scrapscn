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

test("restores every workbench state when navigating Back and Forward", async ({ page }) => {
  await page.goto(
    "/?component=checkbox&checked=true&disabled=true&items=new-issues%2Cissue-status&label=Back+state&selected=issue-status&size=md&theme=dark&viewport=mobile"
  )
  await page.getByRole("button", { name: "Open setup" }).click()
  await page.getByLabel("Component or template").selectOption("drag-handle")
  await expect(page.getByRole("heading", { name: "Drag Handle", exact: true })).toBeVisible()
  await page.getByLabel("Orientation").selectOption("vertical")
  await page.getByLabel("Variant").selectOption("ghost")
  await page.getByLabel("Value").fill("150")

  await page.goBack()
  await expect(page).toHaveURL(/component=checkbox/)
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute("data-component", "checkbox")
  await expect(page.getByRole("heading", { name: "Notification Settings" })).toBeVisible()
  await expect(page.getByLabel("Component or template")).toHaveValue("checkbox")
  await expect(page.getByLabel("Size")).toHaveValue("md")
  await expect(page.getByLabel("Label")).toHaveValue("Back state")
  await expect(page.getByLabel("Disabled")).toBeChecked()
  await expect(page.getByLabel("Preview width")).toHaveValue("mobile")
  await expect(page.locator("html")).toHaveClass(/dark/)
  await expect(page.locator("form label")).toHaveText(["Back state", "Issue status changes"])

  await page.goForward()
  await expect(page).toHaveURL(/component=drag-handle/)
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute("data-component", "drag-handle")
  await expect(page.getByRole("heading", { name: "Drag Handle", exact: true })).toBeVisible()
  await expect(page.getByLabel("Component or template")).toHaveValue("drag-handle")
  await expect(page.getByLabel("Orientation")).toHaveValue("vertical")
  await expect(page.getByLabel("Variant")).toHaveValue("ghost")
  await expect(page.getByLabel("Value")).toHaveValue("150")
  await expect(page.getByLabel("Preview width")).toHaveValue("mobile")
  await expect(page.locator("html")).toHaveClass(/dark/)
})

test("restores the system theme when history has no theme override", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" })
  await page.goto("/?component=checkbox")
  await page.getByRole("button", { name: "Open setup" }).click()
  const themeButton = page.getByRole("button", { name: /Switch to (dark|light) theme/ })

  await expect(page).not.toHaveURL(/theme=/)
  await expect(page.locator("html")).not.toHaveClass(/dark/)
  await expect(themeButton).toHaveAccessibleName("Switch to dark theme")

  await page.evaluate(() => {
    window.history.pushState(null, "", "/?component=checkbox&theme=dark")
    window.dispatchEvent(new PopStateEvent("popstate"))
  })
  await expect(page.locator("html")).toHaveClass(/dark/)
  await expect(themeButton).toHaveAccessibleName("Switch to light theme")

  await page.evaluate(() => {
    window.history.pushState(null, "", "/?component=checkbox&theme=light")
    window.dispatchEvent(new PopStateEvent("popstate"))
  })
  await expect(page.locator("html")).not.toHaveClass(/dark/)
  await expect(themeButton).toHaveAccessibleName("Switch to dark theme")

  await page.goBack()
  await expect(page).toHaveURL(/theme=dark/)
  await expect(page.locator("html")).toHaveClass(/dark/)
  await expect(themeButton).toHaveAccessibleName("Switch to light theme")

  await page.goBack()
  await expect(page).not.toHaveURL(/theme=/)
  await expect(page.locator("html")).not.toHaveClass(/dark/)
  await expect(themeButton).toHaveAccessibleName("Switch to dark theme")

  await page.goForward()
  await expect(page).toHaveURL(/theme=dark/)
  await expect(page.locator("html")).toHaveClass(/dark/)
  await expect(themeButton).toHaveAccessibleName("Switch to light theme")

  await page.goForward()
  await expect(page).toHaveURL(/theme=light/)
  await expect(page.locator("html")).not.toHaveClass(/dark/)
  await expect(themeButton).toHaveAccessibleName("Switch to dark theme")
})

test("keeps a horizontal maximum usable at a 320px viewport", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 })
  await page.goto(
    "/?component=drag-handle&dragHandleOrientation=horizontal&dragHandleSize=320"
  )

  const handle = page.getByRole("separator", { name: "Adjust drag pane width" })
  await expect.poll(async () => Number(await handle.getAttribute("aria-valuemax"))).toBeLessThan(320)
  const effectiveMaximum = Number(await handle.getAttribute("aria-valuemax"))
  expect(effectiveMaximum).toBeGreaterThanOrEqual(100)
  await expect(handle).toHaveAttribute("aria-valuenow", String(effectiveMaximum))
  await expect(page).toHaveURL(new RegExp(`dragHandleSize=${effectiveMaximum}`))

  const frameBox = await page.getByTestId("drag-handle-frame").boundingBox()
  const handleBox = await handle.boundingBox()
  const flexiblePaneBox = await page.getByTestId("drag-handle-flexible-pane").boundingBox()
  if (!frameBox || !handleBox || !flexiblePaneBox) throw new Error("Responsive drag panes are not visible")
  expect(handleBox.x).toBeGreaterThan(0)
  expect(handleBox.x).toBeLessThan(320)
  expect(flexiblePaneBox.width).toBeGreaterThanOrEqual(64)
  expect(flexiblePaneBox.x).toBeGreaterThanOrEqual(frameBox.x)
  expect(flexiblePaneBox.x + flexiblePaneBox.width).toBeLessThanOrEqual(frameBox.x + frameBox.width)

  await handle.focus()
  await page.keyboard.press("ArrowLeft")
  const horizontalValue = effectiveMaximum - 10
  await expect(handle).toHaveAttribute("aria-valuenow", String(horizontalValue))
  await expect(page).toHaveURL(new RegExp(`dragHandleSize=${horizontalValue}`))

  await page.evaluate(() => {
    window.history.pushState(
      null,
      "",
      "/?component=drag-handle&dragHandleOrientation=vertical&dragHandleSize=300"
    )
    window.dispatchEvent(new PopStateEvent("popstate"))
  })
  let restoredHandle = page.getByRole("separator", { name: "Adjust drag pane height" })
  await expect(restoredHandle).toHaveAttribute("aria-valuemax", "320")
  await expect(restoredHandle).toHaveAttribute("aria-valuenow", "300")

  await page.goBack()
  restoredHandle = page.getByRole("separator", { name: "Adjust drag pane width" })
  await expect(restoredHandle).toHaveAttribute("aria-valuemax", String(effectiveMaximum))
  await expect(restoredHandle).toHaveAttribute("aria-valuenow", String(horizontalValue))

  await page.goForward()
  restoredHandle = page.getByRole("separator", { name: "Adjust drag pane height" })
  await expect(restoredHandle).toHaveAttribute("aria-valuemax", "320")
  await expect(restoredHandle).toHaveAttribute("aria-valuenow", "300")
  await expect(page).toHaveURL(/dragHandleSize=300/)
})

test("configures, shares, restores, drags, and arrows the Drag Handle workbench", async ({ browser, page }) => {
  await page.goto("/?component=drag-handle")
  await expect(page.getByRole("heading", { name: "Drag Handle", exact: true })).toBeVisible()
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute("data-component", "drag-handle")

  await page.getByRole("button", { name: "Open setup" }).click()
  const componentSelect = page.getByLabel("Component or template")
  await expect(componentSelect).toHaveValue("drag-handle")
  await expect(componentSelect.locator('option[value="checkbox"]')).toHaveText("Checkbox")
  await expect(componentSelect.locator('option[value="drag-handle"]')).toHaveText("Drag Handle")
  await expect(page.locator('[data-slot="playground-island"]')).toHaveCSS("z-index", "10000")
  await expect(page.getByRole("heading", { name: "Drag Handle setup" })).toBeVisible()
  await expect(page.getByLabel("Orientation")).toHaveValue("horizontal")
  await expect(page.getByLabel("Variant")).toHaveValue("solid")
  await expect(page.getByLabel("Value")).toHaveValue("180")

  let handle = page.getByRole("separator", { name: "Adjust drag pane width" })
  await expect(handle).toHaveAttribute("aria-orientation", "vertical")
  await expect(handle).toHaveAttribute("aria-valuemin", "100")
  await expect(handle).toHaveAttribute("aria-valuemax", "320")
  await expect(page.getByTestId("drag-handle-size")).toHaveText("Sized pane width: 180px")
  await expect(handle).toHaveCSS("border-left-width", "1px")
  expect(await handle.evaluate((element) => getComputedStyle(element, "::before").width)).toBe("24px")
  expect(await handle.evaluate((element) => getComputedStyle(element, "::after").width)).toBe("4px")
  expect(await handle.evaluate((element) => getComputedStyle(element, "::before").cursor)).toBe("ew-resize")

  await page.getByLabel("Orientation").selectOption("vertical")
  await page.getByLabel("Variant").selectOption("ghost")
  await page.getByLabel("Value").fill("160")
  await expect(page).toHaveURL(/component=drag-handle/)
  await expect(page).toHaveURL(/dragHandleOrientation=vertical/)
  await expect(page).toHaveURL(/dragHandleVariant=ghost/)
  await expect(page).toHaveURL(/dragHandleSize=160/)
  await expect(page.getByRole("button", { name: "Share" })).toBeVisible()
  await page.getByRole("button", { name: "Share" }).click()
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText())
  expect(sharedUrl).toContain("/?component=drag-handle")
  expect(sharedUrl).not.toContain("/templates/checkbox-settings")

  const restoredContext = await browser.newContext({
    ignoreHTTPSErrors: true,
    permissions: ["clipboard-read", "clipboard-write"],
  })
  const restoredPage = await restoredContext.newPage()
  await restoredPage.goto(sharedUrl)
  await restoredPage.getByRole("button", { name: "Open setup" }).click()
  await expect(restoredPage.getByLabel("Component or template")).toHaveValue("drag-handle")
  await expect(restoredPage.getByLabel("Orientation")).toHaveValue("vertical")
  await expect(restoredPage.getByLabel("Variant")).toHaveValue("ghost")
  await expect(restoredPage.getByLabel("Value")).toHaveValue("160")
  await restoredPage.getByRole("button", { name: "Close setup" }).click()

  handle = restoredPage.getByRole("separator", { name: "Adjust drag pane height" })
  await expect(handle).toHaveAttribute("aria-orientation", "horizontal")
  await expect(handle).toHaveAttribute("data-orientation", "vertical")
  await expect(handle).toHaveAttribute("data-variant", "ghost")
  await expect(restoredPage.getByTestId("drag-handle-size")).toHaveText("Sized pane height: 160px")
  await expect(handle).toHaveCSS("border-top-width", "1px")
  expect(await handle.evaluate((element) => getComputedStyle(element, "::before").height)).toBe("24px")
  expect(await handle.evaluate((element) => getComputedStyle(element, "::after").height)).toBe("4px")
  expect(await handle.evaluate((element) => getComputedStyle(element, "::before").cursor)).toBe("ns-resize")

  const box = await handle.boundingBox()
  if (!box) throw new Error("Drag handle is not visible")
  const initialAccent = await handle.evaluate((element) => getComputedStyle(element, "::after").backgroundColor)
  await restoredPage.mouse.move(box.x + 24, box.y)
  const hoveredAccent = await handle.evaluate((element) => getComputedStyle(element, "::after").backgroundColor)
  expect(hoveredAccent).not.toBe(initialAccent)
  await restoredPage.mouse.down()
  await restoredPage.mouse.move(box.x + 24, box.y + 25)
  await restoredPage.mouse.up()
  await expect(restoredPage.getByTestId("drag-handle-size")).toHaveText("Sized pane height: 185px")

  await handle.focus()
  await restoredPage.keyboard.press("ArrowUp")
  await expect(handle).toHaveCSS("outline-width", "2px")
  expect(await handle.evaluate((element) => element.matches(":focus-visible"))).toBe(true)
  await restoredPage.keyboard.press("Shift+ArrowDown")
  await expect(restoredPage.getByTestId("drag-handle-size")).toHaveText("Sized pane height: 225px")
  await expect(restoredPage).toHaveURL(/dragHandleSize=225/)

  await restoredPage.getByRole("button", { name: "Open setup" }).click()
  await restoredPage.getByRole("button", { name: "Reset" }).click()
  await expect(restoredPage.getByLabel("Component or template")).toHaveValue("drag-handle")
  await expect(restoredPage.getByLabel("Orientation")).toHaveValue("horizontal")
  await expect(restoredPage.getByLabel("Variant")).toHaveValue("solid")
  await expect(restoredPage.getByLabel("Value")).toHaveValue("180")
  await expect(restoredPage).toHaveURL(/component=drag-handle/)
  await restoredContext.close()
})
