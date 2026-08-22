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

test("configures, resizes, sorts, shares, and restores the Table workbench", async ({ browser, page }) => {
  await page.goto("/?component=table")
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute("data-component", "table")
  await expect(page.getByRole("heading", { name: "Table", exact: true })).toBeVisible()

  const table = page.getByRole("table", { name: "Issue stream" })
  await expect(table).toHaveCSS("display", "grid")
  await expect.poll(() => table.evaluate((element) => element.style.gridTemplateColumns)).toBe("220px 120px minmax(90px, auto)")
  await expect(page.getByRole("columnheader", { name: "Events" })).toHaveAttribute("aria-sort", "descending")
  await expect(page.getByRole("separator")).toHaveCount(2)

  await page.getByRole("button", { name: "Open setup" }).click()
  await expect(page.getByLabel("Component or template")).toHaveValue("table")
  await page.getByLabel("Minimum column width").fill("100")
  await page.getByLabel("Rows").fill("3")
  await page.getByLabel("Sort column").selectOption("issue")
  await page.getByLabel("Sort direction").selectOption("asc")
  await page.reload()
  await page.getByRole("button", { name: "Open setup" }).click()
  await expect(page.getByLabel("Minimum column width")).toHaveValue("100")
  await expect(page.getByLabel("Rows")).toHaveValue("3")
  await expect(page.getByLabel("Sort column")).toHaveValue("issue")
  await page.getByLabel("Component or template").selectOption("checkbox")
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute("data-component", "checkbox")
  await page.goBack()
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute("data-component", "table")
  await expect(page.getByLabel("Minimum column width")).toHaveValue("100")
  await page.goForward()
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute("data-component", "checkbox")
  await page.goBack()
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute("data-component", "table")
  await page.getByRole("button", { name: "Close setup" }).click()
  await expect(page.getByRole("columnheader", { name: "Issue" })).toHaveAttribute("aria-sort", "ascending")
  await expect(page.getByRole("cell", { name: "Authentication token refresh failed" })).toBeVisible()

  let issueHandle = page.getByRole("separator", { name: "Issue" })
  await issueHandle.focus()
  await page.keyboard.press("Shift+ArrowRight")
  await expect(page.getByTestId("table-resize-output")).toHaveText("Last resize: 0:270")
  await expect(page).toHaveURL(/tableWidth=270/)

  const handleBox = await issueHandle.boundingBox()
  if (!handleBox) throw new Error("Table resize handle is not visible")
  await page.mouse.move(handleBox.x, handleBox.y + 8)
  await page.mouse.down()
  await page.mouse.move(handleBox.x + 30, handleBox.y + 8)
  await page.mouse.up()
  await expect(page.getByTestId("table-resize-output")).toHaveText("Last resize: 0:300")
  await expect(page).toHaveURL(/tableWidth=300/)

  issueHandle = page.getByRole("separator", { name: "Issue" })
  const resetHandleBox = await issueHandle.boundingBox()
  if (!resetHandleBox) throw new Error("Table reset handle is not visible")
  await page.mouse.dblclick(resetHandleBox.x, resetHandleBox.y + 8)
  await expect(page.getByTestId("table-resize-output")).toHaveText("Last resize: 0:-1")
  await expect(page).toHaveURL(/tableWidthPreset=auto/)
  await page.getByRole("button", { name: "Issue" }).click()
  await expect(page.getByRole("columnheader", { name: "Issue" })).toHaveAttribute("aria-sort", "descending")

  await page.getByRole("button", { name: "Open setup" }).click()
  await page.getByLabel("Show status row").check()
  await expect(page.getByRole("cell", { name: "No matching issues" })).toBeVisible()
  await page.getByRole("button", { name: "Share" }).click()
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText())
  expect(sharedUrl).toContain("/?component=table")

  const restoredContext = await browser.newContext({ ignoreHTTPSErrors: true, permissions: ["clipboard-read", "clipboard-write"] })
  const restoredPage = await restoredContext.newPage()
  await restoredPage.goto(sharedUrl)
  await restoredPage.getByRole("button", { name: "Open setup" }).click()
  await expect(restoredPage.getByLabel("Component or template")).toHaveValue("table")
  await expect(restoredPage.getByLabel("Minimum column width")).toHaveValue("100")
  await expect(restoredPage.getByLabel("Rows")).toHaveValue("3")
  await expect(restoredPage.getByLabel("Width preset")).toHaveValue("auto")
  await expect(restoredPage.getByLabel("Show status row")).toBeChecked()
  await restoredContext.close()

  await page.setViewportSize({ width: 320, height: 844 })
  await page.getByRole("button", { name: "Close setup" }).click()
  const scrollFrame = page.getByTestId("table-scroll-frame")
  expect(await scrollFrame.evaluate((element) => element.scrollWidth)).toBeGreaterThan(await scrollFrame.evaluate((element) => element.clientWidth))
  await expect(table).toHaveCSS("min-width", "540px")
})

