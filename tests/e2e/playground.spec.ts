import { expect, test } from "playwright/test";

test("runs the SegmentedControl workbench through exact styles, keyboard behavior, themes, sharing, and reset", async ({
  browser,
  page,
}) => {
  await page.goto(
    "/?component=segmented-control&segmentedDisabled=false&segmentedPriority=primary&segmentedSize=xs&segmentedValue=list&theme=light&viewport=desktop",
  );

  const preview = page.getByTestId("segmented-control-preview");
  const group = preview.getByRole("radiogroup");
  const list = preview.getByRole("radio", { name: "List" });
  const grid = preview.getByRole("radio", { name: "Grid" });
  const chart = preview.getByRole("radio", { name: "Chart" });
  const table = preview.getByRole("radio", { name: "Table view" });
  const labels = group.locator(":scope > label");
  const listLabel = labels.nth(0);
  const gridLabel = labels.nth(1);
  const chartLabel = labels.nth(2);
  const tableLabel = labels.nth(3);

  async function readSegmentStyles(label: typeof listLabel) {
    return label.evaluate((element) => {
      const style = getComputedStyle(element);
      const before = getComputedStyle(element, "::before");
      const after = getComputedStyle(element, "::after");
      const content = getComputedStyle(element.querySelector(":scope > span")!);
      return {
        afterTransform: after.transform,
        afterTransitionDuration: after.transitionDuration,
        afterTransitionTimingFunction: after.transitionTimingFunction,
        borderColor: after.borderTopColor,
        borderWidth: after.borderTopWidth,
        chonkBackground: before.backgroundColor,
        chonkShadow: before.boxShadow,
        color: content.color,
        contentAlignItems: content.alignItems,
        contentDisplay: content.display,
        contentFlexGrow: content.flexGrow,
        contentGap: content.gap,
        contentJustifyContent: content.justifyContent,
        contentOverflow: content.overflow,
        contentPosition: content.position,
        contentShadow: content.boxShadow,
        contentTransform: content.transform,
        contentTransitionDuration: content.transitionDuration,
        contentTransitionTimingFunction: content.transitionTimingFunction,
        cursor: style.cursor,
        focusShadow: style.boxShadow,
        fontSize: style.fontSize,
        height: style.height,
        lineHeight: style.lineHeight,
        minHeight: style.minHeight,
        opacity: style.opacity,
        padding: style.padding,
        radiusBottomLeft: style.borderBottomLeftRadius,
        radiusBottomRight: style.borderBottomRightRadius,
        radiusTopLeft: style.borderTopLeftRadius,
        radiusTopRight: style.borderTopRightRadius,
        surface: after.backgroundColor,
      };
    });
  }

  await expect(group).toHaveAttribute("aria-orientation", "horizontal");
  await expect(group).toHaveCSS("height", "28px");
  await expect(list).toBeChecked();
  await expect(chart).toBeDisabled();
  await expect(table).toHaveAccessibleName("Table view");

  expect(await readSegmentStyles(listLabel)).toMatchObject({
    afterTransform: "matrix(1, 0, 0, 1, 0, 0)",
    afterTransitionDuration: "0s",
    borderColor: "rgb(88, 39, 214)",
    borderWidth: "1px",
    chonkBackground: "rgb(88, 39, 214)",
    color: "rgb(255, 255, 255)",
    contentAlignItems: "center",
    contentDisplay: "flex",
    contentFlexGrow: "1",
    contentGap: "normal",
    contentJustifyContent: "center",
    contentOverflow: "hidden",
    contentPosition: "relative",
    contentTransform: "matrix(1, 0, 0, 1, 0, 0)",
    contentTransitionDuration: "0s",
    fontSize: "12px",
    height: "28px",
    lineHeight: "16px",
    minHeight: "28px",
    padding: "6px 8px",
    radiusBottomLeft: "5px",
    radiusBottomRight: "0px",
    radiusTopLeft: "5px",
    radiusTopRight: "0px",
    surface: "rgb(117, 83, 255)",
  });
  expect(await readSegmentStyles(gridLabel)).toMatchObject({
    afterTransform: "matrix(1, 0, 0, 1, 0, -1)",
    afterTransitionDuration: "0.12s",
    afterTransitionTimingFunction: "cubic-bezier(0.8, -0.4, 0.5, 1)",
    borderColor: "rgb(218, 217, 222)",
    chonkBackground: "rgb(218, 217, 222)",
    color: "rgb(106, 103, 114)",
    contentTransform: "matrix(1, 0, 0, 1, 0, -1)",
    contentTransitionDuration: "0.12s",
    contentTransitionTimingFunction: "cubic-bezier(0.8, -0.4, 0.5, 1)",
    padding: "6px 8px",
    radiusBottomLeft: "0px",
    radiusBottomRight: "0px",
    radiusTopLeft: "0px",
    radiusTopRight: "0px",
    surface: "rgb(255, 255, 255)",
  });
  expect(await readSegmentStyles(chartLabel)).toMatchObject({
    afterTransform: "matrix(1, 0, 0, 1, 0, 0)",
    contentTransform: "matrix(1, 0, 0, 1, 0, 0)",
    cursor: "pointer",
    opacity: "0.6",
  });
  expect(await readSegmentStyles(tableLabel)).toMatchObject({
    padding: "0px",
    radiusBottomLeft: "0px",
    radiusBottomRight: "5px",
    radiusTopLeft: "0px",
    radiusTopRight: "5px",
  });
  await expect(tableLabel).toHaveCSS("width", "28px");

  const boxes = await labels.evaluateAll((elements) =>
    elements.map((element) => {
      const box = element.getBoundingClientRect();
      return { left: box.left, right: box.right };
    }),
  );
  for (let index = 1; index < boxes.length; index += 1) {
    expect(boxes[index]!.left).toBe(boxes[index - 1]!.right - 1);
  }

  const visibleGridLabel = gridLabel.locator(":scope > span > span");
  await gridLabel.evaluate((element) => {
    element.style.width = "24px";
  });
  expect(
    await visibleGridLabel.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        display: style.display,
        overflow: style.overflow,
        overflows: element.scrollWidth > element.clientWidth,
        textOverflow: style.textOverflow,
        whiteSpace: style.whiteSpace,
        width: style.width,
      };
    }),
  ).toMatchObject({
    display: "block",
    overflow: "hidden",
    overflows: true,
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  });
  await gridLabel.evaluate((element) => {
    element.style.removeProperty("width");
  });

  await gridLabel.hover();
  await expect
    .poll(async () => (await readSegmentStyles(gridLabel)).afterTransform)
    .toBe("matrix(1, 0, 0, 1, 0, -2)");
  expect(await readSegmentStyles(gridLabel)).toMatchObject({
    contentTransform: "matrix(1, 0, 0, 1, 0, -2)",
  });
  await page.mouse.down();
  await expect
    .poll(async () => (await readSegmentStyles(gridLabel)).afterTransform)
    .toBe("matrix(1, 0, 0, 1, 0, 0)");
  expect(await readSegmentStyles(gridLabel)).toMatchObject({
    contentTransform: "matrix(1, 0, 0, 1, 0, 0)",
  });
  await page.mouse.move(0, 0);
  await page.mouse.up();
  await expect(list).toBeChecked();
  await expect(grid).not.toBeChecked();

  await gridLabel.click();
  await expect(grid).toBeChecked();
  await expect(grid).toBeFocused();
  await grid.press("ArrowRight");
  await expect(table).toBeChecked();
  await table.press("ArrowRight");
  await expect(list).toBeChecked();
  await list.press("ArrowLeft");
  await expect(table).toBeChecked();
  await table.press("ArrowUp");
  await expect(grid).toBeChecked();
  await grid.press("ArrowDown");
  await expect(table).toBeChecked();
  await expect(page).toHaveURL(/segmentedValue=table/);

  expect(await readSegmentStyles(tableLabel)).toMatchObject({
    contentShadow: "none",
    focusShadow: "rgb(255, 255, 255) 0px 0px 0px 0px, rgb(117, 83, 255) 0px 0px 0px 2px",
  });
  await tableLabel.hover();
  await expect(page.getByRole("tooltip")).toContainText("Table view");

  await page.getByRole("button", { name: "Open setup" }).click();
  const sizeControl = page.getByLabel("Segmented control size");
  const priorityControl = page.getByLabel("Segmented control priority");
  await expect(priorityControl).toHaveValue("primary");
  await sizeControl.selectOption("sm");
  await expect(group).toHaveCSS("height", "32px");
  expect(await readSegmentStyles(listLabel)).toMatchObject({
    fontSize: "14px",
    height: "32px",
    lineHeight: "16px",
    minHeight: "32px",
    padding: "8px 12px",
    radiusTopLeft: "6px",
  });
  await sizeControl.selectOption("md");
  await expect(group).toHaveCSS("height", "36px");
  expect(await readSegmentStyles(listLabel)).toMatchObject({
    fontSize: "14px",
    height: "36px",
    lineHeight: "16px",
    minHeight: "36px",
    padding: "8px 16px",
    radiusTopLeft: "8px",
  });

  await priorityControl.selectOption("default");
  expect(await readSegmentStyles(tableLabel)).toMatchObject({
    borderColor: "rgb(218, 217, 222)",
    chonkBackground: "rgb(218, 217, 222)",
    color: "rgb(101, 61, 233)",
    surface: "rgb(255, 255, 255)",
  });
  await priorityControl.selectOption("secondary");
  expect(await readSegmentStyles(tableLabel)).toMatchObject({
    borderColor: "rgb(218, 217, 222)",
    color: "rgb(101, 61, 233)",
    surface: "rgb(255, 255, 255)",
  });

  await page.getByLabel("Disable segmented control").check();
  for (const radio of [list, grid, chart, table]) await expect(radio).toBeDisabled();
  expect(await readSegmentStyles(tableLabel)).toMatchObject({
    cursor: "pointer",
    opacity: "0.6",
  });
  await listLabel.click({ force: true });
  await expect(table).toBeChecked();
  await expect(list).not.toBeChecked();
  await page.getByRole("button", { name: "Open setup" }).click();
  await page.getByLabel("Disable segmented control").uncheck();

  await page.getByRole("button", { name: "Share" }).click();
  const shared = await page.evaluate(() => navigator.clipboard.readText());
  expect(shared).toContain("component=segmented-control");
  expect(shared).toContain("segmentedDisabled=false");
  expect(shared).toContain("segmentedPriority=secondary");
  expect(shared).toContain("segmentedSize=md");
  expect(shared).toContain("segmentedValue=table");
  const context = await browser.newContext({
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const restored = await context.newPage();
  await restored.goto(shared);
  await expect(
    restored.getByTestId("segmented-control-preview").getByRole("radio", { name: "Table view" }),
  ).toBeChecked();
  await restored.getByRole("button", { name: "Open setup" }).click();
  await expect(restored.getByLabel("Segmented control priority")).toHaveValue("secondary");
  await expect(restored.getByLabel("Segmented control size")).toHaveValue("md");
  await expect(restored.getByLabel("Disable segmented control")).not.toBeChecked();
  await context.close();

  await page.getByRole("button", { name: "Reset" }).click();
  await expect(list).toBeChecked();
  await expect(list).not.toBeDisabled();
  await expect(group).toHaveCSS("height", "36px");
  await expect(page).toHaveURL(/segmentedDisabled=false/);
  await expect(page).toHaveURL(/segmentedPriority=default/);
  await expect(page).toHaveURL(/segmentedSize=md/);
  await expect(page).toHaveURL(/segmentedValue=list/);

  await page.goto(
    "/?component=segmented-control&segmentedDisabled=false&segmentedPriority=primary&segmentedSize=xs&segmentedValue=list&theme=dark&viewport=desktop",
  );
  const darkPreview = page.getByTestId("segmented-control-preview");
  const darkLabels = darkPreview.getByRole("radiogroup").locator(":scope > label");
  const darkList = darkPreview.getByRole("radio", { name: "List" });
  const darkGrid = darkPreview.getByRole("radio", { name: "Grid" });
  const darkListStyles = await readSegmentStyles(darkLabels.nth(0));
  const darkGridStyles = await readSegmentStyles(darkLabels.nth(1));
  expect(darkListStyles).toMatchObject({
    borderColor: "rgb(18, 5, 57)",
    chonkBackground: "rgb(18, 5, 57)",
    color: "rgb(255, 255, 255)",
    surface: "rgb(117, 83, 255)",
  });
  expect(darkGridStyles).toMatchObject({
    borderColor: "rgb(20, 17, 25)",
    chonkBackground: "rgb(20, 17, 25)",
    color: "rgb(181, 176, 189)",
    surface: "rgb(46, 41, 54)",
  });
  await darkList.press("ArrowRight");
  await expect(darkGrid).toBeChecked();
  expect(await readSegmentStyles(darkLabels.nth(1))).toMatchObject({
    contentShadow: "none",
    focusShadow: "rgb(46, 41, 54) 0px 0px 0px 0px, rgb(117, 83, 255) 0px 0px 0px 2px",
  });
});

test("runs the Switch workbench through sharing, native form controls, keyboard, sizes, and themes", async ({
  browser,
  page,
}) => {
  await page.goto(
    "/?component=switch&switchChecked=true&switchDisabled=false&switchSize=lg&theme=light&viewport=desktop",
  );
  const preview = page.getByTestId("switch-preview");
  const input = preview.getByRole("checkbox", { name: "Issue notifications" });
  const track = preview.locator("[data-slot='switch-track']");
  const thumb = preview.locator("[data-slot='switch-thumb']");
  const close = preview.locator("[data-icon='close']");
  const checkmark = preview.locator("[data-icon='checkmark']");
  await expect(input).toBeChecked();
  await expect(input).toHaveAttribute("type", "checkbox");
  await expect(input).not.toHaveAttribute("role", "switch");
  await expect(track).toHaveCSS("width", "40px");
  await expect(track).toHaveCSS("height", "24px");
  await expect(track).toHaveCSS("border-radius", "5px");
  await expect(track).toHaveCSS("border-top-width", "2px");
  await expect(track).toHaveCSS("border-right-width", "1px");
  await expect(track).toHaveCSS("background-color", "rgb(117, 83, 255)");
  await expect(track).toHaveCSS("border-top-color", "rgb(88, 39, 214)");
  await expect(thumb).toHaveCSS("width", "24px");
  await expect(thumb).toHaveCSS("height", "24px");
  await expect(thumb).toHaveCSS("border-radius", "5px");
  await expect(thumb).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(thumb).toHaveCSS("border-color", "rgb(88, 39, 214)");
  await expect(thumb).toHaveCSS("transform", "matrix(1, 0, 0, 1, 16, -1)");
  await expect(close).toHaveCSS("width", "14px");
  await expect(close).toHaveCSS("opacity", "0");
  await expect(checkmark).toHaveCSS("width", "14px");
  await expect(checkmark).toHaveCSS("fill", "rgb(101, 61, 233)");
  await expect(checkmark).toHaveCSS("opacity", "1");
  await page.getByRole("button", { name: "Open setup" }).click();
  await expect(page.getByLabel("Switch size")).toHaveValue("lg");
  await expect(page.getByLabel("Enable switch")).toBeChecked();
  await page.getByRole("button", { name: "Share" }).click();
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
  expect(sharedUrl).toContain("component=switch");
  expect(sharedUrl).toContain("switchChecked=true");
  expect(sharedUrl).toContain("switchDisabled=false");
  expect(sharedUrl).toContain("switchSize=lg");
  const context = await browser.newContext({
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const restored = await context.newPage();
  await restored.goto(sharedUrl);
  await expect(
    restored.getByTestId("switch-preview").getByRole("checkbox", { name: "Issue notifications" }),
  ).toBeChecked();
  await restored.getByRole("button", { name: "Open setup" }).click();
  await expect(restored.getByLabel("Component or template")).toHaveValue("switch");
  await expect(restored.getByLabel("Switch size")).toHaveValue("lg");
  await expect(restored.getByLabel("Disable switch")).not.toBeChecked();
  await context.close();
  await page.getByRole("button", { name: "Close setup" }).click();
  await page.keyboard.press("Tab");
  await input.focus();
  await expect(track).toHaveCSS(
    "box-shadow",
    "rgb(255, 255, 255) 0px 0px 0px 0px, rgb(117, 83, 255) 0px 0px 0px 2px",
  );
  await page.keyboard.press("Space");
  await expect(input).not.toBeChecked();
  await expect(track).toHaveCSS("background-color", "rgba(16, 16, 48, 0.03)");
  await expect(track).toHaveCSS("border-top-color", "rgb(218, 217, 222)");
  await expect(thumb).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, -1)");
  await expect(close).toHaveCSS("fill", "rgb(106, 103, 114)");
  await expect(close).toHaveCSS("opacity", "1");
  await expect(checkmark).toHaveCSS("opacity", "0");
  await preview.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByTestId("switch-submit-result")).toHaveText("Submitted: disabled");
  await input.click();
  await expect(thumb).toHaveCSS("transform", "matrix(1, 0, 0, 1, 16, -1)");
  await preview.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByTestId("switch-submit-result")).toHaveText("Submitted: enabled");
  await page.getByRole("button", { name: "Open setup" }).click();
  await page.getByLabel("Switch size").selectOption("sm");
  await expect(track).toHaveCSS("width", "36px");
  await expect(thumb).toHaveCSS("width", "20px");
  await expect(close).toHaveCSS("width", "12px");
  await page.getByLabel("Switch size").selectOption("lg");
  await expect(track).toHaveCSS("width", "40px");
  await page.getByLabel("Disable switch").check();
  await expect(input).toBeDisabled();
  await expect(track).toHaveCSS("opacity", "0.6");
  await expect(thumb).toHaveCSS("transform", "matrix(1, 0, 0, 1, 17, 0)");
  await preview.getByRole("button", { name: "Reset" }).click();
  await expect(input).not.toBeChecked();
  await expect(input).not.toBeDisabled();
  await expect(track).toHaveCSS("opacity", "1");
  await expect(track).toHaveCSS("width", "36px");
  await expect(thumb).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, -1)");
  await expect(page.getByTestId("switch-submit-result")).toHaveText("Reset");
  await expect(page).toHaveURL(/switchChecked=false/);
  await expect(page).toHaveURL(/switchDisabled=false/);
  await expect(page).toHaveURL(/switchSize=sm/);
  await page.goto(
    "/?component=switch&switchChecked=false&switchDisabled=false&switchSize=sm&theme=dark&viewport=desktop",
  );
  expect(
    await page.locator("html").evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        accentChonk: style.getPropertyValue("--scraps-switch-accent-chonk").trim(),
        close: style.getPropertyValue("--scraps-switch-close").trim(),
        neutral: style.getPropertyValue("--scraps-switch-neutral-background").trim(),
        surface: style.getPropertyValue("--scraps-switch-thumb-surface").trim(),
      };
    }),
  ).toEqual({
    accentChonk: "#120539",
    close: "#b5b0bd",
    neutral: "#00002033",
    surface: "#2e2936",
  });
  const darkPreview = page.getByTestId("switch-preview");
  await expect(darkPreview.locator("[data-slot='switch-track']")).toHaveCSS(
    "background-color",
    "rgba(0, 0, 32, 0.2)",
  );
  await expect(darkPreview.locator("[data-slot='switch-thumb']")).toHaveCSS(
    "background-color",
    "rgb(46, 41, 54)",
  );
  await expect(darkPreview.locator("[data-icon='close']")).toHaveCSS("fill", "rgb(181, 176, 189)");
});

test("runs the Slider workbench through keyboard, pointer, touch, and sharing", async ({
  browser,
  page,
}) => {
  await page.goto(
    "/?component=slider&sliderDisabled=false&sliderValue=40.5&theme=light&viewport=desktop",
  );
  const slider = page.getByRole("slider", { name: "Deployment progress" });
  const preview = page.getByTestId("slider-preview");
  const trackArea = preview.locator("[data-slot='slider-track-area']");
  const activeTrack = preview.locator("[data-slot='slider-active-track']");
  const inactiveTrack = preview.locator("[data-slot='slider-inactive-track']");
  const thumb = preview.locator("[data-slot='slider-thumb-hitbox']");
  const thumbChonk = preview.locator("[data-slot='slider-thumb-chonk']");
  const thumbSurface = preview.locator("[data-slot='slider-thumb-surface']");
  const valueLabel = preview.locator("[data-slot='slider-value-label']");
  const lastCommit = page.getByTestId("slider-last-commit");

  await expect(slider).toHaveValue("41");
  await expect(preview.getByText("Value: 41", { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/sliderValue=41/);
  await page.getByRole("button", { name: "Open setup" }).click();
  const sliderValueInput = page.getByLabel("Slider value");
  await expect(sliderValueInput).toHaveValue("41");
  await sliderValueInput.fill("39.5");
  await expect(sliderValueInput).toHaveValue("40");
  await expect(slider).toHaveValue("40");
  await expect(preview.getByText("Value: 40", { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/sliderValue=40/);
  await page.getByRole("button", { name: "Share" }).click();
  const normalizedUrl = await page.evaluate(() => navigator.clipboard.readText());
  expect(normalizedUrl).toContain("component=slider");
  expect(normalizedUrl).toContain("sliderValue=40");
  expect(normalizedUrl).not.toContain("sliderValue=39.5");

  const normalizedContext = await browser.newContext({
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const normalizedPage = await normalizedContext.newPage();
  await normalizedPage.goto(normalizedUrl);
  await expect(normalizedPage.getByRole("slider", { name: "Deployment progress" })).toHaveValue(
    "40",
  );
  await expect(
    normalizedPage.getByTestId("slider-preview").getByText("Value: 40", {
      exact: true,
    }),
  ).toBeVisible();
  await normalizedPage.getByRole("button", { name: "Open setup" }).click();
  await expect(normalizedPage.getByLabel("Slider value")).toHaveValue("40");
  await normalizedContext.close();
  await page.getByRole("button", { name: "Close setup" }).click();

  expect(
    await page.locator("html").evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        accentBackground: style.getPropertyValue("--scraps-slider-accent-background").trim(),
        accentChonk: style.getPropertyValue("--scraps-slider-accent-chonk").trim(),
        neutralBackground: style.getPropertyValue("--scraps-slider-neutral-background").trim(),
        neutralChonk: style.getPropertyValue("--scraps-slider-neutral-chonk").trim(),
        thumbSurface: style.getPropertyValue("--scraps-slider-thumb-surface").trim(),
      };
    }),
  ).toEqual({
    accentBackground: "#7553ff",
    accentChonk: "#5827d6",
    neutralBackground: "#10103008",
    neutralChonk: "#dad9de",
    thumbSurface: "#fff",
  });
  await expect(activeTrack).toHaveCSS("background-color", "rgb(117, 83, 255)");
  await expect(activeTrack).toHaveCSS("border-left-color", "rgb(88, 39, 214)");
  await expect(inactiveTrack).toHaveCSS("border-right-color", "rgb(218, 217, 222)");
  await expect(thumbSurface).toHaveCSS("background-color", "rgb(255, 255, 255)");

  await trackArea.hover();
  await expect(valueLabel).toHaveCSS("color", "rgb(101, 61, 233)");
  await page.keyboard.press("Tab");
  await slider.focus();
  await expect(slider).toBeFocused();
  await expect(thumbChonk).toHaveCSS("background-color", "rgb(88, 39, 214)");
  await expect(valueLabel).toHaveCSS("background-color", "rgb(117, 83, 255)");
  await expect(valueLabel).toHaveCSS("color", "rgb(255, 255, 255)");
  const focusRing = await valueLabel.evaluate(
    (element) => getComputedStyle(element, "::after").boxShadow,
  );
  expect(focusRing).toContain("rgb(117, 83, 255)");
  expect(focusRing).toContain("2px");
  await slider.blur();
  await expect(valueLabel).toHaveCSS("color", "rgb(101, 61, 233)");
  await slider.focus();

  await page.keyboard.press("ArrowRight");
  await expect(slider).toHaveValue("41");
  await expect(lastCommit).toHaveText("Last commit: 41");
  await page.keyboard.press("PageUp");
  await expect(slider).toHaveValue("51");
  await page.keyboard.press("PageDown");
  await expect(slider).toHaveValue("41");
  await page.keyboard.press("End");
  await expect(slider).toHaveValue("100");
  await page.keyboard.press("Home");
  await expect(slider).toHaveValue("0");

  const trackBox = await trackArea.boundingBox();
  const thumbBox = await thumb.boundingBox();
  expect(trackBox).not.toBeNull();
  expect(thumbBox).not.toBeNull();
  await page.mouse.move(thumbBox!.x + thumbBox!.width / 2, thumbBox!.y + thumbBox!.height / 2);
  await page.mouse.down();
  await page.mouse.move(trackBox!.x + trackBox!.width * 0.7, trackBox!.y + 32);
  await expect(lastCommit).toHaveText("Last commit: 0");
  await page.mouse.up();
  const pointerValue = await slider.inputValue();
  expect(Number(pointerValue)).toBeGreaterThanOrEqual(69);
  expect(Number(pointerValue)).toBeLessThanOrEqual(71);
  await expect(lastCommit).toHaveText(`Last commit: ${pointerValue}`);

  const touchTargetX = trackBox!.x + trackBox!.width * 0.3;
  const touchTargetY = trackBox!.y + 32;
  await thumb.dispatchEvent("pointerdown", {
    bubbles: true,
    button: 0,
    buttons: 1,
    clientX: trackBox!.x + trackBox!.width * 0.7,
    clientY: touchTargetY,
    isPrimary: true,
    pointerId: 7,
    pointerType: "touch",
  });
  await page.evaluate(
    ({ clientX, clientY }) => {
      window.dispatchEvent(
        new PointerEvent("pointermove", {
          bubbles: true,
          button: 0,
          buttons: 1,
          clientX,
          clientY,
          isPrimary: true,
          pointerId: 7,
          pointerType: "touch",
        }),
      );
    },
    { clientX: touchTargetX, clientY: touchTargetY },
  );
  const touchValue = await slider.inputValue();
  expect(Number(touchValue)).toBeLessThan(Number(pointerValue));
  await expect(lastCommit).toHaveText(`Last commit: ${pointerValue}`);
  await page.evaluate(
    ({ clientX, clientY }) => {
      window.dispatchEvent(
        new PointerEvent("pointerup", {
          bubbles: true,
          button: 0,
          buttons: 0,
          clientX,
          clientY,
          isPrimary: true,
          pointerId: 7,
          pointerType: "touch",
        }),
      );
    },
    { clientX: touchTargetX, clientY: touchTargetY },
  );
  await expect(lastCommit).toHaveText(`Last commit: ${touchValue}`);

  await expect(page).toHaveURL(new RegExp(`sliderValue=${touchValue}`));

  await page.goto(
    `/?component=slider&sliderDisabled=false&sliderValue=${touchValue}&theme=dark&viewport=desktop`,
  );
  expect(
    await page.locator("html").evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        accentChonk: style.getPropertyValue("--scraps-slider-accent-chonk").trim(),
        neutralBackground: style.getPropertyValue("--scraps-slider-neutral-background").trim(),
        neutralChonk: style.getPropertyValue("--scraps-slider-neutral-chonk").trim(),
        thumbSurface: style.getPropertyValue("--scraps-slider-thumb-surface").trim(),
      };
    }),
  ).toEqual({
    accentChonk: "#120539",
    neutralBackground: "#00002033",
    neutralChonk: "#141119",
    thumbSurface: "#393442",
  });
  await page.goto(
    `/?component=slider&sliderDisabled=true&sliderValue=${touchValue}&theme=dark&viewport=mobile`,
  );
  await expect(page.getByRole("slider", { name: "Deployment progress" })).toBeDisabled();
  await expect(page.locator("html")).toHaveClass(/dark/);
});

