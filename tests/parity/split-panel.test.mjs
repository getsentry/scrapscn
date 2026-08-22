import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("records the complete regular Scraps SplitPanel delivery", async () => {
  const manifest = JSON.parse(await readFile("scraps-parity.json", "utf8"));
  const splitPanel = manifest.modules.find(({ name }) => name === "splitPanel");
  assert.deepEqual(splitPanel.canonical.sourcePaths, [
    "static/app/components/core/splitPanel/index.tsx",
    "static/app/components/core/splitPanel/splitPanel.tsx",
    "static/app/utils/useDimensions.tsx",
    "static/app/utils/useResizableDrawer.tsx",
  ]);
  assert.deepEqual(splitPanel.local.implementationPaths, ["src/components/ui/split-panel.tsx"]);
  assert.deepEqual(splitPanel.local.registryItems, ["split-panel"]);
  assert.deepEqual(splitPanel.local.tests, [
    "src/components/ui/split-panel.test.tsx",
    "tests/e2e/playground.spec.ts",
    "tests/parity/split-panel.test.mjs",
    "tests/types/split-panel-types.test.tsx",
  ]);
  assert.deepEqual(splitPanel.local.figmaNodes, []);
  assert.equal(splitPanel.local.playgroundPath, "/?component=split-panel");
  assert.equal(splitPanel.completion.complete, true);
});

test("publishes the full local SplitPanel dependency closure", async () => {
  const registry = JSON.parse(await readFile("registry.json", "utf8"));
  const item = registry.items.find(({ name }) => name === "split-panel");
  assert.deepEqual(item.registryDependencies, []);
  assert.deepEqual(item.dependencies, [
    "@emotion/is-prop-valid@1.4.0",
    "@react-aria/interactions@3.28.1",
    "@react-aria/utils@3.34.1",
  ]);
  assert.deepEqual(item.cssVars, {
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
  assert.deepEqual(item.files, [
    { path: "src/components/ui/container-query-context.ts", type: "registry:ui" },
    { path: "src/components/ui/drag-handle.module.css", type: "registry:file", target: "src/components/ui/drag-handle.module.css" },
    { path: "src/components/ui/drag-handle.tsx", type: "registry:ui" },
    { path: "src/components/ui/layout-style-engine.ts", type: "registry:ui" },
    { path: "src/components/ui/layout.tsx", type: "registry:ui" },
    { path: "src/components/ui/separator.tsx", type: "registry:ui" },
    { path: "src/components/ui/split-panel.module.css", type: "registry:file", target: "src/components/ui/split-panel.module.css" },
    { path: "src/components/ui/split-panel.tsx", type: "registry:ui" },
    { path: "src/components/ui/use-drag-move.tsx", type: "registry:ui" },
    { path: "src/components/ui/use-drag-separator.tsx", type: "registry:ui" },
  ]);
});

test("keeps the iframe drag lock at the canonical triple specificity", async () => {
  const styles = await readFile("src/components/ui/split-panel.module.css", "utf8");
  assert.match(styles, /\.root\.root\.root\[data-is-held="true"\] iframe/);
  assert.match(styles, /pointer-events:\s*none\s*!important/);
});