test("configures, shares, and restores the Status Indicator workbench", async ({ browser, page }) => {
  await page.setViewportSize({ width: 320, height: 844 })
  await page.goto("/evidence/status-indicator-server")
  await expect(page.getByRole("img", { name: "Server status" })).toBeAttached()

  await page.goto(
    "/?component=status-indicator&statusCount=0&statusLabeled=true&statusRole=status&statusVariant=promotion&theme=dark&viewport=mobile"
  )

  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "status-indicator"
  )
  await expect(page.getByRole("heading", { name: "Status Indicator", exact: true })).toBeVisible()
  const status = page.getByRole("status", { name: "Online" })
  await expect(status).toHaveCSS("width", "8px")
  await expect(status).toHaveCSS("height", "8px")
  expect(
    await status.evaluate((element) => ({
      fill: element.style.getPropertyValue("--status-fill"),
      iterations: element.style.getPropertyValue("--status-iterations"),
    }))
  ).toEqual({ fill: "forwards", iterations: "0" })
  expect(
    await status.evaluate((element) => ({
      dot: getComputedStyle(element, "::after").backgroundColor,
      pulse: getComputedStyle(element, "::before").backgroundColor,
    }))
  ).toEqual({
    dot: "rgb(255, 69, 168)",
    pulse: "rgba(248, 0, 120, 0.18)",
  })
  expect(
    await status.evaluate((element) => {
      const before = getComputedStyle(element, "::before")
      const after = getComputedStyle(element, "::after")
      return {
        activeAnimations: element.getAnimations().length,
        afterIterations: after.animationIterationCount,
        afterTransform: after.transform,
        beforeIterations: before.animationIterationCount,
        beforeTransform: before.transform,
      }
    })
  ).toEqual({
    activeAnimations: 0,
    afterIterations: "0",
    afterTransform: "matrix(1, 0, 0, 1, 0, 0)",
    beforeIterations: "0",
    beforeTransform: "matrix(0.9, 0, 0, 0.9, 0, 0)",
  })
  await expect(page.getByTestId("status-indicator-state")).toHaveText(
    "promotion, 0 iterations"
  )

  await page.emulateMedia({ reducedMotion: "reduce" })
  expect(
    await status.evaluate((element) => {
      const before = getComputedStyle(element, "::before")
      const after = getComputedStyle(element, "::after")
      return {
        afterAnimation: after.animationName,
        afterTransform: after.transform,
        beforeAnimation: before.animationName,
        beforeOpacity: before.opacity,
        beforeTransform: before.transform,
      }
    })
  ).toEqual({
    afterAnimation: "none",
    afterTransform: "matrix(1, 0, 0, 1, 0, 0)",
    beforeAnimation: "none",
    beforeOpacity: "0",
    beforeTransform: "matrix(1.25, 0, 0, 1.25, 0, 0)",
  })

  await page.getByRole("button", { name: "Open setup" }).click()
  await expect(page.getByLabel("Component or template")).toHaveValue("status-indicator")
  await expect(page.getByLabel("Status variant")).toHaveValue("promotion")
  await expect(page.getByLabel("Animation iterations")).toHaveValue("0")
  await expect(page.getByLabel("Status label")).toBeChecked()
  await expect(page.getByLabel("Status role")).toHaveValue("status")
  const variantControlBox = await page.getByLabel("Status variant").boundingBox()
  expect(variantControlBox?.height).toBeGreaterThanOrEqual(44)
  await page.emulateMedia({ reducedMotion: "no-preference" })
  await page.getByRole("button", { name: "Switch to light theme" }).click()
  expect(
    await status.evaluate((element) => ({
      dot: getComputedStyle(element, "::after").backgroundColor,
      pulse: getComputedStyle(element, "::before").backgroundColor,
    }))
  ).toEqual({
    dot: "rgb(252, 92, 180)",
    pulse: "rgba(240, 0, 144, 0.1)",
  })

  await page.reload()
  await page.getByRole("button", { name: "Open setup" }).click()
  await expect(page.getByLabel("Status variant")).toHaveValue("promotion")
  await expect(page.getByLabel("Animation iterations")).toHaveValue("0")

  await page.getByRole("button", { name: "Reset" }).click()
  const decorativeStatus = page.getByTestId("status-indicator-preview")
  await expect(decorativeStatus).toHaveAttribute("aria-hidden", "true")
  expect(
    await decorativeStatus.evaluate((element) => ({
      fill: element.style.getPropertyValue("--status-fill"),
      iterations: element.style.getPropertyValue("--status-iterations"),
    }))
  ).toEqual({ fill: "none", iterations: "infinite" })
  await expect(page.getByLabel("Status variant")).toHaveValue("accent")

  await page.getByLabel("Status variant").selectOption("promotion")
  await page.getByLabel("Animation iterations").selectOption("0")
  await page.getByLabel("Status label").check()
  await page.getByRole("button", { name: "Share" }).click()
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText())
  expect(sharedUrl).toContain("/?component=status-indicator")

  const restoredContext = await browser.newContext({
    ignoreHTTPSErrors: true,
    permissions: ["clipboard-read", "clipboard-write"],
    viewport: { width: 320, height: 844 },
  })
  const restoredPage = await restoredContext.newPage()
  await restoredPage.goto(sharedUrl)
  await restoredPage.getByRole("button", { name: "Open setup" }).click()
  await expect(restoredPage.getByLabel("Status variant")).toHaveValue("promotion")
  await expect(restoredPage.getByLabel("Animation iterations")).toHaveValue("0")
  await expect(restoredPage.getByLabel("Status label")).toBeChecked()
  await restoredContext.close()

  await page.getByLabel("Component or template").selectOption("checkbox")
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "checkbox"
  )
  await page.goBack()
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "status-indicator"
  )
  await expect(page.getByLabel("Status variant")).toHaveValue("promotion")
  await expect(page.getByLabel("Animation iterations")).toHaveValue("0")
  await page.goForward()
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "checkbox"
  )
})