test("runs the Modal workbench through nested overlays, isolation, geometry, and close restrictions", async ({
  page,
}) => {
  await page.goto(
    "/?component=modal&modalBackdrop=true&modalCloseEvents=all&modalLong=true&modalWidth=720px&theme=light&viewport=desktop",
  );
  const preview = page.getByTestId("modal-preview");
  const openButton = preview.getByRole("button", { name: "Open modal" });
  const initialUrl = page.url();
  await openButton.click();

  const dialog = page.getByRole("dialog", { name: "Modal" });
  await expect(dialog).toContainText("Scraps Modal");
  await expect(dialog).toHaveCSS("margin-top", "50px");
  await expect(dialog).toHaveCSS("padding-top", "32px");
  await expect(dialog).toHaveCSS("padding-left", "16px");
  await expect(dialog).toHaveCSS("width", "720px");
  const header = dialog.locator("header");
  const footer = dialog.locator("footer");
  await expect(header).toHaveCSS("margin-bottom", "24px");
  await expect(header).toHaveCSS("padding-top", "24px");
  await expect(header).toHaveCSS("padding-bottom", "24px");
  await expect(header).toHaveCSS("border-bottom-width", "1px");
  await expect(footer).toHaveCSS("margin-top", "24px");
  await expect(footer).toHaveCSS("padding-top", "24px");
  await expect(footer).toHaveCSS("padding-bottom", "24px");
  await expect(footer).toHaveCSS("border-top-width", "1px");
  await expect(page.locator("body")).toHaveCSS("position", "fixed");
  await expect(page.locator("[data-slot='playground-canvas']")).toHaveAttribute(
    "aria-hidden",
    "true",
  );
  await expect(page.locator("#modal-portal")).toHaveCSS("container-type", "inline-size");

  await dialog.getByRole("button", { exact: true, name: "One" }).click();
  await expect(page.getByRole("option", { exact: true, name: "One" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("option", { exact: true, name: "One" })).toHaveCount(0);
  await expect(dialog).toBeVisible();

  await dialog.getByRole("button", { name: "Close Modal" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(openButton).toBeFocused();
  await expect(page.locator("body")).not.toHaveCSS("position", "fixed");
  await expect(page.locator("[data-slot='playground-canvas']")).not.toHaveAttribute(
    "aria-hidden",
    "true",
  );
  expect(page.url()).toBe(initialUrl);

  await page.goto(
    "/?component=modal&modalBackdrop=true&modalCloseEvents=none&modalLong=false&modalWidth=&theme=light&viewport=desktop",
  );
  await page.getByTestId("modal-preview").getByRole("button", { name: "Open modal" }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Modal" })).toBeVisible();
  await page.locator("[data-test-id='modal-backdrop']").click({ position: { x: 2, y: 2 } });
  await expect(page.getByRole("dialog", { name: "Modal" })).toBeVisible();
  await page
    .getByRole("dialog", { name: "Modal" })
    .getByRole("button", { name: "Close Modal" })
    .click();
  await expect(page.getByTestId("modal-close-reason")).toContainText("close-button");

  await page.goto(
    "/?component=modal&modalBackdrop=true&modalCloseEvents=all&modalLong=false&modalTextOnly=true&modalWidth=&theme=light&viewport=desktop",
  );
  const textOnlyOpenButton = page
    .getByTestId("modal-preview")
    .getByRole("button", { name: "Open modal" });
  await textOnlyOpenButton.click();
  const textOnlyDialog = page.getByRole("dialog", { name: "Modal" });
  await expect(textOnlyDialog).toContainText("Text-only modal content.");
  await expect(textOnlyDialog).toBeFocused();
  await expect(page.locator("[data-slot='playground-canvas']")).toHaveAttribute(
    "aria-hidden",
    "true",
  );
  await page.keyboard.press("Escape");
  await expect(textOnlyDialog).toHaveCount(0);
  await expect(textOnlyOpenButton).toBeFocused();

  await textOnlyOpenButton.click();
  await page.evaluate(() => {
    window.history.pushState(null, "", `/templates/checkbox-settings${window.location.search}`);
  });
  await expect(page.getByRole("dialog", { name: "Modal" })).toHaveCount(0);
});

test("runs the Drawer workbench through modes, routes, resize persistence, overlays, themes, and sharing", async ({
  browser,
  page,
}) => {
  const drawerUrl = (overrides = "") => {
    const params = new URLSearchParams(
      "component=drawer&drawerMode=blocking&drawerResizable=true&drawerKey=true&drawerLong=false&drawerWidth=&drawerRoutePolicy=default&theme=light&viewport=desktop",
    );
    for (const [key, value] of new URLSearchParams(overrides)) {
      params.set(key, value);
    }
    return `/?${params.toString()}`;
  };
  const openDrawer = async () => {
    await page.getByTestId("drawer-preview").getByRole("button", { name: "Open drawer" }).click();
    return page.getByRole("complementary", { name: "Scraps Drawer" });
  };

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(drawerUrl());
  let drawer = await openDrawer();
  await expect(drawer).toBeVisible();
  await expect(drawer).toHaveCSS("width", "640px");
  await expect(drawer).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(drawer).toHaveCSS("border-left-width", "1px");
  await expect(page.locator("body")).toHaveCSS("position", "fixed");
  await expect(page.locator("[data-drawer-backdrop]")).toBeVisible();
  await expect(drawer.locator("header")).toHaveCSS("height", "53px");
  await expect(drawer.locator("header")).toHaveCSS("z-index", "10000");
  await expect(drawer.locator("header")).toHaveCSS("padding-left", "12px");
  await expect(drawer.locator("header")).toHaveCSS("padding-top", "6px");
  await expect(drawer.locator("aside")).toHaveCSS("padding-left", "24px");
  await expect(drawer.locator("aside")).toHaveCSS("padding-top", "16px");

  await drawer.getByRole("button", { name: "Open modal over drawer" }).click();
  const dialog = page.getByRole("dialog", { name: "Modal" });
  await expect(dialog).toContainText("Modal over drawer");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(drawer).toBeVisible();
  await expect(page.locator("body")).toHaveCSS("position", "fixed");
  await page.keyboard.press("Escape");
  await expect(drawer).toHaveCount(0);
  await expect(page.locator("body")).not.toHaveCSS("position", "fixed");
  await expect(page.getByTestId("drawer-last-event")).toContainText("onClose");

  await page.goto(drawerUrl("&drawerMode=passive"));
  drawer = await openDrawer();
  await expect(page.locator("[data-drawer-backdrop]")).toHaveCount(0);
  await expect(page.locator("body")).not.toHaveCSS("position", "fixed");
  await page.getByRole("button", { name: "Interact with page" }).click();
  await expect(page.getByTestId("drawer-page-interactions")).toHaveText("Page interactions: 1");
  await page.keyboard.press("Escape");
  await expect(drawer).toHaveCount(0);

  await page.goto(drawerUrl());
  drawer = await openDrawer();
  await drawer.getByRole("button", { name: "Change test location" }).click();
  await expect(drawer).toHaveCount(0);
  await expect(page.getByTestId("drawer-last-event")).toContainText("onOpen");

  await page.goto(drawerUrl("&drawerRoutePolicy=keep"));
  drawer = await openDrawer();
  await drawer.getByRole("button", { name: "Change test location" }).click();
  await expect(drawer).toBeVisible();
  await drawer.getByRole("button", { name: "Close Drawer" }).click();

  await page.goto(drawerUrl("&drawerMode=passive&drawerRoutePolicy=close"));
  drawer = await openDrawer();
  await drawer.getByRole("button", { name: "Change test location" }).click();
  await expect(drawer).toHaveCount(0);

  await page.evaluate(() => localStorage.removeItem("drawer-width:playground"));
  await page.goto(drawerUrl());
  drawer = await openDrawer();
  const resizeHandle = page.locator("[data-slot='drawer-resize-handle']");
  const resizeBox = await resizeHandle.boundingBox();
  expect(resizeBox).not.toBeNull();
  const resizeHandleTransition = await resizeHandle.evaluate((element) => {
    const style = getComputedStyle(element, "::after");
    return {
      duration: style.transitionDuration,
      property: style.transitionProperty,
      timingFunction: style.transitionTimingFunction,
    };
  });
  expect(resizeHandleTransition.property).toContain("background-color");
  expect(resizeHandleTransition.duration).toBe("0.1s");
  expect(["ease", "cubic-bezier(0.25, 0.1, 0.25, 1)"]).toContain(
    resizeHandleTransition.timingFunction,
  );
  await resizeHandle.dispatchEvent("mousedown", {
    bubbles: true,
    button: 0,
    clientX: resizeBox!.x + resizeBox!.width / 2,
    clientY: 200,
  });
  await expect(resizeHandle).toHaveAttribute("data-resizing", "");
  await expect(drawer).toHaveCSS("overflow", "hidden");
  expect(
    await drawer.evaluate((element) => getComputedStyle(element, "::-webkit-scrollbar").display),
  ).toBe("none");
  await page.evaluate(() => {
    document.dispatchEvent(
      new MouseEvent("mousemove", { bubbles: true, clientX: 256, clientY: 200 }),
    );
  });
  await expect(drawer).toHaveCSS("width", "1024px");
  await page.evaluate(() => {
    document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
  });
  await expect(drawer).toHaveCSS("width", "1024px");
  expect(await page.evaluate(() => localStorage.getItem("drawer-width:playground"))).toBe("80");
  await drawer.getByRole("button", { name: "Close Drawer" }).click();
  drawer = await openDrawer();
  await expect(drawer).toHaveCSS("width", "1024px");
  await drawer.getByRole("button", { name: "Close Drawer" }).click();
  await page.reload();
  drawer = await openDrawer();
  await expect(drawer).toHaveCSS("width", "1024px");
  await drawer.getByRole("button", { name: "Close Drawer" }).click();

  await page.goto(drawerUrl("&drawerKey=false&theme=dark"));
  drawer = await openDrawer();
  await expect(drawer).toHaveCSS("background-color", "rgb(57, 52, 66)");
  expect(
    await drawer.locator("header").evaluate((element) => getComputedStyle(element).backgroundColor),
  ).toBe(
    await page.locator("body").evaluate((element) => getComputedStyle(element).backgroundColor),
  );
  await drawer.getByRole("button", { name: "Close Drawer" }).click();

  await page.setViewportSize({ width: 800, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(drawerUrl("&viewport=mobile"));
  expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(
    true,
  );
  drawer = await openDrawer();
  const mobileBox = await drawer.boundingBox();
  expect(mobileBox?.x).toBe(0);
  expect(mobileBox?.width).toBe(800);
  await expect(page.locator("[data-slot='drawer-resize-handle']")).toHaveCount(0);
  await drawer.getByRole("button", { name: "Close Drawer" }).click();

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/?component=drawer&theme=light&viewport=desktop");
  await page.getByRole("button", { name: "Open setup" }).click();
  await page.getByLabel("Drawer mode").selectOption("passive");
  await page.getByLabel("Drawer route policy").selectOption("close");
  await page.getByLabel("Drawer resizable").uncheck();
  await page.getByRole("button", { name: "Share" }).click();
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
  expect(sharedUrl).toContain("component=drawer");
  expect(sharedUrl).toContain("drawerMode=passive");
  expect(sharedUrl).toContain("drawerRoutePolicy=close");
  expect(sharedUrl).toContain("drawerResizable=false");

  const restoredContext = await browser.newContext({
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const restoredPage = await restoredContext.newPage();
  await restoredPage.goto(sharedUrl);
  await restoredPage.getByRole("button", { name: "Open setup" }).click();
  await expect(restoredPage.getByLabel("Drawer mode")).toHaveValue("passive");
  await expect(restoredPage.getByLabel("Drawer route policy")).toHaveValue("close");
  await expect(restoredPage.getByLabel("Drawer resizable")).not.toBeChecked();
  await restoredContext.close();
});

test("covers all Badge exports, feature focus, share, and reset", async ({ browser, page }) => {
  await page.goto("/?component=badge");
  const preview = page.getByTestId("badge-preview");
  await expect(preview.locator('[data-export="Badge"]')).toContainText("Badge label");

  await page.getByRole("button", { name: "Open setup" }).click();
  const exportSelect = page.getByLabel("Badge export");
  await page.getByLabel("Badge variant").selectOption("alpha");
  await expect(preview.locator('[data-export="Badge"]')).toHaveCSS("border-radius", "5px");

  await exportSelect.selectOption("tag");
  await expect(preview.locator('[data-export="Tag"]')).toContainText("Tagged release");
  await expect(preview.locator('[data-export="Tag"]')).toHaveCSS("border-radius", "4px");

  await exportSelect.selectOption("feature");
  await page.getByLabel("Feature type").selectOption("new");
  await page.getByRole("button", { name: "Close setup" }).click();
  const standaloneFeature = preview
    .locator('[data-export="FeatureBadge"]')
    .getByRole("img", { name: "new" });
  await standaloneFeature.focus();
  await expect(page.getByRole("tooltip")).toContainText(
    "This feature is new! Try it out and let us know what you think",
  );

  await page.getByRole("button", { name: "Open setup" }).click();
  await page.getByLabel("Nest in interactive parent").check();
  await page.getByRole("button", { name: "Close setup" }).click();
  const nestedFeature = preview.locator('[data-export="FeatureBadge"]');
  await expect(nestedFeature).not.toHaveAttribute("tabindex");
  const parentAction = preview.getByRole("button", { name: /Parent action/ });
  await page.getByRole("button", { name: "Open setup" }).focus();
  const focusableCount = await page
    .locator(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )
    .count();
  for (let index = 0; index < focusableCount; index += 1) {
    if (await parentAction.evaluate((element) => element === document.activeElement)) {
      break;
    }
    await page.keyboard.press("Tab");
  }
  await expect(parentAction).toBeFocused();
  await expect(page.getByRole("tooltip")).toContainText(
    "This feature is new! Try it out and let us know what you think",
  );

  await page.getByRole("button", { name: "Open setup" }).click();
  await exportSelect.selectOption("alert");
  await page.getByLabel("Alert state").selectOption("critical");
  await expect(preview.locator('[data-export="AlertBadge"]')).toContainText("Critical");

  await exportSelect.selectOption("deploy");
  await page.getByLabel("Deploy environment").fill("production-eu");
  await expect(preview.locator('[data-export="DeployBadge"]')).toContainText("production-eu");
  await expect(preview.locator('[data-export="DeployBadge"] a')).toHaveAttribute(
    "href",
    "/organizations/sentry/issues/?environment=production-eu&project=1&query=release%3A4.9.0+build+%280.0.01",
  );

  await exportSelect.selectOption("projects");
  await page.getByLabel("Project platforms").fill("python,javascript,ruby");
  await expect(preview.locator('[data-export="ProjectsBadge"] img')).toHaveCount(2);
  await page.getByRole("button", { name: "Share" }).click();
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
  expect(sharedUrl).toContain("component=badge");
  expect(sharedUrl).toContain("badgeComponent=projects");
  expect(sharedUrl).toContain("badgePlatforms=python%2Cjavascript%2Cruby");

  const restoredContext = await browser.newContext({
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const restored = await restoredContext.newPage();
  await restored.goto(sharedUrl);
  await restored.getByRole("button", { name: "Open setup" }).click();
  await expect(restored.getByLabel("Badge export")).toHaveValue("projects");
  await expect(restored.getByLabel("Project platforms")).toHaveValue("python,javascript,ruby");
  await restored
    .getByRole("complementary", { name: "Playground controls" })
    .getByLabel("Reset")
    .click();
  await expect(restored.getByLabel("Badge export")).toHaveValue("badge");
  await expect(restored.getByLabel("Badge variant")).toHaveValue("info");
  await expect(restored).toHaveURL(/component=badge/);
  await restoredContext.close();
});

test("uses, shares, and resets the regular Scraps Select workbench", async ({ browser, page }) => {
  await page.goto("/?component=select");
  const preview = page.getByTestId("select-preview");
  const selectInput = preview.getByLabel("Project selector");
  await expect(preview.locator('[data-export="Select"]')).toContainText("Frontend");
  await expect(selectInput).not.toHaveAttribute("role", "combobox");
  await expect(selectInput).not.toHaveAttribute("aria-expanded");

  await page.getByRole("button", { name: "Open setup" }).click();
  await page.getByLabel("Select multiple").check();
  await page.getByLabel("Select clearable").uncheck();
  await page.getByLabel("Select size").selectOption("sm");
  await page.getByRole("button", { name: "Close setup" }).click();
  await expect(preview.getByRole("button", { name: "Clear choices" })).toHaveCount(0);
  await selectInput.press("ArrowDown");
  await expect(preview.getByRole("menuitemcheckbox")).toHaveCount(4);
  await selectInput.press("End");
  await selectInput.press("Enter");
  await expect(preview.locator('input[type="hidden"][name="project"]')).toHaveCount(2);
  await expect(preview.locator('[data-export="Select"]')).toContainText("Relay");

  await page.getByRole("button", { name: "Open setup" }).click();
  await page.getByLabel("Select clearable").check();
  await page.getByLabel("Select async").check();
  await page.getByLabel("Select creatable").check();
  await page.getByRole("button", { name: "Close setup" }).click();
  await selectInput.fill("custom, project");
  await preview.getByText('Create "custom, project"').click();
  await expect(preview.locator('[data-export="Select"]')).toContainText("custom, project");

  await page.getByRole("button", { name: "Open setup" }).click();
  await page.getByRole("button", { name: "Share" }).click();
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
  expect(sharedUrl).toContain("component=select");
  expect(sharedUrl).toContain("selectMultiple=true");
  expect(sharedUrl).toContain("selectAsync=true");
  const sharedState = new URL(sharedUrl).searchParams;
  expect(JSON.parse(sharedState.get("selectSelected") ?? "[]")).toEqual([
    "frontend",
    "relay",
    "custom, project",
  ]);
  expect(JSON.parse(sharedState.get("selectCreated") ?? "[]")).toEqual(["custom, project"]);

  const restoredContext = await browser.newContext({
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const restored = await restoredContext.newPage();
  await restored.goto(sharedUrl);
  await restored.getByRole("button", { name: "Open setup" }).click();
  await expect(restored.getByLabel("Select multiple")).toBeChecked();
  await expect(restored.getByLabel("Select async")).toBeChecked();
  await expect(restored.getByLabel("Select size")).toHaveValue("sm");
  await restored.getByRole("button", { name: "Close setup" }).click();
  await expect(
    restored.getByTestId("select-preview").locator('[data-export="Select"]'),
  ).toContainText("custom, project");
  await restored.getByRole("button", { name: "Open setup" }).click();
  await restored.getByRole("button", { name: "Reset" }).click();
  await expect(restored.getByLabel("Select multiple")).not.toBeChecked();
  await expect(restored.getByLabel("Select async")).not.toBeChecked();
  await expect(restored.getByLabel("Select size")).toHaveValue("md");
  await expect(restored).toHaveURL(/component=select/);
  await restoredContext.close();
});

test("edits, submits, shares, and resets the regular Scraps Form workbench", async ({
  browser,
  page,
}) => {
  await page.goto("/?component=form");
  const preview = page.getByTestId("form-preview");
  const input = preview.getByLabel("Project name");
  await expect(input).toHaveValue("Frontend");
  await input.fill("Relay");
  await preview.getByRole("button", { name: "Save" }).click();

  await page.getByRole("button", { name: "Open setup" }).click();
  await page.getByLabel("Form field label").fill("Service name");
  await page.getByLabel("Form layout").selectOption("stack");
  await page.getByRole("button", { name: "Share" }).click();
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
  expect(sharedUrl).toContain("component=form");
  expect(sharedUrl).toContain("formValue=Relay");

  const restoredContext = await browser.newContext({
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const restored = await restoredContext.newPage();
  await restored.goto(sharedUrl);
  await expect(restored.getByTestId("form-preview").getByLabel("Service name")).toHaveValue(
    "Relay",
  );
  await restored.getByRole("button", { name: "Open setup" }).click();
  await expect(restored.getByLabel("Form layout")).toHaveValue("stack");
  await restored
    .getByRole("complementary", { name: "Playground controls" })
    .getByLabel("Reset")
    .click();
  await expect(restored.getByLabel("Form field label")).toHaveValue("Project name");
  await expect(restored).toHaveURL(/component=form/);
  await restoredContext.close();
});

test("opens, styles, shares, and closes the regular Scraps PictureInPicture workbench", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const pipDocument = document.implementation.createHTMLDocument("pip");
    const events = new EventTarget();
    let closed = false;
    const pipWindow = {
      addEventListener: events.addEventListener.bind(events),
      get closed() {
        return closed;
      },
      close() {
        if (closed) return;
        closed = true;
        events.dispatchEvent(new Event("pagehide"));
      },
      document: pipDocument,
      removeEventListener: events.removeEventListener.bind(events),
    };
    const state: {
      document: Document;
      options: unknown;
      requestCount: number;
    } = {
      document: pipDocument,
      options: null,
      requestCount: 0,
    };
    Object.defineProperty(window, "documentPictureInPicture", {
      configurable: true,
      value: {
        requestWindow: async (options: unknown) => {
          state.options = options;
          state.requestCount += 1;
          return pipWindow;
        },
        window: null,
      },
    });
    Reflect.set(window, "__scrapscnPipTestState", state);
  });

  await page.goto(
    "/?component=picture-in-picture&pipHeight=640&pipPreferInitialWindowPlacement=false&pipWidth=520&theme=light&viewport=desktop",
  );
  const preview = page.getByTestId("picture-in-picture-preview");
  await expect(preview).toBeVisible();
  await expect(page.getByTestId("pip-status")).toHaveText("Picture-in-picture is ready");
  await page.getByRole("button", { name: "Open setup" }).click();
  await expect(page.getByLabel("Picture-in-picture width")).toHaveValue("520");
  await expect(page.getByLabel("Picture-in-picture height")).toHaveValue("640");
  await expect(page.getByLabel("Prefer initial window placement")).not.toBeChecked();
  await page.getByLabel("Picture-in-picture width").fill("560");
  await page.getByLabel("Picture-in-picture height").fill("680");
  await page.getByLabel("Prefer initial window placement").check();
  await page.getByRole("button", { name: "Close setup" }).click();

  await preview.getByRole("button", { name: "Open picture-in-picture" }).click();
  await expect(page.getByTestId("pip-status")).toHaveText("Picture-in-picture is open");
  await expect
    .poll(() =>
      page.evaluate(() => {
        const state = Reflect.get(window, "__scrapscnPipTestState");
        if (!state || typeof state !== "object") return null;
        const pipDocument = Reflect.get(state, "document");
        const options = Reflect.get(state, "options");
        if (!(pipDocument instanceof Document) || !options || typeof options !== "object") {
          return null;
        }
        return {
          bodyMargin: pipDocument.body.style.margin,
          content: pipDocument.body.textContent,
          copiedCss: pipDocument.head.textContent?.includes("--scraps"),
          height: Reflect.get(options, "height"),
          htmlHeight: pipDocument.documentElement.style.height,
          initialPlacement: Reflect.get(options, "preferInitialWindowPlacement"),
          requestCount: Reflect.get(state, "requestCount"),
          width: Reflect.get(options, "width"),
        };
      }),
    )
    .toEqual({
      bodyMargin: "0px",
      content: expect.stringContaining("Scrapscn prototype"),
      copiedCss: true,
      height: 680,
      htmlHeight: "100%",
      initialPlacement: true,
      requestCount: 1,
      width: 560,
    });

  await page.getByRole("button", { name: "Open setup" }).click();
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const state = Reflect.get(window, "__scrapscnPipTestState");
        if (!state || typeof state !== "object") return null;
        const pipDocument = Reflect.get(state, "document");
        return pipDocument instanceof Document ? pipDocument.documentElement.className : null;
      }),
    )
    .toContain("dark");

  await preview.getByRole("button", { name: "Close picture-in-picture" }).click();
  await expect(page.getByTestId("pip-status")).toHaveText("Picture-in-picture is ready");
  await page.getByRole("button", { name: "Open setup" }).click();
  await page.getByRole("button", { name: "Share" }).click();
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
  expect(sharedUrl).toContain("component=picture-in-picture");
  expect(sharedUrl).toContain("pipWidth=560");
  expect(sharedUrl).toContain("pipHeight=680");
  await page.goto(sharedUrl);
  await page.getByRole("button", { name: "Open setup" }).click();
  await expect(page.getByLabel("Picture-in-picture width")).toHaveValue("560");
  await expect(page.getByLabel("Picture-in-picture height")).toHaveValue("680");
  await expect(page.getByLabel("Prefer initial window placement")).toBeChecked();
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.getByLabel("Picture-in-picture width")).toHaveValue("480");
  await expect(page.getByLabel("Picture-in-picture height")).toHaveValue("600");
});

test("configures, shares, and restores the regular Scraps MenuListItem workbench", async ({
  browser,
  page,
}) => {
  await page.goto("/?component=menu-list-item");
  const preview = page.getByTestId("menu-list-item-preview");
  await expect(preview).toBeVisible();
  await page.getByRole("button", { name: "Open setup" }).click();
  await page.getByLabel("Menu item size").selectOption("xs");
  await page.getByLabel("Menu item priority").selectOption("danger");
  await page.getByLabel("Menu item selected").check();
  const label = preview.locator('[data-test-id="menu-list-item-label"]');
  const labelContainer = label.locator("..");
  const content = labelContainer.locator("..");
  const inner = content.locator("..");
  const leading = preview.getByText("✓", { exact: true }).locator("..");
  const trailing = preview.getByText("⌘,", { exact: true }).locator("..");
  const details = preview.getByText("Details: focused true, selected true");
  await expect(preview.locator("ul")).not.toHaveAttribute("role");
  await expect(inner).toHaveCSS("padding", "4px 8px 4px 12px");
  await expect(inner).toHaveCSS("border-radius", "6px");
  await expect(inner).toHaveCSS("font-size", "12px");
  await expect(inner).toHaveCSS("line-height", "16.8px");
  await expect(content).toHaveCSS("gap", "8px");
  await expect(labelContainer).toHaveCSS("padding-right", "8px");
  await expect(leading).toHaveCSS("gap", "8px");
  await expect(leading).toHaveCSS("margin-right", "8px");
  await expect(leading).toHaveCSS("line-height", "16.8px");
  await expect(trailing).toHaveCSS("gap", "8px");
  await expect(trailing).toHaveCSS("line-height", "16.8px");
  await expect(details).toHaveCSS("font-size", "12px");
  await expect(details).toHaveCSS("line-height", "16.8px");
  await expect
    .poll(() => inner.evaluate((element) => getComputedStyle(element, "::before").borderRadius))
    .toBe("0px");
  await page.getByLabel("Menu item overlay").check();
  await page.getByLabel("Menu item tooltip").check();
  await page.getByLabel("Preview width").selectOption("mobile");
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(preview.getByText("Open project settings")).toBeVisible();
  const overlay = page
    .locator("[role=tooltip]")
    .filter({ hasText: "Details: focused true, selected true" });
  const overlayWrapper = overlay.locator("..");
  await expect(overlay).toBeVisible();
  await expect(overlay).toHaveAttribute("data-overlay", "true");
  await expect(overlayWrapper).toHaveAttribute("data-popper-placement", /^(?:left|right)-start$/);
  await expect(overlayWrapper).toHaveCSS("position", "fixed");
  await expect(overlayWrapper).toHaveCSS("z-index", "10003");
  await expect(overlay).toHaveCSS("background-color", "rgb(57, 52, 66)");
  await expect(overlay).toHaveCSS("border", "1px solid rgb(20, 17, 25)");
  await expect(overlay).toHaveCSS("border-radius", "6px");
  await expect
    .poll(() => overlay.evaluate((element) => getComputedStyle(element).boxShadow))
    .toContain("rgb(20, 17, 25) 0px 2px 0px 0px");
  await expect(overlay).toHaveCSS("cursor", "auto");
  await expect(overlay).toHaveCSS("padding", "4px");
  await expect(overlay).toHaveCSS("line-height", "16.8px");
  await expect(overlay).toHaveClass(/\[user-select:contain\]/);
  const item = preview.locator("li");
  await item.evaluate((element) => {
    Object.assign(element.style, {
      left: "calc(100vw - 180px)",
      position: "fixed",
      top: "80px",
      width: "180px",
    });
  });
  await page.evaluate(() => window.dispatchEvent(new Event("resize")));
  await expect(overlayWrapper).toHaveAttribute("data-popper-placement", "left-start");
  await expect
    .poll(async () => {
      const [itemBox, overlayBox] = await Promise.all([
        item.boundingBox(),
        overlayWrapper.boundingBox(),
      ]);
      if (!itemBox || !overlayBox) return null;
      return {
        crossOffset: Math.round(overlayBox.y - itemBox.y),
        mainOffset: Math.round(itemBox.x - (overlayBox.x + overlayBox.width)),
      };
    })
    .toEqual({ crossOffset: -4, mainOffset: 8 });
  await item.evaluate((element) => {
    element.style.left = "-10000px";
  });
  await page.evaluate(() => window.dispatchEvent(new Event("resize")));
  await expect(overlayWrapper).toHaveAttribute("data-popper-reference-hidden", "true");
  await expect(overlayWrapper).toHaveAttribute("data-popper-escaped", "true");
  await expect(overlayWrapper).toHaveCSS("opacity", "0");
  await item.evaluate((element) => {
    element.removeAttribute("style");
  });
  await page.evaluate(() => window.dispatchEvent(new Event("resize")));
  await expect(overlayWrapper).toHaveAttribute("data-popper-reference-hidden", "false");
  await expect(overlayWrapper).toHaveAttribute("data-popper-escaped", "false");
  await expect(overlayWrapper).toHaveCSS("opacity", "1");
  await page.getByRole("button", { name: "Share" }).click();
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
  const restored = await browser.newPage();
  await restored.goto(sharedUrl);
  await restored.getByRole("button", { name: "Open setup" }).click();
  await expect(restored.getByLabel("Menu item size")).toHaveValue("xs");
  await expect(restored.getByLabel("Menu item priority")).toHaveValue("danger");
  await expect(restored.getByLabel("Menu item selected")).toBeChecked();
  await expect(restored.getByLabel("Menu item overlay")).toBeChecked();
  await restored.close();
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.getByLabel("Menu item size")).toHaveValue("md");
  await expect(page.getByLabel("Menu item priority")).toHaveValue("default");
});

test("configures, shares, restores, and resets the regular Scraps AvatarButton workbench", async ({
  browser,
  page,
}) => {
  await page.goto("/?component=avatar-button");
  const preview = page.getByTestId("avatar-button-preview");
  await expect(preview).toBeVisible();
  const button = preview.getByRole("button", { name: "Open profile" });
  const frame = button.locator('[data-slot="avatar-button-frame"]');
  await expect(button).toHaveCSS("width", "36px");
  await expect(button).toHaveCSS("height", "36px");
  await expect(button).toHaveCSS("min-width", "36px");
  await expect(button).toHaveCSS("border-radius", "8px");
  await expect(frame).toHaveCSS("width", "36px");
  await expect(frame).toHaveCSS("height", "36px");
  await expect(frame).toHaveCSS("border-radius", "8px");
  await expect(frame).toHaveCSS("display", "flex");
  await page.getByRole("button", { name: "Open setup" }).click();
  await page.getByLabel("Avatar type").selectOption("upload");
  await expect(button.locator("img")).toHaveAttribute("loading", "lazy");
  await expect
    .poll(() =>
      button.evaluate((element) =>
        getComputedStyle(element).getPropertyValue("--avatar-chonk").trim(),
      ),
    )
    .toBe("#2500BA");
  await expect(frame).toHaveCSS("padding", "0px");
  await expect(frame).toHaveCSS("border-color", "rgb(37, 0, 186)");
  await expect
    .poll(() =>
      button.evaluate((element) => ({
        afterBorder: getComputedStyle(element, "::after").borderColor,
        beforeBackground: getComputedStyle(element, "::before").backgroundColor,
      })),
    )
    .toEqual({
      afterBorder: "rgb(37, 0, 186)",
      beforeBackground: "rgb(37, 0, 186)",
    });
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect
    .poll(() =>
      button.evaluate((element) =>
        getComputedStyle(element).getPropertyValue("--avatar-chonk").trim(),
      ),
    )
    .toBe("#0A0033");
  await expect(frame).toHaveCSS("border-color", "rgb(10, 0, 51)");
  await expect
    .poll(() =>
      button.evaluate((element) => ({
        afterBorder: getComputedStyle(element, "::after").borderColor,
        beforeBackground: getComputedStyle(element, "::before").backgroundColor,
      })),
    )
    .toEqual({
      afterBorder: "rgb(10, 0, 51)",
      beforeBackground: "rgb(10, 0, 51)",
    });

  await page.getByLabel("Avatar type").selectOption("padded");
  await page.getByLabel("Avatar button size").selectOption("sm");
  await expect(button).toHaveCSS("width", "32px");
  await expect(button).toHaveCSS("min-width", "32px");
  await page.getByLabel("Avatar button size").selectOption("xs");
  await page.getByLabel("Avatar name").fill("Jane Bloggs");
  await expect(frame).toHaveCSS("width", "28px");
  await expect(frame).toHaveCSS("height", "28px");
  await expect(frame).toHaveCSS("border-radius", "5px");
  await expect(frame).toHaveCSS("padding", "4px");
  await expect(frame).toHaveCSS("background-color", "rgb(46, 41, 54)");
  await expect
    .poll(() =>
      button.evaluate((element) =>
        getComputedStyle(element).getPropertyValue("--avatar-chonk").trim(),
      ),
    )
    .toBe("#2F1700");
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await expect(frame).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect
    .poll(() =>
      button.evaluate((element) =>
        getComputedStyle(element).getPropertyValue("--avatar-chonk").trim(),
      ),
    )
    .toBe("#AB5300");
  await page.getByRole("button", { name: "Close setup" }).click();
  await page.getByRole("button", { name: "Open profile" }).click();
  await expect(preview.getByText("Clicks: 1")).toBeVisible();
  await expect(button).toHaveCSS("width", "28px");
  await expect(button).toHaveCSS("min-width", "28px");
  await expect(button).toHaveCSS("border-radius", "5px");
  await expect(button.locator("img")).toHaveAttribute("src", /^data:image\/svg\+xml,/);

  await page.getByRole("button", { name: "Open setup" }).click();
  await page.getByLabel("disabled avatar button").check();
  await button.click({ force: true });
  await expect(preview.getByText("Clicks: 1")).toBeVisible();
  await page.getByLabel("disabled avatar button").uncheck();
  await page.getByLabel("busy avatar button").check();
  await expect(button).toHaveAttribute("aria-busy", "true");
  await button.click({ force: true });
  await expect(preview.getByText("Clicks: 1")).toBeVisible();
  await page.getByLabel("busy avatar button").uncheck();

  await page.getByLabel("Avatar type").selectOption("broken");
  await expect(button.locator("img")).toHaveCount(0);
  await expect(button).toContainText("JB");
  await page.getByLabel("Avatar type").selectOption("padded");
  await page.getByRole("button", { name: "Share" }).click();
  const context = await browser.newContext();
  const shared = await context.newPage();
  await shared.goto(await page.evaluate(() => navigator.clipboard.readText()));
  await shared.getByRole("button", { name: "Open setup" }).click();
  await expect(shared.getByLabel("Avatar type")).toHaveValue("padded");
  await expect(shared.getByLabel("Avatar button size")).toHaveValue("xs");
  await expect(shared.getByLabel("Avatar name")).toHaveValue("Jane Bloggs");
  await expect(shared.getByLabel("disabled avatar button")).not.toBeChecked();
  await expect(shared.getByLabel("busy avatar button")).not.toBeChecked();
  await context.close();
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.getByLabel("Avatar type")).toHaveValue("letter");
  await expect(page.getByLabel("Avatar button size")).toHaveValue("md");
  await expect(page.getByLabel("Avatar name")).toHaveValue("Jane Doe");
  await expect(button).toHaveCSS("width", "36px");
  await expect(button).toHaveCSS("min-width", "36px");
});

test("configures, shares, restores, and resets the regular Scraps Toast workbench", async ({
  browser,
  page,
}) => {
  await page.goto("/?component=toast");
  const preview = page.getByTestId("toast-preview");
  const toast = preview.locator('[data-test-id="toast-success"]');
  await expect(toast).toHaveCSS("border-radius", "8px");
  await expect(toast).toHaveCSS("border-color", "rgb(124, 216, 138)");
  await expect(toast).toHaveCSS(
    "box-shadow",
    "rgba(16, 16, 48, 0.03) 0px 2px 0px 1px, rgba(16, 16, 48, 0.03) 0px 1px 0px 0px",
  );
  await expect(toast.locator('[data-slot="toast-icon"] svg')).toHaveCSS("width", "16px");
  await toast.click();
  await expect(preview.getByText("Dismisses: 1")).toBeVisible();
  await page.getByRole("button", { name: "Open setup" }).click();
  await page.getByLabel("Toast type").selectOption("loading");
  await expect(
    preview
      .locator('[data-test-id="toast-loading"]')
      .locator('[data-test-id="loading-indicator"] > div'),
  ).toHaveCSS("border-left-color", "rgb(108, 95, 199)");
  await page.getByLabel("Toast type").selectOption("error");
  await expect(preview.locator('[data-test-id="toast-error"]')).toHaveCSS(
    "border-color",
    "rgb(255, 151, 143)",
  );
  await page.getByLabel("Toast type").selectOption("undo");
  await expect(
    preview.locator('[data-test-id="toast-undo"]').locator('[data-slot="toast-icon"]'),
  ).toHaveCount(0);
  await page.getByLabel("Toast type").selectOption("success");
  await page.getByLabel("Toast undo").check();
  await page.getByRole("button", { name: "Close setup" }).click();
  await preview.getByRole("button", { name: "Undo" }).click();
  await expect(preview.getByText("Undos: 1")).toBeVisible();
  await expect(preview.getByText("Dismisses: 2")).toBeVisible();
  await page.getByRole("button", { name: "Open setup" }).click();
  await page.getByLabel("Toast disable dismiss").check();
  await page.getByRole("button", { name: "Close setup" }).click();
  await preview.locator('[data-test-id="toast-success"]').click();
  await expect(preview.getByText("Dismisses: 2")).toBeVisible();
  await page.getByRole("button", { name: "Open setup" }).click();
  await page.getByLabel("Toast message").fill("Long saved project message");
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(preview.locator('[data-test-id="toast-success"]')).toHaveCSS(
    "border-color",
    "rgb(0, 167, 25)",
  );
  await page.getByRole("button", { name: "Share" }).click();
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
  const restored = await browser.newPage();
  await restored.goto(sharedUrl);
  await restored.getByRole("button", { name: "Open setup" }).click();
  await expect(restored.getByLabel("Toast type")).toHaveValue("success");
  await expect(restored.getByLabel("Toast message")).toHaveValue("Long saved project message");
  await expect(restored.getByLabel("Toast undo")).toBeChecked();
  await expect(restored.getByLabel("Toast disable dismiss")).toBeChecked();
  await restored.close();
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.getByLabel("Toast type")).toHaveValue("success");
  await expect(page.getByLabel("Toast undo")).not.toBeChecked();
});

test("configures, shares, and restores the regular Scraps Pagination workbench", async ({
  browser,
  page,
}) => {
  await page.goto(
    "/?component=pagination&paginationCaption=true&paginationCustomHandler=true&paginationDisabled=false&paginationNextResults=true&paginationPreviousResults=false&paginationSize=sm",
  );
  const preview = page.getByTestId("pagination-preview");
  await expect(preview.getByRole("button", { name: "Previous" })).toBeDisabled();
  await expect(preview.getByRole("button", { name: "Next" })).toBeEnabled();
  await expect(preview).toContainText("1-25 of 100");
  await preview.getByRole("button", { name: "Next" }).click();
  await expect(preview).toContainText("Last cursor event: 1: 0:25:0");
  await page.getByRole("button", { name: "Open setup" }).click();
  await page.getByLabel("Use custom cursor handler").uncheck();
  await page.getByRole("button", { name: "Close setup" }).click();
  await preview.getByRole("button", { name: "Next" }).click();
  await expect(page).toHaveURL(/cursor=0%3A25%3A0/);
  await expect(preview).toBeVisible();
  await page.getByRole("button", { name: "Open setup" }).click();
  await page.getByLabel("Pagination size").selectOption("xs");
  await page.getByLabel("Previous link has results").check();
  await page.getByLabel("Next link has results").uncheck();
  await page.getByLabel("Show pagination caption").uncheck();
  await page.getByLabel("Preview width").selectOption("mobile");
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(preview.getByRole("button", { name: "Previous" })).toBeEnabled();
  await expect(preview.getByRole("button", { name: "Next" })).toBeDisabled();
  await expect(preview.getByText("1-25 of 100")).toHaveCount(0);
  await expect(page.locator('[data-slot="sentry-page-frame"]')).toHaveCSS("width", "390px");
  await page.getByRole("button", { name: "Share" }).click();
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
  expect(sharedUrl).toContain("component=pagination");
  expect(sharedUrl).toContain("paginationCustomHandler=false");
  expect(sharedUrl).toContain("paginationSize=xs");
  expect(sharedUrl).toContain("paginationNextResults=false");
  const restored = await browser.newPage();
  await restored.goto(sharedUrl);
  await restored.getByRole("button", { name: "Open setup" }).click();
  await expect(restored.getByLabel("Pagination size")).toHaveValue("xs");
  await expect(restored.getByLabel("Use custom cursor handler")).not.toBeChecked();
  await expect(restored.getByLabel("Previous link has results")).toBeChecked();
  await expect(restored.getByLabel("Next link has results")).not.toBeChecked();
  await restored.close();
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.getByLabel("Pagination size")).toHaveValue("sm");
  await expect(page.getByLabel("Show pagination caption")).toBeChecked();
  await expect(page.getByLabel("Use custom cursor handler")).toBeChecked();
});

test("configures, shares, and restores the regular Scraps Disclosure workbench", async ({
  browser,
  page,
}) => {
  await page.goto(
    "/?component=disclosure&disclosureExpanded=true&disclosureLeading=false&disclosureSize=md&disclosureTrailing=false&disclosureVariant=default",
  );
  const preview = page.getByTestId("disclosure-preview");
  const title = preview.getByRole("button", { name: "Project details" });
  const panel = preview.getByRole("group", { name: "Project details" });
  await expect(title).toHaveAttribute("aria-expanded", "true");
  await expect(panel).toContainText("controlled disclosure state");
  await title.focus();
  await page.keyboard.press("Enter");
  await expect(title).toHaveAttribute("aria-expanded", "false");
  await page.getByRole("button", { name: "Open setup" }).click();
  await page.getByLabel("Disclosure size").selectOption("sm");
  await page.getByLabel("Disclosure variant").selectOption("outline");
  await page.getByLabel("Disclosure leading items").check();
  await page.getByLabel("Disclosure trailing items").check();
  await page.getByLabel("Disclosure expanded").check();
  await page.getByLabel("Preview width").selectOption("mobile");
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(title).toHaveAttribute("aria-expanded", "true");
  await expect(panel).toHaveCSS("border-radius", "8px");
  await expect(page.locator('[data-slot="sentry-page-frame"]')).toHaveCSS("width", "390px");
  await page.getByRole("button", { name: "Share" }).click();
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
  expect(sharedUrl).toContain("component=disclosure");
  expect(sharedUrl).toContain("disclosureVariant=outline");
  expect(sharedUrl).toContain("disclosureSize=sm");
  expect(sharedUrl).toContain("theme=dark");
  const restored = await browser.newPage();
  await restored.goto(sharedUrl);
  const restoredPreview = restored.getByTestId("disclosure-preview");
  await expect(restoredPreview.getByRole("button", { name: "Project details" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await restored.getByRole("button", { name: "Open setup" }).click();
  await expect(restored.getByLabel("Disclosure size")).toHaveValue("sm");
  await expect(restored.getByLabel("Disclosure variant")).toHaveValue("outline");
  await expect(restored.getByLabel("Disclosure leading items")).toBeChecked();
  await restored.close();
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.getByLabel("Disclosure size")).toHaveValue("md");
  await expect(page.getByLabel("Disclosure variant")).toHaveValue("default");
  await expect(page.getByLabel("Disclosure expanded")).toBeChecked();
});

test("configures, shares, and restores the regular Scraps Radio workbench", async ({
  browser,
  page,
}) => {
  await page.goto(
    "/?component=radio&radioDisabled=false&radioLabel=Issue+severity&radioSelected=warning&radioSize=md",
  );
  const preview = page.getByTestId("radio-preview");
  const warning = preview.getByRole("radio", { name: "warning" });
  const info = preview.getByRole("radio", { name: "info" });

  await expect(warning).toBeChecked();
  await expect(warning).toHaveCSS("width", "24px");
  await expect(warning).toHaveCSS("height", "24px");
  await expect(warning).toHaveCSS("background-color", "rgb(117, 83, 255)");
  await expect(warning).toHaveCSS("border-color", "rgb(88, 39, 214)");
  await expect
    .poll(() => warning.evaluate((element) => getComputedStyle(element, "::after").width))
    .toBe("12px");

  await warning.focus();
  await page.keyboard.press("ArrowDown");
  await expect(info).toBeChecked();
  await expect(info).toHaveCSS(
    "box-shadow",
    "rgb(255, 255, 255) 0px 0px 0px 0px, rgb(117, 83, 255) 0px 0px 0px 2px",
  );
  await expect(preview.getByText("Selected: info")).toBeVisible();

  await page.getByRole("button", { name: "Open setup" }).click();
  await page.getByLabel("Radio group label").fill("Alert level");
  await page.getByLabel("Radio size").selectOption("xs");
  await page.getByLabel("Selected radio").selectOption("error");
  await page.getByLabel("Disable radio group").check();
  await page.getByLabel("Preview width").selectOption("mobile");
  await page.getByRole("button", { name: "Switch to dark theme" }).click();

  const error = preview.getByRole("radio", { name: "error" });
  await expect(preview).toContainText("Alert level");
  await expect(error).toBeChecked();
  await expect(error).toBeDisabled();
  await expect(error).toHaveCSS("width", "12px");
  await expect(error).toHaveCSS("border-color", "rgb(18, 5, 57)");
  await expect(page.locator('[data-slot="sentry-page-frame"]')).toHaveCSS("width", "390px");

  await page.getByRole("button", { name: "Share" }).click();
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
  expect(sharedUrl).toContain("component=radio");
  expect(sharedUrl).toContain("radioDisabled=true");
  expect(sharedUrl).toContain("radioSelected=error");
  expect(sharedUrl).toContain("radioSize=xs");
  expect(sharedUrl).toContain("theme=dark");
  expect(sharedUrl).toContain("viewport=mobile");

  const restored = await browser.newPage();
  await restored.goto(sharedUrl);
  const restoredError = restored.getByTestId("radio-preview").getByRole("radio", { name: "error" });
  await expect(restoredError).toBeChecked();
  await expect(restoredError).toBeDisabled();
  await expect(restoredError).toHaveCSS("width", "12px");
  await restored.close();

  await page.reload();
  await page.getByRole("button", { name: "Open setup" }).click();
  await expect(page.getByLabel("Radio group label")).toHaveValue("Alert level");
  await expect(page.getByLabel("Radio size")).toHaveValue("xs");
  await expect(page.getByLabel("Selected radio")).toHaveValue("error");
  await expect(page.getByLabel("Disable radio group")).toBeChecked();

  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.getByLabel("Radio group label")).toHaveValue("Issue severity");
  await expect(page.getByLabel("Radio size")).toHaveValue("md");
  await expect(page.getByLabel("Selected radio")).toHaveValue("warning");
  await expect(page.getByLabel("Disable radio group")).not.toBeChecked();
});

test("composes, interacts with, shares, and restores the regular Scraps Chat workbench", async ({
  browser,
  page,
}) => {
  await page.goto(
    "/?component=chat&chatDensity=default&chatFeedbackDisabled=false&chatMessage=Which+issues+are+getting+worse%3F&chatStatus=loading&chatThinking=true",
  );
  const preview = page.getByTestId("chat-preview");
  const userMessage = preview.getByTestId("chat-user-message");
  const userRow = userMessage.locator("..");
  await expect(userRow).toHaveCSS("justify-content", "flex-end");
  await expect(userRow).toHaveCSS("padding", "16px");
  await expect(userMessage).toHaveCSS("border-radius", "6px");
  await expect(userMessage).toHaveCSS("white-space", "pre-wrap");
  await expect(userMessage).toHaveCSS("overflow-wrap", "anywhere");
  await expect(userMessage).toHaveCSS("max-width", "80%");
  await expect(userMessage).toHaveCSS("background-color", "rgb(248, 248, 249)");
  await expect(preview.getByRole("status", { name: "Running..." })).toBeVisible();
  await expect(preview.getByText(/5\.\d+s/)).toBeVisible();

  await preview.getByRole("button", { name: "I like this response" }).click();
  await expect(preview.getByText(/Feedback: positive/)).toBeVisible();
  await expect(preview.getByText(/Bubbled clicks: 0/)).toBeVisible();
  await preview.getByRole("button", { name: "Copy to clipboard" }).click();
  await expect(preview.getByText(/Copies: 1/)).toBeVisible();
  await expect(preview.getByText(/Bubbled clicks: 0/)).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe("Three checkout issues have increased during the last 24 hours.");

  await page.getByRole("button", { name: "Open setup" }).click();
  await page.getByLabel("Chat user message").fill("Show critical regressions");
  await page.getByLabel("Chat row density").selectOption("compact");
  await page.getByLabel("Chat tool status").selectOption("mixed");
  await page.getByLabel("Disable chat feedback").check();
  await page.getByLabel("Chat thinking active").uncheck();
  await page.getByLabel("Preview width").selectOption("mobile");
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(userRow).toHaveCSS("padding", "8px 16px");
  await expect(userMessage).toHaveText("Show critical regressions");
  await expect(userMessage).toHaveCSS("background-color", "rgb(36, 32, 43)");
  await expect(preview.getByLabel("Some tool calls succeeded and some failed")).toHaveCSS(
    "color",
    "rgb(255, 206, 0)",
  );
  await expect(preview.getByRole("button", { name: "Feedback submitted" })).toHaveCount(2);
  const thinkingTrigger = preview.getByRole("button", {
    name: "Analysis complete",
  });
  await expect(preview.getByText("1.5min")).toBeVisible();
  await expect(thinkingTrigger).toHaveAttribute("aria-expanded", "false");
  await page.getByRole("button", { name: "Close setup" }).click();
  await thinkingTrigger.click();
  await expect(thinkingTrigger).toHaveAttribute("aria-expanded", "true");
  await expect(preview.getByText("Found three escalating checkout issues.")).toBeVisible();
  await expect(page.locator('[data-slot="sentry-page-frame"]')).toHaveCSS("width", "390px");

  await page.getByRole("button", { name: "Open setup" }).click();
  await page.getByRole("button", { name: "Share" }).click();
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
  expect(sharedUrl).toContain("component=chat");
  expect(sharedUrl).toContain("chatDensity=compact");
  expect(sharedUrl).toContain("chatStatus=mixed");
  const context = await browser.newContext();
  const restored = await context.newPage();
  await restored.goto(sharedUrl);
  await restored.getByRole("button", { name: "Open setup" }).click();
  await expect(restored.getByLabel("Chat user message")).toHaveValue("Show critical regressions");
  await expect(restored.getByLabel("Chat row density")).toHaveValue("compact");
  await expect(restored.getByLabel("Chat tool status")).toHaveValue("mixed");
  await expect(restored.getByLabel("Disable chat feedback")).toBeChecked();
  await expect(restored.getByLabel("Chat thinking active")).not.toBeChecked();
  await expect(restored.getByLabel("Preview width")).toHaveValue("mobile");
  await expect(restored.locator("html")).toHaveClass(/dark/);
  await context.close();

  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.getByLabel("Chat user message")).toHaveValue("Which issues are getting worse?");
  await expect(page.getByLabel("Chat row density")).toHaveValue("default");
  await expect(page.getByLabel("Chat tool status")).toHaveValue("loading");
  await expect(page.getByLabel("Disable chat feedback")).not.toBeChecked();
  await expect(page.getByLabel("Chat thinking active")).toBeChecked();
});

test("renders, sanitizes, shares, and restores the regular Scraps Markdown workbench", async ({
  browser,
  page,
}) => {
  await page.goto("/?component=markdown");
  const preview = page.getByTestId("markdown-preview");
  await expect(preview.getByRole("heading", { level: 2 })).toHaveText("Checkout regression");
  await expect(preview.getByRole("table")).toBeVisible();
  await expect(preview.getByRole("checkbox")).toHaveCount(2);
  await expect(preview.getByRole("link", { name: "SENTRY-123" })).toHaveAttribute(
    "href",
    "/issues/SENTRY-123/",
  );

  await page.getByRole("button", { name: "Open setup" }).click();
  const source = [
    "# Critical regression",
    "",
    "[unsafe](javascript:alert(1))",
    "",
    "H<sub>2</sub>O",
    "",
    '{% ref type="issue" id="SENTRY-456" /%}',
    "",
    "<script>window.bad = true</script>",
  ].join("\n");
  await page.getByLabel("Markdown source").fill(source);
  await page.getByLabel("Markdown variant").selectOption("streaming");
  await page.getByLabel("Preview width").selectOption("mobile");
  await page.getByRole("button", { name: "Switch to dark theme" }).click();

  await expect(preview.getByRole("heading", { level: 1 })).toHaveText("Critical regression");
  await expect(preview.getByText("unsafe")).toBeVisible();
  await expect(preview.getByRole("link", { name: "unsafe" })).toHaveCount(0);
  await expect(preview.locator("sub")).toHaveText("2");
  await expect(preview.locator("script")).toHaveCount(0);
  await expect(preview.getByRole("link", { name: "SENTRY-456" })).toBeVisible();
  await expect(preview.locator("[data-streaming=true]")).toBeVisible();
  await expect(page.locator('[data-slot="sentry-page-frame"]')).toHaveCSS("width", "390px");

  await page.getByRole("button", { name: "Share" }).click();
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
  expect(sharedUrl).toContain("component=markdown");
  expect(sharedUrl).toContain("markdownVariant=streaming");

  const context = await browser.newContext();
  const restored = await context.newPage();
  await restored.goto(sharedUrl);
  await restored.getByRole("button", { name: "Open setup" }).click();
  await expect(restored.getByLabel("Markdown source")).toHaveValue(source);
  await expect(restored.getByLabel("Markdown variant")).toHaveValue("streaming");
  await expect(restored.getByLabel("Render custom Markdown tag")).toBeChecked();
  await expect(restored.getByLabel("Preview width")).toHaveValue("mobile");
  await expect(restored.locator("html")).toHaveClass(/dark/);
  await context.close();

  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.getByLabel("Markdown variant")).toHaveValue("static");
  await expect(page.getByLabel("Markdown source")).toHaveValue(/## Checkout regression/);
});

test("configures, expands, shares, and restores the regular Scraps Alert workbench", async ({
  browser,
  page,
}) => {
  await page.goto("/?component=alert");
  const preview = page.getByTestId("alert-preview");
  const panel = preview.locator(".ref-info");
  await expect(panel).toContainText("Project configuration was updated.");
  await expect(panel).toHaveCSS("min-height", "44px");
  await expect(panel.locator('[role="img"]')).toBeVisible();

  await page.getByRole("button", { name: "Open setup" }).click();
  await page.getByLabel("Alert variant").selectOption("warning");
  await page.getByLabel("Alert icon").uncheck();
  await page.getByLabel("System banner").check();
  await page.getByLabel("Preview width").selectOption("mobile");
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await page.getByRole("button", { name: "Close setup" }).click();

  const warning = preview.locator(".ref-warning");
  await expect(warning.locator('[role="img"]')).toHaveCount(0);
  await expect(warning).toHaveCSS("border-radius", "0px");
  await expect(warning).toHaveCSS("border-bottom-color", "rgb(202, 155, 0)");
  await warning.getByText("Project configuration was updated.").click();
  await expect(warning.getByText("Trace sampling changed from 10% to 25%.")).toBeVisible();

  await page.getByRole("button", { name: "Open setup" }).click();
  await expect(page.getByLabel("Alert expanded")).toBeChecked();
  await page.getByRole("button", { name: "Share" }).click();
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
  expect(sharedUrl).toContain("component=alert");
  expect(sharedUrl).toContain("alertVariant=warning");
  expect(sharedUrl).toContain("alertExpanded=true");

  const context = await browser.newContext();
  const restored = await context.newPage();
  await restored.goto(sharedUrl);
  await restored.getByRole("button", { name: "Open setup" }).click();
  await expect(restored.getByLabel("Alert variant")).toHaveValue("warning");
  await expect(restored.getByLabel("Alert icon")).not.toBeChecked();
  await expect(restored.getByLabel("System banner")).toBeChecked();
  await expect(restored.getByLabel("Alert expanded")).toBeChecked();
  await expect(restored.getByLabel("Preview width")).toHaveValue("mobile");
  await expect(restored.locator("html")).toHaveClass(/dark/);
  await context.close();

  await page.getByLabel("Alert composition").selectOption("link");
  await expect(
    preview.getByRole("link", { name: /Open the Sentry documentation/ }),
  ).toHaveAttribute("href", "https://docs.sentry.io");
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.getByLabel("Alert variant")).toHaveValue("info");
  await expect(page.getByLabel("Alert composition")).toHaveValue("alert");
  await expect(page.getByLabel("Alert icon")).toBeChecked();
});

test("configures, shares, and restores the regular Scraps Info workbench", async ({
  browser,
  page,
}) => {
  await page.goto("/?component=info&infoMode=regular&infoTitle=Owner+details&infoVariant=warning");
  const preview = page.getByTestId("info-preview");
  const text = preview.getByText("an-extremely-long-project-name");
  await expect(text).toHaveAttribute("tabindex", "0");
  await text.hover();
  await expect(page.getByRole("tooltip")).toContainText("Owner details");
  await page.getByRole("button", { name: "Open setup" }).click();
  await page.getByLabel("Info mode").selectOption("overflowOnly");
  await page.getByLabel("Info tooltip text").fill("Complete project name");
  await page.getByRole("button", { name: "Share" }).click();
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
  expect(sharedUrl).toContain("component=info");
  expect(sharedUrl).toContain("infoMode=overflowOnly");
  expect(sharedUrl).toContain("infoTitle=Complete+project+name");
  expect(sharedUrl).toContain("infoVariant=warning");
  const restored = await browser.newPage();
  await restored.goto(sharedUrl);
  const restoredPreview = restored.getByTestId("info-preview");
  const restoredText = restoredPreview.getByText("an-extremely-long-project-name");
  await expect(restoredText).toHaveAttribute("tabindex", "0");
  await restoredText.hover();
  await expect(restored.getByRole("tooltip")).toContainText("Complete project name");
  await restored.getByRole("button", { name: "Open setup" }).click();
  await expect(restored.getByLabel("Info mode")).toHaveValue("overflowOnly");
  await expect(restored.getByLabel("Info tooltip text")).toHaveValue("Complete project name");
  await expect(restored.getByLabel("Info underline color")).toHaveValue("warning");
  await restored.close();
});

test("configures, shares, restores, and dismisses the regular Scraps Chip workbench", async ({
  browser,
  page,
}) => {
  await page.goto(
    "/?component=chip&chipDismissable=true&chipOperator=is&chipProperty=browser&chipReadonly=false&chipSize=md&chipValue=Chrome",
  );
  const preview = page.getByTestId("chip-preview");
  const chip = preview.locator(":scope > div");
  await expect(chip).toHaveCSS("height", "28px");
  await expect(chip).toHaveCSS("border-color", "rgb(218, 217, 222)");
  await expect(chip.getByRole("button", { name: "Remove browser is Chrome" })).toBeVisible();

  await page.getByRole("button", { name: "Open setup" }).click();
  await page.getByLabel("Chip property").fill("environment");
  await page.getByLabel("Chip operator").fill("equals");
  await page.getByLabel("Chip value").fill("production");
  await page.getByLabel("Chip size").selectOption("xs");
  await page.getByLabel("Readonly chip").check();
  await page.getByLabel("Dismissable chip").uncheck();
  await page.getByLabel("Preview width").selectOption("mobile");
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(chip).toHaveCSS("height", "20px");
  await expect(chip).toHaveCSS("border-color", "rgb(20, 17, 25)");
  await expect(chip.getByRole("button")).toHaveCount(0);

  await page.getByRole("button", { name: "Share" }).click();
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
  expect(sharedUrl).toContain("component=chip");
  expect(sharedUrl).toContain("chipReadonly=true");
  expect(sharedUrl).toContain("chipSize=xs");
  const restored = await browser.newPage();
  await restored.goto(sharedUrl);
  await expect(restored.getByTestId("chip-preview")).toContainText("environmentequalsproduction");
  await restored.close();

  await page.getByRole("button", { name: "Reset" }).click();
  await page.getByLabel("Readonly chip").uncheck();
  await page.getByLabel("Dismissable chip").check();
  await page.getByRole("button", { name: "Close setup" }).click();
  await chip.getByRole("button", { name: "Remove browser is Chrome" }).click();
  await expect(preview).toContainText("Chip removed");
});

test("configures, shares, and restores the regular Scraps Button workbench", async ({
  browser,
  page,
}) => {
  await page.goto(
    "/?component=button&buttonBusy=false&buttonDisabled=false&buttonIcon=true&buttonKind=button&buttonLabel=Create+issue&buttonSize=xs&buttonVariant=primary",
  );
  const preview = page.getByTestId("button-preview");
  const selected = preview.getByRole("button", { name: "Create issue" });
  await expect(selected).toHaveCSS("height", "28px");
  await expect(selected.locator("svg")).toHaveCSS("width", "12px");
  await expect
    .poll(() =>
      selected.evaluate((element) => getComputedStyle(element, "::after").backgroundColor),
    )
    .toBe("rgb(117, 83, 255)");
  await expect(preview.getByRole("button", { name: "Previous" })).toHaveAttribute(
    "data-size",
    "sm",
  );

  await page.getByRole("button", { name: "Open setup" }).click();
  await page.getByLabel("Button kind").selectOption("external");
  await page.getByLabel("Button variant").selectOption("warning");
  await page.getByLabel("Button size").selectOption("zero");
  await page.getByLabel("Button label").fill("Read docs");
  await page.getByLabel("Disabled button").check();
  await page.getByLabel("Preview width").selectOption("mobile");
  const external = preview.getByRole("button", { name: "Read docs" });
  await expect(external).not.toHaveAttribute("href");
  await expect(external).toHaveAttribute("aria-disabled", "true");
  await expect(external).toHaveCSS("height", "24px");
  await expect(page.locator('[data-slot="sentry-page-frame"]')).toHaveCSS("width", "390px");

  await page.getByRole("button", { name: "Share" }).click();
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
  expect(sharedUrl).toContain("component=button");
  expect(sharedUrl).toContain("buttonKind=external");
  expect(sharedUrl).toContain("buttonVariant=warning");
  const restored = await browser.newPage();
  await restored.goto(sharedUrl);
  await expect(
    restored.getByTestId("button-preview").getByRole("button", { name: "Read docs" }),
  ).not.toHaveAttribute("href");
  await restored.close();

  await page.getByLabel("Component or template").selectOption("checkbox");
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "checkbox",
  );
  await page.goBack();
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "button",
  );
  await expect(page.getByLabel("Button variant")).toHaveValue("warning");
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.getByLabel("Button kind")).toHaveValue("button");
  await expect(page.getByLabel("Button variant")).toHaveValue("secondary");
  await expect(page.getByLabel("Button size")).toHaveValue("md");
  await expect(page.getByLabel("Button label")).toHaveValue("Save changes");
  await expect(page.getByLabel("Preview width")).toHaveValue("desktop");
});

