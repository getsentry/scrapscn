import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

const completionNote =
  "Exact regular Scraps Tabs, TabStateProvider, TabList.Item, and TabPanels.Item contracts, controlled and uncontrolled selection, manual keyboard activation, disabled and hidden items, horizontal overflow, links, tooltips, sizes, orientations, variants, workbench, production browser behavior, and standalone registry delivery use literal Tailwind classes and pinned theme tokens. TabListItemProps.tooltip and the legacy internal tooltipProps path inherit the shared TooltipProps.overlayStyle portable-contract input exclusion recorded in scope.excludedContractInputs. The Tabs MDX resource resolves to the generic Button node, so Tabs has no Code Connect mapping or Figma property vocabulary.";

test("records the complete pinned regular Scraps Tabs clone", async () => {
  const manifest = JSON.parse(await readFile("scraps-parity.json", "utf8"));
  const component = manifest.modules.find(({ name }) => name === "tabs");
  const button = manifest.modules.find(({ name }) => name === "button");

  assert.deepEqual(component.canonical.publicExports, {
    runtime: ["TabList", "TabPanels", "TabStateProvider", "Tabs"],
    types: ["TabListItemProps"],
  });
  assert.deepEqual(component.local.implementedExports, {
    runtime: ["TabList", "TabPanels", "TabStateProvider", "Tabs"],
    types: ["TabListItemProps"],
  });
  assert.deepEqual(component.local.implementationPaths, ["src/components/ui/tabs.tsx"]);
  assert.deepEqual(component.local.registryItems, ["tabs"]);
  assert.equal(component.local.playgroundPath, "/?component=tabs");
  assert.deepEqual(component.local.codeConnect, []);
  assert.deepEqual(component.local.figmaNodes, []);
  assert.deepEqual(button.local.figmaNodes, [
    "https://www.figma.com/design/eTJz6aPgudMY9E6mzyZU0B?node-id=384-2119",
  ]);
  assert.deepEqual(component.completion, {
    state: "complete",
    complete: true,
    note: completionNote,
    excludedContractInputs: ["tooltip.overlayStyle.serializedStyles"],
  });
});

test("publishes a self-contained Tabs registry artifact", async () => {
  const registry = JSON.parse(await readFile("registry.json", "utf8"));
  const component = registry.items.find(({ name }) => name === "tabs");

  assert.deepEqual(component.dependencies, [
    "@react-aria/tabs@3.12.1",
    "@react-stately/collections@3.13.1",
    "@react-stately/list@3.14.1",
    "@react-stately/tabs@3.9.1",
    "@react-types/shared@3.36.0",
    "lucide-react@1.16.0",
  ]);
  assert.deepEqual(component.registryDependencies, [
    "https://scrapscn.sentry.dev/r/button.json",
    "https://scrapscn.sentry.dev/r/compact-select.json",
    "https://scrapscn.sentry.dev/r/link.json",
    "https://scrapscn.sentry.dev/r/scraps-locale.json",
    "https://scrapscn.sentry.dev/r/sentry-base.json",
    "https://scrapscn.sentry.dev/r/tooltip.json",
  ]);
  assert.equal(component.cssVars.light["scraps-tabs-accent-selected-rest"], "#0000f008");
  assert.equal(component.cssVars.dark["scraps-tabs-accent-selected-rest"], "#5828f05e");

  const directory = await mkdtemp(path.join(tmpdir(), "scrapscn-tabs-"));
  try {
    execFileSync("pnpm", ["exec", "shadcn", "build", "registry.json", "--output", directory], {
      cwd: process.cwd(),
      stdio: "pipe",
    });
    const built = JSON.parse(await readFile(path.join(directory, "tabs.json"), "utf8"));
    assert.equal(
      built.files.find(({ path: file }) => file === "src/components/ui/tabs.tsx")?.content,
      await readFile("src/components/ui/tabs.tsx", "utf8"),
    );
  } finally {
    await rm(directory, { recursive: true });
  }
});

test("keeps source-grounded React Aria and Tailwind evidence", async () => {
  const source = await readFile("src/components/ui/tabs.tsx", "utf8");

  for (const fragment of [
    "@react-aria/tabs",
    "@react-stately/tabs",
    "TabList.Item = TabListItem",
    "TabPanels.Item = TabPanelItem",
    'keyboardActivation = "manual"',
    "RESERVED_OVERFLOW_TRIGGER_WIDTH = 48",
    "new ResizeObserver",
    "More tabs",
    'disableOverflow || orientation !== "horizontal"',
    "outerWrapStyles",
    "scraps-tabs-accent-selected-rest",
    "scraps-tabs-indicator",
  ]) {
    assert.match(source, new RegExp(fragment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.doesNotMatch(source, /@emotion\//);
  assert.doesNotMatch(source, /styled\(/);
  assert.doesNotMatch(source, /\.module\.css/);
});
