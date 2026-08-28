import { createHash } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";

import parityManifest from "../scraps-parity.json" with { type: "json" };
import { assertSentryReviewServer } from "./sentry-review-server.mjs";
import { createSentryStoryUrl, parseSentryReviewOrigin } from "./visual-review-inputs.mjs";
import {
  pairedScenarios,
  scenarioContractHash,
  visualEnvironment,
} from "./visual-scenario-contract.mjs";

const repository = path.resolve(process.env.SENTRY_REPO_PATH ?? "../sentry-scraps-latest");
const authState =
  process.env.SENTRY_AUTH_STATE ??
  new URL("../.auth/sentry-playwright.json", import.meta.url).pathname;
try {
  await access(authState);
} catch {
  throw new Error(
    "SENTRY_AUTH_STATE must point to a local Playwright auth state, or .auth/sentry-playwright.json must exist",
  );
}

const origin = parseSentryReviewOrigin(
  process.env.SENTRY_REVIEW_ORIGIN ?? "https://sentry.dev.getsentry.net:8000",
);
assertSentryReviewServer({
  repository,
  commit: parityManifest.canonical.commit,
  origin: origin.origin,
});
const organization = process.env.SENTRY_ORG_SLUG ?? "sentry";
const outputDirectory = new URL("../tests/visual/canonical-screenshots/", import.meta.url);
const metadataFile = new URL("../tests/visual/canonical-capture-metadata.json", import.meta.url);
const metadata = {
  canonicalCommit: parityManifest.canonical.commit,
  contractHash: scenarioContractHash(),
  records: [],
};

await mkdir(outputDirectory, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({
  deviceScaleFactor: 1,
  ignoreHTTPSErrors: true,
  locale: visualEnvironment.locale,
  storageState: authState,
  timezoneId: "UTC",
});
const page = await context.newPage();

try {
  for (const scenario of pairedScenarios()) {
    for (const view of scenario.views) {
      const [theme, viewportName] = view.split("-");
      const viewport = visualEnvironment.dimensions[viewportName];
      await page.setViewportSize(viewport);
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      const url = new URL(
        createSentryStoryUrl({ origin, organization, slug: scenario.target.slug }),
      );
      url.searchParams.set("theme", theme);
      await page.goto("about:blank");
      await page.goto(url.href, { waitUntil: "domcontentloaded" });
      if (new URL(page.url()).pathname.startsWith("/auth/login")) {
        throw new Error("The canonical capture auth state is not authenticated");
      }
      await setCanonicalTheme(page, theme);
      const captureSurface = page.locator(scenario.canonical.selector).first();
      await captureSurface.waitFor({ state: "visible" });
      await settle(page);
      await captureSurface.evaluate((element) => {
        const computed = getComputedStyle(element);
        for (const name of computed) {
          if (name.startsWith("--"))
            element.style.setProperty(name, computed.getPropertyValue(name));
        }
        let ancestor = element;
        while (ancestor) {
          const color = getComputedStyle(ancestor).backgroundColor;
          if (color !== "transparent" && color !== "rgba(0, 0, 0, 0)") {
            element.style.setProperty("background", color, "important");
            break;
          }
          ancestor = ancestor.parentElement;
        }
        for (const name of ["color", "font-family", "font-size", "line-height"]) {
          element.style.setProperty(name, computed.getPropertyValue(name), "important");
        }
        element.setAttribute("data-scrapscn-canonical-capture", "");
        document.body.append(element);
      });
      await page.addStyleTag({
        content:
          "nextjs-portal,body>:not([data-scrapscn-canonical-capture]){display:none!important}*,*::before,*::after{animation-duration:0s!important;transition-duration:0s!important;caret-color:transparent!important}html,body{overflow:hidden!important}[data-scrapscn-canonical-capture]{position:fixed!important;inset:0!important;z-index:2147483647!important;width:100vw!important;height:100vh!important;min-height:100vh!important;max-height:none!important;margin:0!important;border:0!important;border-radius:0!important}",
      });
      await settle(page);

      const image = `${scenario.id}-${view}.png`;
      const imagePath = new URL(image, outputDirectory).pathname;
      await page.screenshot({ animations: "disabled", path: imagePath });
      metadata.records.push({
        dimensions: viewport,
        fontsReady: true,
        image,
        locale: visualEnvironment.locale,
        reducedMotion: visualEnvironment.reducedMotion,
        route: url.pathname,
        scenario: scenario.id,
        sha256: createHash("sha256")
          .update(await readFile(imagePath))
          .digest("hex"),
        theme,
        view,
      });
      process.stdout.write(`Captured ${scenario.id} ${view}\n`);
    }
  }
} finally {
  await browser.close();
}

await writeFile(metadataFile, `${JSON.stringify(metadata, null, 2)}\n`);

async function setCanonicalTheme(activePage, theme) {
  const action = theme === "dark" ? "Switch to Dark Mode" : "Switch to Light Mode";
  const inverseAction = theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode";
  await activePage
    .locator('button[aria-label="Switch to Light Mode"], button[aria-label="Switch to Dark Mode"]')
    .waitFor({ state: "visible" });
  const themeButton = activePage.getByRole("button", { name: action });
  if (await themeButton.isVisible()) await themeButton.evaluate((element) => element.click());
  await activePage.getByRole("button", { name: inverseAction }).waitFor({ state: "visible" });
}

async function settle(activePage) {
  await activePage.evaluate(async () => {
    await Promise.race([
      Promise.all([
        document.fonts.ready,
        ...Array.from(document.images, (image) => image.decode().catch(() => undefined)),
      ]),
      new Promise((resolve) => window.setTimeout(resolve, 5000)),
    ]);
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}