test("configures, edits, shares, and restores the regular Scraps TextArea workbench", async ({
  browser,
  page,
}) => {
  await page.goto(
    "/?component=textarea&textAreaAutosize=false&textAreaDisabled=false&textAreaLabel=Investigation+notes&textAreaMaxRows=7&textAreaMonospace=false&textAreaRows=4&textAreaSize=sm&textAreaValue=Initial+finding",
  );
  const preview = page.getByTestId("textarea-preview");
  const textarea = preview.getByRole("textbox", {
    name: "Investigation notes",
  });
  await expect(textarea).toHaveAttribute("data-autosize", "false");
  await expect(textarea).toHaveAttribute("data-size", "sm");
  await expect(textarea).toHaveAttribute("rows", "4");
  await expect(textarea).toHaveCSS("border-radius", "6px");
  await expect(textarea).toHaveCSS("font-size", "14px");
  await textarea.focus();
  await expect
    .poll(() => textarea.evaluate((element) => getComputedStyle(element).boxShadow))
    .toMatch(/0px 1px 0px 0px inset/);
  await expect
    .poll(() => textarea.evaluate((element) => getComputedStyle(element).boxShadow))
    .toMatch(/0px 0px 0px 2px/);
  await textarea.fill("Updated finding\nwith a second line");
  await expect(preview).toContainText("34 characters");

  await page.getByRole("button", { name: "Open setup" }).click();
  await page.getByLabel("TextArea size").selectOption("xs");
  await page.getByLabel("autosize TextArea").check();
  await page.getByLabel("monospace TextArea").check();
  await page.getByLabel("disabled TextArea").check();
  await page.getByLabel("Preview width").selectOption("mobile");
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(textarea).toHaveAttribute("data-autosize", "true");
  await expect(textarea).toHaveAttribute("data-size", "xs");
  await expect(textarea).toBeDisabled();
  await expect(textarea).toHaveCSS("border-radius", "5px");
  await expect(textarea).toHaveCSS("font-family", /Roboto Mono/);

  await page.getByRole("button", { name: "Share" }).click();
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
  expect(sharedUrl).toContain("component=textarea");
  expect(sharedUrl).toContain("textAreaAutosize=true");
  expect(sharedUrl).toContain("textAreaSize=xs");
  expect(sharedUrl).toContain("textAreaValue=Updated+finding%0Awith+a+second+line");

  const restored = await browser.newPage();
  await restored.goto(sharedUrl);
  const restoredTextArea = restored
    .getByTestId("textarea-preview")
    .getByRole("textbox", { name: "Investigation notes" });
  await expect(restoredTextArea).toHaveValue("Updated finding\nwith a second line");
  await expect(restoredTextArea).toBeDisabled();
  await expect(restoredTextArea).toHaveAttribute("data-size", "xs");
  await restored.getByRole("button", { name: "Open setup" }).click();
  await expect(restored.getByLabel("monospace TextArea")).toBeChecked();
  await expect(restored.getByLabel("Preview width")).toHaveValue("mobile");
  await expect(restored.locator("html")).toHaveClass(/dark/);
  await restored.close();

  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.getByLabel("TextArea size")).toHaveValue("md");
  await expect(page.getByLabel("autosize TextArea")).toBeChecked();
  await expect(page.getByLabel("disabled TextArea")).not.toBeChecked();
});

