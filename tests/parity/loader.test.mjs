import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("records the local regular Scraps Loader delivery without overclaiming", async () => {
  const manifest = JSON.parse(await readFile("scraps-parity.json", "utf8"));
  const loader = manifest.modules.find(({ name }) => name === "loader");
  assert.deepEqual(loader.canonical.sourcePaths, [
    "package.json",
    "static/app/components/core/layout/container.tsx",
    "static/app/components/core/layout/flex.tsx",
    "static/app/components/core/layout/index.tsx",
    "static/app/components/core/layout/stack.tsx",
    "static/app/components/core/layout/styles.tsx",
    "static/app/components/core/loader/indeterminateLoader.tsx",
    "static/app/components/core/loader/index.tsx",
    "static/app/components/core/loader/loader.mdx",
    "static/app/components/core/principles/motion/motion.mdx",
    "static/app/components/core/separator/index.tsx",
    "static/app/components/core/separator/separator.tsx",
    "static/app/components/core/text/index.tsx",
    "static/app/components/core/text/styles.tsx",
    "static/app/components/core/text/text.tsx",
    "static/app/utils/theme/index.tsx",
    "static/app/utils/theme/scraps/theme/base.tsx",
    "static/app/utils/theme/scraps/theme/dark.tsx",
    "static/app/utils/theme/scraps/theme/light.tsx",
    "static/app/utils/theme/scraps/tokens/color.tsx",
    "static/app/utils/theme/scraps/tokens/size.tsx",
    "static/app/utils/theme/scraps/tokens/typography.tsx",
    "static/app/utils/theme/theme.tsx",
    "static/app/utils/theme/types.tsx",
    "static/less/fonts.less",
  ]);
  assert.deepEqual(loader.canonical.publicExports, { runtime: ["IndeterminateLoader"], types: [] });
  assert.deepEqual(loader.local.implementationPaths, ["src/components/ui/loader.tsx"]);
  assert.deepEqual(loader.local.implementedExports, { runtime: ["IndeterminateLoader"], types: [] });
  assert.deepEqual(loader.local.registryItems, ["loader"]);
  assert.deepEqual(loader.local.stories, ["src/components/ui/loader.stories.tsx"]);
  assert.deepEqual(loader.local.tests, [
    "src/app/evidence/loader-server/page.tsx",
    "src/components/ui/loader.test.tsx",
    "tests/e2e/playground.spec.ts",
    "tests/e2e/templates.spec.ts",
    "tests/parity/loader.test.mjs",
    "tests/types/loader-types.test.tsx",
  ]);
  assert.deepEqual(loader.local.figmaNodes, []);
  assert.equal(loader.local.playgroundPath, "/?component=loader");
  assert.deepEqual(loader.completion, {
    state: "partial",
    complete: false,
    note: "The local Loader implementation, template-backed workbench, server evidence, focused tests, and local registry item are present. The shared hosted Layout and Text registry dependencies are protected, so public dependency installation is not verified. No canonical Loader Figma node is recorded.",
  });
});

test("publishes Loader with exact local package seams", async () => {
  const registry = JSON.parse(await readFile("registry.json", "utf8"));
  const item = registry.items.find(({ name }) => name === "loader");
  assert.deepEqual(item.dependencies, ["@react-aria/utils@3.34.1", "framer-motion@12.38.0"]);
  assert.deepEqual(item.registryDependencies, ["https://scrapscn.sentry.dev/r/layout.json", "https://scrapscn.sentry.dev/r/text.json"]);
});

test("keeps the canonical Loader visual and timing contract", async () => {
  const source = await readFile("src/components/ui/loader.tsx", "utf8");
  const css = await readFile("src/components/ui/loader.module.css", "utf8");
  for (const fragment of ["role=\"progressbar\"", "aria-label=\"Loading\"", "MESSAGE_INTERVAL_MS = 10_000", "mode=\"wait\"", "duration: 0.3", "useReducedMotion", "WIDTH = { MIN: 128, MAX: 400 }", '"--loader-track-color"', "color={color}", "style={trackStyle}"]) assert.ok(source.includes(fragment));
  for (const fragment of ["round(down, 100% - 16px, 8px) + 16px", "mask-size: 16px 8px", "cubic-bezier(0.4, 0, 0.2, 1)", "left: -35%; right: 100%", "left: -200%; right: 100%", "prefers-reduced-motion: reduce"]) assert.ok(css.includes(fragment));
});
