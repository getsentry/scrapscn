import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("records the complete regular Scraps Table delivery", async () => {
  const manifest = JSON.parse(await readFile("scraps-parity.json", "utf8"));
  const table = manifest.modules.find(({ name }) => name === "table");
  assert.deepEqual(table.canonical.sourcePaths, [
    "static/app/components/core/table/index.tsx",
    "static/app/components/core/table/styles.tsx",
    "static/app/components/core/table/table.tsx",
    "static/app/components/tables/sortableHeaderCell.tsx",
    "static/app/components/tables/useColumnResize.tsx",
    "static/app/components/tables/useObservedColumnSize.tsx",
    "static/app/icons/iconArrow.tsx",
  ]);
  assert.deepEqual(table.local.implementationPaths, ["src/components/ui/table.tsx"]);
  assert.deepEqual(table.local.registryItems, ["table"]);
  assert.deepEqual(table.local.tests, ["src/components/ui/table.test.tsx", "tests/e2e/playground.spec.ts", "tests/parity/table.test.mjs", "tests/types/table-types.test.tsx"]);
  assert.deepEqual(table.local.figmaNodes, []);
  assert.equal(table.local.playgroundPath, "/?component=table");
  assert.equal(table.completion.complete, true);
});

test("publishes the exact self-contained Table closure", async () => {
  const registry = JSON.parse(await readFile("registry.json", "utf8"));
  const item = registry.items.find(({ name }) => name === "table");
  assert.deepEqual(item.dependencies, ["@base-ui/react@1.5.0", "@emotion/is-prop-valid@1.4.0", "@react-aria/interactions@3.28.1", "@react-aria/utils@3.34.1"]);
  assert.deepEqual(item.registryDependencies, []);
  assert.deepEqual(item.files, [
    { path: "src/components/ui/container-query-context.ts", type: "registry:ui" },
    { path: "src/components/ui/drag-handle.module.css", type: "registry:file", target: "src/components/ui/drag-handle.module.css" },
    { path: "src/components/ui/drag-handle.tsx", type: "registry:ui" },
    { path: "src/components/ui/layout-style-engine.ts", type: "registry:ui" },
    { path: "src/components/ui/layout.tsx", type: "registry:ui" },
    { path: "src/components/ui/separator.tsx", type: "registry:ui" },
    { path: "src/components/ui/table.module.css", type: "registry:file", target: "src/components/ui/table.module.css" },
    { path: "src/components/ui/table.tsx", type: "registry:ui" },
    { path: "src/components/ui/use-drag-move.tsx", type: "registry:ui" },
    { path: "src/components/ui/use-drag-separator.tsx", type: "registry:ui" },
  ]);
});

test("keeps exact Table constants and grid style invariants", async () => {
  const source = await readFile("src/components/ui/table.tsx", "utf8");
  const styles = await readFile("src/components/ui/table.module.css", "utf8");
  assert.match(source, /COL_WIDTH_UNDEFINED = -1/);
  assert.match(source, /COL_WIDTH_MINIMUM = 90/);
  assert.match(source, /TABLE_HEAD_ROW_HEIGHT = 45/);
  assert.match(styles, /grid-template-columns:\s*subgrid/);
  assert.match(styles, /--column-resizer-height, 45px/);
  assert.match(styles, /border-bottom:\s*1px solid var\(--scraps-theme-border-secondary\)/);
  assert.match(styles, /box-shadow:\s*var\(--shadow-chonk, 0 2px 0 var\(--border\)\)/);
});