test("configures every regular Scraps Input mode and restores its share URL", async ({
  browser,
  page,
}) => {
  await page.goto(
    "/?component=input&inputDisabled=false&inputLabel=Issue+query&inputMode=group&inputMonospace=false&inputNumberValue=5&inputSize=sm&inputValue=is%3Aunresolved&theme=light",
  );
  const preview = page.getByTestId("input-preview");
  const input = preview.getByRole("textbox", { name: "Issue query" });

  await expect(input).toHaveAttribute("data-size", "sm");
  await expect(input).toHaveCSS("height", "32px");
  await expect(input).toHaveCSS("border-radius", "6px");
  await expect(input).toHaveCSS("line-height", "16px");
  await expect(input).toHaveCSS("padding-top", "8px");
  await expect(input).toHaveCSS("padding-bottom", "8px");
  await expect(input).toHaveCSS("padding-left", "34px");
  await input.focus();
  await expect
    .poll(() => input.evaluate((element) => getComputedStyle(element).boxShadow))
    .toContain("0px 1px");
  await expect
    .poll(() => input.evaluate((element) => getComputedStyle(element).boxShadow))
    .toContain("0px 0px 0px 2px");
  await input.fill("assigned:me");

  await page.locator("html").evaluate((element) => {
    element.classList.remove("light");
    element.classList.add("dark");
  });
  await input.evaluate((element) => element.setAttribute("placeholder", "Search issues"));
  await expect(input).toHaveCSS("background-color", "rgba(0, 0, 32, 0.2)");
  await expect
    .poll(() => input.evaluate((element) => getComputedStyle(element, "::placeholder").color))
    .toBe("rgb(181, 176, 189)");

  await page.getByRole("button", { name: "Open setup" }).click();
  await page.getByLabel("Input mode").selectOption("number");
  const numberInput = preview.getByRole("textbox", { name: "Issue query" });
  await expect(numberInput).toHaveValue("5");
  await page.getByRole("button", { name: "Close setup" }).click();
  const increase = preview.getByRole("button", {
    name: "Increase Issue query",
  });
  await expect(increase).toHaveCSS("min-width", "24px");
  await expect(increase).toHaveCSS("color", "rgb(181, 176, 189)");
  await increase.click();
  await expect(preview.getByText("Value: 6")).toBeVisible();

  await page.getByRole("button", { name: "Open setup" }).click();
  await page.getByLabel("Input mode").selectOption("drag");
  await page.getByRole("button", { name: "Close setup" }).click();
  const dragInput = preview.getByRole("textbox", { name: "Issue query" });
  await dragInput.press("ArrowUp");
  await expect(preview.getByText("Value: 7")).toBeVisible();

  await page.getByRole("button", { name: "Open setup" }).click();
  await page.getByLabel("Input mode").selectOption("autosize");
  await page.getByLabel("Input size").selectOption("xs");
  await page.getByLabel("monospace Input").check();
  await page.getByLabel("Input value").fill("event.type:error");
  const autosizeInput = preview.getByRole("textbox", { name: "Issue query" });
  await expect(autosizeInput).toHaveAttribute("data-size", "xs");
  await expect(autosizeInput).toHaveCSS("font-family", /Roboto Mono/);
  await expect
    .poll(() => autosizeInput.evaluate((element) => element.getBoundingClientRect().width))
    .toBeGreaterThan(100);

  await page.getByRole("button", { name: "Share" }).click();
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
  expect(sharedUrl).toContain("component=input");
  expect(sharedUrl).toContain("inputMode=autosize");
  expect(sharedUrl).toContain("inputNumberValue=7");
  expect(sharedUrl).toContain("inputSize=xs");

  const restoredContext = await browser.newContext({
    ignoreHTTPSErrors: true,
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const restored = await restoredContext.newPage();
  await restored.goto(sharedUrl);
  await expect(
    restored.getByTestId("input-preview").getByRole("textbox", {
      name: "Issue query",
    }),
  ).toHaveValue("event.type:error");
  await restored.getByRole("button", { name: "Open setup" }).click();
  await expect(restored.getByLabel("Input mode")).toHaveValue("autosize");
  await expect(restored.getByLabel("Input size")).toHaveValue("xs");
  await expect(restored.getByLabel("monospace Input")).toBeChecked();
  await restoredContext.close();

  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.getByLabel("Input mode")).toHaveValue("group");
  await expect(page.getByLabel("Input size")).toHaveValue("md");
  await expect(page.getByLabel("monospace Input")).not.toBeChecked();

  await page.goto("/?component=input");
  await page.getByRole("button", { name: "Open setup" }).click();
  await expect(page.getByLabel("Input number value")).toHaveValue("5");
});

test("configures, edits, shares, and restores the regular Scraps BreadcrumbList workbench", async ({
  browser,
  page,
}) => {
  await page.goto(
    "/?component=breadcrumb-list&breadcrumbEditable=false&breadcrumbProject=web&breadcrumbTitle=Issue+details&breadcrumbWidth=wide",
  );
  const preview = page.getByTestId("breadcrumb-list-preview");
  await expect(preview.getByText("Settings")).toBeVisible();
  await preview.getByRole("button", { name: "More breadcrumb actions" }).click();
  const submenuTrigger = page.getByRole("menuitem", { name: "More actions" });
  const expectedSide = await submenuTrigger.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const available = {
      bottom: window.innerHeight - rect.bottom,
      left: rect.left,
      right: window.innerWidth - rect.right,
      top: rect.top,
    };
    return Object.entries(available).reduce((best, entry) =>
      entry[1] > best[1] ? entry : best,
    )[0];
  });
  await submenuTrigger.hover();
  await submenuTrigger.click();
  const submenu = page.locator('[data-slot="dropdown-menu-sub-content"]');
  await expect(submenu).toBeVisible();
  await expect(submenu).toHaveAttribute("data-requested-side", expectedSide);
  await expect(submenu).toHaveAttribute("data-side", expectedSide);
  await expect(submenu).toContainText("Advanced");
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await preview.getByRole("button", { name: "Selected Project: Web" }).click();
  await page.getByRole("option", { name: "API" }).click();
  await expect(preview.getByRole("button", { name: "Selected Project: API" })).toBeVisible();
  await page.getByRole("button", { name: "Open setup" }).click();
  await page.getByLabel("Breadcrumb container width").selectOption("narrow");
  await page.getByLabel("Editable title").check();
  await page.getByLabel("Breadcrumb title").fill("Frontend overview");
  await page.getByRole("button", { name: "Close setup" }).click();
  await expect(preview.getByText("Settings")).toBeHidden();
  await expect(preview.getByRole("button", { name: "More breadcrumbs" })).toBeVisible();
  await preview.locator('[data-slot="breadcrumb-editable-label"]').click();
  const input = preview.getByRole("textbox", { name: "Edit breadcrumb title" });
  await input.press("ControlOrMeta+A");
  await input.fill("Renamed dashboard");
  await input.press("Enter");
  await page.getByRole("button", { name: "Open setup" }).click();
  await page.getByRole("button", { name: "Share" }).click();
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
  expect(sharedUrl).toContain("component=breadcrumb-list");
  expect(sharedUrl).toContain("breadcrumbEditable=true");
  expect(sharedUrl).toContain("breadcrumbProject=api");
  expect(sharedUrl).toContain("breadcrumbWidth=narrow");
  const restored = await browser.newPage();
  await restored.goto(sharedUrl);
  await restored.getByRole("button", { name: "Open setup" }).click();
  await expect(restored.getByLabel("Breadcrumb title")).toHaveValue("Renamed dashboard");
  await expect(restored.locator('[aria-label="Selected Project: API"]')).toBeHidden();
  await expect(restored.getByRole("button", { name: "More breadcrumbs" })).toBeVisible();
  await restored.getByLabel("Breadcrumb container width").selectOption("wide");
  await expect(restored.getByRole("button", { name: "Selected Project: API" })).toBeVisible();
  await restored.close();
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.getByLabel("Breadcrumb title")).toHaveValue("Issue details");
});

test("configures, shares, and restores the regular Scraps Link workbench", async ({
  browser,
  page,
}) => {
  await page.goto("/?component=link&linkDisabled=false&linkLabel=Issue+details&linkNewTab=true");
  const preview = page.getByTestId("link-preview");
  const routerLink = preview.getByRole("link", { name: "Issue details" });
  await expect(routerLink).toHaveAttribute("href", "/issues/");
  await expect(routerLink).not.toHaveAttribute("preventScrollReset");
  await expect(routerLink).not.toHaveAttribute("reloadDocument");
  await expect(routerLink).not.toHaveAttribute("state");
  await expect(preview.getByRole("link", { name: "Read the docs" })).toHaveAttribute(
    "target",
    "_blank",
  );
  await page.getByRole("button", { name: "Open setup" }).click();
  await page.getByLabel("Link label").fill("Shared issue");
  await page.getByLabel("Disabled link").check();
  await page.getByLabel("Open external link in new tab").uncheck();
  await page.getByLabel("Preview width").selectOption("mobile");
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  const disabledLink = preview.getByText("Shared issue");
  await expect(disabledLink).not.toHaveAttribute("href");
  await expect(disabledLink).toHaveCSS("color", "rgb(149, 142, 159)");
  await expect(disabledLink).toHaveCSS("pointer-events", "none");
  await expect(page.locator('[data-slot="sentry-page-frame"]')).toHaveCSS("width", "390px");
  await expect(preview.getByRole("link", { name: "Read the docs" })).not.toHaveAttribute("target");
  await page.getByRole("button", { name: "Share" }).click();
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
  expect(sharedUrl).toContain("component=link");
  expect(sharedUrl).toContain("linkDisabled=true");
  expect(sharedUrl).toContain("theme=dark");
  expect(sharedUrl).toContain("viewport=mobile");
  const restored = await browser.newPage();
  await restored.goto(sharedUrl);
  await expect(restored.getByTestId("link-preview").getByText("Shared issue")).not.toHaveAttribute(
    "href",
  );
  await restored.close();

  await page.reload();
  await page.getByRole("button", { name: "Open setup" }).click();
  await expect(page.getByLabel("Link label")).toHaveValue("Shared issue");
  await expect(page.getByLabel("Disabled link")).toBeChecked();
  await expect(page.getByLabel("Open external link in new tab")).not.toBeChecked();
  await expect(page.getByLabel("Preview width")).toHaveValue("mobile");

  await page.getByLabel("Component or template").selectOption("checkbox");
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "checkbox",
  );
  await page.goBack();
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "link",
  );
  await expect(page.getByLabel("Link label")).toHaveValue("Shared issue");
  await expect(page.getByLabel("Disabled link")).toBeChecked();
  await expect(page.getByLabel("Preview width")).toHaveValue("mobile");

  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.getByLabel("Link label")).toHaveValue("Open issue details");
  await expect(page.getByLabel("Disabled link")).not.toBeChecked();
  await expect(page.getByLabel("Open external link in new tab")).toBeChecked();
  await expect(page.getByLabel("Preview width")).toHaveValue("desktop");
  await expect(
    page.getByTestId("link-preview").getByRole("link", { name: "Open issue details" }),
  ).toHaveAttribute("href", "/issues/");
  const resetUrl = new URL(page.url());
  expect(resetUrl.searchParams.get("theme")).toBe("light");
  expect(resetUrl.searchParams.get("linkDisabled")).toBe("false");
});

