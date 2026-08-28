import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("records the complete regular Scraps Image delivery", async () => {
  const manifest = JSON.parse(await readFile("scraps-parity.json", "utf8"));
  const image = manifest.modules.find(({ name }) => name === "image");

  assert.deepEqual(image.canonical.sourcePaths, [
    "static/app/components/core/image/image.tsx",
    "static/app/components/core/image/index.tsx",
    "static/app/components/core/layout/styles.tsx",
    "static/app/utils/theme/scraps/theme/base.tsx",
    "static/app/utils/theme/scraps/tokens/size.tsx",
    "static/app/utils/theme/types.tsx",
  ]);
  assert.deepEqual(image.canonical.publicExports, {
    runtime: ["Image"],
    types: ["ImageProps"],
  });
  assert.deepEqual(image.local.implementationPaths, ["src/components/ui/image.tsx"]);
  assert.deepEqual(image.local.implementedExports, {
    runtime: ["Image"],
    types: ["ImageProps"],
  });
  assert.deepEqual(image.local.registryItems, ["image"]);
  assert.deepEqual(image.local.tests, [
    "src/components/ui/image.test.tsx",
    "tests/e2e/playground.spec.ts",
    "tests/parity/image.test.mjs",
    "tests/types/image-types.test.tsx",
  ]);
  assert.deepEqual(image.local.figmaNodes, []);
  assert.equal(image.local.playgroundPath, "/?component=image");
  assert.equal(image.completion.state, "complete");
  assert.equal(image.completion.complete, true);
});

test("publishes Image with the exact self-contained Layout closure", async () => {
  const registry = JSON.parse(await readFile("registry.json", "utf8"));
  const item = registry.items.find(({ name }) => name === "image");

  assert.deepEqual(item.dependencies, []);
  assert.deepEqual(item.registryDependencies, []);
  assert.deepEqual(item.files, [
    {
      path: "src/components/ui/container-query-context.ts",
      type: "registry:ui",
    },
    { path: "src/components/ui/layout-style-engine.ts", type: "registry:ui" },
    {
      path: "src/components/ui/layout-tailwind-candidates.ts",
      type: "registry:ui",
    },
    { path: "src/components/ui/layout-tailwind.ts", type: "registry:ui" },
    { path: "src/components/ui/layout.tsx", type: "registry:ui" },
    { path: "src/components/ui/separator.tsx", type: "registry:ui" },
    { path: "src/components/ui/image.tsx", type: "registry:ui" },
  ]);
});

test("keeps the native Image contract, responsive Layout path, and server boundary", async () => {
  const source = await readFile("src/components/ui/image.tsx", "utf8");
  const serverPage = await readFile("src/app/evidence/image-server/page.tsx", "utf8");

  assert.match(source, /^"use client"/);
  assert.match(source, /extends Omit<ImgHTMLAttributes<HTMLImageElement>, "height" \| "width">/);
  assert.match(source, /loading = "lazy"/);
  assert.match(source, /property: "height", value: height \?\? "auto"/);
  assert.match(source, /property: "width", value: width \?\? "100%"/);
  assert.match(source, /createLayoutTailwindStyle/);
  assert.match(source, /objectFit/);
  assert.match(source, /objectPosition/);
  assert.match(source, /aspectRatio/);
  assert.match(source, /ref=\{ref\}/);
  assert.doesNotMatch(source, /<div/);
  assert.doesNotMatch(serverPage, /["']use client["']/);
  assert.match(serverPage, /import \{ Image \}/);
  assert.match(serverPage, /alt="Server image"/);
});
