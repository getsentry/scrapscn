import { expect, test } from "playwright/test"

test("discovers, serves, and restores templates in production", async ({ page, request }) => {
  await page.goto("/")
  await page.getByRole("button", { name: "Open setup" }).click()
  const sectionOptions = page.getByLabel("Component or template").locator("option")
  await expect(sectionOptions).toHaveText([
    "Checkbox",
    "Drag Handle",
    "Split Panel",
    "Table",
    "Status Indicator",
    "Reveal On Hover",
    "Hotkey",
    "Image",
    "Backdrop",
    "Code",
    "Empty State",
    "Loader",
    "Slide Over Panel",
    "Tooltip",
    "Text",
    "Quote",
    "Checkbox settings",
    "Loader status",
  ])

  const response = await request.get("/templates/checkbox-settings")
  expect(response.status()).toBe(200)
  const loaderResponse = await request.get("/templates/loader-status")
  expect(loaderResponse.status()).toBe(200)
  await page.goto("/templates/loader-status?loaderMessages=false&loaderVariant=monochrome&loaderWidth=400&theme=dark&viewport=mobile")
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute("data-component", "loader")
  await expect(page.locator('[data-slot="sentry-page-frame"]')).toHaveCSS("width", "390px")
  await expect(page.getByRole("heading", { name: "Loader", exact: true })).toBeVisible()
  await expect(page.getByRole("progressbar", { name: "Loading" })).toBeVisible()
  await expect(page.locator('[data-slot="playground-island"]')).toBeVisible()
  await page.getByRole("button", { name: "Open setup" }).click()
  await expect(page.getByLabel("Component or template")).toHaveValue("/templates/loader-status")
  await expect(page.getByLabel("Loader variant")).toHaveValue("monochrome")
  await expect(page.getByLabel("Loader width")).toHaveValue("400")
  await expect(page.getByLabel("Show loader messages")).not.toBeChecked()
  await expect(page.getByLabel("Preview width")).toHaveValue("mobile")
  await expect(page.locator("html")).toHaveClass(/dark/)

  await page.goto("/templates/checkbox-settings?checked=true&disabled=true&items=weekly-reports%2Cnew-issues&label=Escalation+alerts&selected=weekly-reports&size=md&theme=dark&viewport=mobile")
  await page.reload()

  await expect(page.getByRole("heading", { name: "Notification Settings" })).toBeVisible()
  await page.getByRole("button", { name: "Open setup" }).click()
  await expect(page.getByLabel("Size")).toHaveValue("md")
  await expect(page.getByLabel("Label")).toHaveValue("Escalation alerts")
  await expect(page.getByLabel("Preview width")).toHaveValue("mobile")
  await expect(page.locator("html")).toHaveClass(/dark/)
  await page.getByRole("button", { name: "Close setup" }).click()

  const formLabels = await page.locator("form label").allTextContents()
  expect(formLabels).toEqual(["Weekly project report", "Escalation alerts"])
  await expect(page.getByRole("checkbox", { name: "Escalation alerts" })).toBeChecked()
  await expect(page.getByRole("checkbox", { name: "Escalation alerts" })).toBeDisabled()
  await expect(page.getByRole("checkbox", { name: "Weekly project report" })).toBeChecked()

  const missing = await request.get("/templates/not-a-template")
  expect(missing.status()).toBe(404)
})
