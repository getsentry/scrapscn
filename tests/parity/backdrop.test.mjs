import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("records the complete regular Scraps Backdrop delivery", async () => {
  const manifest = JSON.parse(await readFile("scraps-parity.json", "utf8"));
  const backdrop = manifest.modules.find(({ name }) => name === "backdrop");

  assert.deepEqual(backdrop.canonical.sourcePaths, [
    "static/app/components/core/backdrop/backdrop.tsx",
    "static/app/components/core/backdrop/index.tsx",
    "static/app/utils/theme/theme.tsx",
  ]);
  assert.deepEqual(backdrop.canonical.publicExports, {
    runtime: ["Backdrop"],
    types: [],
  });
  assert.deepEqual(backdrop.local.implementationPaths, ["src/components/ui/backdrop.tsx"]);
  assert.deepEqual(backdrop.local.implementedExports, {
    runtime: ["Backdrop"],
    types: [],
  });
  assert.deepEqual(backdrop.local.registryItems, ["backdrop"]);
  assert.deepEqual(backdrop.local.tests, [
    "src/components/ui/backdrop.test.tsx",
    "tests/e2e/playground.spec.ts",
    "tests/parity/backdrop.test.mjs",
    "tests/types/backdrop-types.test.tsx",
  ]);
  assert.deepEqual(backdrop.local.figmaNodes, []);
  assert.equal(backdrop.local.playgroundPath, "/?component=backdrop");
  assert.equal(backdrop.completion.state, "complete");
  assert.equal(backdrop.completion.complete, true);
});

test("publishes the exact standalone Backdrop registry item", async () => {
  const registry = JSON.parse(await readFile("registry.json", "utf8"));
  const backdrop = registry.items.find(({ name }) => name === "backdrop");

  assert.deepEqual(backdrop.dependencies, ["framer-motion@12.38.0"]);
  assert.deepEqual(backdrop.registryDependencies, []);
  assert.deepEqual(backdrop.cssVars, {
    light: { "scraps-backdrop-background": "#10082845" },
    dark: { "scraps-backdrop-background": "#10082080" },
  });
  assert.deepEqual(backdrop.files, [
    { path: "src/components/ui/backdrop.tsx", type: "registry:ui" },
  ]);
});

test("keeps the exact Backdrop layers, geometry, colors, and motion", async () => {
  const source = await readFile("src/components/ui/backdrop.tsx", "utf8");

  assert.match(source, /widgetBuilderDrawer: "z-\[1016\]"/);
  assert.match(source, /drawer: "z-\[9999\]"/);
  assert.match(source, /modal: "z-\[10000\]"/);
  assert.match(source, /#10082845/);
  assert.match(source, /duration: 0\.24/);
  assert.match(source, /ease: \[0\.72, 0, 0\.16, 1\]/);
  assert.match(source, /useReducedMotion/);
  assert.match(source, /className=\{`fixed inset-0 bg-/);
  assert.doesNotMatch(source, /position: "fixed"|inset: "0"|\.module\.css/);
  assert.match(source, /initial=\{/);
  assert.match(source, /animate=\{\{ opacity: 1 \}\}/);
  assert.match(source, /exit=\{\{ opacity: 0 \}\}/);
});
