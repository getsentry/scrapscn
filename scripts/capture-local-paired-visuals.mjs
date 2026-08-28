import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";

import { chromium } from "playwright";

import parityManifest from "../scraps-parity.json" with { type: "json" };
import {
  pairedScenarios,
  scenarioContractHash,
  visualEnvironment,
} from "./visual-scenario-contract.mjs";

const origin = new URL(process.env.SCRAPSCN_REVIEW_ORIGIN ?? "https://scrapscn.localhost:1355");
const outputDirectory = new URL("../tests/visual/paired-screenshots/", import.meta.url);
const metadataFile = new URL("../tests/visual/local-capture-metadata.json", import.meta.url);
const metadata = {
  canonicalCommit: parityManifest.canonical.commit,
  contractHash: scenarioContractHash(),
  records: [],
};

await mkdir(outputDirectory, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({
  deviceScaleFactor: 1,
  locale: visualEnvironment.locale,
  timezoneId: "UTC",
});
try {
  for (const scenario of pairedScenarios()) {
    for (const view of scenario.views) {
      const [theme, viewportName] = view.split("-");
      const viewport = visualEnvironment.dimensions[viewportName];
      const url = new URL(scenario.local.path, origin);
      for (const [key, value] of Object.entries(scenario.local.searchParams)) {
        url.searchParams.set(
          key,
          value
            .replace("{theme}", theme)
            .replace("{viewport}", viewportName === "wide" ? "desktop" : "mobile"),
        );
      }
      await page.setViewportSize(viewport);
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      await page.goto(url.href, { waitUntil: "networkidle" });
      await page.locator(scenario.local.selector).waitFor({ state: "visible" });
      const renderedTheme = await page.evaluate(() =>
        document.documentElement.classList.contains("dark") ? "dark" : "light",
      );
      if (renderedTheme !== theme) {
        throw new Error(`Expected local ${theme} theme, found ${renderedTheme}`);
      }
      await page.addStyleTag({
        content:
          "nextjs-portal{display:none!important}*,*::before,*::after{animation-duration:0s!important;transition-duration:0s!important;caret-color:transparent!important}",
      });
      await page.evaluate(async () => document.fonts.ready);
      const image = `${scenario.id}-${view}.png`;
      const imagePath = new URL(image, outputDirectory).pathname;
      await page.screenshot({ animations: "disabled", path: imagePath });
      metadata.records.push({
        dimensions: viewport,
        fontsReady: true,
        image,
        locale: visualEnvironment.locale,
        reducedMotion: visualEnvironment.reducedMotion,
        route: `${url.pathname}?${url.searchParams}`,
        scenario: scenario.id,
        sha256: createHash("sha256")
          .update(await readFile(imagePath))
          .digest("hex"),
        theme,
        view,
      });
    }
  }
} finally {
  await browser.close();
}
await writeFile(metadataFile, `${JSON.stringify(metadata, null, 2)}\n`);