test("runs Reveal On Hover through pointer, keyboard, touch, history, and restore", async ({ browser, page }) => {
  await page.goto(
    "/?component=reveal-on-hover&revealActions=true&revealCustom=true&revealInteractive=true&revealVisible=false"
  )

  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "reveal-on-hover"
  )
  await expect(page.getByRole("heading", { name: "Reveal On Hover", exact: true })).toBeVisible()
  const customRoot = page.getByTestId("reveal-custom-root")
  const action = page.getByRole("button", { name: "Reveal action" })
  const actionWrapper = action.locator("..")
  await expect(customRoot).toBeVisible()
  await expect(actionWrapper).toHaveCSS("opacity", "0")
  await customRoot.hover()
  await expect(actionWrapper).toHaveCSS("opacity", "1")
  await action.focus()
  await expect(action).toBeFocused()
  await expect(actionWrapper).toHaveCSS("opacity", "1")
  await action.click()
  await expect(page.getByTestId("reveal-clicks")).toHaveText("Clicks: 1")

  await page.emulateMedia({ reducedMotion: "reduce" })
  await expect(actionWrapper).toHaveCSS("transition-duration", "0s")
  await page.getByRole("button", { name: "Open setup" }).click()
  await expect(page.getByLabel("Component or template")).toHaveValue("reveal-on-hover")
  await expect(page.getByLabel("Custom root")).toBeChecked()
  await expect(page.getByLabel("Actions")).toBeChecked()
  await page.getByLabel("Visible").check()
  await expect(actionWrapper).toHaveAttribute("data-reveal-on-hover-visible", "")
  await page.getByLabel("Custom root").uncheck()
  await expect(page.getByTestId("reveal-flex-root")).toBeVisible()
  await page.getByLabel("Actions").uncheck()
  await expect(page.getByRole("button", { name: "Reveal action" })).toHaveCount(0)
  await page.getByLabel("Actions").check()

  await page.reload()
  await page.getByRole("button", { name: "Open setup" }).click()
  await expect(page.getByLabel("Visible")).toBeChecked()
  await expect(page.getByLabel("Custom root")).not.toBeChecked()
  await expect(page.getByLabel("Actions")).toBeChecked()
  await page.getByRole("button", { name: "Share" }).click()
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText())
  expect(sharedUrl).toContain("/?component=reveal-on-hover")

  const touchContext = await browser.newContext({
    hasTouch: true,
    ignoreHTTPSErrors: true,
    permissions: ["clipboard-read", "clipboard-write"],
    viewport: { width: 320, height: 844 },
  })
  const touchPage = await touchContext.newPage()
  const touchUrl = new URL(sharedUrl)
  touchUrl.searchParams.set("revealVisible", "false")
  touchUrl.searchParams.set("viewport", "mobile")
  await touchPage.goto(touchUrl.href)
  expect(await touchPage.evaluate(() => matchMedia("(hover: hover)").matches)).toBe(false)
  await expect(touchPage.getByRole("button", { name: "Reveal action" }).locator("..")).toHaveCSS(
    "opacity",
    "1"
  )
  await touchPage.getByRole("button", { name: "Reveal action" }).tap()
  await expect(touchPage.getByTestId("reveal-clicks")).toHaveText("Clicks: 1")
  await touchContext.close()

  await page.getByLabel("Component or template").selectOption("checkbox")
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "checkbox"
  )
  await page.goBack()
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "reveal-on-hover"
  )
  await expect(page.getByLabel("Visible")).toBeChecked()
  await page.goForward()
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "checkbox"
  )
})

