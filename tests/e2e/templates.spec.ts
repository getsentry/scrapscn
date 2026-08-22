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
    "Checkbox settings",
  ])

  const response = await request.get("/templates/checkbox-settings")
  expect(response.status()).toBe(200)
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