test("configures, shares, and restores the regular Scraps Tooltip workbench", async ({
  browser,
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(
    "/?component=tooltip&tooltipHoverable=true&tooltipOverflow=false&tooltipPosition=top&tooltipTitle=Issue+details&tooltipVisible=false",
  );
  const preview = page.getByTestId("tooltip-preview");
  const trigger = preview.getByRole("button", { name: "Inspect issue" });
  await trigger.hover();
  const tooltip = page.getByRole("tooltip", { name: "Issue details" });
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toHaveAttribute("data-side", "top");
  await expect(tooltip.locator("svg")).toHaveCSS("width", "16px");
  await expect(tooltip.locator("svg")).toHaveCSS("height", "8px");
  await expect(tooltip.locator("polygon")).toHaveCount(5);
  await expect
    .poll(() =>
      tooltip
        .locator("polygon")
        .evaluateAll(
          (polygons) =>
            polygons.filter((polygon) => getComputedStyle(polygon).display !== "none").length,
        ),
    )
    .toBe(2);
  await expect(tooltip.locator("..")).toHaveCSS("z-index", "10003");
  await expect(tooltip).toHaveCSS("max-width", "225px");
  await expect(tooltip).toHaveCSS("font-size", "12px");
  await expect(tooltip).toHaveCSS("padding", "8px 12px");

  await page.getByRole("button", { name: "Open setup" }).click();
  await page.getByLabel("Tooltip title").fill("Shared tooltip");
  await page.getByLabel("Tooltip position").selectOption("right");
  await page.getByLabel("Force visible").check();
  await page.getByLabel("Overflow-only trigger").check();
  await page.getByLabel("Preview width").selectOption("mobile");
  await expect(page.locator('[data-slot="sentry-page-frame"]')).toHaveCSS("width", "390px");
  const sharedTooltip = preview.getByRole("tooltip", {
    name: "Shared tooltip",
  });
  await expect(sharedTooltip).toBeVisible();
  const previewBox = await preview.boundingBox();
  const tooltipBox = await sharedTooltip.boundingBox();
  expect(previewBox).not.toBeNull();
  expect(tooltipBox).not.toBeNull();
  expect(tooltipBox!.x).toBeGreaterThanOrEqual(previewBox!.x);
  expect(tooltipBox!.x + tooltipBox!.width).toBeLessThanOrEqual(previewBox!.x + previewBox!.width);
  expect(tooltipBox!.y).toBeGreaterThanOrEqual(previewBox!.y);
  expect(tooltipBox!.y + tooltipBox!.height).toBeLessThanOrEqual(
    previewBox!.y + previewBox!.height,
  );
  await page.getByRole("button", { name: "Share" }).click();
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
  expect(sharedUrl).toContain("component=tooltip");
  expect(sharedUrl).toContain("tooltipPosition=right");
  expect(sharedUrl).toContain("tooltipVisible=true");
  expect(sharedUrl).toContain("tooltipOverflow=true");
  expect(sharedUrl).toContain("viewport=mobile");

  const restored = await browser.newPage();
  await restored.goto(sharedUrl);
  await expect(restored.getByRole("tooltip", { name: "Shared tooltip" })).toBeVisible();
  await restored.close();

  await page.reload();
  await page.getByRole("button", { name: "Open setup" }).click();
  await expect(page.getByLabel("Tooltip position")).toHaveValue("right");
  await expect(page.getByLabel("Force visible")).toBeChecked();
  await expect(page.getByLabel("Overflow-only trigger")).toBeChecked();
  await expect(page.getByLabel("Preview width")).toHaveValue("mobile");

  await page.getByLabel("Component or template").selectOption("checkbox");
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "checkbox",
  );
  await page.goBack();
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "tooltip",
  );
  await expect(page.getByLabel("Tooltip position")).toHaveValue("right");
  await expect(page.getByLabel("Preview width")).toHaveValue("mobile");
  await page.goForward();
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "checkbox",
  );
  await page.goBack();
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "tooltip",
  );
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.getByLabel("Tooltip position")).toHaveValue("top");
  await expect(page.getByLabel("Force visible")).not.toBeChecked();
  await expect(page.getByLabel("Preview width")).toHaveValue("desktop");
});

test("uses measured popup overflow for automatic Tooltip placement", async ({ page }) => {
  await page.setViewportSize({ width: 500, height: 300 });
  await page.goto(
    "/?component=tooltip&tooltipPosition=auto&tooltipTitle=This+tooltip+is+wide+enough+to+overflow+the+largest+raw+gap&tooltipVisible=true",
  );
  const preview = page.getByTestId("tooltip-preview");
  const trigger = preview.getByRole("button", { name: "Inspect issue" });
  await preview.evaluate((element) => {
    Object.assign((element as HTMLElement).style, {
      inset: "0",
      minHeight: "300px",
      overflow: "visible",
      position: "fixed",
      width: "500px",
      zIndex: "20000",
    });
  });
  await trigger.evaluate((element) => {
    Object.assign((element as HTMLElement).style, {
      left: "150px",
      position: "fixed",
      top: "130px",
    });
  });
  const tooltip = page.getByRole("tooltip");
  const positioner = tooltip.locator("..");
  await expect(positioner).toHaveAttribute("data-requested-side", "bottom");
  await expect(tooltip).toHaveAttribute("data-side", "bottom");

  const geometry = await Promise.all([trigger.boundingBox(), tooltip.boundingBox()]);
  expect(geometry[0]).not.toBeNull();
  expect(geometry[1]).not.toBeNull();
  const rawRightGap = 500 - (geometry[0]!.x + geometry[0]!.width);
  const rawBottomGap = 300 - (geometry[0]!.y + geometry[0]!.height);
  expect(rawRightGap).toBeGreaterThan(rawBottomGap);
  expect(geometry[1]!.width + 8 + 12).toBeGreaterThan(rawRightGap);
  expect(geometry[1]!.height + 8 + 12).toBeLessThan(rawBottomGap);
});

test("configures, shares, reloads, restores history, and resets the Loader template", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/evidence/loader-server");
  await expect(
    page.getByTestId("loader-server").getByRole("progressbar", { name: "Loading" }),
  ).toBeVisible();

  await page.goto(
    "/templates/loader-status?loaderVariant=vibrant&loaderWidth=120&theme=dark&viewport=mobile",
  );
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "loader",
  );
  await expect(page.getByRole("heading", { name: "Loader", exact: true })).toBeVisible();
  await expect(page.locator('[data-slot="sentry-page-frame"]')).toHaveCSS("width", "390px");
  const preview = page.getByTestId("loader-preview");
  const track = preview.getByRole("progressbar", { name: "Loading" });
  const readVisuals = () =>
    track.evaluate((element) => {
      const before = getComputedStyle(element, "::before");
      const mask = element.querySelector<HTMLElement>(":scope > span");
      const bars = element.querySelectorAll<HTMLElement>("span span");
      if (!mask || bars.length !== 2) throw new Error("Loader visual layers are missing");
      return {
        accentBars: [...bars].map((bar) => getComputedStyle(bar).backgroundColor),
        maskImage: getComputedStyle(mask).maskImage,
        maskSize: getComputedStyle(mask).maskSize,
        trackColor: before.backgroundColor,
        trackOpacity: before.opacity,
      };
    });
  await expect(track).toBeVisible();
  await expect(track).toHaveCSS("height", "8px");
  expect(await readVisuals()).toEqual({
    accentBars: ["rgb(117, 83, 255)", "rgb(117, 83, 255)"],
    maskImage: expect.stringContaining("data:image/svg+xml"),
    maskSize: "16px 8px",
    trackColor: "rgb(27, 24, 33)",
    trackOpacity: "1",
  });
  await expect(track.locator("span span").first()).toHaveCSS("animation-duration", "2s");
  await expect(track.locator("span span").nth(1)).toHaveCSS("animation-delay", "0.8s");
  await page.getByRole("button", { name: "Open setup" }).click();
  await expect(page.getByLabel("Component or template")).toHaveValue("/templates/loader-status");
  await expect(page.getByLabel("Loader width")).toHaveValue("120");
  await expect(page.getByLabel("Preview width")).toHaveValue("mobile");
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await expect.poll(readVisuals).toMatchObject({ trackColor: "rgb(230, 230, 233)" });
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await page.getByLabel("Loader width").selectOption("400");
  await expect(track).toHaveCSS("width", "400px");
  await expect(track.locator("span span").first()).toHaveCSS("animation-duration", "2.8s");
  await expect(track.locator("span span").nth(1)).toHaveCSS("animation-delay", "1.2s");
  await page.getByLabel("Loader variant").selectOption("monochrome");
  expect(await readVisuals()).toMatchObject({
    accentBars: ["rgb(117, 83, 255)", "rgb(117, 83, 255)"],
    trackColor: "rgb(117, 83, 255)",
    trackOpacity: "0.2",
  });
  await page.getByRole("button", { name: "Share" }).click();
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
  expect(sharedUrl).toContain("/templates/loader-status?");
  expect(sharedUrl).toContain("component=loader");
  expect(sharedUrl).toContain("loaderVariant=monochrome");
  expect(sharedUrl).toContain("loaderWidth=400");
  expect(sharedUrl).toContain("theme=dark");
  expect(sharedUrl).toContain("viewport=mobile");

  await page.reload();
  await page.getByRole("button", { name: "Open setup" }).click();
  await expect(page.getByLabel("Loader variant")).toHaveValue("monochrome");
  await expect(page.getByLabel("Loader width")).toHaveValue("400");
  await expect(page.getByLabel("Preview width")).toHaveValue("mobile");
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.getByLabel("Component or template").selectOption("checkbox");
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "checkbox",
  );
  await page.goBack();
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "loader",
  );
  await page.getByRole("button", { name: "Open setup" }).click();
  await expect(page.getByLabel("Loader width")).toHaveValue("400");
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.getByLabel("Loader variant")).toHaveValue("vibrant");
  await expect(page.getByLabel("Loader width")).toHaveValue("240");
  await expect(page.getByLabel("Preview width")).toHaveValue("desktop");
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await expect(page).toHaveURL(/theme=light/);
  await expect(page).toHaveURL(/viewport=desktop/);
});

test("keeps Loader progress semantics while reduced motion disables loader animation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?component=loader");
  const track = page.getByTestId("loader-preview").getByRole("progressbar", { name: "Loading" });
  await expect(track).toBeVisible();
  await expect(track.locator("span span").first()).toHaveCSS("animation-name", "none");
  await expect(track.locator("span span").nth(1)).toHaveCSS("animation-name", "none");
});

test("configures, shares, reloads, restores history, and resets the Slide Over Panel workbench", async ({
  browser,
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(
    "/?component=slide-over-panel&slideOpen=true&slidePosition=right&slideMode=passive&slideTopOffsetViewport=desktop&slideSuperuser=true&slideWidth=36rem&slideContent=Shared+panel&theme=dark&viewport=mobile",
  );
  const preview = page.getByTestId("slide-over-panel-preview");
  const panel = preview.locator('[data-test-id="slide-over-panel-preview-panel"]');
  await expect(panel).toHaveAttribute("role", "complementary");
  await expect(panel).toHaveAttribute("mode", "passive");
  await expect(panel).not.toHaveAttribute("position");
  await expect(panel).not.toHaveAttribute("panelwidth");
  await expect(panel).not.toHaveAttribute("data-position");
  await expect(panel).not.toHaveAttribute("data-mode");
  await expect(panel).toHaveCSS("top", "77px");
  await expect(panel).toHaveCSS("width", "576px");
  await expect(panel).toHaveCSS("background-color", "rgb(57, 52, 66)");
  await expect(panel).toHaveCSS("color", "rgb(231, 229, 234)");
  await expect(panel).toHaveCSS(
    "box-shadow",
    "rgba(0, 0, 24, 0.1) 0px 4px 0px 2px, rgba(0, 0, 24, 0.1) 0px 1px 0px 1px",
  );
  await page.getByRole("button", { name: "Open setup" }).click();
  await page.getByLabel("Panel position").selectOption("left");
  await page.getByLabel("Panel width").fill("32rem");
  await page.getByLabel("Panel content").fill("Restored panel");
  await page.getByLabel("Panel top offset viewport").selectOption("mobile");
  await expect(panel).toHaveCSS("top", "72px");
  await expect(page.getByLabel("Preview width")).toHaveValue("mobile");
  await page.getByRole("button", { name: "Share" }).click();
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
  expect(sharedUrl).toContain("component=slide-over-panel");
  expect(sharedUrl).toContain("slidePosition=left");
  expect(sharedUrl).toContain("slideTopOffsetViewport=mobile");
  expect(sharedUrl).toContain("slideSuperuser=true");
  expect(sharedUrl).toContain("viewport=mobile");
  const restored = await browser.newPage();
  await restored.goto(sharedUrl);
  await expect(restored.locator('[data-test-id="slide-over-panel-preview-panel"]')).toHaveCSS(
    "top",
    "72px",
  );
  await expect(restored.getByTestId("slide-over-panel-preview")).toContainText("Restored panel");
  await restored.close();
  await page.reload();
  await page.getByRole("button", { name: "Open setup" }).click();
  await expect(page.getByLabel("Panel content")).toHaveValue("Restored panel");
  await expect(page.getByLabel("Panel top offset viewport")).toHaveValue("mobile");
  await expect(page.getByLabel("Show superuser warning")).toBeChecked();

  await page.getByLabel("Component or template").selectOption("checkbox");
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "checkbox",
  );
  await page.goBack();
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "slide-over-panel",
  );
  await expect(page.getByRole("button", { name: "Close setup" })).toBeVisible();
  await expect(page.getByLabel("Panel content")).toHaveValue("Restored panel");
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.getByLabel("Panel position")).toHaveValue("right");
  await expect(page.getByLabel("Panel top offset viewport")).toHaveValue("auto");
  await expect(page.getByLabel("Show superuser warning")).not.toBeChecked();
  await expect(page.getByLabel("Panel open")).toBeChecked();
  await expect(page.getByLabel("Preview width")).toHaveValue("desktop");
  await expect(page.locator("html")).not.toHaveClass(/dark/);
});

test("keeps exact Slide Over Panel geometry and placement behavior at its responsive boundaries", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });

  for (const width of [639, 640, 799]) {
    await page.setViewportSize({ width, height: 720 });
    await page.goto(
      "/?component=slide-over-panel&slideOpen=true&slidePosition=right&slideMode=blocking&slideTopOffsetViewport=auto&slideSuperuser=false&slideWidth=50vw",
    );
    const panel = page.locator('[data-test-id="slide-over-panel-preview-panel"]');
    await expect(panel).toHaveCSS("position", "fixed");
    await expect(panel).toHaveCSS("top", "16px");
    await expect(panel).toHaveCSS("right", "0px");
    await expect(panel).toHaveCSS("bottom", "16px");
    await expect(panel).toHaveCSS("left", "16px");
    await expect(panel).toHaveCSS("width", `${width - 16}px`);
  }

  await page.setViewportSize({ width: 800, height: 720 });
  await page.goto(
    "/?component=slide-over-panel&slideOpen=true&slidePosition=right&slideMode=blocking&slideTopOffsetViewport=auto&slideSuperuser=false&slideWidth=50vw",
  );
  const panel = page.locator('[data-test-id="slide-over-panel-preview-panel"]');
  await expect(panel).toHaveCSS("top", "0px");
  await expect(panel).toHaveCSS("bottom", "0px");
  await expect(panel).toHaveCSS("left", "400px");
  await expect(panel).toHaveCSS("width", "400px");
  await page.getByRole("button", { name: "Open setup" }).click();

  const cases = [
    {
      mode: "blocking",
      position: "right",
      positionCss: "fixed",
      top: "0px",
      width: "400px",
    },
    {
      mode: "passive",
      position: "right",
      positionCss: "fixed",
      top: "48px",
      width: "400px",
    },
    {
      mode: "blocking",
      position: "left",
      positionCss: "relative",
      top: "0px",
      width: "450px",
    },
    {
      mode: "passive",
      position: "left",
      positionCss: "relative",
      top: "48px",
      width: "450px",
    },
    {
      mode: "blocking",
      position: "bottom",
      positionCss: "sticky",
      top: "16px",
      width: null,
    },
    {
      mode: "passive",
      position: "bottom",
      positionCss: "sticky",
      top: "48px",
      width: null,
    },
    {
      mode: "blocking",
      position: "unspecified",
      positionCss: "relative",
      top: "0px",
      width: "450px",
    },
    {
      mode: "passive",
      position: "unspecified",
      positionCss: "relative",
      top: "48px",
      width: "450px",
    },
  ] as const;

  for (const geometryCase of cases) {
    await page.getByLabel("Panel position").selectOption(geometryCase.position);
    await page.getByLabel("Panel mode").selectOption(geometryCase.mode);
    await expect(panel).toHaveAttribute("mode", geometryCase.mode);
    await expect(panel).toHaveCSS("position", geometryCase.positionCss);
    await expect(panel).toHaveCSS("top", geometryCase.top);
    if (geometryCase.width !== null) await expect(panel).toHaveCSS("width", geometryCase.width);
  }

  await page.setViewportSize({ width: 1280, height: 720 });
  await page.getByLabel("Panel position").selectOption("right");
  await page.getByLabel("Panel mode").selectOption("passive");
  await page.getByLabel("Panel top offset viewport").selectOption("auto");
  await expect(panel).toHaveCSS("top", "53px");
  await page.getByLabel("Show superuser warning").check();
  await expect(panel).toHaveCSS("top", "77px");
  await page.getByLabel("Panel top offset viewport").selectOption("mobile");
  await expect(panel).toHaveCSS("top", "72px");
});

test("uses external AnimatePresence for a real spring exit and a reduced-motion close", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(
    "/?component=slide-over-panel&slideOpen=true&slidePosition=right&slideMode=blocking",
  );
  const panel = page.locator('[data-test-id="slide-over-panel-preview-panel"]');
  await expect(panel).toBeVisible();

  const springExit = await page.evaluate(async () => {
    const drawer = document.querySelector<HTMLElement>(
      '[data-test-id="slide-over-panel-preview-panel"]',
    );
    const close = [...document.querySelectorAll<HTMLButtonElement>("button")].find(
      (button) => button.textContent === "Close panel",
    );
    if (!drawer || !close) throw new Error("The panel fixture is missing");
    close.click();
    const samples: Array<{ opacity: string; transform: string }> = [];
    for (let frame = 0; frame < 120 && drawer.isConnected; frame += 1) {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      if (drawer.isConnected) {
        const styles = getComputedStyle(drawer);
        samples.push({ opacity: styles.opacity, transform: styles.transform });
      }
    }
    return { connected: drawer.isConnected, samples };
  });
  expect(springExit.connected).toBe(false);
  expect(springExit.samples.length).toBeGreaterThan(1);
  expect(springExit.samples.some(({ opacity }) => Number(opacity) > 0 && Number(opacity) < 1)).toBe(
    true,
  );
  expect(
    springExit.samples.some(
      ({ transform }) => transform !== "none" && !transform.endsWith(", 0, 0)"),
    ),
  ).toBe(true);
  await expect(panel).toHaveCount(0);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Open panel" }).click();
  await expect(panel).toBeVisible();
  await page.getByRole("button", { name: "Close panel" }).click();
  await expect(panel).toHaveCount(0, { timeout: 500 });
});

test("configures, shares, and restores the Empty State workbench", async ({ browser, page }) => {
  await page.goto("/evidence/empty-state-server");
  await expect(
    page.getByTestId("empty-state-server").getByRole("heading", { name: "No results" }),
  ).toBeVisible();

  await page.goto(
    "/?component=empty-state&emptyAction=true&emptyDescription=true&emptyIllustration=true&emptyTitle=No+results&emptyWidth=md",
  );
  const preview = page.getByTestId("empty-state-preview");
  const observedWidths = () =>
    preview.evaluate((element) => {
      const styles = getComputedStyle(element);
      return {
        paddedContentBox:
          element.clientWidth -
          Number.parseFloat(styles.paddingLeft) -
          Number.parseFloat(styles.paddingRight),
        queryContainer: element.querySelector(":scope > div")?.clientWidth,
      };
    });
  await expect(preview.getByRole("heading", { name: "No results" })).toBeVisible();
  expect(await observedWidths()).toEqual({
    paddedContentBox: 576,
    queryContainer: 576,
  });
  await expect(preview.locator('[data-test-id="empty-state"]')).toHaveCSS("flex-direction", "row");
  await page.getByRole("button", { name: "Open setup" }).click();
  await page.getByLabel("Empty state container width").selectOption("below-md");
  expect(await observedWidths()).toEqual({
    paddedContentBox: 575,
    queryContainer: 575,
  });
  await expect(preview.locator('[data-test-id="empty-state"]')).toHaveCSS(
    "flex-direction",
    "column",
  );
  await page.getByLabel("Show illustration").uncheck();
  await page.getByLabel("Show description").uncheck();
  await page.getByLabel("Show action").uncheck();
  await expect(preview.getByRole("img")).toHaveCount(0);
  await expect(preview.getByRole("button", { name: "Keep searching" })).toHaveCount(0);
  await page.getByRole("button", { name: "Share" }).click();
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
  expect(sharedUrl).toContain("component=empty-state");
  expect(sharedUrl).toContain("emptyWidth=below-md");
  const restored = await browser.newPage();
  await restored.goto(sharedUrl);
  await expect(restored.getByTestId("empty-state-preview").getByRole("img")).toHaveCount(0);
  await restored.close();
});

test("configures, shares, restores, and proves the Quote workbench", async ({ browser, page }) => {
  const serverCases = [
    { caption: null, cite: null, id: "absent", label: null },
    { caption: "–", cite: null, id: "empty", label: null },
    {
      caption: "–",
      cite: "https://example.com/href-only",
      id: "href-only",
      label: null,
    },
    { caption: "– Ada", cite: null, id: "author-only", label: null },
    { caption: "– , Notes", cite: null, id: "label-only", label: "Notes" },
    {
      caption: "– Ada, Notes",
      cite: "https://example.com/full",
      id: "full",
      label: "Notes",
    },
  ] as const;

  await page.goto("/evidence/quote-server");
  for (const quoteCase of serverCases) {
    const fixture = page.getByTestId(`server-quote-${quoteCase.id}`);
    await expect(fixture.locator("figure")).toHaveCount(1);
    await expect(fixture.locator('hr[aria-orientation="vertical"]')).toHaveCount(1);
    await expect(fixture.locator("blockquote")).toHaveText(
      "Server-rendered regular Scraps quotation.",
    );
    if (quoteCase.cite === null) {
      await expect(fixture.locator("blockquote")).not.toHaveAttribute("cite");
    } else {
      await expect(fixture.locator("blockquote")).toHaveAttribute("cite", quoteCase.cite);
    }
    if (quoteCase.caption === null) {
      await expect(fixture.locator("figcaption")).toHaveCount(0);
    } else {
      await expect(fixture.locator("figcaption")).toHaveText(quoteCase.caption);
    }
    if (quoteCase.label === null) {
      await expect(fixture.locator("figcaption cite")).toHaveCount(0);
    } else {
      await expect(fixture.locator("figcaption cite")).toHaveText(quoteCase.label);
    }
  }

  await page.goto(
    "/?component=quote&quoteAuthor=Ada&quoteBody=Typed+quote&quoteHref=https%3A%2F%2Fexample.com&quoteLabel=Notes&quoteSource=true",
  );
  const preview = page.getByTestId("quote-preview");
  await expect(preview.getByRole("blockquote")).toHaveAttribute("cite", "https://example.com");
  await expect(preview.locator("figcaption cite")).toHaveText("Notes");
  await expect(preview.locator("hr")).toHaveCSS("border-left-width", "1px");
  await expect(preview.locator("blockquote")).toHaveCSS("padding-left", "28px");

  await page.getByRole("button", { name: "Open setup" }).click();
  await page.getByLabel("Body").fill("Shared quote");
  await page.getByLabel("Show source").uncheck();
  await expect(preview.locator("figcaption")).toHaveCount(0);
  await page.getByRole("button", { name: "Share" }).click();
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
  expect(sharedUrl).toContain("component=quote");
  expect(sharedUrl).toContain("quoteSource=false");

  const secondContext = await browser.newContext({
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const secondPage = await secondContext.newPage();
  await secondPage.goto(sharedUrl);
  await expect(secondPage.getByTestId("quote-preview").getByRole("blockquote")).toHaveText(
    "Shared quote",
  );
  await expect(secondPage.getByTestId("quote-preview").locator("figcaption")).toHaveCount(0);
  await secondContext.close();
});

test("shares and restores the Checkbox template workflow", async ({ browser, page }) => {
  await page.goto("/");
  const viewport = page.viewportSize();
  const pageFrame = page.locator('[data-slot="sentry-page-frame"]');
  const pageFrameBox = await pageFrame.boundingBox();
  const pageTitleBox = await page
    .getByRole("heading", { name: "Notification Settings" })
    .boundingBox();
  const collapsedIslandBox = await page.locator('[data-slot="playground-island"]').boundingBox();

  expect(pageFrameBox?.x).toBe(0);
  expect(pageFrameBox?.width).toBe(viewport?.width);
  expect(pageFrameBox?.height).toBeGreaterThanOrEqual(viewport?.height ?? 0);
  expect(collapsedIslandBox?.y).toBeGreaterThanOrEqual(
    (pageTitleBox?.y ?? 0) + (pageTitleBox?.height ?? 0),
  );
  await expect(pageFrame).toHaveCSS("border-radius", "0px");
  await expect(page.locator('[data-slot="playground-island"]')).toBeVisible();
  await expect(page.getByLabel("Size")).toBeHidden();
  await expect(page.getByTestId("layout-stack-separator-proof")).toHaveAttribute(
    "aria-orientation",
    "vertical",
  );
  await expect(page.getByTestId("slot-playground-outlet")).toContainText("Portaled Scraps content");
  await expect(page.getByTestId("slot-playground-outlet")).not.toContainText("No utility content");

  const initialCheckbox = page.getByRole("checkbox", {
    name: "Alert me about new issues",
  });
  const interactionTarget = initialCheckbox.locator("..");
  const interactionStateLayer = interactionTarget.locator('[role="presentation"]');
  await expect(interactionStateLayer).toHaveCSS("opacity", "0");
  await interactionTarget.hover();
  await expect(interactionStateLayer).toHaveCSS("opacity", "0.06");
  await page.mouse.down();
  await expect(interactionStateLayer).toHaveCSS("opacity", "0.09");
  await page.mouse.up();

  await page.getByRole("button", { name: "Open setup" }).click();
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.getByRole("button", { name: "Close setup" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );

  await page.getByLabel("Size").selectOption("md");
  await page.getByLabel("Label").fill("Critical regressions");
  await page.getByLabel("Checked state").selectOption("indeterminate");
  await page.getByLabel("Disabled").check();
  await page.getByLabel("Disabled").uncheck();
  await page.getByRole("button", { name: "Move Critical regressions down" }).click();

  const composedCheckbox = page.getByRole("checkbox", {
    name: "Critical regressions",
  });
  await composedCheckbox.focus();
  await page.keyboard.press("Space");
  await expect(composedCheckbox).toBeChecked();
  await expect(page.getByLabel("Size")).toBeHidden();

  await page.getByRole("button", { name: "Open setup" }).click();
  await page.getByLabel("Component or template").selectOption("/templates/checkbox-settings");
  await expect(page).toHaveURL(/\/templates\/checkbox-settings/);
  await expect(page.locator("form label")).toHaveText([
    "Issue status changes",
    "Critical regressions",
    "Weekly project report",
  ]);
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("status")).toContainText("Saved:");

  await page.getByRole("button", { name: "Open setup" }).click();
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await page.getByLabel("Preview width").selectOption("mobile");
  const mobilePageFrameBox = await page.locator('[data-slot="sentry-page-frame"]').boundingBox();
  expect(mobilePageFrameBox?.width).toBe(390);
  expect(mobilePageFrameBox?.x).toBe((viewport?.width ?? 390) / 2 - 195);
  await page.getByRole("button", { name: "Share" }).click();
  await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
  expect(sharedUrl).toContain("/templates/checkbox-settings?");

  const secondContext = await browser.newContext({
    ignoreHTTPSErrors: true,
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const restoredPage = await secondContext.newPage();
  await restoredPage.goto(sharedUrl);
  await restoredPage.getByRole("button", { name: "Open setup" }).click();
  await expect(restoredPage.getByLabel("Size")).toHaveValue("md");
  await expect(restoredPage.getByLabel("Label")).toHaveValue("Critical regressions");
  await expect(restoredPage.getByLabel("Preview width")).toHaveValue("mobile");
  await expect(restoredPage.locator("html")).toHaveClass(/dark/);
  await expect(restoredPage.getByRole("checkbox", { name: "Critical regressions" })).toBeChecked();
  await expect(restoredPage.locator("form label")).toHaveText([
    "Issue status changes",
    "Critical regressions",
    "Weekly project report",
  ]);
  await secondContext.close();
});

test("configures, responds, shares, restores, and resets the Text workbench", async ({ page }) => {
  await page.setViewportSize({ width: 480, height: 900 });
  await page.goto("/?component=text");

  const viewportText = page.getByTestId("text-responsive-viewport");
  const containerText = page.getByTestId("text-responsive-container");
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "text",
  );
  await expect(page.getByRole("heading", { name: "Text", exact: true })).toBeVisible();
  await expect(viewportText).toHaveCSS("font-size", "11px");
  await expect(viewportText).toHaveCSS("text-align", "left");
  await expect(containerText).toHaveCSS("font-size", "14px");
  await expect(page.getByTestId("text-inherit-class-preview")).toHaveCSS(
    "color",
    "rgb(0, 87, 184)",
  );
  await expect(page.getByTestId("heading-inherit-style-preview")).toHaveCSS(
    "color",
    "rgb(180, 35, 24)",
  );
  await expect(page.getByTestId("text-mono-regular-preview")).toHaveCSS("font-weight", "425");
  await expect(page.getByTestId("text-mono-bold-preview")).toHaveCSS("font-weight", "500");
  expect(
    await page.evaluate(async () => (await document.fonts.load('425 14px "Roboto Mono"')).length),
  ).toBeGreaterThan(0);

  await page.setViewportSize({ width: 600, height: 900 });
  await expect(viewportText).toHaveCSS("font-size", "16px");
  await expect(viewportText).toHaveCSS("text-align", "center");
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(viewportText).toHaveCSS("font-size", "24px");
  await expect(viewportText).toHaveCSS("text-align", "right");

  await page.getByRole("button", { name: "Open setup" }).click();
  await expect(page.getByLabel("Component or template")).toHaveValue("text");
  await page.getByLabel("Text variant").selectOption("promotion");
  await page.getByLabel("Text size").selectOption("2xl");
  await page.getByLabel("Heading size").selectOption("4xl");
  await page.getByLabel("Text density").selectOption("comfortable");
  await page.getByLabel("Text alignment").selectOption("center");
  await page.getByLabel("Text decoration").selectOption("underline-strike");
  await page.getByLabel("Query container width").selectOption("640px");
  await page.getByLabel("Bold").check();
  await page.getByLabel("Italic").check();
  await page.getByLabel("Monospace").check();
  await page.getByLabel("Ellipsis").check();
  await expect(containerText).toHaveCSS("font-size", "20px");
  await page.getByRole("button", { name: "Close setup" }).click();

  const configuredText = page.getByTestId("text-preview");
  await expect(configuredText).toHaveCSS("font-size", "24px");
  await expect(configuredText).toHaveCSS("line-height", "33.6px");
  await expect(configuredText).toHaveCSS("text-align", "center");
  await expect(configuredText).toHaveCSS("font-weight", "500");
  await expect(configuredText).toHaveCSS("font-style", "italic");
  await expect(configuredText).toHaveCSS("color", "rgb(200, 0, 126)");
  expect(
    await configuredText.evaluate((element) => getComputedStyle(element).fontFamily),
  ).toContain("Roboto Mono");
  expect(
    (await configuredText.evaluate((element) => getComputedStyle(element).textDecorationLine))
      .split(" ")
      .sort(),
  ).toEqual(["line-through", "underline"]);
  await expect(page.getByTestId("heading-preview")).toHaveCSS("font-size", "40px");

  const rawInlineCode = page.getByTestId("prose-preview").locator("p code");
  const rawKbd = page.getByTestId("prose-preview").locator("kbd");
  await expect(rawInlineCode).toHaveCSS("color", "rgb(200, 0, 126)");
  await expect(rawInlineCode).toHaveCSS("font-size", "18px");
  await expect(rawInlineCode).toHaveCSS("font-size-adjust", "0.57");
  await expect(rawInlineCode).toHaveCSS("font-weight", "600");
  await expect(rawKbd).toHaveCSS("font-size", "12px");
  await expect(rawKbd).toHaveCSS("line-height", "29px");
  await expect(rawKbd).toHaveCSS("font-weight", "500");
  await expect(rawKbd).toHaveCSS("border-bottom-width", "2px");

  await page.getByRole("button", { name: "Open setup" }).click();
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(rawInlineCode).toHaveCSS("color", "rgb(234, 149, 185)");
  await expect(rawInlineCode).toHaveCSS("font-size", "18px");
  await expect(rawInlineCode).toHaveCSS("font-weight", "600");
  await expect(page.getByTestId("text-inherit-class-preview")).toHaveCSS(
    "color",
    "rgb(0, 87, 184)",
  );
  await expect(page.getByTestId("heading-inherit-style-preview")).toHaveCSS(
    "color",
    "rgb(180, 35, 24)",
  );
  await page.getByLabel("Preview width").selectOption("mobile");
  const pageFrameBox = await page.locator('[data-slot="sentry-page-frame"]').boundingBox();
  expect(pageFrameBox?.width).toBe(390);

  await page.getByRole("button", { name: "Share" }).click();
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
  expect(sharedUrl).toContain("component=text");
  expect(sharedUrl).toContain("textHeadingSize=4xl");
  expect(sharedUrl).toContain("theme=dark");
  expect(sharedUrl).toContain("viewport=mobile");

  await page.reload();
  await page.getByRole("button", { name: "Open setup" }).click();
  await expect(page.getByLabel("Text variant")).toHaveValue("promotion");
  await expect(page.getByLabel("Text size")).toHaveValue("2xl");
  await expect(page.getByLabel("Text decoration")).toHaveValue("underline-strike");
  await expect(page.getByLabel("Preview width")).toHaveValue("mobile");
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.getByLabel("Component or template").selectOption("checkbox");
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "checkbox",
  );
  await page.goBack();
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "text",
  );
  await expect(page.getByLabel("Text variant")).toHaveValue("promotion");
  await page.goForward();
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "checkbox",
  );
  await page.goBack();
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.getByLabel("Text variant")).toHaveValue("primary");
  await expect(page.getByLabel("Text size")).toHaveValue("md");
  await expect(page.getByLabel("Heading size")).toHaveValue("2xl");
  await expect(page.getByLabel("Preview width")).toHaveValue("desktop");
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await expect(page).toHaveURL(/textVariant=primary/);
});