test("runs Hotkey display and registration through URL, inputs, history, and restore", async ({ browser, page }) => {
  await page.setViewportSize({ width: 320, height: 844 })
  await page.goto(
    "/?component=hotkey&hotkeyEnabled=true&hotkeyIncludeInputs=false&hotkeySkipPreventDefault=false&hotkeyValue=mod%2Bshift%2B1&hotkeyVariant=debossed&theme=dark&viewport=mobile"
  )

  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "hotkey"
  )
  await expect(page.getByRole("heading", { name: "Hotkey", exact: true })).toBeVisible()
  const displayedHotkey = page.getByTestId("hotkey-display").locator(":scope > kbd")
  await expect(displayedHotkey).toHaveCSS("font-size", "12px")
  await expect(displayedHotkey).toHaveCSS("font-weight", "500")
  await expect(displayedHotkey).toHaveCSS("border-radius", "5px")
  await expect(displayedHotkey).toHaveCSS("border-top-width", "2px")
  await expect(displayedHotkey).toHaveCSS("border-bottom-width", "1px")
  await expect(displayedHotkey).toHaveCSS("color", "rgb(181, 176, 189)")
  await expect(displayedHotkey).toHaveCSS("background-color", "rgb(36, 32, 43)")

  async function dispatchShortcut(target: "document" | "input") {
    return page.evaluate((targetName) => {
      const target = targetName === "input"
        ? document.querySelector<HTMLInputElement>('[aria-label="Hotkey target input"]')
        : document
      if (!target) throw new Error("Missing Hotkey event target")
      const init = { bubbles: true, cancelable: true, code: "Digit1", key: "!", shiftKey: true }
      const metaResult = target.dispatchEvent(new KeyboardEvent("keydown", { ...init, metaKey: true }))
      const controlResult = target.dispatchEvent(new KeyboardEvent("keydown", { ...init, ctrlKey: true }))
      return { controlResult, metaResult }
    }, target)
  }

  const initialResult = await dispatchShortcut("document")
  expect([initialResult.controlResult, initialResult.metaResult].filter((result) => !result)).toHaveLength(1)
  await expect(page.getByTestId("hotkey-match-count")).toHaveText("Matches: 1")
  await expect(page.getByTestId("hotkey-prevented-state")).toHaveText("Prevented: true")

  await page.getByLabel("Hotkey target input").focus()
  await dispatchShortcut("input")
  await expect(page.getByTestId("hotkey-match-count")).toHaveText("Matches: 1")

  await page.getByRole("button", { name: "Open setup" }).click()
  await expect(page.getByLabel("Component or template")).toHaveValue("hotkey")
  await expect(page.getByLabel("Hotkey shortcut")).toHaveValue("mod+shift+1")
  await expect(page.getByLabel("Hotkey variant")).toHaveValue("debossed")
  await expect(page.getByLabel("Include text inputs")).not.toBeChecked()
  const shortcutBox = await page.getByLabel("Hotkey shortcut").boundingBox()
  expect(shortcutBox?.height).toBeGreaterThanOrEqual(44)

  await page.getByLabel("Include text inputs").check()
  await page.getByLabel("Hotkey target input").focus()
  await dispatchShortcut("input")
  await expect(page.getByTestId("hotkey-match-count")).toHaveText("Matches: 2")

  await page.getByRole("button", { name: "Open setup" }).click()
  await page.getByLabel("Skip prevent default").check()
  const skippedResult = await dispatchShortcut("document")
  expect(skippedResult.controlResult).toBe(true)
  expect(skippedResult.metaResult).toBe(true)
  await expect(page.getByTestId("hotkey-match-count")).toHaveText("Matches: 3")
  await expect(page.getByTestId("hotkey-prevented-state")).toHaveText("Prevented: false")

  await page.getByLabel("Hotkey enabled").uncheck()
  await dispatchShortcut("document")
  await expect(page.getByTestId("hotkey-match-count")).toHaveText("Matches: 3")
  await page.getByLabel("Hotkey enabled").check()

  await page.getByRole("button", { name: "Reset" }).click()
  await expect(page.getByLabel("Hotkey shortcut")).toHaveValue("mod+k")
  await expect(page.getByLabel("Hotkey variant")).toHaveValue("embossed")
  await expect(page.getByLabel("Hotkey enabled")).toBeChecked()
  await expect(page.getByLabel("Include text inputs")).not.toBeChecked()
  await expect(page.getByLabel("Skip prevent default")).not.toBeChecked()
  await expect(page.getByTestId("hotkey-match-count")).toHaveText("Matches: 0")
  await expect(page.getByTestId("hotkey-prevented-state")).toHaveText(
    "Prevented: not tested"
  )
  expect(
    await page.evaluate(() => Object.fromEntries(new URL(location.href).searchParams))
  ).toEqual({
    component: "hotkey",
    hotkeyEnabled: "true",
    hotkeyIncludeInputs: "false",
    hotkeySkipPreventDefault: "false",
    hotkeyValue: "mod+k",
    hotkeyVariant: "embossed",
    theme: "light",
    viewport: "desktop",
  })

  await page.getByLabel("Hotkey shortcut").selectOption("mod+shift+1")
  await page.getByLabel("Hotkey variant").selectOption("debossed")
  await page.getByLabel("Include text inputs").check()
  await page.getByLabel("Skip prevent default").check()
  await page.getByLabel("Preview width").selectOption("mobile")
  await page.getByRole("button", { name: "Switch to dark theme" }).click()

  await page.reload()
  await page.getByRole("button", { name: "Open setup" }).click()
  await expect(page.getByLabel("Hotkey shortcut")).toHaveValue("mod+shift+1")
  await expect(page.getByLabel("Hotkey variant")).toHaveValue("debossed")
  await expect(page.getByLabel("Include text inputs")).toBeChecked()
  await expect(page.getByLabel("Skip prevent default")).toBeChecked()
  await expect(page.getByLabel("Preview width")).toHaveValue("mobile")
  await expect(page.locator("html")).toHaveClass(/dark/)

  await page.getByRole("button", { name: "Share" }).click()
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText())
  expect(sharedUrl).toContain("/?component=hotkey")

  const restoredContext = await browser.newContext({
    ignoreHTTPSErrors: true,
    permissions: ["clipboard-read", "clipboard-write"],
    viewport: { width: 320, height: 844 },
  })
  const restoredPage = await restoredContext.newPage()
  await restoredPage.goto(sharedUrl)
  await restoredPage.getByRole("button", { name: "Open setup" }).click()
  await expect(restoredPage.getByLabel("Component or template")).toHaveValue("hotkey")
  await expect(restoredPage.getByLabel("Hotkey shortcut")).toHaveValue("mod+shift+1")
  await expect(restoredPage.getByLabel("Hotkey variant")).toHaveValue("debossed")
  await expect(restoredPage.getByLabel("Include text inputs")).toBeChecked()
  await expect(restoredPage.getByLabel("Skip prevent default")).toBeChecked()
  await restoredContext.close()

  await page.getByLabel("Component or template").selectOption("checkbox")
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "checkbox"
  )
  await page.goBack()
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "hotkey"
  )
  await expect(page.getByLabel("Hotkey shortcut")).toHaveValue("mod+shift+1")
  await expect(page.getByLabel("Include text inputs")).toBeChecked()
  await page.goForward()
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "checkbox"
  )
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

