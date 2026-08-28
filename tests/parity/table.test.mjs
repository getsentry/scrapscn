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
  assert.deepEqual(table.local.tests, [
    "src/components/ui/table.test.tsx",
    "tests/e2e/playground.spec.ts",
    "tests/parity/table.test.mjs",
    "tests/types/table-types.test.tsx",
  ]);
  assert.deepEqual(table.local.figmaNodes, []);
  assert.equal(table.local.playgroundPath, "/?component=table");
  assert.equal(table.completion.state, "complete");
  assert.equal(table.completion.complete, true);
  assert.match(table.completion.note, /production browser behavior/);
});

test("publishes the exact self-contained Table closure", async () => {
  const registry = JSON.parse(await readFile("registry.json", "utf8"));
  const item = registry.items.find(({ name }) => name === "table");
  assert.deepEqual(item.dependencies, [
    "@react-aria/interactions@3.28.1",
    "@react-aria/utils@3.34.1",
  ]);
  assert.deepEqual(item.registryDependencies, ["https://scrapscn.sentry.dev/r/tooltip.json"]);
  assert.deepEqual(item.files, [
    { path: "src/components/ui/drag-handle.tsx", type: "registry:ui" },
    { path: "src/components/ui/table.tsx", type: "registry:ui" },
    { path: "src/components/ui/use-drag-move.tsx", type: "registry:ui" },
    { path: "src/components/ui/use-drag-separator.tsx", type: "registry:ui" },
  ]);
});

test("keeps exact Table constants and grid style invariants", async () => {
  const source = await readFile("src/components/ui/table.tsx", "utf8");
  assert.match(source, /COL_WIDTH_UNDEFINED = -1/);
  assert.match(source, /COL_WIDTH_MINIMUM = 90/);
  assert.match(source, /TABLE_HEAD_ROW_HEIGHT = 45/);
  assert.match(source, /grid-cols-subgrid/);
  assert.match(source, /--column-resizer-height,45px/);
  assert.match(source, /border-b-\[var\(--scraps-theme-border-secondary\)\]/);
  assert.doesNotMatch(source, /\.module\.css|<style\b/);
  assert.match(source, /import \{ Tooltip \} from "\.\/tooltip"/);
  assert.doesNotMatch(source, /@base-ui\/react\/tooltip/);
  assert.match(source, /\[border:0\]/);
  assert.match(source, /\[transform:scale\(1,-1\)\]/);
  assert.match(source, /cursor-default/);
  assert.match(source, /export const fullWidthCellStyle = "items-stretch flex-col p-0"/);
  assert.match(source, /export const statusCellStyle = "min-h-\[200px\] p-4"/);
  assert.match(
    source,
    /export const emptyCellStyle = `\$\{statusCellStyle\} text-\[var\(--scraps-content-secondary\)\] text-sm`/,
  );
  assert.match(
    source,
    /const DETACHED_TABLE_REF: RefObject<HTMLTableElement \| null> = \{ current: null \}/,
  );
  assert.match(source, /export function useTableElement\(\)/);
});
