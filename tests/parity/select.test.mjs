import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

test("records the complete regular Scraps Select clone and Tailwind-only input exclusion", async () => {
  const manifest = JSON.parse(await readFile("scraps-parity.json", "utf8"));
  const item = manifest.modules.find(({ name }) => name === "select");
  assert.deepEqual(item.canonical.publicExports, {
    runtime: ["CheckWrap", "Select", "SelectOption"],
    types: ["ControlProps", "GeneralSelectValue", "SelectValue", "StylesConfig"],
  });
  assert.deepEqual(item.local.implementationPaths, [
    "src/components/ui/body-scroll-lock.ts",
    "src/components/ui/select-types.ts",
    "src/components/ui/select.tsx",
  ]);
  assert.deepEqual(item.local.implementedExports, item.canonical.publicExports);
  assert.deepEqual(item.local.registryItems, ["select"]);
  assert.deepEqual(item.local.codeConnect, []);
  assert.deepEqual(item.local.figmaNodes, []);
  assert.equal(item.local.playgroundPath, "/?component=select");
  assert.equal(item.completion.state, "complete");
  assert.equal(item.completion.complete, true);
  assert.deepEqual(item.completion.excludedContractInputs, [
    "select.stylesConfig.arbitraryNestedSelectors",
    "tooltip.overlayStyle.serializedStyles",
  ]);
  assert.match(item.completion.note, /25 replacement slots/);
  assert.match(item.completion.note, /complete callback result through getStyles/);
  assert.match(item.completion.note, /Flat StylesConfig declarations/);
  assert.match(
    item.completion.note,
    /every nested selector pattern used by pinned monolith callers/,
  );
  assert.match(item.completion.note, /owner-authorized portable-contract exclusion/);
  assert.match(item.completion.note, /TooltipProps\.overlayStyle exclusion/);
  assert.match(item.completion.note, /generic Button node/);
  for (const evidence of [
    "package.json",
    "static/app/components/core/select/select.mdx",
    "static/app/components/forms/controls/reactSelectWrapper.tsx",
    "static/app/utils/convertFromSelect2Choices.tsx",
  ])
    assert.ok(item.canonical.sourcePaths.includes(evidence), evidence);
  assert.ok(!item.canonical.sourcePaths.includes("yarn.lock"));
});

test("keeps the v4 engine, 25 slots, and Tailwind-only boundary", async () => {
  const source = await readFile("src/components/ui/select.tsx", "utf8");
  const types = await readFile("src/components/ui/select-types.ts", "utf8");
  for (const fragment of [
    "export function Select<",
    "export function CheckWrap",
    "export function SelectOption",
    '"aria-autocomplete": "list"',
    'role={multiple ? "menuitemcheckbox" : "menuitemradio"}',
    "event.keyCode === 229",
    'event.key === "PageDown"',
    'event.key === "ArrowLeft"',
    "createPortal(",
    "props.menuShouldBlockScroll",
    "props.closeMenuOnScroll",
    "normalized(source).includes",
    "activeRequestRef.current !== request",
    "defaultRequestRef",
    "props.cacheOptions",
    "props.onCreateOption",
  ])
    assert.ok(source.includes(fragment), fragment);
  for (const slotName of [
    "ClearIndicator",
    "Control",
    "CrossIcon",
    "DownChevron",
    "DropdownIndicator",
    "Group",
    "GroupHeading",
    "IndicatorSeparator",
    "IndicatorsContainer",
    "Input",
    "LoadingIndicator",
    "LoadingMessage",
    "Menu",
    "MenuList",
    "MenuPortal",
    "MultiValue",
    "MultiValueContainer",
    "MultiValueLabel",
    "MultiValueRemove",
    "NoOptionsMessage",
    "Option",
    "Placeholder",
    "SelectContainer",
    "SingleValue",
    "ValueContainer",
  ])
    assert.ok(types.includes(`${slotName}:`), slotName);
  const imports = [...source.matchAll(/(?:from\s+|import\s*\()\s*["']([^"']+)/g)].map(
    ([, specifier]) => specifier,
  );
  for (const forbidden of [
    "@base-ui/react",
    "@emotion",
    "class-variance-authority",
    "react-select",
  ]) {
    assert.ok(
      imports.every((specifier) => !specifier.startsWith(forbidden)),
      `runtime import ${forbidden}`,
    );
  }
  assert.doesNotMatch(source, /\bstyled\s*\(/);
  assert.doesNotMatch(source, /role="combobox"|role="listbox"|aria-expanded/);
});

test("publishes one exact self-contained Select registry artifact", async () => {
  const registry = JSON.parse(await readFile("registry.json", "utf8"));
  const item = registry.items.find(({ name }) => name === "select");
  assert.deepEqual(item.registryDependencies, [
    "https://scrapscn.sentry.dev/r/menu-list-item.json",
    "https://scrapscn.sentry.dev/r/scraps-locale.json",
  ]);
  assert.deepEqual(item.files, [
    { path: "src/components/ui/body-scroll-lock.ts", type: "registry:ui" },
    { path: "src/components/ui/select-types.ts", type: "registry:ui" },
    { path: "src/components/ui/select.tsx", type: "registry:ui" },
  ]);
  assert.equal(item.cssVars.light["scraps-select-border-secondary"], "#e6e6e9");
  assert.equal(item.cssVars.dark["scraps-select-border-secondary"], "#1b1821");
  assert.equal(item.cssVars.light["scraps-select-transparent-hover"], "#10103008");
  assert.equal(item.cssVars.dark["scraps-select-transparent-hover"], "#d8a0f80f");
  assert.equal(item.cssVars.light["scraps-select-disabled"], "#878490");
  assert.equal(item.cssVars.dark["scraps-select-disabled"], "#958e9f");
  assert.equal(item.cssVars.light["scraps-select-content-accent"], "#653de9");
  assert.equal(item.cssVars.dark["scraps-select-content-accent"], "#aba8f8");
  assert.equal(item.cssVars.light["scraps-select-graphics-accent"], "#b7b2ff");
  assert.equal(item.cssVars.dark["scraps-select-graphics-accent"], "#7553ff");
  assert.equal(item.cssVars.dark["scraps-select-border"], "#141119");
  assert.equal(item.cssVars.dark["scraps-select-surface"], "#2e2936");

  const directory = await mkdtemp(path.join(tmpdir(), "scrapscn-select-"));
  try {
    execFileSync("pnpm", ["exec", "shadcn", "build", "registry.json", "--output", directory], {
      cwd: process.cwd(),
      stdio: "pipe",
    });
    const built = JSON.parse(await readFile(path.join(directory, "select.json"), "utf8"));
    for (const file of item.files) {
      assert.equal(
        built.files.find(({ path: filePath }) => filePath === file.path)?.content,
        await readFile(file.path, "utf8"),
      );
    }
    assert.deepEqual(JSON.parse(await readFile("public/r/select.json", "utf8")), built);
    assert.deepEqual(
      JSON.parse(await readFile("public/r/registry.json", "utf8")),
      JSON.parse(await readFile(path.join(directory, "registry.json"), "utf8")),
    );
  } finally {
    await rm(directory, { recursive: true });
  }
});
