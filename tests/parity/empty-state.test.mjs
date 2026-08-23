import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("records the local regular Scraps EmptyState delivery without overclaiming", async () => {
  const manifest = JSON.parse(await readFile("scraps-parity.json", "utf8"));
  const emptyState = manifest.modules.find(({ name }) => name === "emptyState");
  assert.deepEqual(emptyState.canonical.sourcePaths, [
    "static/app/components/core/emptyState/emptyState.mdx",
    "static/app/components/core/emptyState/emptyState.tsx",
    "static/app/components/core/emptyState/index.tsx",
    "static/app/components/core/layout/container.tsx",
    "static/app/components/core/layout/flex.tsx",
    "static/app/components/core/layout/index.tsx",
    "static/app/components/core/layout/stack.tsx",
    "static/app/components/core/layout/styles.tsx",
    "static/app/components/core/text/heading.tsx",
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
  ]);
  assert.deepEqual(emptyState.canonical.publicExports, { runtime: ["EmptyState"], types: [] });
  assert.deepEqual(emptyState.local.implementationPaths, ["src/components/ui/empty-state.tsx"]);
  assert.deepEqual(emptyState.local.implementedExports, { runtime: ["EmptyState"], types: [] });
  assert.deepEqual(emptyState.local.registryItems, ["empty-state"]);
  assert.deepEqual(emptyState.local.stories, ["src/components/ui/empty-state.stories.tsx"]);
  assert.deepEqual(emptyState.local.tests, [
    "src/app/evidence/empty-state-server/page.tsx",
    "src/components/ui/empty-state.test.tsx",
    "tests/e2e/playground.spec.ts",
    "tests/parity/empty-state.test.mjs",
    "tests/types/empty-state-types.test.tsx",
  ]);
  assert.equal(emptyState.local.playgroundPath, "/?component=empty-state");
  assert.deepEqual(emptyState.local.figmaNodes, [
    "https://www.figma.com/design/eTJz6aPgudMY9E6mzyZU0B?node-id=13363-6895",
  ]);
  assert.deepEqual(emptyState.local.codeConnect, []);
  assert.deepEqual(emptyState.completion, {
    state: "partial",
    complete: false,
    note: "The local EmptyState implementation, workbench, focused tests, and intended registry dependency URLs are present. Figma, Code Connect, and installation from the protected shared registry have not been verified.",
  });
});

test("publishes EmptyState through its Layout and Text seams", async () => {
  const registry = JSON.parse(await readFile("registry.json", "utf8"));
  const item = registry.items.find(({ name }) => name === "empty-state");
  assert.deepEqual(item.registryDependencies, [
    "https://scrapscn.sentry.dev/r/layout.json",
    "https://scrapscn.sentry.dev/r/text.json",
  ]);
  assert.deepEqual(item.files, [{ path: "src/components/ui/empty-state.tsx", type: "registry:ui" }]);
});

test("keeps the canonical EmptyState source contract", async () => {
  const source = await readFile("src/components/ui/empty-state.tsx", "utf8");
  for (const fragment of [
    'containerType="inline-size"', 'width="100%"', 'flexGrow={1}', 'minWidth={0}',
    'direction={{ zero: "column", [switchOn]: "row" }}', 'gap={{ zero: "xl", [switchOn]: "2xl" }}',
    'maxWidth="48ch"', 'textWrap="balance"', 'wrap="wrap"', 'data-test-id="empty-state"', '...props',
  ]) assert.match(source, new RegExp(fragment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});