test("configures, resizes, sorts, shares, and restores the Table workbench", async ({
  browser,
  page,
}) => {
  await page.goto("/?component=table");
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "table",
  );
  await expect(page.getByRole("heading", { name: "Table", exact: true })).toBeVisible();

  const table = page.getByRole("table", { name: "Issue stream" });
  await expect(table).toHaveCSS("display", "grid");
  await expect
    .poll(() => table.evaluate((element) => element.style.gridTemplateColumns))
    .toBe("220px 120px minmax(90px, auto)");
  await expect(page.getByRole("columnheader", { name: "Events" })).toHaveAttribute(
    "aria-sort",
    "descending",
  );
  await expect(page.getByRole("separator")).toHaveCount(2);

  await page.getByRole("button", { name: "Open setup" }).click();
  await expect(page.getByLabel("Component or template")).toHaveValue("table");
  await page.getByLabel("Minimum column width").fill("100");
  await page.getByLabel("Rows").fill("3");
  await page.getByLabel("Sort column").selectOption("issue");
  await page.getByLabel("Sort direction").selectOption("asc");
  await page.reload();
  await page.getByRole("button", { name: "Open setup" }).click();
  await expect(page.getByLabel("Minimum column width")).toHaveValue("100");
  await expect(page.getByLabel("Rows")).toHaveValue("3");
  await expect(page.getByLabel("Sort column")).toHaveValue("issue");
  await page.getByLabel("Component or template").selectOption("checkbox");
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "checkbox",
  );
  await page.goBack();
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "table",
  );
  await expect(page.getByLabel("Minimum column width")).toHaveValue("100");
  await page.goForward();
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "checkbox",
  );
  await page.goBack();
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "table",
  );
  await page.getByRole("button", { name: "Close setup" }).click();
  await expect(page.getByRole("columnheader", { name: "Issue" })).toHaveAttribute(
    "aria-sort",
    "ascending",
  );
  await expect(
    page.getByRole("cell", { name: "Authentication token refresh failed" }),
  ).toBeVisible();

  let issueHandle = page.getByRole("separator", { name: "Issue" });
  await issueHandle.focus();
  await page.keyboard.press("Shift+ArrowRight");
  await expect(page.getByTestId("table-resize-output")).toHaveText("Last resize: 0:270");
  await expect(page).toHaveURL(/tableWidth=270/);

  const handleBox = await issueHandle.boundingBox();
  if (!handleBox) throw new Error("Table resize handle is not visible");
  await page.mouse.move(handleBox.x, handleBox.y + 8);
  await page.mouse.down();
  await page.mouse.move(handleBox.x + 30, handleBox.y + 8);
  await page.mouse.up();
  await expect(page.getByTestId("table-resize-output")).toHaveText("Last resize: 0:300");
  await expect(page).toHaveURL(/tableWidth=300/);

  issueHandle = page.getByRole("separator", { name: "Issue" });
  const resetHandleBox = await issueHandle.boundingBox();
  if (!resetHandleBox) throw new Error("Table reset handle is not visible");
  await page.mouse.dblclick(resetHandleBox.x, resetHandleBox.y + 8);
  await expect(page.getByTestId("table-resize-output")).toHaveText("Last resize: 0:-1");
  await expect(page).toHaveURL(/tableWidthPreset=auto/);
  await page.getByRole("button", { name: "Issue" }).click();
  await expect(page.getByRole("columnheader", { name: "Issue" })).toHaveAttribute(
    "aria-sort",
    "descending",
  );

  await page.getByRole("button", { name: "Open setup" }).click();
  await page.getByLabel("Show status row").check();
  await expect(page.getByRole("cell", { name: "No matching issues" })).toBeVisible();
  await page.getByRole("button", { name: "Share" }).click();
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
  expect(sharedUrl).toContain("/?component=table");

  const restoredContext = await browser.newContext({
    ignoreHTTPSErrors: true,
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const restoredPage = await restoredContext.newPage();
  await restoredPage.goto(sharedUrl);
  await restoredPage.getByRole("button", { name: "Open setup" }).click();
  await expect(restoredPage.getByLabel("Component or template")).toHaveValue("table");
  await expect(restoredPage.getByLabel("Minimum column width")).toHaveValue("100");
  await expect(restoredPage.getByLabel("Rows")).toHaveValue("3");
  await expect(restoredPage.getByLabel("Width preset")).toHaveValue("auto");
  await expect(restoredPage.getByLabel("Show status row")).toBeChecked();
  await restoredContext.close();

  await page.setViewportSize({ width: 320, height: 844 });
  await page.getByRole("button", { name: "Close setup" }).click();
  const scrollFrame = page.getByTestId("table-scroll-frame");
  expect(await scrollFrame.evaluate((element) => element.scrollWidth)).toBeGreaterThan(
    await scrollFrame.evaluate((element) => element.clientWidth),
  );
  await expect(table).toHaveCSS("min-width", "540px");
});

test("configures, shares, and restores the Status Indicator workbench", async ({
  browser,
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/evidence/status-indicator-server");
  await expect(page.getByRole("img", { name: "Server status" })).toBeAttached();

  await page.goto(
    "/?component=status-indicator&statusCount=0&statusLabeled=true&statusRole=status&statusVariant=promotion&theme=dark&viewport=mobile",
  );

  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "status-indicator",
  );
  await expect(page.getByRole("heading", { name: "Status Indicator", exact: true })).toBeVisible();
  const status = page.getByRole("status", { name: "Online" });
  await expect(status).toHaveCSS("width", "8px");
  await expect(status).toHaveCSS("height", "8px");
  expect(
    await status.evaluate((element) => ({
      fill: element.style.getPropertyValue("--status-fill"),
      iterations: element.style.getPropertyValue("--status-iterations"),
    })),
  ).toEqual({ fill: "forwards", iterations: "0" });
  expect(
    await status.evaluate((element) => ({
      dot: getComputedStyle(element, "::after").backgroundColor,
      pulse: getComputedStyle(element, "::before").backgroundColor,
    })),
  ).toEqual({
    dot: "rgb(255, 69, 168)",
    pulse: "rgba(248, 0, 120, 0.18)",
  });
  expect(
    await status.evaluate((element) => {
      const before = getComputedStyle(element, "::before");
      const after = getComputedStyle(element, "::after");
      return {
        activeAnimations: element.getAnimations().length,
        afterIterations: after.animationIterationCount,
        afterTransform: after.transform,
        beforeIterations: before.animationIterationCount,
        beforeTransform: before.transform,
      };
    }),
  ).toEqual({
    activeAnimations: 0,
    afterIterations: "0",
    afterTransform: "matrix(1, 0, 0, 1, 0, 0)",
    beforeIterations: "0",
    beforeTransform: "matrix(0.9, 0, 0, 0.9, 0, 0)",
  });
  await expect(page.getByTestId("status-indicator-state")).toHaveText("promotion, 0 iterations");

  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await status.evaluate((element) => {
      const before = getComputedStyle(element, "::before");
      const after = getComputedStyle(element, "::after");
      return {
        afterAnimation: after.animationName,
        afterTransform: after.transform,
        beforeAnimation: before.animationName,
        beforeOpacity: before.opacity,
        beforeTransform: before.transform,
      };
    }),
  ).toEqual({
    afterAnimation: "none",
    afterTransform: "none",
    beforeAnimation: "none",
    beforeOpacity: "0",
    beforeTransform: "matrix(1.25, 0, 0, 1.25, 0, 0)",
  });

  await page.getByRole("button", { name: "Open setup" }).click();
  await expect(page.getByLabel("Component or template")).toHaveValue("status-indicator");
  await expect(page.getByLabel("Status variant")).toHaveValue("promotion");
  await expect(page.getByLabel("Animation iterations")).toHaveValue("0");
  await expect(page.getByLabel("Status label")).toBeChecked();
  await expect(page.getByLabel("Status role")).toHaveValue("status");
  const variantControlBox = await page.getByLabel("Status variant").boundingBox();
  expect(variantControlBox?.height).toBeGreaterThanOrEqual(44);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  expect(
    await status.evaluate((element) => ({
      dot: getComputedStyle(element, "::after").backgroundColor,
      pulse: getComputedStyle(element, "::before").backgroundColor,
    })),
  ).toEqual({
    dot: "rgb(252, 92, 180)",
    pulse: "rgba(240, 0, 144, 0.1)",
  });

  await page.reload();
  await page.getByRole("button", { name: "Open setup" }).click();
  await expect(page.getByLabel("Status variant")).toHaveValue("promotion");
  await expect(page.getByLabel("Animation iterations")).toHaveValue("0");

  await page.getByRole("button", { name: "Reset" }).click();
  const decorativeStatus = page.getByTestId("status-indicator-preview");
  await expect(decorativeStatus).toHaveAttribute("aria-hidden", "true");
  expect(
    await decorativeStatus.evaluate((element) => ({
      fill: element.style.getPropertyValue("--status-fill"),
      iterations: element.style.getPropertyValue("--status-iterations"),
    })),
  ).toEqual({ fill: "none", iterations: "infinite" });
  await expect(page.getByLabel("Status variant")).toHaveValue("accent");

  await page.getByLabel("Status variant").selectOption("promotion");
  await page.getByLabel("Animation iterations").selectOption("0");
  await page.getByLabel("Status label").check();
  await page.getByRole("button", { name: "Share" }).click();
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
  expect(sharedUrl).toContain("/?component=status-indicator");

  const restoredContext = await browser.newContext({
    ignoreHTTPSErrors: true,
    permissions: ["clipboard-read", "clipboard-write"],
    viewport: { width: 320, height: 844 },
  });
  const restoredPage = await restoredContext.newPage();
  await restoredPage.goto(sharedUrl);
  await restoredPage.getByRole("button", { name: "Open setup" }).click();
  await expect(restoredPage.getByLabel("Status variant")).toHaveValue("promotion");
  await expect(restoredPage.getByLabel("Animation iterations")).toHaveValue("0");
  await expect(restoredPage.getByLabel("Status label")).toBeChecked();
  await restoredContext.close();

  await page.getByLabel("Component or template").selectOption("checkbox");
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "checkbox",
  );
  await page.goBack();
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "status-indicator",
  );
  await expect(page.getByLabel("Status variant")).toHaveValue("promotion");
  await expect(page.getByLabel("Animation iterations")).toHaveValue("0");
  await page.goForward();
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "checkbox",
  );
});

test("runs Reveal On Hover through pointer, keyboard, touch, history, and restore", async ({
  browser,
  page,
}) => {
  await page.goto(
    "/?component=reveal-on-hover&revealActions=true&revealCustom=true&revealInteractive=true&revealVisible=false",
  );

  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "reveal-on-hover",
  );
  await expect(page.getByRole("heading", { name: "Reveal On Hover", exact: true })).toBeVisible();
  const customRoot = page.getByTestId("reveal-custom-root");
  const action = page.getByRole("button", { name: "Reveal action" });
  const actionWrapper = action.locator("..");
  await expect(customRoot).toBeVisible();
  await expect(actionWrapper).toHaveCSS("opacity", "0");
  await customRoot.hover();
  await expect(actionWrapper).toHaveCSS("opacity", "1");
  await action.focus();
  await expect(action).toBeFocused();
  await expect(actionWrapper).toHaveCSS("opacity", "1");
  await action.click();
  await expect(page.getByTestId("reveal-clicks")).toHaveText("Clicks: 1");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(actionWrapper).toHaveCSS("transition-property", "none");
  await page.getByRole("button", { name: "Open setup" }).click();
  await expect(page.getByLabel("Component or template")).toHaveValue("reveal-on-hover");
  await expect(page.getByLabel("Custom root")).toBeChecked();
  await expect(page.getByLabel("Actions")).toBeChecked();
  await page.getByLabel("Visible").check();
  await expect(actionWrapper).toHaveAttribute("data-reveal-on-hover-visible", "");
  await page.getByLabel("Custom root").uncheck();
  await expect(page.getByTestId("reveal-flex-root")).toBeVisible();
  await page.getByLabel("Actions").uncheck();
  await expect(page.getByRole("button", { name: "Reveal action" })).toHaveCount(0);
  await page.getByLabel("Actions").check();

  await page.reload();
  await page.getByRole("button", { name: "Open setup" }).click();
  await expect(page.getByLabel("Visible")).toBeChecked();
  await expect(page.getByLabel("Custom root")).not.toBeChecked();
  await expect(page.getByLabel("Actions")).toBeChecked();
  await page.getByRole("button", { name: "Share" }).click();
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
  expect(sharedUrl).toContain("/?component=reveal-on-hover");

  const touchContext = await browser.newContext({
    hasTouch: true,
    ignoreHTTPSErrors: true,
    permissions: ["clipboard-read", "clipboard-write"],
    viewport: { width: 320, height: 844 },
  });
  const touchPage = await touchContext.newPage();
  const touchUrl = new URL(sharedUrl);
  touchUrl.searchParams.set("revealVisible", "false");
  touchUrl.searchParams.set("viewport", "mobile");
  await touchPage.goto(touchUrl.href);
  expect(await touchPage.evaluate(() => matchMedia("(hover: hover)").matches)).toBe(false);
  await expect(touchPage.getByRole("button", { name: "Reveal action" }).locator("..")).toHaveCSS(
    "opacity",
    "1",
  );
  await touchPage.getByRole("button", { name: "Reveal action" }).tap();
  await expect(touchPage.getByTestId("reveal-clicks")).toHaveText("Clicks: 1");
  await touchContext.close();

  await page.getByLabel("Component or template").selectOption("checkbox");
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "checkbox",
  );
  await page.goBack();
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "reveal-on-hover",
  );
  await expect(page.getByLabel("Visible")).toBeChecked();
  await page.goForward();
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "checkbox",
  );
});

test("runs Hotkey display and registration through URL, inputs, history, and restore", async ({
  browser,
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto(
    "/?component=hotkey&hotkeyEnabled=true&hotkeyIncludeInputs=false&hotkeySkipPreventDefault=false&hotkeyValue=mod%2Bshift%2B1&hotkeyVariant=debossed&theme=dark&viewport=mobile",
  );

  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "hotkey",
  );
  await expect(page.getByRole("heading", { name: "Hotkey", exact: true })).toBeVisible();
  const displayedHotkey = page.getByTestId("hotkey-display").locator(":scope > kbd");
  await expect(displayedHotkey).toHaveCSS("font-size", "12px");
  await expect(displayedHotkey).toHaveCSS("font-weight", "500");
  await expect(displayedHotkey).toHaveCSS("border-radius", "5px");
  await expect(displayedHotkey).toHaveCSS("border-top-width", "2px");
  await expect(displayedHotkey).toHaveCSS("border-bottom-width", "1px");
  await expect(displayedHotkey).toHaveCSS("color", "rgb(181, 176, 189)");
  await expect(displayedHotkey).toHaveCSS("background-color", "rgb(36, 32, 43)");

  async function dispatchShortcut(target: "document" | "input") {
    return page.evaluate((targetName) => {
      const target =
        targetName === "input"
          ? document.querySelector<HTMLInputElement>('[aria-label="Hotkey target input"]')
          : document;
      if (!target) throw new Error("Missing Hotkey event target");
      const init = {
        bubbles: true,
        cancelable: true,
        code: "Digit1",
        key: "!",
        shiftKey: true,
      };
      const metaResult = target.dispatchEvent(
        new KeyboardEvent("keydown", { ...init, metaKey: true }),
      );
      const controlResult = target.dispatchEvent(
        new KeyboardEvent("keydown", { ...init, ctrlKey: true }),
      );
      return { controlResult, metaResult };
    }, target);
  }

  const initialResult = await dispatchShortcut("document");
  expect(
    [initialResult.controlResult, initialResult.metaResult].filter((result) => !result),
  ).toHaveLength(1);
  await expect(page.getByTestId("hotkey-match-count")).toHaveText("Matches: 1");
  await expect(page.getByTestId("hotkey-prevented-state")).toHaveText("Prevented: true");

  await page.getByLabel("Hotkey target input").focus();
  await dispatchShortcut("input");
  await expect(page.getByTestId("hotkey-match-count")).toHaveText("Matches: 1");

  await page.getByRole("button", { name: "Open setup" }).click();
  await expect(page.getByLabel("Component or template")).toHaveValue("hotkey");
  await expect(page.getByLabel("Hotkey shortcut")).toHaveValue("mod+shift+1");
  await expect(page.getByLabel("Hotkey variant")).toHaveValue("debossed");
  await expect(page.getByLabel("Include text inputs")).not.toBeChecked();
  const shortcutBox = await page.getByLabel("Hotkey shortcut").boundingBox();
  expect(shortcutBox?.height).toBeGreaterThanOrEqual(44);

  await page.getByLabel("Include text inputs").check();
  await page.getByLabel("Hotkey target input").focus();
  await dispatchShortcut("input");
  await expect(page.getByTestId("hotkey-match-count")).toHaveText("Matches: 2");

  await page.getByRole("button", { name: "Open setup" }).click();
  await page.getByLabel("Skip prevent default").check();
  const skippedResult = await dispatchShortcut("document");
  expect(skippedResult.controlResult).toBe(true);
  expect(skippedResult.metaResult).toBe(true);
  await expect(page.getByTestId("hotkey-match-count")).toHaveText("Matches: 3");
  await expect(page.getByTestId("hotkey-prevented-state")).toHaveText("Prevented: false");

  await page.getByLabel("Hotkey enabled").uncheck();
  await dispatchShortcut("document");
  await expect(page.getByTestId("hotkey-match-count")).toHaveText("Matches: 3");
  await page.getByLabel("Hotkey enabled").check();

  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.getByLabel("Hotkey shortcut")).toHaveValue("mod+k");
  await expect(page.getByLabel("Hotkey variant")).toHaveValue("embossed");
  await expect(page.getByLabel("Hotkey enabled")).toBeChecked();
  await expect(page.getByLabel("Include text inputs")).not.toBeChecked();
  await expect(page.getByLabel("Skip prevent default")).not.toBeChecked();
  await expect(page.getByTestId("hotkey-match-count")).toHaveText("Matches: 0");
  await expect(page.getByTestId("hotkey-prevented-state")).toHaveText("Prevented: not tested");
  expect(
    await page.evaluate(() => Object.fromEntries(new URL(location.href).searchParams)),
  ).toEqual({
    component: "hotkey",
    hotkeyEnabled: "true",
    hotkeyIncludeInputs: "false",
    hotkeySkipPreventDefault: "false",
    hotkeyValue: "mod+k",
    hotkeyVariant: "embossed",
    theme: "light",
    viewport: "desktop",
  });

  await page.getByLabel("Hotkey shortcut").selectOption("mod+shift+1");
  await page.getByLabel("Hotkey variant").selectOption("debossed");
  await page.getByLabel("Include text inputs").check();
  await page.getByLabel("Skip prevent default").check();
  await page.getByLabel("Preview width").selectOption("mobile");
  await page.getByRole("button", { name: "Switch to dark theme" }).click();

  await page.reload();
  await page.getByRole("button", { name: "Open setup" }).click();
  await expect(page.getByLabel("Hotkey shortcut")).toHaveValue("mod+shift+1");
  await expect(page.getByLabel("Hotkey variant")).toHaveValue("debossed");
  await expect(page.getByLabel("Include text inputs")).toBeChecked();
  await expect(page.getByLabel("Skip prevent default")).toBeChecked();
  await expect(page.getByLabel("Preview width")).toHaveValue("mobile");
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.getByRole("button", { name: "Share" }).click();
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
  expect(sharedUrl).toContain("/?component=hotkey");

  const restoredContext = await browser.newContext({
    ignoreHTTPSErrors: true,
    permissions: ["clipboard-read", "clipboard-write"],
    viewport: { width: 320, height: 844 },
  });
  const restoredPage = await restoredContext.newPage();
  await restoredPage.goto(sharedUrl);
  await restoredPage.getByRole("button", { name: "Open setup" }).click();
  await expect(restoredPage.getByLabel("Component or template")).toHaveValue("hotkey");
  await expect(restoredPage.getByLabel("Hotkey shortcut")).toHaveValue("mod+shift+1");
  await expect(restoredPage.getByLabel("Hotkey variant")).toHaveValue("debossed");
  await expect(restoredPage.getByLabel("Include text inputs")).toBeChecked();
  await expect(restoredPage.getByLabel("Skip prevent default")).toBeChecked();
  await restoredContext.close();

  await page.getByLabel("Component or template").selectOption("checkbox");
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "checkbox",
  );
  await page.goBack();
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "hotkey",
  );
  await expect(page.getByLabel("Hotkey shortcut")).toHaveValue("mod+shift+1");
  await expect(page.getByLabel("Include text inputs")).toBeChecked();
  await page.goForward();
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "checkbox",
  );
});

