import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("records the complete regular Scraps drag handle delivery", async () => {
  const manifest = JSON.parse(await readFile("scraps-parity.json", "utf8"));
  const dragHandle = manifest.modules.find(({ name }) => name === "dragHandle");

  assert.deepEqual(dragHandle.local.implementationPaths, [
    "src/components/ui/drag-handle.tsx",
    "src/components/ui/use-drag-move.tsx",
    "src/components/ui/use-drag-separator.tsx",
  ]);
  assert.deepEqual(dragHandle.local.registryItems, ["drag-handle"]);
  assert.deepEqual(dragHandle.local.stories, ["src/components/ui/drag-handle.stories.tsx"]);
  assert.deepEqual(dragHandle.local.tests, [
    "src/components/ui/drag-handle.test.tsx",
    "tests/e2e/playground.spec.ts",
    "tests/parity/drag-handle.test.mjs",
  ]);
  assert.equal(dragHandle.local.playgroundPath, "/?component=drag-handle");
  assert.equal(dragHandle.completion.state, "complete");
  assert.equal(dragHandle.completion.complete, true);
  assert.deepEqual(dragHandle.local.figmaNodes, []);
});

test("publishes the drag handle with merge-safe theme tokens and a self-contained Layout closure", async () => {
  const registry = JSON.parse(await readFile("registry.json", "utf8"));
  const dragHandle = registry.items.find((item) => item.name === "drag-handle");

  assert.deepEqual(dragHandle.registryDependencies, []);
  assert.deepEqual(dragHandle.dependencies, [
    "@emotion/is-prop-valid",
    "@react-aria/interactions@3.28.1",
    "@react-aria/utils@3.34.1",
  ]);
  assert.deepEqual(dragHandle.cssVars, {
    theme: {
      "duration-slow": "240ms",
      "ease-smooth": "cubic-bezier(0.72, 0, 0.16, 1)",
    },
    light: {
      "scraps-theme-border-primary": "#dad9de",
    },
    dark: {
      "scraps-theme-border-primary": "#141119",
    },
  });
  assert.deepEqual(
    dragHandle.files.map((file) => file.path),
    [
      "src/components/ui/container-query-context.ts",
      "src/components/ui/drag-handle.module.css",
      "src/components/ui/drag-handle.tsx",
      "src/components/ui/layout-style-engine.ts",
      "src/components/ui/layout.tsx",
      "src/components/ui/separator.tsx",
      "src/components/ui/use-drag-move.tsx",
      "src/components/ui/use-drag-separator.tsx",
    ]
  );
});

test("keeps the exact regular Scraps line, target, states, tokens, and motion", async () => {
  const styles = await readFile("src/components/ui/drag-handle.module.css", "utf8");

  assert.match(styles, /\.dragHandleLine\[data-orientation="horizontal"\]/);
  assert.match(styles, /\.dragHandleLine\[data-orientation="vertical"\]/);
  assert.equal(styles.match(/(?:width|height): 24px;/g)?.length, 2);
  assert.equal(styles.match(/border-(?:left|top): 1px solid var\(--scraps-theme-border-primary\);/g)?.length, 2);
  assert.equal(styles.match(/(?:width|height): 4px;/g)?.length, 2);
  assert.equal(styles.match(/z-index: 9999;/g)?.length, 2);
  assert.doesNotMatch(styles, /z-index: 40;/);
  assert.match(styles, /\.dragHandleLine:hover::after,[\s\S]*\[data-is-held="true"\]::after[\s\S]*background: var\(--primary\);/);
  assert.match(styles, /\.dragHandleLine\[data-variant="ghost"\]:hover,[\s\S]*:focus-visible,[\s\S]*\[data-is-held="true"\][\s\S]*border-color: var\(--scraps-theme-border-primary\);/);
  assert.match(styles, /\.dragHandleLine:focus-visible[\s\S]*outline: 2px solid var\(--ring\);/);
  assert.match(styles, /transition: background var\(--duration-slow\) var\(--ease-smooth\);/);
  assert.match(styles, /transition: border-color var\(--duration-slow\) var\(--ease-smooth\);/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)[\s\S]*transition: none;/);
});
