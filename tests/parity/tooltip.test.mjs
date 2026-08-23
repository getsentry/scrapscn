import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("records the local Tooltip port without claiming the Figma gate", async () => {
  const manifest = JSON.parse(await readFile("scraps-parity.json", "utf8"));
  const tooltip = manifest.modules.find(({ name }) => name === "tooltip");
  assert.deepEqual(tooltip.canonical.publicExports, {
    runtime: ["Tooltip", "TooltipContext"],
    types: ["TooltipProps"],
  });
  assert.deepEqual(tooltip.local.implementationPaths, ["src/components/ui/tooltip.tsx"]);
  assert.deepEqual(tooltip.local.implementedExports, {
    runtime: ["Tooltip", "TooltipContext"],
    types: ["TooltipProps"],
  });
  assert.deepEqual(tooltip.local.registryItems, ["tooltip"]);
  assert.deepEqual(tooltip.local.stories, ["src/components/ui/tooltip.stories.tsx"]);
  assert.deepEqual(tooltip.local.tests, [
    "src/components/ui/tooltip.test.tsx",
    "tests/e2e/playground.spec.ts",
    "tests/parity/tooltip.test.mjs",
    "tests/types/tooltip-types.test.tsx",
  ]);
  assert.equal(tooltip.local.playgroundPath, "/?component=tooltip");
  assert.deepEqual(tooltip.local.figmaNodes, [
    "https://www.figma.com/design/eTJz6aPgudMY9E6mzyZU0B?node-id=6775-627",
  ]);
  assert.deepEqual(tooltip.completion, {
    state: "partial",
    complete: false,
    note: "The local Tooltip API, positioning, delay group, overflow observation, motion, workbench, focused tests, and self-contained registry item are present. The canonical Figma node and Code Connect mapping have not been verified.",
  });
});

test("publishes the full Tooltip registry closure", async () => {
  const registry = JSON.parse(await readFile("registry.json", "utf8"));
  const tooltip = registry.items.find(({ name }) => name === "tooltip");
  assert.deepEqual(tooltip.dependencies, [
    "@base-ui/react@1.5.0",
    "@emotion/react@11.14.0",
    "@fontsource/rubik@5.2.8",
    "framer-motion@12.38.0",
  ]);
  assert.deepEqual(tooltip.files, [
    {
      path: "src/components/ui/tooltip.module.css",
      type: "registry:file",
      target: "src/components/ui/tooltip.module.css",
    },
    { path: "src/components/ui/tooltip.tsx", type: "registry:ui" },
  ]);
});

test("keeps Tooltip positioning, observation, interaction, and motion seams", async () => {
  const source = await readFile("src/components/ui/tooltip.tsx", "utf8");
  const styles = await readFile("src/components/ui/tooltip.module.css", "utf8");
  assert.match(styles, /^@import "@fontsource\/rubik\/400\.css";/);
  for (const fragment of [
    "Array.from(element.children).some(isOverflown)",
    "new ResizeObserver",
    "new MutationObserver",
    "ref={setTriggerElementRef}",
    "render={trigger}",
    "collisionPadding={COLLISION_PADDING}",
    "popupElement?.getBoundingClientRect()",
    "popupResizeObserver?.observe",
    "<TooltipArrow />",
    "onMouseDown={stopPropagation}",
    "onPointerDown={stopPropagation}",
    "ownerWindow?.addEventListener(\"resize\"",
    "ownerDocument.addEventListener(\"scroll\"",
    "new IntersectionObserver",
    "useIsPresent()",
    "pointerEvents: isPresent ? undefined : \"none\"",
    "useReducedMotion()",
  ]) {
    assert.ok(source.includes(fragment), `Missing Tooltip seam: ${fragment}`);
  }
  for (const legacyExport of ["TooltipContent", "TooltipProvider", "TooltipTrigger"]) {
    assert.doesNotMatch(source, new RegExp(`export[^{;]*\\b${legacyExport}\\b`));
  }
});
