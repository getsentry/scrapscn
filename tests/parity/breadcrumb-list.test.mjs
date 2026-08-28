import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

const completionNote =
  "Exact regular Scraps BreadcrumbList parent and title contracts, 512px container-query collapse, project selection, pagination, actions, editable title behavior, workbench, focused tests, local registry item, and canonical MDX Figma resource are present. Breadcrumb button actions inherit the shared TooltipProps.overlayStyle portable-contract input exclusion recorded in scope.excludedContractInputs. The canonical module has no Code Connect mapping or property vocabulary to copy.";

test("records the complete regular Scraps BreadcrumbList clone", async () => {
  const manifest = JSON.parse(await readFile("scraps-parity.json", "utf8"));
  const component = manifest.modules.find((module) => module.name === "breadcrumbList");
  assert.deepEqual(component.canonical.publicExports, {
    runtime: ["BreadcrumbList"],
    types: ["BreadcrumbTitleItem"],
  });
  assert.deepEqual(component.local.implementedExports, {
    runtime: ["BreadcrumbList"],
    types: ["BreadcrumbTitleItem"],
  });
  assert.deepEqual(component.local.registryItems, ["breadcrumb-list"]);
  assert.equal(component.local.playgroundPath, "/?component=breadcrumb-list");
  assert.deepEqual(component.local.figmaNodes, [
    "https://www.figma.com/design/a638AEl7pFxj29zMODCiOB?node-id=1198-17420",
  ]);
  assert.deepEqual(component.local.codeConnect, []);
  assert.deepEqual(component.completion, {
    state: "complete",
    complete: true,
    excludedContractInputs: ["tooltip.overlayStyle.serializedStyles"],
    note: completionNote,
  });
});

test("keeps selection, actions, editing, localization, and collapse in literal Tailwind", async () => {
  const source = await readFile("src/components/ui/breadcrumb-list.tsx", "utf8");
  for (const fragment of [
    'role="listbox"',
    'role="option"',
    "aria-selected={isSelected}",
    "showDetailsInOverlay={option.showDetailsInOverlay}",
    "tooltipOptions={option.tooltipOptions}",
    "resolveSubmenuPosition",
    'requestedSide = "right", requestedAlign = "start"',
    "data-requested-side={side}",
    "aria-errormessage={showError ? errorId : undefined}",
    'role="alert"',
    't("Selected Project: %s", label)',
    't("More breadcrumbs")',
    'const visibleWhenWide = { zero: "none", sm: "flex" }',
    'const visibleWhenNarrow = { zero: "flex", sm: "none" }',
    'containerType={hasParentQueryContainer ? "normal" : "inline-size"}',
    "BreadcrumbList.Title = Title",
  ]) {
    assert.ok(source.includes(fragment), fragment);
  }
  assert.doesNotMatch(source, /@emotion|styled\(|\.module\.css|DO_NOT_USE_getButtonStyles/);
});

test("publishes the complete BreadcrumbList registry closure", async () => {
  const registry = JSON.parse(await readFile("registry.json", "utf8"));
  const item = registry.items.find(({ name }) => name === "breadcrumb-list");
  assert.deepEqual(item.registryDependencies, [
    "https://scrapscn.sentry.dev/r/button.json",
    "https://scrapscn.sentry.dev/r/info.json",
    "https://scrapscn.sentry.dev/r/layout.json",
    "https://scrapscn.sentry.dev/r/link.json",
    "https://scrapscn.sentry.dev/r/menu-list-item.json",
    "https://scrapscn.sentry.dev/r/scraps-locale.json",
    "https://scrapscn.sentry.dev/r/tooltip.json",
  ]);

  const directory = await mkdtemp(path.join(tmpdir(), "scrapscn-breadcrumb-"));
  try {
    execFileSync("pnpm", ["exec", "shadcn", "build", "registry.json", "--output", directory], {
      cwd: process.cwd(),
      stdio: "pipe",
    });
    assert.deepEqual(
      JSON.parse(await readFile("public/r/breadcrumb-list.json", "utf8")),
      JSON.parse(await readFile(path.join(directory, "breadcrumb-list.json"), "utf8")),
    );
    assert.deepEqual(
      JSON.parse(await readFile("public/r/registry.json", "utf8")),
      JSON.parse(await readFile(path.join(directory, "registry.json"), "utf8")),
    );
  } finally {
    await rm(directory, { recursive: true });
  }
});