test("runs the Split Panel workbench from URL through resize and restore", async ({ browser, page }) => {
  await page.goto("/?component=split-panel")
  await page.getByRole("button", { name: "Open setup" }).click()
  await expect(page.getByLabel("Default size")).toHaveValue("200")
  await expect(page.getByLabel("Initial size")).toHaveValue("200")
  await expect(page.getByLabel("Minimum size")).toHaveValue("100")
  await expect(page.getByLabel("Fill minimum")).toHaveValue("120")
  await expect(page.getByLabel("Maximum", { exact: true })).toHaveValue("container")

  await page.goto(
    "/?component=split-panel&splitPanelDefaultSize=220&splitPanelFillMinSize=80&splitPanelHasFill=true&splitPanelInitialSize=240&splitPanelMaxSize=400&splitPanelMinSize=100&splitPanelOrientation=horizontal&splitPanelPlacement=start&theme=dark&viewport=desktop"
  )
  await expect(page.getByRole("heading", { name: "Split Panel", exact: true })).toBeVisible()
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute("data-component", "split-panel")
  await expect(page.locator("html")).toHaveClass(/dark/)

  await page.getByRole("button", { name: "Open setup" }).click()
  await expect(page.getByLabel("Component or template")).toHaveValue("split-panel")
  await expect(page.getByLabel("Orientation")).toHaveValue("horizontal")
  await expect(page.getByLabel("Placement")).toHaveValue("start")
  await expect(page.getByLabel("Default size")).toHaveValue("220")
  await expect(page.getByLabel("Initial size")).toHaveValue("240")
  await expect(page.getByLabel("Minimum size")).toHaveValue("100")
  await expect(page.getByLabel("Fill minimum")).toHaveValue("80")
  await expect(page.getByLabel("Maximum", { exact: true })).toHaveValue("fixed")
  await expect(page.getByLabel("Maximum size")).toHaveValue("400")
  await expect(page.getByLabel("Include fill pane")).toBeChecked()
  await page.getByLabel("Initial size").fill("260")
  await expect(page.getByRole("separator", { name: "Resize panels" })).toHaveAttribute("aria-valuenow", "260")
  await expect(page).toHaveURL(/splitPanelInitialSize=260/)
  await page.getByRole("button", { name: "Close setup" }).click()
  await page.reload()

  let separator = page.getByRole("separator", { name: "Resize panels" })
  await expect(separator).toHaveAttribute("aria-valuenow", "260")
  await expect(separator).toHaveAttribute("aria-valuemin", "100")
  await expect(separator).toHaveAttribute("aria-valuemax", "400")
  await separator.focus()
  await page.keyboard.press("ArrowRight")
  await expect(separator).toHaveAttribute("aria-valuenow", "270")
  await expect(page).toHaveURL(/splitPanelInitialSize=270/)
  await page.keyboard.press("Shift+ArrowRight")
  await expect(separator).toHaveAttribute("aria-valuenow", "320")
  await page.keyboard.press("Home")
  await expect(separator).toHaveAttribute("aria-valuenow", "100")
  await page.keyboard.press("End")
  await expect(separator).toHaveAttribute("aria-valuenow", "400")
  await separator.dblclick()
  await expect(separator).toHaveAttribute("aria-valuenow", "220")
  await expect(page).toHaveURL(/splitPanelInitialSize=220/)

  const separatorBox = await separator.boundingBox()
  if (!separatorBox) throw new Error("Split Panel separator is not visible")
  await page.mouse.move(separatorBox.x, separatorBox.y + separatorBox.height / 2)
  await page.mouse.down()
  await page.mouse.move(separatorBox.x + 24, separatorBox.y + separatorBox.height / 2)
  await page.mouse.up()
  await expect(separator).toHaveAttribute("aria-valuenow", "244")
  await expect(page).toHaveURL(/splitPanelInitialSize=244/)

  await separator.dispatchEvent("pointerdown", { button: 0, clientX: separatorBox.x, clientY: separatorBox.y, isPrimary: true, pointerId: 7, pointerType: "touch" })
  await page.evaluate(({ x, y }) => {
    document.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, cancelable: true, clientX: x + 16, clientY: y, isPrimary: true, pointerId: 7, pointerType: "touch" }))
    document.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, cancelable: true, clientX: x + 16, clientY: y, isPrimary: true, pointerId: 7, pointerType: "touch" }))
  }, { x: separatorBox.x, y: separatorBox.y })
  await expect(separator).toHaveAttribute("aria-valuenow", "260")
  await expect(page).toHaveURL(/splitPanelInitialSize=260/)

  await page.getByRole("button", { name: "Open setup" }).click()
  await page.getByLabel("Placement").selectOption("end")
  await page.getByRole("button", { name: "Close setup" }).click()
  separator = page.getByRole("separator", { name: "Resize panels" })
  await expect(separator).toHaveAttribute("aria-valuenow", "260")
  await separator.focus()
  await page.keyboard.press("ArrowRight")
  await expect(separator).toHaveAttribute("aria-valuenow", "250")
  await page.getByRole("button", { name: "Set default size" }).click()
  await expect(separator).toHaveAttribute("aria-valuenow", "220")

  await page.getByRole("button", { name: "Open setup" }).click()
  await page.getByRole("button", { name: "Share" }).click()
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText())
  expect(sharedUrl).toContain("/?component=split-panel")
  expect(sharedUrl).not.toContain("checked=")
  expect(sharedUrl).not.toContain("dragHandle")

  const restoredContext = await browser.newContext({
    ignoreHTTPSErrors: true,
    permissions: ["clipboard-read", "clipboard-write"],
  })
  const restoredPage = await restoredContext.newPage()
  await restoredPage.goto(sharedUrl)
  await restoredPage.getByRole("button", { name: "Open setup" }).click()
  await expect(restoredPage.getByLabel("Placement")).toHaveValue("end")
  await expect(restoredPage.getByLabel("Initial size")).toHaveValue("250")
  await restoredPage.getByRole("button", { name: "Reset" }).click()
  await expect(restoredPage.getByLabel("Orientation")).toHaveValue("horizontal")
  await expect(restoredPage.getByLabel("Placement")).toHaveValue("start")
  await expect(restoredPage.getByLabel("Initial size")).toHaveValue("200")
  await expect(restoredPage.getByLabel("Maximum")).toHaveValue("container")
  await expect(restoredPage).toHaveURL(/component=split-panel/)
  await restoredContext.close()
})

