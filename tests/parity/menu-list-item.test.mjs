import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

const completionNote =
  "Exact regular Scraps MenuListItem API, states, slots, tooltip, fixed details overlay, workbench, production browser behavior, and standalone registry delivery use literal Tailwind classes. MenuListItemProps.tooltipOptions inherits the shared TooltipProps.overlayStyle portable-contract input exclusion recorded in scope.excludedContractInputs. The canonical module has no MenuListItem Figma node.";
test("records the complete regular Scraps MenuListItem clone", async () => {
  const manifest = JSON.parse(await readFile("scraps-parity.json", "utf8"));
  const item = manifest.modules.find(({ name }) => name === "menuListItem");
  assert.deepEqual(item.local.implementedExports, {
    runtime: ["InnerWrap", "LeadingItems", "MenuListItem"],
    types: ["MenuListItemProps"],
  });
  assert.deepEqual(item.local.registryItems, ["menu-list-item"]);
  assert.equal(item.local.playgroundPath, "/?component=menu-list-item");
  assert.deepEqual(item.completion, {
    state: "complete",
    complete: true,
    note: completionNote,
    excludedContractInputs: ["tooltip.overlayStyle.serializedStyles"],
  });
});
test("keeps menu state, slots, tooltip, and fixed overlay in literal Tailwind", async () => {
  const source = await readFile("src/components/ui/menu-list-item.tsx", "utf8");
  for (const fragment of [
    "MenuListItemProps",
    "MenuListItem = memo",
    "LeadingItems",
    "InnerWrap",
    "showDetailsInOverlay",
    "computePosition",
    "autoUpdate",
    'placement: "right-start"',
    'strategy: "fixed"',
    "offset({ mainAxis: 8, crossAxis: -4 })",
    "flip(),",
    "delay={500}",
    'data-test-id="menu-list-item-label"',
    'xs: "py-1 text-[12px] [line-height:1.4]"',
    'sm: "py-1.5 text-[14px] [line-height:1.4]"',
    'md: "py-2 text-[14px] [line-height:1.4]"',
    "shift({ limiter: limitShift(), padding: 0 })",
    'hide({ strategy: "referenceHidden" })',
    'hide({ strategy: "escaped" })',
    "data-popper-reference-hidden={position?.referenceHidden}",
    "data-popper-escaped={position?.escaped}",
    "mergeRefs(ref, itemRef)",
    'position?.referenceHidden && "pointer-events-none opacity-0"',
    "rounded-[6px] pr-2 pl-3",
    "mr-2 flex shrink-0 items-start gap-2",
    "justify-between gap-2",
    '"text-xs [line-height:1.4] text-[var(--scraps-content-secondary,#6a6772)]',
    "fixed z-[10003]",
    "cursor-auto overflow-auto rounded-[6px]",
    "shadow-[0_2px_0_var(--scraps-menu-list-item-overlay-shadow,#dad9de)]",
    "[user-select:contain]",
  ])
    assert.ok(source.includes(fragment), fragment);
  assert.doesNotMatch(
    source,
    /@emotion|styled\(|\.module\.css|react-popper|lucide-react|before:rounded-\[inherit\]|\bgap-3\b|\bmr-3\b|\bpr-3\b|\bpl-4\b|\bpy-3\b|\bz-50\b|\bshadow-sm\b/,
  );
});
test("publishes MenuListItem and keeps checked-in registry artifacts current", async () => {
  const registry = JSON.parse(await readFile("registry.json", "utf8"));
  const item = registry.items.find(({ name }) => name === "menu-list-item");
  assert.deepEqual(item.dependencies, ["@floating-ui/dom@1.7.6", "@react-aria/utils@3.34.1"]);
  assert.deepEqual(item.registryDependencies, [
    "https://scrapscn.sentry.dev/r/interaction-state-layer.json",
    "https://scrapscn.sentry.dev/r/tooltip.json",
  ]);
  assert.deepEqual(item.cssVars.light, {
    "scraps-content-primary": "#302e36",
    "scraps-content-secondary": "#6a6772",
    "scraps-content-accent": "#653de9",
    "scraps-content-danger": "#d50000",
    "scraps-menu-list-item-overlay-background": "#ffffff",
    "scraps-menu-list-item-overlay-border": "#dad9de",
    "scraps-menu-list-item-overlay-shadow": "#dad9de",
    "scraps-theme-border-primary": "#dad9de",
  });
  assert.deepEqual(item.cssVars.dark, {
    "scraps-content-primary": "#e7e5ea",
    "scraps-content-secondary": "#b5b0bd",
    "scraps-content-accent": "#aba8f8",
    "scraps-content-danger": "#f6938c",
    "scraps-menu-list-item-overlay-background": "#393442",
    "scraps-menu-list-item-overlay-border": "#141119",
    "scraps-menu-list-item-overlay-shadow": "#141119",
    "scraps-theme-border-primary": "#141119",
  });
  const directory = await mkdtemp(path.join(tmpdir(), "scrapscn-menu-list-item-"));
  try {
    execFileSync("pnpm", ["exec", "shadcn", "build", "registry.json", "--output", directory], {
      cwd: process.cwd(),
      stdio: "pipe",
    });
    const built = JSON.parse(await readFile(path.join(directory, "menu-list-item.json"), "utf8"));
    assert.equal(
      built.files.find(({ path: filePath }) => filePath === "src/components/ui/menu-list-item.tsx")
        ?.content,
      await readFile("src/components/ui/menu-list-item.tsx", "utf8"),
    );
    assert.deepEqual(JSON.parse(await readFile("public/r/menu-list-item.json", "utf8")), built);
    assert.deepEqual(
      JSON.parse(await readFile("public/r/registry.json", "utf8")),
      JSON.parse(await readFile(path.join(directory, "registry.json"), "utf8")),
    );
  } finally {
    await rm(directory, { recursive: true });
  }
});
