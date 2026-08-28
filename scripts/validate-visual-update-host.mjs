import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

import { chromium } from "playwright";

import expected from "../tests/visual/baseline-environment.json" with { type: "json" };

const playwrightPackage = JSON.parse(
  await readFile(new URL("../node_modules/playwright/package.json", import.meta.url), "utf8"),
);
const actual = {
  architecture: process.arch,
  browser: execFileSync(chromium.executablePath(), ["--version"], { encoding: "utf8" }).trim(),
  operatingSystem: process.platform,
  operatingSystemVersion:
    process.platform === "darwin"
      ? execFileSync("sw_vers", ["-productVersion"], { encoding: "utf8" }).trim()
      : "unsupported",
  playwright: playwrightPackage.version,
};

const mismatches = Object.entries(expected).filter(([key, value]) => actual[key] !== value);
if (mismatches.length) {
  const details = mismatches
    .map(([key, value]) => `${key}: expected ${value}, received ${actual[key]}`)
    .join("\n");
  throw new Error(`Visual snapshots can only be updated in the reference environment.\n${details}`);
}

process.stdout.write("Visual baseline reference environment verified.\n");