test("resets a mounted Split Panel without changing direction", async ({ page }) => {
  await page.goto(
    "/?component=split-panel&splitPanelDefaultSize=200&splitPanelFillMinSize=120&splitPanelHasFill=true&splitPanelInitialSize=260&splitPanelMaxSize=container&splitPanelMinSize=100&splitPanelOrientation=horizontal&splitPanelPlacement=start"
  )
  const separator = page.getByRole("separator", { name: "Resize panels" })
  await expect(separator).toHaveAttribute("aria-valuenow", "260")
  await separator.focus()
  await page.keyboard.press("ArrowRight")
  await expect(separator).toHaveAttribute("aria-valuenow", "270")
  await expect(page).toHaveURL(/splitPanelInitialSize=270/)

  await page.getByRole("button", { name: "Open setup" }).click()
  await expect(page.getByLabel("Orientation")).toHaveValue("horizontal")
  await expect(page.getByLabel("Placement")).toHaveValue("start")
  await page.getByRole("button", { name: "Reset" }).click()

  await expect(page.getByLabel("Default size")).toHaveValue("200")
  await expect(page.getByLabel("Initial size")).toHaveValue("200")
  await expect(page.getByLabel("Orientation")).toHaveValue("horizontal")
  await expect(page.getByLabel("Placement")).toHaveValue("start")
  await expect(separator).toHaveAttribute("aria-valuenow", "200")
  await expect(page).toHaveURL(/splitPanelInitialSize=200/)
  await expect(page).toHaveURL(/splitPanelOrientation=horizontal/)
  await expect(page).toHaveURL(/splitPanelPlacement=start/)
})

