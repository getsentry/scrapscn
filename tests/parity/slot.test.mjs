import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("slot keeps the regular Scraps portal and context bridge contract", async () => {
  const slot = await readFile("src/components/ui/slot.tsx", "utf8");
  const registry = JSON.parse(await readFile("registry.json", "utf8"));
  const parity = JSON.parse(await readFile("scraps-parity.json", "utf8"));
  const parityModule = parity.modules.find(({ name }) => name === "slot");
  const registryItem = registry.items.find(({ name }) => name === "slot");

  assert.match(slot, /export function slot/);
  assert.match(slot, /export function withSlots/);
  assert.match(slot, /createPortal/);
  assert.match(slot, /SizeContext, ContainerQueryContext/);
  assert.match(slot, /useSlotOutletRef/);
  assert.match(slot, /Slot\.Fallback must be rendered inside Slot\.Outlet/);
  assert.deepEqual(parityModule.local.implementationPaths, ["src/components/ui/slot.tsx"]);
  assert.deepEqual(parityModule.local.registryItems, ["slot"]);
  assert.deepEqual(parityModule.local.stories, ["src/components/ui/slot.stories.tsx"]);
  assert.deepEqual(parityModule.local.tests, [
    "src/components/ui/slot.test.tsx",
    "tests/e2e/playground.spec.ts",
    "tests/parity/slot.test.mjs",
  ]);
  assert.equal(parityModule.local.playgroundPath, "/?component=slot");
  assert.equal(parityModule.completion.complete, true);
  assert.deepEqual(parityModule.canonical.sourcePaths, [
    "static/app/components/core/sizeContext.tsx",
    "static/app/components/core/slot/index.tsx",
    "static/app/components/core/slot/knownContexts.ts",
    "static/app/components/core/slot/slot.tsx",
  ]);
  assert.deepEqual(registryItem.dependencies, ["@sentry/react@10.69.0"]);
  assert.deepEqual(
    registryItem.files.map(({ path }) => path),
    [
      "src/components/ui/container-query-context.ts",
      "src/components/ui/size-context.tsx",
      "src/components/ui/slot.tsx",
    ],
  );
});