test("keeps the playground and page-frame navigation usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/templates/checkbox-settings");
  await expect(page.getByTestId("layout-stack-separator-proof")).toHaveAttribute(
    "aria-orientation",
    "horizontal",
  );

  const collapsedIslandBox = await page.locator('[data-slot="playground-island"]').boundingBox();
  expect(collapsedIslandBox?.width).toBeLessThanOrEqual(56);
  await page.getByRole("button", { name: "Open setup" }).click();
  const sectionControlBox = await page.getByLabel("Component or template").boundingBox();
  expect(sectionControlBox?.width).toBeGreaterThan(100);
  expect(sectionControlBox?.height).toBeGreaterThanOrEqual(44);
  await expect(page.getByLabel("Component or template")).toHaveCSS("font-size", "16px");
  await page.getByLabel("Preview width").selectOption("mobile");
  const island = page.locator('[data-slot="playground-island"]');
  const islandBox = await island.boundingBox();
  const setupBox = await page.locator("#playground-setup").boundingBox();
  const toolbarBox = await page.locator('[data-slot="playground-toolbar"]').boundingBox();
  const pageFrameBox = await page.locator('[data-slot="sentry-page-frame"]').boundingBox();

  expect(islandBox?.x).toBeGreaterThanOrEqual(8);
  expect(islandBox?.width).toBeLessThanOrEqual(304);
  expect((setupBox?.y ?? 0) + (setupBox?.height ?? 0)).toBeLessThanOrEqual(toolbarBox?.y ?? 0);
  expect(pageFrameBox?.x).toBe(0);
  expect(pageFrameBox?.width).toBe(320);
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-viewport",
    "mobile",
  );

  await expect(page.getByLabel("Label")).toBeVisible();
  await page.getByLabel("Label").focus();
  await page.getByRole("heading", { name: "Checkbox setup" }).click();
  await expect(page.getByLabel("Label")).toBeVisible();
  await page.getByRole("heading", { name: "Notification Settings" }).click();
  await expect(page.getByLabel("Label")).toBeHidden();

  await page.getByRole("button", { name: "Open setup" }).click();
  await page.getByRole("button", { name: "Collapse setup" }).press("Tab");
  await expect(page.getByLabel("Label")).toBeHidden();
  const trigger = page.getByRole("button", { name: "Open navigation" });
  await expect(trigger).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
  await expect(page.getByLabel("Label")).toBeHidden();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeHidden();
  await expect(trigger).toBeFocused();

  await page.getByRole("button", { name: "Open setup" }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByLabel("Label")).toBeHidden();
  await expect(page.getByRole("button", { name: "Open setup" })).toBeFocused();
});

test("restores every workbench state when navigating Back and Forward", async ({ page }) => {
  await page.goto(
    "/?component=checkbox&checked=true&disabled=true&items=new-issues%2Cissue-status&label=Back+state&selected=issue-status&size=md&theme=dark&viewport=mobile",
  );
  await page.getByRole("button", { name: "Open setup" }).click();
  await page.getByLabel("Component or template").selectOption("drag-handle");
  await expect(page.getByRole("heading", { name: "Drag Handle", exact: true })).toBeVisible();
  await page.getByLabel("Orientation").selectOption("vertical");
  await page.getByLabel("Variant").selectOption("ghost");
  await page.getByLabel("Value").fill("150");

  await page.goBack();
  await expect(page).toHaveURL(/component=checkbox/);
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "checkbox",
  );
  await expect(page.getByRole("heading", { name: "Notification Settings" })).toBeVisible();
  await expect(page.getByLabel("Component or template")).toHaveValue("checkbox");
  await expect(page.getByLabel("Size")).toHaveValue("md");
  await expect(page.getByLabel("Label")).toHaveValue("Back state");
  await expect(page.getByLabel("Disabled")).toBeChecked();
  await expect(page.getByLabel("Preview width")).toHaveValue("mobile");
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.locator("form label")).toHaveText(["Back state", "Issue status changes"]);

  await page.goForward();
  await expect(page).toHaveURL(/component=drag-handle/);
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "drag-handle",
  );
  await expect(page.getByRole("heading", { name: "Drag Handle", exact: true })).toBeVisible();
  await expect(page.getByLabel("Component or template")).toHaveValue("drag-handle");
  await expect(page.getByLabel("Orientation")).toHaveValue("vertical");
  await expect(page.getByLabel("Variant")).toHaveValue("ghost");
  await expect(page.getByLabel("Value")).toHaveValue("150");
  await expect(page.getByLabel("Preview width")).toHaveValue("mobile");
  await expect(page.locator("html")).toHaveClass(/dark/);
});

test("restores the system theme when history has no theme override", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/?component=checkbox");
  await page.getByRole("button", { name: "Open setup" }).click();
  const themeButton = page.getByRole("button", {
    name: /Switch to (dark|light) theme/,
  });

  await expect(page).not.toHaveURL(/theme=/);
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await expect(themeButton).toHaveAccessibleName("Switch to dark theme");

  await page.evaluate(() => {
    window.history.pushState(null, "", "/?component=checkbox&theme=dark");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(themeButton).toHaveAccessibleName("Switch to light theme");

  await page.evaluate(() => {
    window.history.pushState(null, "", "/?component=checkbox&theme=light");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await expect(themeButton).toHaveAccessibleName("Switch to dark theme");

  await page.goBack();
  await expect(page).toHaveURL(/theme=dark/);
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(themeButton).toHaveAccessibleName("Switch to light theme");

  await page.goBack();
  await expect(page).not.toHaveURL(/theme=/);
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await expect(themeButton).toHaveAccessibleName("Switch to dark theme");

  await page.goForward();
  await expect(page).toHaveURL(/theme=dark/);
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(themeButton).toHaveAccessibleName("Switch to light theme");

  await page.goForward();
  await expect(page).toHaveURL(/theme=light/);
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await expect(themeButton).toHaveAccessibleName("Switch to dark theme");
});

test("keeps a horizontal maximum usable at a 320px viewport", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/?component=drag-handle&dragHandleOrientation=horizontal&dragHandleSize=320");

  const handle = page.getByRole("separator", {
    name: "Adjust drag pane width",
  });
  await expect
    .poll(async () => Number(await handle.getAttribute("aria-valuemax")))
    .toBeLessThan(320);
  const effectiveMaximum = Number(await handle.getAttribute("aria-valuemax"));
  expect(effectiveMaximum).toBeGreaterThanOrEqual(100);
  await expect(handle).toHaveAttribute("aria-valuenow", String(effectiveMaximum));
  await expect(page).toHaveURL(new RegExp(`dragHandleSize=${effectiveMaximum}`));

  const frameBox = await page.getByTestId("drag-handle-frame").boundingBox();
  const handleBox = await handle.boundingBox();
  const flexiblePaneBox = await page.getByTestId("drag-handle-flexible-pane").boundingBox();
  if (!frameBox || !handleBox || !flexiblePaneBox)
    throw new Error("Responsive drag panes are not visible");
  expect(handleBox.x).toBeGreaterThan(0);
  expect(handleBox.x).toBeLessThan(320);
  expect(flexiblePaneBox.width).toBeGreaterThanOrEqual(64);
  expect(flexiblePaneBox.x).toBeGreaterThanOrEqual(frameBox.x);
  expect(flexiblePaneBox.x + flexiblePaneBox.width).toBeLessThanOrEqual(
    frameBox.x + frameBox.width,
  );

  await handle.focus();
  await page.keyboard.press("ArrowLeft");
  const horizontalValue = effectiveMaximum - 10;
  await expect(handle).toHaveAttribute("aria-valuenow", String(horizontalValue));
  await expect(page).toHaveURL(new RegExp(`dragHandleSize=${horizontalValue}`));

  await page.evaluate(() => {
    window.history.pushState(
      null,
      "",
      "/?component=drag-handle&dragHandleOrientation=vertical&dragHandleSize=300",
    );
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  let restoredHandle = page.getByRole("separator", {
    name: "Adjust drag pane height",
  });
  await expect(restoredHandle).toHaveAttribute("aria-valuemax", "320");
  await expect(restoredHandle).toHaveAttribute("aria-valuenow", "300");

  await page.goBack();
  restoredHandle = page.getByRole("separator", {
    name: "Adjust drag pane width",
  });
  await expect(restoredHandle).toHaveAttribute("aria-valuemax", String(effectiveMaximum));
  await expect(restoredHandle).toHaveAttribute("aria-valuenow", String(horizontalValue));

  await page.goForward();
  restoredHandle = page.getByRole("separator", {
    name: "Adjust drag pane height",
  });
  await expect(restoredHandle).toHaveAttribute("aria-valuemax", "320");
  await expect(restoredHandle).toHaveAttribute("aria-valuenow", "300");
  await expect(page).toHaveURL(/dragHandleSize=300/);
});

test("configures, shares, restores, drags, and arrows the Drag Handle workbench", async ({
  browser,
  page,
}) => {
  await page.goto("/?component=drag-handle");
  await expect(page.getByRole("heading", { name: "Drag Handle", exact: true })).toBeVisible();
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "drag-handle",
  );

  await page.getByRole("button", { name: "Open setup" }).click();
  const componentSelect = page.getByLabel("Component or template");
  await expect(componentSelect).toHaveValue("drag-handle");
  await expect(componentSelect.locator('option[value="checkbox"]')).toHaveText("Checkbox");
  await expect(componentSelect.locator('option[value="drag-handle"]')).toHaveText("Drag Handle");
  await expect(page.locator('[data-slot="playground-island"]')).toHaveCSS("z-index", "10000");
  await expect(page.getByRole("heading", { name: "Drag Handle setup" })).toBeVisible();
  await expect(page.getByLabel("Orientation")).toHaveValue("horizontal");
  await expect(page.getByLabel("Variant")).toHaveValue("solid");
  await expect(page.getByLabel("Value")).toHaveValue("180");

  let handle = page.getByRole("separator", { name: "Adjust drag pane width" });
  await expect(handle).toHaveAttribute("aria-orientation", "vertical");
  await expect(handle).toHaveAttribute("aria-valuemin", "100");
  await expect(handle).toHaveAttribute("aria-valuemax", "320");
  await expect(page.getByTestId("drag-handle-size")).toHaveText("Sized pane width: 180px");
  await expect(handle).toHaveCSS("border-left-width", "1px");
  expect(await handle.evaluate((element) => getComputedStyle(element, "::before").width)).toBe(
    "24px",
  );
  expect(await handle.evaluate((element) => getComputedStyle(element, "::after").width)).toBe(
    "4px",
  );
  expect(await handle.evaluate((element) => getComputedStyle(element, "::before").cursor)).toBe(
    "ew-resize",
  );

  await page.getByLabel("Orientation").selectOption("vertical");
  await page.getByLabel("Variant").selectOption("ghost");
  await page.getByLabel("Value").fill("160");
  await expect(page).toHaveURL(/component=drag-handle/);
  await expect(page).toHaveURL(/dragHandleOrientation=vertical/);
  await expect(page).toHaveURL(/dragHandleVariant=ghost/);
  await expect(page).toHaveURL(/dragHandleSize=160/);
  await expect(page.getByRole("button", { name: "Share" })).toBeVisible();
  await page.getByRole("button", { name: "Share" }).click();
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
  expect(sharedUrl).toContain("/?component=drag-handle");
  expect(sharedUrl).not.toContain("/templates/checkbox-settings");

  const restoredContext = await browser.newContext({
    ignoreHTTPSErrors: true,
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const restoredPage = await restoredContext.newPage();
  await restoredPage.goto(sharedUrl);
  await restoredPage.getByRole("button", { name: "Open setup" }).click();
  await expect(restoredPage.getByLabel("Component or template")).toHaveValue("drag-handle");
  await expect(restoredPage.getByLabel("Orientation")).toHaveValue("vertical");
  await expect(restoredPage.getByLabel("Variant")).toHaveValue("ghost");
  await expect(restoredPage.getByLabel("Value")).toHaveValue("160");
  await restoredPage.getByRole("button", { name: "Close setup" }).click();

  handle = restoredPage.getByRole("separator", {
    name: "Adjust drag pane height",
  });
  await expect(handle).toHaveAttribute("aria-orientation", "horizontal");
  await expect(handle).toHaveAttribute("data-orientation", "vertical");
  await expect(handle).toHaveAttribute("data-variant", "ghost");
  await expect(restoredPage.getByTestId("drag-handle-size")).toHaveText("Sized pane height: 160px");
  await expect(handle).toHaveCSS("border-top-width", "1px");
  expect(await handle.evaluate((element) => getComputedStyle(element, "::before").height)).toBe(
    "24px",
  );
  expect(await handle.evaluate((element) => getComputedStyle(element, "::after").height)).toBe(
    "4px",
  );
  expect(await handle.evaluate((element) => getComputedStyle(element, "::before").cursor)).toBe(
    "ns-resize",
  );

  const box = await handle.boundingBox();
  if (!box) throw new Error("Drag handle is not visible");
  const initialAccent = await handle.evaluate(
    (element) => getComputedStyle(element, "::after").backgroundColor,
  );
  await restoredPage.mouse.move(box.x + 24, box.y);
  const hoveredAccent = await handle.evaluate(
    (element) => getComputedStyle(element, "::after").backgroundColor,
  );
  expect(hoveredAccent).not.toBe(initialAccent);
  await restoredPage.mouse.down();
  await restoredPage.mouse.move(box.x + 24, box.y + 25);
  await restoredPage.mouse.up();
  await expect(restoredPage.getByTestId("drag-handle-size")).toHaveText("Sized pane height: 185px");

  await handle.focus();
  await restoredPage.keyboard.press("ArrowUp");
  await expect(handle).toHaveCSS("outline-width", "2px");
  expect(await handle.evaluate((element) => element.matches(":focus-visible"))).toBe(true);
  await restoredPage.keyboard.press("Shift+ArrowDown");
  await expect(restoredPage.getByTestId("drag-handle-size")).toHaveText("Sized pane height: 225px");
  await expect(restoredPage).toHaveURL(/dragHandleSize=225/);

  await restoredPage.getByRole("button", { name: "Open setup" }).click();
  await restoredPage.getByRole("button", { name: "Reset" }).click();
  await expect(restoredPage.getByLabel("Component or template")).toHaveValue("drag-handle");
  await expect(restoredPage.getByLabel("Orientation")).toHaveValue("horizontal");
  await expect(restoredPage.getByLabel("Variant")).toHaveValue("solid");
  await expect(restoredPage.getByLabel("Value")).toHaveValue("180");
  await expect(restoredPage).toHaveURL(/component=drag-handle/);
  await restoredContext.close();
});

test("runs the Split Panel workbench from URL through resize and restore", async ({
  browser,
  page,
}) => {
  await page.goto("/?component=split-panel");
  await page.getByRole("button", { name: "Open setup" }).click();
  await expect(page.getByRole("spinbutton", { name: "Default size", exact: true })).toHaveValue(
    "200",
  );
  await expect(page.getByLabel("Initial size")).toHaveValue("200");
  await expect(page.getByLabel("Minimum size")).toHaveValue("100");
  await expect(page.getByLabel("Fill minimum")).toHaveValue("120");
  await expect(page.getByLabel("Maximum", { exact: true })).toHaveValue("container");

  await page.goto(
    "/?component=split-panel&splitPanelDefaultSize=220&splitPanelFillMinSize=80&splitPanelHasFill=true&splitPanelInitialSize=240&splitPanelMaxSize=400&splitPanelMinSize=100&splitPanelOrientation=horizontal&splitPanelPlacement=start&theme=dark&viewport=desktop",
  );
  await expect(page.getByRole("heading", { name: "Split Panel", exact: true })).toBeVisible();
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "split-panel",
  );
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.getByRole("button", { name: "Open setup" }).click();
  await expect(page.getByLabel("Component or template")).toHaveValue("split-panel");
  await expect(page.getByLabel("Orientation")).toHaveValue("horizontal");
  await expect(page.getByLabel("Placement")).toHaveValue("start");
  await expect(page.getByRole("spinbutton", { name: "Default size", exact: true })).toHaveValue(
    "220",
  );
  await expect(page.getByLabel("Initial size")).toHaveValue("240");
  await expect(page.getByLabel("Minimum size")).toHaveValue("100");
  await expect(page.getByLabel("Fill minimum")).toHaveValue("80");
  await expect(page.getByLabel("Maximum", { exact: true })).toHaveValue("fixed");
  await expect(page.getByLabel("Maximum size")).toHaveValue("400");
  await expect(page.getByLabel("Include fill pane")).toBeChecked();
  await page.getByLabel("Initial size").fill("260");
  await expect(page.getByRole("separator", { name: "Resize panels" })).toHaveAttribute(
    "aria-valuenow",
    "260",
  );
  await expect(page).toHaveURL(/splitPanelInitialSize=260/);
  await page.getByRole("button", { name: "Close setup" }).click();
  await page.reload();

  let separator = page.getByRole("separator", { name: "Resize panels" });
  await expect(separator).toHaveAttribute("aria-valuenow", "260");
  await expect(separator).toHaveAttribute("aria-valuemin", "100");
  await expect(separator).toHaveAttribute("aria-valuemax", "400");
  await separator.focus();
  await page.keyboard.press("ArrowRight");
  await expect(separator).toHaveAttribute("aria-valuenow", "270");
  await expect(page).toHaveURL(/splitPanelInitialSize=270/);
  await page.keyboard.press("Shift+ArrowRight");
  await expect(separator).toHaveAttribute("aria-valuenow", "320");
  await page.keyboard.press("Home");
  await expect(separator).toHaveAttribute("aria-valuenow", "100");
  await page.keyboard.press("End");
  await expect(separator).toHaveAttribute("aria-valuenow", "400");
  await separator.dblclick();
  await expect(separator).toHaveAttribute("aria-valuenow", "220");
  await expect(page).toHaveURL(/splitPanelInitialSize=220/);

  const separatorBox = await separator.boundingBox();
  if (!separatorBox) throw new Error("Split Panel separator is not visible");
  await page.mouse.move(separatorBox.x, separatorBox.y + separatorBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(separatorBox.x + 24, separatorBox.y + separatorBox.height / 2);
  await page.mouse.up();
  await expect(separator).toHaveAttribute("aria-valuenow", "244");
  await expect(page).toHaveURL(/splitPanelInitialSize=244/);

  await separator.dispatchEvent("pointerdown", {
    button: 0,
    clientX: separatorBox.x,
    clientY: separatorBox.y,
    isPrimary: true,
    pointerId: 7,
    pointerType: "touch",
  });
  await page.evaluate(
    ({ x, y }) => {
      document.dispatchEvent(
        new PointerEvent("pointermove", {
          bubbles: true,
          cancelable: true,
          clientX: x + 16,
          clientY: y,
          isPrimary: true,
          pointerId: 7,
          pointerType: "touch",
        }),
      );
      document.dispatchEvent(
        new PointerEvent("pointerup", {
          bubbles: true,
          cancelable: true,
          clientX: x + 16,
          clientY: y,
          isPrimary: true,
          pointerId: 7,
          pointerType: "touch",
        }),
      );
    },
    { x: separatorBox.x, y: separatorBox.y },
  );
  await expect(separator).toHaveAttribute("aria-valuenow", "260");
  await expect(page).toHaveURL(/splitPanelInitialSize=260/);

  await page.getByRole("button", { name: "Open setup" }).click();
  await page.getByLabel("Placement").selectOption("end");
  await page.getByRole("button", { name: "Close setup" }).click();
  separator = page.getByRole("separator", { name: "Resize panels" });
  await expect(separator).toHaveAttribute("aria-valuenow", "260");
  await separator.focus();
  await page.keyboard.press("ArrowRight");
  await expect(separator).toHaveAttribute("aria-valuenow", "250");
  await page.getByRole("button", { name: "Set default size" }).click();
  await expect(separator).toHaveAttribute("aria-valuenow", "220");

  await page.getByRole("button", { name: "Open setup" }).click();
  await page.getByRole("button", { name: "Share" }).click();
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
  expect(sharedUrl).toContain("/?component=split-panel");
  expect(sharedUrl).not.toContain("checked=");
  expect(sharedUrl).not.toContain("dragHandle");

  const restoredContext = await browser.newContext({
    ignoreHTTPSErrors: true,
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const restoredPage = await restoredContext.newPage();
  await restoredPage.goto(sharedUrl);
  await restoredPage.getByRole("button", { name: "Open setup" }).click();
  await expect(restoredPage.getByLabel("Placement")).toHaveValue("end");
  await expect(restoredPage.getByLabel("Initial size")).toHaveValue("250");
  await restoredPage.getByRole("button", { name: "Reset" }).click();
  await expect(restoredPage.getByLabel("Orientation")).toHaveValue("horizontal");
  await expect(restoredPage.getByLabel("Placement")).toHaveValue("start");
  await expect(restoredPage.getByLabel("Initial size")).toHaveValue("200");
  await expect(restoredPage.getByLabel("Maximum")).toHaveValue("container");
  await expect(restoredPage).toHaveURL(/component=split-panel/);
  await restoredContext.close();
});

test("resets a mounted Split Panel without changing direction", async ({ page }) => {
  await page.goto(
    "/?component=split-panel&splitPanelDefaultSize=200&splitPanelFillMinSize=120&splitPanelHasFill=true&splitPanelInitialSize=260&splitPanelMaxSize=container&splitPanelMinSize=100&splitPanelOrientation=horizontal&splitPanelPlacement=start",
  );
  const separator = page.getByRole("separator", { name: "Resize panels" });
  await expect(separator).toHaveAttribute("aria-valuenow", "260");
  await separator.focus();
  await page.keyboard.press("ArrowRight");
  await expect(separator).toHaveAttribute("aria-valuenow", "270");
  await expect(page).toHaveURL(/splitPanelInitialSize=270/);

  await page.getByRole("button", { name: "Open setup" }).click();
  await expect(page.getByLabel("Orientation")).toHaveValue("horizontal");
  await expect(page.getByLabel("Placement")).toHaveValue("start");
  await page.getByRole("button", { name: "Reset" }).click();

  await expect(page.getByRole("spinbutton", { name: "Default size", exact: true })).toHaveValue(
    "200",
  );
  await expect(page.getByLabel("Initial size")).toHaveValue("200");
  await expect(page.getByLabel("Orientation")).toHaveValue("horizontal");
  await expect(page.getByLabel("Placement")).toHaveValue("start");
  await expect(separator).toHaveAttribute("aria-valuenow", "200");
  await expect(page).toHaveURL(/splitPanelInitialSize=200/);
  await expect(page).toHaveURL(/splitPanelOrientation=horizontal/);
  await expect(page).toHaveURL(/splitPanelPlacement=start/);
});

test("keeps Split Panel valid and contained at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto(
    "/?component=split-panel&splitPanelDefaultSize=bad&splitPanelFillMinSize=-10&splitPanelHasFill=true&splitPanelInitialSize=bad&splitPanelMaxSize=invalid&splitPanelMinSize=100&splitPanelOrientation=sideways&splitPanelPlacement=middle",
  );
  const island = page.locator('[data-slot="playground-island"]');
  const separator = page.getByRole("separator", { name: "Resize panels" });
  await expect(separator).toHaveAttribute("aria-valuenow", "200");
  await expect
    .poll(async () => Number(await separator.getAttribute("aria-valuemax")))
    .toBeGreaterThanOrEqual(200);
  await page.getByRole("button", { name: "Open setup" }).click();
  await expect(page.getByLabel("Orientation")).toHaveValue("horizontal");
  await expect(page.getByLabel("Placement")).toHaveValue("start");
  await expect(page.getByRole("spinbutton", { name: "Default size", exact: true })).toHaveValue(
    "200",
  );
  await expect(page.getByLabel("Fill minimum")).toHaveValue("0");
  await expect(page.getByLabel("Maximum", { exact: true })).toHaveValue("container");
  const islandBox = await island.boundingBox();
  const frameBox = await page.getByTestId("split-panel-frame").boundingBox();
  if (!islandBox || !frameBox) throw new Error("Split Panel mobile frame is not visible");
  expect(islandBox.x).toBeGreaterThanOrEqual(8);
  expect(islandBox.width).toBeLessThanOrEqual(304);
  expect(frameBox.x).toBeGreaterThanOrEqual(0);
  expect(frameBox.x + frameBox.width).toBeLessThanOrEqual(320);

  await page.getByLabel("Component or template").selectOption("checkbox");
  await expect(page).toHaveURL(/component=checkbox/);
  await page.goBack();
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "split-panel",
  );
  await expect(page.getByLabel("Orientation")).toHaveValue("horizontal");
  await page.goForward();
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "checkbox",
  );
});

test("configures, restores, and falls back in the Image workbench", async ({ browser, page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/evidence/image-server");
  await expect(page.getByRole("img", { name: "Server image" })).toBeAttached();

  await page.goto(
    "/?component=image&imageAspectRatio=1+%2F+1&imageFit=contain&imagePosition=top&imageRadius=full&imageLoading=eager&imageResponsive=responsive&imageBroken=true",
  );
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "image",
  );
  const image = page.getByTestId("image-preview");
  await expect(image).toHaveCSS("object-fit", "contain");
  await expect(image).toHaveCSS("object-position", "50% 0%");
  await expect(image).toHaveCSS("border-radius", "999px");
  await expect(image).toHaveAttribute("loading", "eager");
  await expect(image).toHaveCSS("height", "180px");
  expect(
    await image.evaluate((element) => {
      const parent = element.parentElement;
      if (!parent) return false;
      const parentStyle = getComputedStyle(parent);
      const contentWidth =
        parent.clientWidth -
        Number.parseFloat(parentStyle.paddingLeft) -
        Number.parseFloat(parentStyle.paddingRight);
      return Math.abs(element.getBoundingClientRect().width - contentWidth) < 1;
    }),
  ).toBe(true);

  await page.setViewportSize({ width: 1200, height: 900 });
  await expect(image).toHaveCSS("width", "480px");
  await expect(image).toHaveCSS("height", "280px");
  await image.evaluate((element) => element.dispatchEvent(new Event("error")));
  await expect(page.getByTestId("image-fallback-state")).toHaveText("Fallback: true");
  await page.getByRole("button", { name: "Open setup" }).click();
  await expect(page.getByLabel("Responsive preset")).toHaveValue("responsive");
  await page.getByLabel("Broken image").uncheck();
  await page.getByRole("button", { name: "Share" }).click();
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
  expect(sharedUrl).toContain("/?component=image");

  const restoredContext = await browser.newContext({
    ignoreHTTPSErrors: true,
    permissions: ["clipboard-read", "clipboard-write"],
    viewport: { width: 320, height: 844 },
  });
  const restoredPage = await restoredContext.newPage();
  await restoredPage.goto(sharedUrl);
  await restoredPage.getByRole("button", { name: "Open setup" }).click();
  await expect(restoredPage.getByLabel("Object fit")).toHaveValue("contain");
  await expect(restoredPage.getByLabel("Radius")).toHaveValue("full");
  await restoredContext.close();

  await page.getByLabel("Component or template").selectOption("checkbox");
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "checkbox",
  );
  await page.goBack();
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "image",
  );
  await expect(page.getByLabel("Aspect ratio")).toHaveValue("1 / 1");
  await expect(page.getByLabel("Object fit")).toHaveValue("contain");
  await expect(page.getByLabel("Object position")).toHaveValue("top");
  await expect(page.getByLabel("Radius")).toHaveValue("full");
  await expect(page.getByLabel("Loading")).toHaveValue("eager");
  await expect(page.getByLabel("Responsive preset")).toHaveValue("responsive");
  await expect(page.getByLabel("Broken image")).not.toBeChecked();
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.getByLabel("Aspect ratio")).toHaveValue("16 / 9");
  await expect(page.getByLabel("Object fit")).toHaveValue("cover");
  await expect(page.getByLabel("Object position")).toHaveValue("center");
  await expect(page.getByLabel("Radius")).toHaveValue("md");
  await expect(page.getByLabel("Loading")).toHaveValue("lazy");
  await expect(page.getByLabel("Responsive preset")).toHaveValue("fixed");
  await expect(page.getByLabel("Broken image")).not.toBeChecked();
  await expect(page.getByTestId("image-fallback-state")).toHaveText("Fallback: false");
  expect(
    await page.evaluate(() =>
      Object.fromEntries(
        [...new URL(location.href).searchParams.entries()].filter(([key]) =>
          key.startsWith("image"),
        ),
      ),
    ),
  ).toEqual({
    imageAspectRatio: "16 / 9",
    imageBroken: "false",
    imageFit: "cover",
    imageLoading: "lazy",
    imagePosition: "center",
    imageRadius: "md",
    imageResponsive: "fixed",
  });
});