test("keeps Split Panel valid and contained at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 })
  await page.goto(
    "/?component=split-panel&splitPanelDefaultSize=bad&splitPanelFillMinSize=-10&splitPanelHasFill=true&splitPanelInitialSize=bad&splitPanelMaxSize=invalid&splitPanelMinSize=100&splitPanelOrientation=sideways&splitPanelPlacement=middle"
  )
  const island = page.locator('[data-slot="playground-island"]')
  const separator = page.getByRole("separator", { name: "Resize panels" })
  await expect(separator).toHaveAttribute("aria-valuenow", "200")
  await expect.poll(async () => Number(await separator.getAttribute("aria-valuemax"))).toBeGreaterThanOrEqual(200)
  await page.getByRole("button", { name: "Open setup" }).click()
  await expect(page.getByLabel("Orientation")).toHaveValue("horizontal")
  await expect(page.getByLabel("Placement")).toHaveValue("start")
  await expect(page.getByLabel("Default size")).toHaveValue("200")
  await expect(page.getByLabel("Fill minimum")).toHaveValue("0")
  await expect(page.getByLabel("Maximum", { exact: true })).toHaveValue("container")
  const islandBox = await island.boundingBox()
  const frameBox = await page.getByTestId("split-panel-frame").boundingBox()
  if (!islandBox || !frameBox) throw new Error("Split Panel mobile frame is not visible")
  expect(islandBox.x).toBeGreaterThanOrEqual(8)
  expect(islandBox.width).toBeLessThanOrEqual(304)
  expect(frameBox.x).toBeGreaterThanOrEqual(0)
  expect(frameBox.x + frameBox.width).toBeLessThanOrEqual(320)

  await page.getByLabel("Component or template").selectOption("checkbox")
  await expect(page).toHaveURL(/component=checkbox/)
  await page.goBack()
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute("data-component", "split-panel")
  await expect(page.getByLabel("Orientation")).toHaveValue("horizontal")
  await page.goForward()
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute("data-component", "checkbox")
})

