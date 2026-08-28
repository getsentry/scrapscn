import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("records the complete regular Scraps RevealOnHover delivery", async () => {
  const manifest = JSON.parse(await readFile("scraps-parity.json", "utf8"));
  const reveal = manifest.modules.find(({ name }) => name === "revealOnHover");

  assert.deepEqual(reveal.canonical.sourcePaths, [
    "static/app/components/core/revealOnHover/index.tsx",
    "static/app/components/core/revealOnHover/revealOnHover.tsx",
    "static/app/utils/theme/theme.tsx",
  ]);
  assert.deepEqual(reveal.canonical.publicExports, {
    runtime: ["RevealOnHover"],
    types: [],
  });
  assert.deepEqual(reveal.local.implementationPaths, ["src/components/ui/reveal-on-hover.tsx"]);
  assert.deepEqual(reveal.local.implementedExports, {
    runtime: ["RevealOnHover"],
    types: [],
  });
  assert.deepEqual(reveal.local.registryItems, ["reveal-on-hover"]);
  assert.deepEqual(reveal.local.tests, [
    "src/components/ui/reveal-on-hover.test.tsx",
    "tests/e2e/playground.spec.ts",
    "tests/parity/reveal-on-hover.test.mjs",
    "tests/types/reveal-on-hover-types.test.tsx",
  ]);
  assert.deepEqual(reveal.local.figmaNodes, []);
  assert.equal(reveal.local.playgroundPath, "/?component=reveal-on-hover");
  assert.equal(reveal.completion.state, "complete");
  assert.equal(reveal.completion.complete, true);
});

test("publishes RevealOnHover with its self-contained Layout closure and motion tokens", async () => {
  const registry = JSON.parse(await readFile("registry.json", "utf8"));
  const item = registry.items.find(({ name }) => name === "reveal-on-hover");

  assert.deepEqual(item.dependencies, []);
  assert.deepEqual(item.registryDependencies, []);
  assert.deepEqual(item.cssVars, {
    theme: {
      "duration-fast": "120ms",
      "duration-moderate": "160ms",
      "ease-enter": "cubic-bezier(0.24, 1, 0.32, 1)",
      "ease-exit": "cubic-bezier(0.64, 0, 0.8, 0)",
    },
  });
  assert.deepEqual(item.files, [
    { path: "src/components/ui/container-query-context.ts", type: "registry:ui" },
    { path: "src/components/ui/layout-style-engine.ts", type: "registry:ui" },
    { path: "src/components/ui/layout-tailwind-candidates.ts", type: "registry:ui" },
    { path: "src/components/ui/layout-tailwind.ts", type: "registry:ui" },
    { path: "src/components/ui/layout.tsx", type: "registry:ui" },
    { path: "src/components/ui/reveal-on-hover.tsx", type: "registry:ui" },
    { path: "src/components/ui/separator.tsx", type: "registry:ui" },
  ]);
});

test("keeps RevealOnHover capability, timing, and motion in Tailwind selectors", async () => {
  const source = await readFile("src/components/ui/reveal-on-hover.tsx", "utf8");

  assert.match(source, /@media\(hover:hover\)/);
  assert.match(source, /duration-\[var\(--duration-fast,120ms\)\]/);
  assert.match(source, /ease-\[var\(--ease-exit,cubic-bezier\(0\.64,0,0\.8,0\)\)\]/);
  assert.match(source, /&:is\(:hover,:focus-within\)_\[data-reveal-on-hover\]/);
  assert.match(source, /duration-\[var\(--duration-moderate,160ms\)\]/);
  assert.match(source, /motion-reduce:\[&_\[data-reveal-on-hover\]\]:!transition-none/);
  assert.doesNotMatch(source, /\.module\.css/);
});