test("configures, animates, shares, and restores the Backdrop workbench", async ({
  browser,
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto(
    "/?component=backdrop&backdropLayer=drawer&backdropVisible=true&theme=dark&viewport=mobile",
  );

  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "backdrop",
  );
  const backdrop = page.getByTestId("backdrop-preview").last();
  await expect(backdrop).toHaveCSS("position", "fixed");
  await expect(backdrop).toHaveCSS("inset", "0px");
  await expect(backdrop).toHaveCSS("z-index", "9999");
  await expect(backdrop).toHaveCSS("background-color", "rgba(16, 8, 32, 0.5)");
  await expect(backdrop).toHaveCSS("opacity", "1");
  await backdrop.click({ position: { x: 4, y: 4 } });
  await expect(page.getByTestId("backdrop-dismissals")).toHaveText("Dismissals: 1");
  await expect(backdrop).toHaveCount(0);
  const showBackdrop = page.getByRole("button", { name: "Show backdrop" });
  await showBackdrop.focus();
  await page.keyboard.press("Enter");
  await expect(backdrop).toHaveCount(1);
  const dismissBackdrop = page.getByRole("button", {
    name: "Dismiss backdrop",
  });
  await dismissBackdrop.focus();
  await page.keyboard.press("Space");
  await expect(backdrop).toHaveCount(0);
  await expect(page.getByTestId("backdrop-dismissals")).toHaveText("Dismissals: 2");

  await page.getByRole("button", { name: "Open setup" }).click();
  await expect(page.getByLabel("Component or template")).toHaveValue("backdrop");
  await expect(page.getByLabel("Backdrop layer")).toHaveValue("drawer");
  await expect(page.getByLabel("Backdrop visible")).not.toBeChecked();
  await page.getByLabel("Backdrop visible").check();
  await page.getByLabel("Backdrop layer").selectOption("modal");
  await expect(backdrop).toHaveCSS("z-index", "10000");
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await expect(backdrop).toHaveCSS("background-color", "rgba(16, 8, 40, 0.27)");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByLabel("Backdrop visible").uncheck();
  await expect(backdrop).toHaveCount(0);
  await page.getByLabel("Backdrop visible").check();
  await expect(page.getByTestId("backdrop-preview")).toHaveCSS("opacity", "1");

  await page.getByRole("button", { name: "Share" }).click();
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
  expect(sharedUrl).toContain("/?component=backdrop");

  const restoredContext = await browser.newContext({
    ignoreHTTPSErrors: true,
    permissions: ["clipboard-read", "clipboard-write"],
    viewport: { width: 320, height: 844 },
  });
  const restoredPage = await restoredContext.newPage();
  await restoredPage.goto(sharedUrl);
  await restoredPage.getByRole("button", { name: "Open setup" }).click();
  await expect(restoredPage.getByLabel("Backdrop layer")).toHaveValue("modal");
  await expect(restoredPage.getByLabel("Backdrop visible")).toBeChecked();
  await expect(restoredPage.locator("html")).not.toHaveClass(/dark/);
  await restoredContext.close();

  await page.getByLabel("Component or template").selectOption("checkbox");
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "checkbox",
  );
  await page.goBack();
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "backdrop",
  );
  await expect(page.getByLabel("Backdrop layer")).toHaveValue("modal");
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.getByLabel("Backdrop layer")).toHaveValue("modal");
  await expect(page.getByLabel("Backdrop visible")).toBeChecked();
  await expect(page.getByTestId("backdrop-dismissals")).toHaveText("Dismissals: 0");
  expect(
    await page.evaluate(() =>
      Object.fromEntries(
        [...new URL(location.href).searchParams.entries()].filter(([key]) =>
          key.startsWith("backdrop"),
        ),
      ),
    ),
  ).toEqual({ backdropLayer: "modal", backdropVisible: "true" });
});

test("configures, highlights, copies, shares, and restores the Code workbench", async ({
  browser,
  page,
}) => {
  await page.goto(
    "/?component=code&codeCopyButton=true&codeDark=false&codeHeader=filename&codeInlineVariant=accent&codeLanguage=typescript&codeLineHighlight=true&codeMode=block&codeRounded=true&codeSelectable=true&codeSelectedTab=invalid&codeValue=const+answer%3A+number+%3D+42%3B",
  );

  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "code",
  );
  await expect(page.locator(".token.keyword")).toHaveText("const");
  const codeBlock = page.locator("[data-code-block]");
  await expect(codeBlock).toHaveCSS("background-color", "rgb(248, 248, 249)");
  await expect(codeBlock.locator("pre")).toHaveCSS("color", "rgb(48, 46, 54)");
  await expect(codeBlock.locator("code")).toHaveCSS("user-select", "auto");
  await expect(codeBlock.locator(".line-highlight")).toHaveCount(1);

  const copyButton = page.getByRole("button", { name: "Copy snippet" });
  await expect(copyButton).toHaveCSS("width", "28px");
  await expect(copyButton).toHaveCSS("height", "28px");
  await expect(copyButton).toHaveCSS("border-radius", "5px");
  await expect(copyButton.locator("svg")).toHaveAttribute("width", "12");
  await expect(copyButton.locator("svg")).toHaveAttribute("height", "12");
  await copyButton.focus();
  await expect(copyButton).toHaveCSS(
    "box-shadow",
    "rgb(255, 255, 255) 0px 0px 0px 0px, rgb(117, 83, 255) 0px 0px 0px 2px",
  );
  const focusedCopyTooltip = page.getByRole("tooltip", { name: "Copy" });
  await expect(focusedCopyTooltip).toBeHidden();
  await page.waitForTimeout(300);
  await expect(focusedCopyTooltip).toBeHidden();
  await expect(focusedCopyTooltip).toBeVisible();
  await copyButton.evaluate((element) => element.blur());
  await page.waitForTimeout(100);
  await expect(focusedCopyTooltip).toBeVisible();
  await expect(focusedCopyTooltip).toBeHidden();
  await copyButton.hover();
  await expect(copyButton).toHaveCSS("background-color", "rgba(0, 0, 32, 0.06)");
  await expect(page.getByRole("tooltip", { name: "Copy" })).toBeVisible();
  const copyTooltip = page.getByRole("tooltip", { name: "Copy" });
  await expect(copyTooltip.locator("..")).toHaveCSS("z-index", "10003");
  await expect(copyTooltip).toHaveAttribute("data-side", "left");
  await expect(copyTooltip.locator("svg")).toHaveCSS("width", "16px");
  await expect(copyTooltip.locator("svg")).toHaveCSS("height", "8px");
  await expect(copyTooltip.locator("svg polygon")).toHaveCount(5);
  await expect
    .poll(() =>
      copyTooltip
        .locator("svg polygon")
        .evaluateAll(
          (polygons) =>
            polygons.filter((polygon) => getComputedStyle(polygon).display !== "none").length,
        ),
    )
    .toBe(3);
  await page.mouse.down();
  await expect(copyButton).toHaveCSS("background-color", "rgba(0, 0, 24, 0.1)");
  await page.mouse.move(0, 0);
  await page.mouse.up();
  await expect(copyTooltip).toBeHidden();
  await copyButton.hover();
  await expect(copyTooltip).toBeVisible();
  await copyButton.click();
  await expect(page.getByTestId("code-copy-count")).toHaveText("Copies: 1");
  await expect(page.getByRole("tooltip", { name: "Copied" })).toBeVisible();
  await expect
    .poll(() => page.evaluate(async () => (await navigator.clipboard.readText()).trim()))
    .toBe("const answer: number = 42;");

  await page.getByRole("button", { name: "Open setup" }).click();
  await expect(page.getByLabel("Component or template")).toHaveValue("code");
  await page.getByLabel("Header").selectOption("tabs");
  await page.getByRole("button", { name: "Close setup" }).click();
  await expect(page.getByRole("button", { name: "React" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Vue" }).click();
  await expect(page).toHaveURL(/codeSelectedTab=vue/);
  await page.getByRole("button", { name: "Open setup" }).click();
  await page.getByLabel("Dark code theme").check();
  await expect(codeBlock).toHaveCSS("background-color", "rgb(36, 32, 43)");
  await expect(codeBlock.locator("pre")).toHaveCSS("color", "rgb(231, 229, 234)");
  await page.keyboard.press("Tab");
  await copyButton.focus();
  await expect(copyButton).toHaveCSS(
    "box-shadow",
    "rgb(46, 41, 54) 0px 0px 0px 0px, rgb(117, 83, 255) 0px 0px 0px 2px",
  );
  await copyButton.evaluate((element) => element.blur());
  await page.getByRole("button", { name: "Open setup" }).click();
  await page.getByLabel("Highlight first line").uncheck();
  await page.getByLabel("Rounded corners").uncheck();
  await page.getByLabel("Selectable code").uncheck();
  await page.getByLabel("Language").selectOption("bash");
  await page.getByLabel("Code value").fill("pnpm test");
  await expect(codeBlock).toHaveCSS("border-radius", "0px");
  await expect(codeBlock.locator("code")).toHaveCSS("user-select", "none");
  await expect(codeBlock.locator(".line-highlight")).toHaveCount(0);

  await page.getByLabel("Code mode").selectOption("inline");
  await page.getByLabel("Inline variant").selectOption("neutral");
  const inlineCode = page.getByTestId("inline-code-preview");
  await expect(inlineCode).toHaveCSS("color", "rgb(48, 46, 54)");
  await expect(inlineCode).toHaveCSS("background-color", "rgba(0, 0, 32, 0.06)");
  await page.getByRole("button", { name: "Share" }).click();
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
  expect(sharedUrl).toContain("/?component=code");

  const restoredContext = await browser.newContext({
    ignoreHTTPSErrors: true,
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const restoredPage = await restoredContext.newPage();
  await restoredPage.goto(sharedUrl);
  await restoredPage.getByRole("button", { name: "Open setup" }).click();
  await expect(restoredPage.getByLabel("Code mode")).toHaveValue("inline");
  await expect(restoredPage.getByLabel("Inline variant")).toHaveValue("neutral");
  await expect(restoredPage.getByLabel("Code value")).toHaveValue("pnpm test");
  await restoredContext.close();

  await page.getByLabel("Component or template").selectOption("checkbox");
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "checkbox",
  );
  await page.goBack();
  await expect(page.locator('[data-slot="playground-canvas"]')).toHaveAttribute(
    "data-component",
    "code",
  );
  await expect(page.getByLabel("Code mode")).toHaveValue("inline");
  await expect(page.getByLabel("Inline variant")).toHaveValue("neutral");
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.getByLabel("Code mode")).toHaveValue("block");
  await expect(page.getByLabel("Language")).toHaveValue("typescript");
  await expect(page.getByLabel("Header")).toHaveValue("filename");
  await expect(page.getByTestId("code-copy-count")).toHaveText("Copies: 0");
  await expect(page.getByTestId("code-highlight-count")).not.toHaveText("Highlights: 0");
  expect(
    await page.evaluate(() =>
      Object.fromEntries(
        [...new URL(location.href).searchParams.entries()].filter(([key]) =>
          key.startsWith("code"),
        ),
      ),
    ),
  ).toEqual({
    codeCopyButton: "true",
    codeDark: "false",
    codeHeader: "filename",
    codeInlineVariant: "accent",
    codeLanguage: "typescript",
    codeLineHighlight: "true",
    codeMode: "block",
    codeRounded: "true",
    codeSelectable: "true",
    codeSelectedTab: "react",
    codeValue: "const event = { status: 'captured' };",
  });

  const touchContext = await browser.newContext({
    hasTouch: true,
    ignoreHTTPSErrors: true,
    viewport: { width: 320, height: 844 },
  });
  const touchPage = await touchContext.newPage();
  await touchPage.goto("/?component=code");
  const touchCopyButton = touchPage.getByRole("button", {
    name: "Copy snippet",
  });
  await expect(touchCopyButton).toHaveCSS("min-width", "44px");
  await expect(touchCopyButton).toHaveCSS("min-height", "44px");
  await expect(touchCopyButton).toHaveCSS("touch-action", "manipulation");
  await touchPage.emulateMedia({ reducedMotion: "reduce" });
  await expect(touchCopyButton).toHaveCSS("transition-property", "none");
  await touchContext.close();
});

test("configures, selects, searches, shares, and restores CompactSelect", async ({
  browser,
  page,
}) => {
  await page.goto("/?component=compact-select&theme=light&viewport=desktop");
  const preview = page.getByTestId("compact-select-preview");
  const value = page.getByTestId("compact-select-value");
  const trigger = preview.getByRole("button", { name: /Frontend/ });

  await expect(preview).toBeVisible();
  await expect(trigger).toContainText("Frontend");
  await expect(value).toHaveText("Selected: frontend");

  await page.getByRole("button", { name: "Open setup" }).click();
  await expect(page.getByLabel("Component or template")).toHaveValue("compact-select");
  await page.getByLabel("Multiple selection").check();
  await page.getByLabel("CompactSelect size").selectOption("sm");
  await page.getByRole("button", { name: "Close setup" }).click();

  await trigger.click();
  const listbox = page.getByRole("listbox");
  const search = page.getByPlaceholder("Search projects…");
  await expect(listbox).toBeVisible();
  const positionerBox = await page.locator('[data-slot="compact-select-positioner"]').boundingBox();
  const popupBox = await page.locator('[data-slot="compact-select-popup"]').boundingBox();
  expect(positionerBox).not.toBeNull();
  expect(popupBox).not.toBeNull();
  expect(Math.abs((positionerBox?.x ?? 0) - (popupBox?.x ?? 0))).toBeLessThan(1);
  expect(Math.abs((positionerBox?.y ?? 0) - (popupBox?.y ?? 0))).toBeLessThan(1);
  await expect(page.getByRole("option", { name: /API/ })).toHaveAttribute("aria-disabled", "true");
  await page.getByRole("option", { name: /Mobile/ }).click();
  await expect(value).toHaveText("Selected: frontend, mobile");
  await expect(listbox).toBeVisible();

  await search.fill("Relay");
  await expect(page.locator('[data-test-id="sqb-highlighted-match"]')).toHaveText("Relay");
  await search.press("Enter");
  await expect(value).toHaveText("Selected: frontend, mobile, relay");
  await expect(trigger).toContainText("+2");
  await search.press("Escape");
  await expect(listbox).not.toBeVisible();

  await page.getByRole("button", { name: "Open setup" }).click();
  await page.getByRole("button", { name: "Share" }).click();
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
  expect(sharedUrl).toContain("component=compact-select");
  expect(sharedUrl).toContain("compactSelectSelected=frontend%2Cmobile%2Crelay");

  const restoredContext = await browser.newContext({
    ignoreHTTPSErrors: true,
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const restoredPage = await restoredContext.newPage();
  await restoredPage.goto(sharedUrl);
  await expect(restoredPage.getByTestId("compact-select-value")).toHaveText(
    "Selected: frontend, mobile, relay",
  );
  await restoredPage.getByRole("button", { name: "Open setup" }).click();
  await expect(restoredPage.getByLabel("Multiple selection")).toBeChecked();
  await expect(restoredPage.getByLabel("CompactSelect size")).toHaveValue("sm");
  await restoredPage.getByRole("button", { name: "Close setup" }).click();
  const restoredTrigger = restoredPage
    .getByTestId("compact-select-preview")
    .getByRole("button", { name: /Frontend/ });
  await restoredTrigger.click();
  await restoredPage.getByRole("button", { name: "Clear" }).click();
  await expect(restoredPage.getByTestId("compact-select-value")).toHaveText("Selected: none");
  await restoredPage.getByRole("button", { name: "Open setup" }).click();
  await restoredPage.getByRole("button", { name: "Share" }).click();
  const emptySharedUrl = await restoredPage.evaluate(() => navigator.clipboard.readText());
  expect(emptySharedUrl).toContain("compactSelectSelected=");
  await restoredPage.reload();
  await expect(restoredPage.getByTestId("compact-select-value")).toHaveText("Selected: none");
  await restoredContext.close();
});

test("configures, selects, shares, and restores the regular Scraps Tabs workbench", async ({
  browser,
  page,
}) => {
  await page.goto("/?component=tabs");
  const preview = page.getByTestId("tabs-preview");
  await expect(preview.getByRole("tab", { name: "Details" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await preview.getByRole("tab", { name: "Activity" }).click();
  await expect(preview.getByRole("tabpanel")).toContainText("Recent activity");

  await page.getByRole("button", { name: "Open setup" }).click();
  await page.getByLabel("Tabs orientation").selectOption("vertical");
  await page.getByLabel("Tabs size").selectOption("xs");
  await page.getByLabel("Tabs variant").selectOption("floating");
  await expect(preview.locator("[data-orientation='vertical']")).toBeVisible();
  await expect(preview.locator("[data-variant='floating']")).toBeVisible();

  await page.getByRole("button", { name: "Share" }).click();
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
  expect(sharedUrl).toContain("component=tabs");
  expect(sharedUrl).toContain("tabsOrientation=vertical");
  expect(sharedUrl).toContain("tabsSize=xs");
  expect(sharedUrl).toContain("tabsValue=activity");
  expect(sharedUrl).toContain("tabsVariant=floating");

  const restoredContext = await browser.newContext({
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const restored = await restoredContext.newPage();
  await restored.goto(sharedUrl);
  const restoredPreview = restored.getByTestId("tabs-preview");
  await expect(restoredPreview.getByRole("tab", { name: "Activity" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(restoredPreview.getByRole("tabpanel")).toContainText("Recent activity");
  await restored.getByRole("button", { name: "Open setup" }).click();
  await expect(restored.getByLabel("Tabs orientation")).toHaveValue("vertical");
  await expect(restored.getByLabel("Tabs size")).toHaveValue("xs");
  await expect(restored.getByLabel("Tabs variant")).toHaveValue("floating");
  await restored
    .getByRole("complementary", { name: "Playground controls" })
    .getByLabel("Reset")
    .click();
  await expect(restored.getByLabel("Tabs orientation")).toHaveValue("horizontal");
  await expect(restored).toHaveURL(/component=tabs/);
  await restoredContext.close();
});

test("configures, shares, and restores the regular Scraps Avatar workbench", async ({
  browser,
  page,
}) => {
  await page.goto("/?component=avatar");
  const preview = page.getByTestId("avatar-preview");
  await expect(preview.locator("text").first()).toHaveText("JD");
  await expect(preview.locator('[data-test-id="platform-icon-python"]')).toBeVisible();
  await expect(preview.getByText("RU", { exact: true })).toBeVisible();
  await expect(preview.getByText("RT", { exact: true })).toBeVisible();
  for (const testId of ["default-size-avatar", "zero-size-avatar"]) {
    const style = await preview.locator(`[data-test-id="${testId}"]`).evaluate((element) => {
      const computed = getComputedStyle(element);
      return {
        display: computed.display,
        height: computed.height,
        position: computed.position,
        verticalAlign: computed.verticalAlign,
        width: computed.width,
      };
    });
    expect(style).toEqual({
      display: "inline-block",
      height: "20px",
      position: "relative",
      verticalAlign: "middle",
      width: "20px",
    });
  }
  const projectIconStyle = await preview
    .locator('[data-test-id="platform-icon-python"]')
    .evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        borderRadius: Number.parseFloat(style.borderRadius),
        boxShadow: style.boxShadow,
        cursor: style.cursor,
        minWidth: style.minWidth,
      };
    });
  expect(projectIconStyle.borderRadius).toBe(6);
  expect(projectIconStyle.boxShadow).not.toBe("none");
  expect(projectIconStyle.cursor).toBe("default");
  expect(projectIconStyle.minWidth).toBe("40px");
  await expect(preview.getByText("+3")).toBeVisible();
  const avatarList = preview.locator('[data-slot="avatar-list"]');
  const listAvatar = avatarList.locator(".avatar").first();
  await expect(listAvatar).toHaveCSS("border-color", "rgb(218, 217, 222)");
  await avatarList.hover();
  await expect(listAvatar).toHaveCSS("border-color", "rgba(0, 0, 32, 0.15)");

  await page.getByRole("button", { name: "Open setup" }).click();
  await page.getByLabel("Avatar type").selectOption("upload");
  await page.getByLabel("Avatar size").selectOption("48");
  await page.getByLabel("Avatar name").fill("Grace Hopper");
  await page.getByLabel("round avatar").check();
  await page.getByLabel("suggested avatar").check();
  const configuredAvatar = preview.locator(".avatar").first();
  await expect(configuredAvatar).toHaveCSS("border-style", "dashed");
  await expect(configuredAvatar).toHaveCSS("border-color", "rgb(162, 159, 170)");
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(configuredAvatar).toHaveCSS("border-color", "rgb(181, 176, 189)");
  await expect(preview.locator("img").first()).toHaveAttribute("src", /data:image\/svg\+xml/);
  await expect(preview.locator(".avatar").first()).toHaveCSS("width", "48px");
  expect(
    await preview
      .locator(".avatar")
      .first()
      .evaluate((element) => Number.parseFloat(getComputedStyle(element).borderRadius)),
  ).toBeGreaterThanOrEqual(24);

  await page.getByRole("button", { name: "Share" }).click();
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
  expect(sharedUrl).toContain("component=avatar");
  expect(sharedUrl).toContain("avatarKind=upload");
  expect(sharedUrl).toContain("avatarName=Grace+Hopper");
  expect(sharedUrl).toContain("avatarRound=true");
  expect(sharedUrl).toContain("avatarSize=48");
  expect(sharedUrl).toContain("avatarSuggested=true");
  expect(sharedUrl).toContain("theme=dark");

  const restoredContext = await browser.newContext({
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const restored = await restoredContext.newPage();
  await restored.goto(sharedUrl);
  await expect(restored.getByTestId("avatar-preview").locator("img").first()).toBeVisible();
  await restored.getByRole("button", { name: "Open setup" }).click();
  await expect(restored.getByLabel("Avatar type")).toHaveValue("upload");
  await expect(restored.getByLabel("Avatar size")).toHaveValue("48");
  await expect(restored.getByLabel("Avatar name")).toHaveValue("Grace Hopper");
  await expect(restored.getByLabel("round avatar")).toBeChecked();
  await expect(restored.getByLabel("suggested avatar")).toBeChecked();
  await expect(restored.locator("html")).toHaveClass(/dark/);
  await restoredContext.close();
});

test("runs the dedicated interaction, layout, separator, and slot workbenches", async ({
  page,
}) => {
  await page.goto(
    "/?component=interaction-state-layer&stateLayerHigherOpacity=true&stateLayerMode=selected&stateLayerSelectedBackground=true",
  );
  const selectedTarget = page.getByTestId("interaction-target-1");
  await expect(selectedTarget).toHaveAttribute("aria-selected", "true");
  await expect(selectedTarget.getByRole("presentation")).toHaveCSS("opacity", "0.12");
  await page.getByRole("button", { name: "Open setup" }).click();
  await expect(page.getByLabel("Interaction state", { exact: true })).toHaveValue("selected");
  await page.getByLabel("Interaction state", { exact: true }).selectOption("pressed");
  await expect(page).toHaveURL(/stateLayerMode=pressed/);

  await page.goto("/?component=layout&layoutColumns=2&layoutGap=lg&layoutSurface=secondary");
  await expect(page.getByTestId("layout-workbench-preview")).toContainText("Project health");
  await expect(page.getByTestId("layout-workbench-preview")).toContainText("For review");
  await expect(page.getByTestId("layout-workbench-preview")).not.toContainText("Resolved");
  await page.getByRole("button", { name: "Open setup" }).click();
  await expect(page.getByLabel("Layout grid columns")).toHaveValue("2");
  await expect(page.getByLabel("Layout gap")).toHaveValue("lg");
  await expect(page.getByLabel("Layout surface")).toHaveValue("secondary");

  await page.goto(
    "/?component=separator&separatorBorder=muted&separatorMargin=md&separatorOrientation=vertical&separatorPadding=xs",
  );
  const separators = page.getByTestId("separator-preview-line");
  await expect(separators).toHaveCount(2);
  await expect(separators.first()).toHaveAttribute("aria-orientation", "vertical");
  await expect(separators.first()).toHaveCSS("border-left-style", "solid");
  await page.getByRole("button", { name: "Open setup" }).click();
  await expect(page.getByLabel("Separator margin")).toHaveValue("md");
  await expect(page.getByLabel("Separator padding")).toHaveValue("xs");

  await page.goto("/?component=slot");
  const outlet = page.getByTestId("slot-workbench-outlet");
  await expect(outlet).toContainText("Create project");
  await page.getByRole("button", { name: "Open setup" }).click();
  await page.getByLabel("Connect consumer").uncheck();
  await expect(outlet).toContainText("No toolbar action");
  await page.getByLabel("Slot name").selectOption("footer");
  await expect(page.getByTestId("slot-workbench-outlet")).toContainText("No footer action");
  await expect(page).toHaveURL(/component=slot/);
  await expect(page).toHaveURL(/slotName=footer/);
});
