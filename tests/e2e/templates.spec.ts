import { expect, test } from "playwright/test";

test("discovers, serves, and restores templates in production", async ({ page, request }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open setup" }).click();
  const sectionOptions = page.getByLabel("Component or template").locator("option");
  await expect(sectionOptions).toHaveText([
    "SegmentedControl",
    "Checkbox",
    "Slider",
    "Switch",
    "CompactSelect",
    "Modal",
    "Drawer",
    "Breadcrumb List",
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
    "Link",
    "Button",
    "Chat",
    "Markdown",
    "Alert",
    "Badge",
    "Select",
    "Form",
    "Tabs",
    "Avatar",
    "Radio",
    "Chip",
    "Info",
    "Disclosure",
    "Pagination",
    "AvatarButton",
    "Toast",
    "PictureInPicture",
    "MenuListItem",
    "Text",
    "TextArea",
    "Input",
    "Interaction State Layer",
    "Layout",
    "Separator",
    "Slot",
    "Quote",
    "Checkbox settings",
    "Loader status",
    "Page frame",
  ]);

  const response = await request.get("/templates/checkbox-settings");
  expect(response.status()).toBe(200);
  const loaderResponse = await request.get("/templates/loader-status");
  expect(loaderResponse.status()).toBe(200);
  await page.goto(
    "/templates/loader-status?loaderVariant=monochrome&loaderWidth=400&theme=dark&viewport=mobile",
  );
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "loader",
  );
  await expect(page.locator('[data-slot="sentry-page-frame"]')).toHaveCSS("width", "390px");
  await expect(page.getByRole("heading", { name: "Loader", exact: true })).toBeVisible();
  await expect(page.getByRole("progressbar", { name: "Loading" })).toBeVisible();
  await expect(page.locator('[data-slot="playground-island"]')).toBeVisible();
  await page.getByRole("button", { name: "Open setup" }).click();
  await expect(page.getByLabel("Component or template")).toHaveValue("/templates/loader-status");
  await expect(page.getByLabel("Loader variant")).toHaveValue("monochrome");
  await expect(page.getByLabel("Loader width")).toHaveValue("400");
  await expect(page.getByLabel("Preview width")).toHaveValue("mobile");
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.goto(
    "/templates/checkbox-settings?checked=true&disabled=true&items=weekly-reports%2Cnew-issues&label=Escalation+alerts&selected=weekly-reports&size=md&theme=dark&viewport=mobile",
  );
  await page.reload();

  await expect(page.getByRole("heading", { name: "Notification Settings" })).toBeVisible();
  await page.getByRole("button", { name: "Open setup" }).click();
  await expect(page.getByLabel("Size")).toHaveValue("md");
  await expect(page.getByLabel("Label")).toHaveValue("Escalation alerts");
  await expect(page.getByLabel("Preview width")).toHaveValue("mobile");
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByRole("button", { name: "Close setup" }).click();

  const formLabels = await page.locator("form label").allTextContents();
  expect(formLabels).toEqual(["Weekly project report", "Escalation alerts"]);
  await expect(page.getByRole("checkbox", { name: "Escalation alerts" })).toBeChecked();
  await expect(page.getByRole("checkbox", { name: "Escalation alerts" })).toBeDisabled();
  await expect(page.getByRole("checkbox", { name: "Weekly project report" })).toBeChecked();

  const missing = await request.get("/templates/not-a-template");
  expect(missing.status()).toBe(404);
});

test("page frame preserves Ivy's geometry, flyouts and URL state", async ({ page, context }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/templates/page-frame");
  const rail = page.getByRole("navigation", { name: "Products" });
  await expect(rail.getByRole("button")).toHaveText([
    "Issues",
    "Explore",
    "Dashboards",
    "Insights",
    "Monitors",
    "Settings",
  ]);
  await expect(page.locator('[data-slot="page-frame-header"]')).toHaveCSS("height", "53px");
  await expect(rail.locator("..")).toHaveCSS("width", "76px");
  await expect(page.getByRole("complementary", { name: "Secondary navigation" })).toHaveCSS(
    "width",
    "188px",
  );
  await page.getByRole("button", { name: "Collapse sidebar" }).click();
  await expect(page).toHaveURL(/sidebar=collapsed/);
  await expect(page.getByRole("button", { name: "Expand sidebar" })).toBeFocused();
  const headerBox = await page.locator('[data-slot="page-frame-header"]').boundingBox();
  expect(headerBox?.x).toBe(76);
  await rail.getByRole("button", { name: "Dashboards" }).hover();
  await expect(page.locator('[data-slot="page-frame-sidebar"]')).toHaveAttribute(
    "data-state",
    "flyout",
  );
  await expect(page.getByText("All Dashboards", { exact: true })).toBeVisible();
  expect((await page.locator('[data-slot="page-frame-header"]').boundingBox())?.x).toBe(76);
  await page.getByRole("button", { name: "Keep sidebar open" }).click();
  await expect(page).toHaveURL(/sidebar=expanded/);
  await rail.getByRole("button", { name: "Explore" }).click();
  await expect(page).toHaveURL(/area=explore/);
  await page.getByRole("button", { name: "Use dark theme" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByRole("button", { name: "Share", exact: true }).click();
  await expect(page.getByRole("button", { name: "Copied", exact: true })).toBeVisible();
  const url = await page.evaluate(() => navigator.clipboard.readText());
  const restored = await context.newPage();
  await restored.goto(url);
  await expect(restored.locator("html")).toHaveClass(/dark/);
  await expect(
    restored.getByRole("navigation", { name: "Products" }).getByRole("button", { name: "Explore" }),
  ).toHaveAttribute("aria-current", "page");
  await restored.close();
});

test("page frame supports narrow containers, navigation and keyboard dismissal", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/templates/page-frame?viewport=mobile");
  await expect(page.locator('[data-slot="page-frame"]')).toHaveCSS("width", "390px");
  const trigger = page.getByRole("button", { name: "Open navigation" });
  await expect(trigger).toBeVisible();
  await trigger.click();
  await page.getByRole("dialog").getByRole("button", { name: "Settings", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).toHaveURL(/area=settings/);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await page.getByLabel("Preview width").selectOption("tablet");
  await expect(page.locator('[data-slot="page-frame"]')).toHaveCSS("width", "800px");
  await expect(trigger).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});
