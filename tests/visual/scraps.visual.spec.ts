import { expect, test, type Page } from "playwright/test";

import parityManifest from "../../scraps-parity.json";
import { getVisualCase } from "./cases";

const themes = ["light", "dark"] as const;
const viewports = {
  narrow: { height: 844, width: 390, workbench: "mobile" },
  wide: { height: 900, width: 1280, workbench: "desktop" },
} as const;

const modules = parityManifest.modules.map(({ local, name }) => {
  const route = new URL(local.playgroundPath, "https://scrapscn.localhost");
  const component = route.searchParams.get("component");
  if (!component) throw new Error(`Missing playground component for ${name}`);
  return { component, name, route };
});

if (modules.length !== 48 || new Set(modules.map(({ component }) => component)).size !== 48) {
  throw new Error("Visual coverage must contain exactly 48 unique Scraps modules");
}

test.describe.configure({ mode: "serial" });

for (const { component, name, route } of modules) {
  for (const theme of themes) {
    for (const [viewportName, viewport] of Object.entries(viewports)) {
      test(`${name} · ${theme} · ${viewportName}`, async ({ page }) => {
        await page.setViewportSize({ height: viewport.height, width: viewport.width });
        await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });

        const url = new URL(route);
        url.searchParams.set("capture", "visual");
        url.searchParams.set("theme", theme);
        url.searchParams.set("viewport", viewport.workbench);
        const visualCase = getVisualCase(component);
        for (const [key, value] of Object.entries(visualCase?.searchParams ?? {})) {
          url.searchParams.set(key, value);
        }

        await page.goto(`${url.pathname}?${url.searchParams.toString()}`);
        const capture = page.locator('[data-slot="visual-capture"]');
        await expect(capture).toHaveAttribute("data-component", component);
        await expect(capture).toHaveAttribute("data-visual-ready", "true");
        await expect
          .poll(() =>
            page.locator("html").evaluate((element) => element.classList.contains("dark")),
          )
          .toBe(theme === "dark");

        await visualCase?.prepare?.(page);
        await settleVisuals(page);
        await expect
          .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
          .toBe(viewport.width);

        await expect(page).toHaveScreenshot(`${component}-${theme}-${viewportName}.png`, {
          fullPage: true,
        });
      });
    }
  }
}

async function settleVisuals(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      Array.from(document.images, (image) => image.decode().catch(() => undefined)),
    );
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
  });
}
