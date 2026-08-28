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
      "src/components/ui/drag-handle.tsx",
      "src/components/ui/use-drag-move.tsx",
      "src/components/ui/use-drag-separator.tsx",
    ],
  );
});

test("keeps the exact regular Scraps line, target, states, tokens, and motion", async () => {
  const source = await readFile("src/components/ui/drag-handle.tsx", "utf8");

  assert.match(source, /data-\[orientation=horizontal\]:before:w-6/);
  assert.match(source, /data-\[orientation=vertical\]:before:h-6/);
  assert.match(source, /data-\[orientation=horizontal\]:after:w-1/);
  assert.match(source, /data-\[orientation=vertical\]:after:h-1/);
  assert.equal(source.match(/z-\[9999\]/g)?.length, 2);
  assert.match(source, /hover:after:bg-primary \[&\[data-is-held=true\]\]:after:bg-primary/);
  assert.match(source, /\[&\[data-variant=ghost\]:focus-visible\]:border-/);
  assert.match(source, /focus-visible:outline-2 focus-visible:outline-\[var\(--ring\)\]/);
  assert.match(source, /duration-\[var\(--duration-slow\)\]/);
  assert.match(source, /motion-reduce:transition-none motion-reduce:after:transition-none/);
  assert.doesNotMatch(source, /\.module\.css|<Container/);
});
