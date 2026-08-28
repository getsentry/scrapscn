import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

const completionNote =
  "Exact regular Scraps Chip API, query text, xs, sm, and md geometry, readonly and dismissable discriminated states, exact close icon, workbench, production browser behavior, and standalone registry delivery use literal Tailwind classes. The canonical module has no Figma component.";

test("records the complete regular Scraps Chip clone", async () => {
  const manifest = JSON.parse(await readFile("scraps-parity.json", "utf8"));
  const chip = manifest.modules.find(({ name }) => name === "chip");

  assert.deepEqual(chip.canonical.sourcePaths, [
    "static/app/components/core/chip/chip.snapshots.tsx",
    "static/app/components/core/chip/chip.spec.tsx",
    "static/app/components/core/chip/chip.tsx",
    "static/app/components/core/chip/index.tsx",
    "static/app/icons/iconClose.tsx",
    "static/app/icons/svgIcon.tsx",
    "static/app/utils/theme/scraps/theme/dark.tsx",
    "static/app/utils/theme/scraps/theme/light.tsx",
    "static/app/utils/theme/scraps/tokens/size.tsx",
  ]);
  assert.deepEqual(chip.canonical.publicExports, { runtime: ["Chip"], types: [] });
  assert.deepEqual(chip.local.implementationPaths, ["src/components/ui/chip.tsx"]);
  assert.deepEqual(chip.local.implementedExports, { runtime: ["Chip"], types: [] });
  assert.deepEqual(chip.local.registryItems, ["chip"]);
  assert.deepEqual(chip.local.codeConnect, []);
  assert.equal(chip.local.playgroundPath, "/?component=chip");
  assert.deepEqual(chip.completion, { state: "complete", complete: true, note: completionNote });
});

test("keeps exact Chip API, class tokens, and close icon path", async () => {
  const source = await readFile("src/components/ui/chip.tsx", "utf8");
  for (const fragment of [
    'type ChipSize = "xs" | "sm" | "md"',
    "interface DismissableChipProps",
    "readonly?: false",
    "interface ReadonlyChipProps",
    "onDismiss?: never",
    'size = "md"',
    "value !== undefined",
    "xs: {",
    'root: "h-5 rounded-[3px]"',
    'root: "h-6 rounded-[4px]"',
    'root: "h-7 rounded-[5px]"',
    "event.stopPropagation()",
    "aria-label={`Remove ${label}`}",
    "M12.72 2.22C13.01 1.93",
  ])
    assert.ok(source.includes(fragment), fragment);
  assert.doesNotMatch(source, /@emotion|@base-ui|styled\(|\.module\.css|lucide-react/);
});

test("publishes Chip as a self-contained registry item", async () => {
  const registry = JSON.parse(await readFile("registry.json", "utf8"));
  const chip = registry.items.find(({ name }) => name === "chip");
  assert.deepEqual(chip.registryDependencies, [
    "https://scrapscn.sentry.dev/r/button.json",
    "https://scrapscn.sentry.dev/r/layout.json",
    "https://scrapscn.sentry.dev/r/text.json",
  ]);
  assert.deepEqual(chip.cssVars, {
    light: {
      "scraps-chip-background": "#ffffff",
      "scraps-chip-chonk": "#dad9de",
      "scraps-chip-content-primary": "#181225",
      "scraps-chip-content-secondary": "#6a6772",
      "scraps-chip-hover": "#f8f8f9",
    },
    dark: {
      "scraps-chip-background": "#2e2936",
      "scraps-chip-chonk": "#141119",
      "scraps-chip-content-primary": "#ffffff",
      "scraps-chip-content-secondary": "#b5b0bd",
      "scraps-chip-hover": "#24202b",
    },
  });
  assert.deepEqual(chip.files, [{ path: "src/components/ui/chip.tsx", type: "registry:ui" }]);

  const temporaryDirectory = await mkdtemp(path.join(tmpdir(), "scrapscn-chip-"));
  try {
    execFileSync(
      "pnpm",
      ["exec", "shadcn", "build", "registry.json", "--output", temporaryDirectory],
      { cwd: process.cwd(), stdio: "pipe" },
    );
    const builtItem = JSON.parse(
      await readFile(path.join(temporaryDirectory, "chip.json"), "utf8"),
    );
    assert.equal(
      builtItem.files.find(({ path: filePath }) => filePath === "src/components/ui/chip.tsx")
        ?.content,
      await readFile("src/components/ui/chip.tsx", "utf8"),
    );
  } finally {
    await rm(temporaryDirectory, { recursive: true });
  }
});
