import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("records the complete local Tooltip port and portable input exclusion", async () => {
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
  assert.deepEqual(tooltip.local.codeConnect, ["src/components/ui/tooltip.figma.ts"]);
  assert.equal(tooltip.local.playgroundPath, "/?component=tooltip");
  assert.deepEqual(tooltip.local.figmaNodes, [
    "https://www.figma.com/design/eTJz6aPgudMY9E6mzyZU0B?node-id=6775-627",
  ]);
  assert.equal(tooltip.completion.state, "complete");
  assert.equal(tooltip.completion.complete, true);
  assert.match(tooltip.completion.note, /synchronous disabled reset/);
  assert.deepEqual(tooltip.completion.excludedContractInputs, [
    "tooltip.overlayStyle.serializedStyles",
  ]);
});

test("publishes the full Tooltip registry closure", async () => {
  const registry = JSON.parse(await readFile("registry.json", "utf8"));
  const tooltip = registry.items.find(({ name }) => name === "tooltip");
  assert.deepEqual(tooltip.dependencies, [
    "@base-ui/react@1.5.0",
    "@fontsource/rubik@5.2.8",
    "framer-motion@12.38.0",
  ]);
  assert.deepEqual(tooltip.files, [
    {
      path: "src/components/ui/rubik.css",
      type: "registry:file",
      target: "src/components/ui/rubik.css",
    },
    { path: "src/components/ui/tooltip.tsx", type: "registry:ui" },
  ]);
});

test("keeps Tooltip positioning, observation, interaction, and motion seams", async () => {
  const source = await readFile("src/components/ui/tooltip.tsx", "utf8");
  const fontStyles = await readFile("src/components/ui/rubik.css", "utf8");
  assert.match(fontStyles, /font-family: "Rubik"/);
  assert.match(source, /import "\.\/rubik\.css"/);
  assert.match(source, /Object\.assign\(TooltipComponent/);
  assert.match(source, /Header: TooltipHeader/);
  assert.match(source, /Grid: TooltipGrid/);
  assert.match(source, /Row: TooltipRow/);
  assert.match(source, /Footer: TooltipFooter/);
  assert.match(source, /data-tooltip-section/);
  assert.match(source, /\[&>\[data-tooltip-section\]\]:-mx-3/);
  assert.match(source, /\[&>\[data-tooltip-section\]~\[data-tooltip-section\]\]:mt-0/);
  assert.match(source, /\[&>\[data-tooltip-section\]:last-child\]:-mb-2/);
  assert.match(source, /className="contents"/);
  assert.match(source, /trailingItems !== null && trailingItems !== undefined/);
  assert.doesNotMatch(source, /\.module\.css|styles\./);
  assert.match(source, /z-\[10003\]/);
  assert.match(source, /\[font-family:var\(--font-rubik,'Rubik'\),sans-serif\]/);
  assert.match(source, /motion-reduce:transition-none/);
  assert.match(source, /data-\[side=left\]:\[transform:rotate\(-90deg\)\]/);
  assert.match(source, /data-\[side=left\]:h-4/);
  assert.match(source, /points="-2,0 16,0 8,5\.8 6,5\.8"/);
  assert.match(source, /points="0,0 16,0 8,7\.8"/);
  assert.match(source, /points="1\.5,0 14\.5,0 8,4\.8"/);
  assert.match(source, /group-data-\[side=right\]\/tooltip-arrow:\[transform:translateX\(2px\)\]/);
  const codeConnect = await readFile("src/components/ui/tooltip.figma.ts", "utf8");
  assert.match(codeConnect, /findText\("Text"\)/);
  assert.match(codeConnect, /getEnum\("position"/);
  assert.match(codeConnect, /import \{ Tooltip \} from "@\/components\/ui\/tooltip"/);
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
    'ownerWindow?.addEventListener("resize"',
    'ownerDocument.addEventListener("scroll"',
    "new IntersectionObserver",
    "useIsPresent()",
    'pointerEvents: isPresent ? undefined : "none"',
    "useReducedMotion()",
  ]) {
    assert.ok(source.includes(fragment), `Missing Tooltip seam: ${fragment}`);
  }
  assert.doesNotMatch(source, /@emotion|ClassNames|SerializedStyles/);
  assert.doesNotMatch(
    source,
    /insertRule|createElement\(["']style|dangerouslySetInnerHTML|CSSStyleSheet/,
  );
  for (const legacyExport of ["TooltipContent", "TooltipProvider", "TooltipTrigger"]) {
    assert.doesNotMatch(source, new RegExp(`export[^{;]*\\b${legacyExport}\\b`));
  }
});
