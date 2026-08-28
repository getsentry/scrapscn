import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

const completionNote =
  "Exact regular Scraps CompactSelect and CompositeSelect public exports, controlled single and multiple selection, clear behavior, sections, search, highlighting, custom triggers, list and grid modes, focus, keyboard behavior, disabled options, select-all sections, virtualization, positioning options, menu composition, workbench, focused tests, and standalone registry delivery use literal Tailwind classes. Select option tooltipOptions inherit the shared TooltipProps.overlayStyle portable-contract input exclusion recorded in scope.excludedContractInputs. The canonical module has no Code Connect file or approved component property vocabulary to copy.";

test("records the complete regular Scraps CompactSelect clone", async () => {
  const manifest = JSON.parse(await readFile("scraps-parity.json", "utf8"));
  const component = manifest.modules.find((module) => module.name === "compactSelect");
  assert.deepEqual(component.canonical.publicExports, {
    runtime: [
      "CompactSelect",
      "CompositeSelect",
      "ControlContext",
      "HighlightText",
      "LeadWrap",
      "ListBox",
      "ListLabel",
      "ListSeparator",
      "ListWrap",
      "MenuComponents",
      "SectionGroup",
      "SectionHeader",
      "SectionSeparator",
      "SectionTitle",
      "SectionToggle",
      "SectionWrap",
      "SelectFilterContext",
      "SizeLimitMessage",
      "TriggerLabel",
      "getDisabledOptions",
      "getEscapedKey",
      "getHiddenOptions",
      "getItemsWithKeys",
      "itemIsSectionWithKey",
      "useVirtualizedItems",
    ],
    types: [
      "MultipleSelectProps",
      "SearchMatchResult",
      "SelectKey",
      "SelectOption",
      "SelectOptionOrSection",
      "SelectOptionOrSectionWithKey",
      "SelectOptionWithKey",
      "SelectProps",
      "SelectSection",
      "SelectSectionWithKey",
      "SingleSelectProps",
    ],
  });
  for (const name of [
    ...component.canonical.publicExports.runtime,
    ...component.canonical.publicExports.types,
  ]) {
    assert.ok(
      component.local.implementedExports.runtime.includes(name) ||
        component.local.implementedExports.types.includes(name),
      name,
    );
  }
  assert.deepEqual(component.local.registryItems, ["compact-select"]);
  assert.equal(component.local.playgroundPath, "/?component=compact-select");
  assert.deepEqual(component.local.codeConnect, []);
  assert.deepEqual(component.local.figmaNodes, []);
  assert.ok(component.canonical.sourcePaths.includes("static/app/utils/search/fzf.tsx"));
  assert.ok(component.canonical.sourcePaths.includes("static/app/utils/search/fzf.spec.tsx"));
  assert.deepEqual(component.completion, {
    state: "complete",
    complete: true,
    excludedContractInputs: ["tooltip.overlayStyle.serializedStyles"],
    note: completionNote,
  });
});

test("keeps selection, search, composition, and positioning in Tailwind", async () => {
  const source = `${await readFile(
    "src/components/ui/compact-select.tsx",
    "utf8",
  )}\n${await readFile("src/components/ui/compact-select-support.tsx", "utf8")}`;
  for (const fragment of [
    "export function CompactSelect",
    "export const CompositeSelect",
    "export const MenuComponents",
    "getHiddenOptions(",
    "getDisabledOptions(",
    "useVirtualizedItems",
    "getFloatingAutoPlacementMiddleware(placement, flipOptions)",
    "getFloatingFlipMiddleware(flipOptions)",
    "getFloatingShiftOptions(preventOverflowOptions, defaultBoundary)",
    "floatingSize({",
    "limitShift({",
    "AriaGridListOptions<ListItemBase>",
    "AriaListBoxOptions<ListItemBase>",
    "autoAlignment: flipVariations",
    "crossAxis: options?.altAxis ?? true",
    "mainAxis: options?.mainAxis ?? true",
    "flipAlignment: options?.flipVariations ?? false",
    "useInteractOutside,",
    "useCompactSelectOverlay({",
    "keyboardNavigationBehavior={selectionProps.keyboardNavigationBehavior}",
    'mode === "grid"',
    'selectionMode: multiple ? "multiple" : "single"',
    'data-slot="compact-select-selection-checkbox"',
  ]) {
    assert.ok(source.includes(fragment), fragment);
  }
  assert.doesNotMatch(source, /@emotion|styled\(|\.module\.css|SerializedStyles/);
});

test("publishes the complete CompactSelect registry closure", async () => {
  const registry = JSON.parse(await readFile("registry.json", "utf8"));
  const item = registry.items.find(({ name }) => name === "compact-select");
  assert.deepEqual(
    item.files.map((file) => file.path),
    [
      "THIRD_PARTY_NOTICES.md",
      "src/components/ui/compact-select-support.tsx",
      "src/components/ui/boundary-context.tsx",
      "src/components/ui/compact-select.tsx",
    ],
  );
  const notice = await readFile("THIRD_PARTY_NOTICES.md", "utf8");
  assert.match(notice, /Copyright 2013-2020 Junegunn Choi/);
  assert.match(notice, /MIT License/);
  assert.deepEqual(item.registryDependencies, [
    "https://scrapscn.sentry.dev/r/alert.json",
    "https://scrapscn.sentry.dev/r/badge.json",
    "https://scrapscn.sentry.dev/r/button.json",
    "https://scrapscn.sentry.dev/r/checkbox.json",
    "https://scrapscn.sentry.dev/r/input.json",
    "https://scrapscn.sentry.dev/r/layout.json",
    "https://scrapscn.sentry.dev/r/menu-list-item.json",
    "https://scrapscn.sentry.dev/r/scraps-locale.json",
    "https://scrapscn.sentry.dev/r/text.json",
  ]);

  const directory = await mkdtemp(path.join(tmpdir(), "scrapscn-compact-select-"));
  try {
    execFileSync("pnpm", ["exec", "shadcn", "build", "registry.json", "--output", directory], {
      cwd: process.cwd(),
      stdio: "pipe",
    });
    assert.deepEqual(
      JSON.parse(await readFile("public/r/compact-select.json", "utf8")),
      JSON.parse(await readFile(path.join(directory, "compact-select.json"), "utf8")),
    );
    assert.deepEqual(
      JSON.parse(await readFile("public/r/registry.json", "utf8")),
      JSON.parse(await readFile(path.join(directory, "registry.json"), "utf8")),
    );
  } finally {
    await rm(directory, { recursive: true });
  }
});