test("configures, restores, and falls back in the Image workbench", async ({ browser, page }) => {
  await page.setViewportSize({ width: 320, height: 844 })
  await page.goto("/evidence/image-server")
  await expect(page.getByRole("img", { name: "Server image" })).toBeAttached()

  await page.goto("/?component=image&imageAspectRatio=1+%2F+1&imageFit=contain&imagePosition=top&imageRadius=full&imageLoading=eager&imageResponsive=responsive&imageBroken=true")
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute("data-component", "image")
  const image = page.getByTestId("image-preview")
  await expect(image).toHaveCSS("object-fit", "contain")
  await expect(image).toHaveCSS("object-position", "50% 0%")
  await expect(image).toHaveCSS("border-radius", "999px")
  await expect(image).toHaveAttribute("loading", "eager")
  await expect(image).toHaveCSS("height", "180px")
  expect(
    await image.evaluate((element) => {
      const parent = element.parentElement
      if (!parent) return false
      const parentStyle = getComputedStyle(parent)
      const contentWidth =
        parent.clientWidth -
        Number.parseFloat(parentStyle.paddingLeft) -
        Number.parseFloat(parentStyle.paddingRight)
      return Math.abs(element.getBoundingClientRect().width - contentWidth) < 1
    })
  ).toBe(true)

  await page.setViewportSize({ width: 1200, height: 900 })
  await expect(image).toHaveCSS("width", "480px")
  await expect(image).toHaveCSS("height", "280px")
  await image.evaluate((element) => element.dispatchEvent(new Event("error")))
  await expect(page.getByTestId("image-fallback-state")).toHaveText("Fallback: true")
  await page.getByRole("button", { name: "Open setup" }).click()
  await expect(page.getByLabel("Responsive preset")).toHaveValue("responsive")
  await page.getByLabel("Broken image").uncheck()
  await page.getByRole("button", { name: "Share" }).click()
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText())
  expect(sharedUrl).toContain("/?component=image")

  const restoredContext = await browser.newContext({
    ignoreHTTPSErrors: true,
    permissions: ["clipboard-read", "clipboard-write"],
    viewport: { width: 320, height: 844 },
  })
  const restoredPage = await restoredContext.newPage()
  await restoredPage.goto(sharedUrl)
  await restoredPage.getByRole("button", { name: "Open setup" }).click()
  await expect(restoredPage.getByLabel("Object fit")).toHaveValue("contain")
  await expect(restoredPage.getByLabel("Radius")).toHaveValue("full")
  await restoredContext.close()

  await page.getByLabel("Component or template").selectOption("checkbox")
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute("data-component", "checkbox")
  await page.goBack()
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute("data-component", "image")
  await expect(page.getByLabel("Aspect ratio")).toHaveValue("1 / 1")
  await expect(page.getByLabel("Object fit")).toHaveValue("contain")
  await expect(page.getByLabel("Object position")).toHaveValue("top")
  await expect(page.getByLabel("Radius")).toHaveValue("full")
  await expect(page.getByLabel("Loading")).toHaveValue("eager")
  await expect(page.getByLabel("Responsive preset")).toHaveValue("responsive")
  await expect(page.getByLabel("Broken image")).not.toBeChecked()
  await page.getByRole("button", { name: "Reset" }).click()
  await expect(page.getByLabel("Aspect ratio")).toHaveValue("16 / 9")
  await expect(page.getByLabel("Object fit")).toHaveValue("cover")
  await expect(page.getByLabel("Object position")).toHaveValue("center")
  await expect(page.getByLabel("Radius")).toHaveValue("md")
  await expect(page.getByLabel("Loading")).toHaveValue("lazy")
  await expect(page.getByLabel("Responsive preset")).toHaveValue("fixed")
  await expect(page.getByLabel("Broken image")).not.toBeChecked()
  await expect(page.getByTestId("image-fallback-state")).toHaveText("Fallback: false")
  expect(
    await page.evaluate(() =>
      Object.fromEntries(
        [...new URL(location.href).searchParams.entries()].filter(([key]) =>
          key.startsWith("image")
        )
      )
    )
  ).toEqual({
    imageAspectRatio: "16 / 9",
    imageBroken: "false",
    imageFit: "cover",
    imageLoading: "lazy",
    imagePosition: "center",
    imageRadius: "md",
    imageResponsive: "fixed",
  })
})
