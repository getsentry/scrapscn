import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("records the complete regular Scraps StatusIndicator delivery", async () => {
  const manifest = JSON.parse(await readFile("scraps-parity.json", "utf8"));
  const status = manifest.modules.find(({ name }) => name === "statusIndicator");

  assert.deepEqual(status.canonical.sourcePaths, [
    "static/app/components/core/statusIndicator/index.tsx",
    "static/app/components/core/statusIndicator/statusIndicator.tsx",
    "static/app/utils/theme/scraps/theme/base.tsx",
    "static/app/utils/theme/scraps/theme/dark.tsx",
    "static/app/utils/theme/scraps/theme/light.tsx",
    "static/app/utils/theme/scraps/tokens/size.tsx",
  ]);
  assert.deepEqual(status.canonical.publicExports, {
    runtime: ["StatusIndicator"],
    types: [],
  });
  assert.deepEqual(status.local.implementationPaths, [
    "src/components/ui/status-indicator.tsx",
  ]);
  assert.deepEqual(status.local.implementedExports, {
    runtime: ["StatusIndicator"],
    types: [],
  });
  assert.deepEqual(status.local.registryItems, ["status-indicator"]);
  assert.deepEqual(status.local.tests, [
    "src/components/ui/status-indicator.test.tsx",
    "tests/e2e/playground.spec.ts",
    "tests/parity/status-indicator.test.mjs",
    "tests/types/status-indicator-types.test.tsx",
  ]);
  assert.deepEqual(status.local.figmaNodes, []);
  assert.equal(status.local.playgroundPath, "/?component=status-indicator");
  assert.equal(status.completion.complete, true);
});

test("publishes StatusIndicator with its self-contained Layout closure and exact tokens", async () => {
  const registry = JSON.parse(await readFile("registry.json", "utf8"));
  const item = registry.items.find(({ name }) => name === "status-indicator");

  assert.deepEqual(item.dependencies, ["@emotion/is-prop-valid@1.4.0"]);
  assert.deepEqual(item.registryDependencies, []);
  assert.deepEqual(item.cssVars, {
    light: {
      "scraps-status-accent-dot": "#7553ff",
      "scraps-status-accent-pulse": "#0008f012",
      "scraps-status-danger-dot": "#ff002b",
      "scraps-status-danger-pulse": "#f828081c",
      "scraps-status-warning-dot": "#ffce00",
      "scraps-status-warning-pulse": "#e0b01030",
      "scraps-status-success-dot": "#00f261",
      "scraps-status-success-pulse": "#00b8001c",
      "scraps-status-promotion-dot": "#fc5cb4",
      "scraps-status-promotion-pulse": "#f000901a",
      "scraps-status-muted-dot": "#c0bec6",
      "scraps-status-muted-pulse": "#0000200f",
    },
    dark: {
      "scraps-status-accent-dot": "#7553ff",
      "scraps-status-accent-pulse": "#4828b894",
      "scraps-status-danger-dot": "#ff002b",
      "scraps-status-danger-pulse": "#f8000033",
      "scraps-status-warning-dot": "#ffce00",
      "scraps-status-warning-pulse": "#e8380029",
      "scraps-status-success-dot": "#00f261",
      "scraps-status-success-pulse": "#00f8001f",
      "scraps-status-promotion-dot": "#ff45a8",
      "scraps-status-promotion-pulse": "#f800782e",
      "scraps-status-muted-dot": "#898294",
      "scraps-status-muted-pulse": "#c0a8f81a",
    },
  });
  assert.deepEqual(item.files, [
    { path: "src/components/ui/container-query-context.ts", type: "registry:ui" },
    { path: "src/components/ui/layout-style-engine.ts", type: "registry:ui" },
    { path: "src/components/ui/layout.tsx", type: "registry:ui" },
    { path: "src/components/ui/separator.tsx", type: "registry:ui" },
    {
      path: "src/components/ui/status-indicator.module.css",
      type: "registry:file",
      target: "src/components/ui/status-indicator.module.css",
    },
    { path: "src/components/ui/status-indicator.tsx", type: "registry:ui" },
  ]);
});

test("keeps the exact StatusIndicator geometry, motion, and reduced-motion state", async () => {
  const source = await readFile("src/components/ui/status-indicator.tsx", "utf8");
  const styles = await readFile(
    "src/components/ui/status-indicator.module.css",
    "utf8"
  );
  const serverPage = await readFile(
    "src/app/evidence/status-indicator-server/page.tsx",
    "utf8"
  );

  assert.match(source, /^"use client"/);
  assert.match(source, /animationIterationCount = "infinite"/);
  assert.match(source, /role=\{role \?\? \(ariaLabel \? "img" : undefined\)\}/);
  assert.match(source, /aria-hidden=\{!ariaLabel && !role \? true : undefined\}/);
  assert.match(styles, /width:\s*8px;\s*height:\s*8px/);
  assert.match(styles, /width:\s*12px;\s*height:\s*12px;\s*border-radius:\s*3px/);
  assert.match(styles, /gentleSpin 2\.2s cubic-bezier\(0\.785, 0\.135, 0\.15, 0\.86\)/);
  assert.match(styles, /gentlePulse 2\.2s cubic-bezier\(0\.445, 0\.05, 0\.55, 0\.95\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /opacity:\s*0;\s*transform:\s*scale\(1\.25\) rotate\(1turn\)/);
  assert.doesNotMatch(serverPage, /["']use client["']/);
  assert.match(serverPage, /import \{ StatusIndicator \}/);
  assert.match(serverPage, /aria-label="Server status"/);
});
