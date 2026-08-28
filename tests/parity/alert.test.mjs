import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

test("records the complete regular Scraps Alert clone", async () => {
  const manifest = JSON.parse(await readFile("scraps-parity.json", "utf8"));
  const item = manifest.modules.find(({ name }) => name === "alert");
  assert.deepEqual(item.canonical.publicExports, {
    runtime: ["Alert", "AlertLink"],
    types: ["AlertProps"],
  });
  assert.deepEqual(item.local.implementedExports, {
    runtime: ["Alert", "AlertLink"],
    types: ["AlertProps"],
  });
  assert.deepEqual(item.local.registryItems, ["alert"]);
  assert.equal(item.local.playgroundPath, "/?component=alert");
  assert.deepEqual(item.local.codeConnect, ["src/components/ui/alert.figma.ts"]);
  assert.deepEqual(item.local.figmaNodes, [
    "https://www.figma.com/design/eTJz6aPgudMY9E6mzyZU0B?node-id=6943-13522",
  ]);
  assert.equal(item.completion.state, "complete");
  assert.match(item.completion.note, /live variant, system, showIcon, expand, information/);
  for (const evidencePath of [
    "static/app/components/core/alert/alert.figma.tsx",
    "static/app/components/core/alert/alert.mdx",
    "static/app/components/core/alert/alert.spec.tsx",
    "static/app/icons/iconWarning.tsx",
    "static/app/utils/theme/scraps/theme/dark.tsx",
    "static/app/utils/theme/scraps/theme/light.tsx",
  ]) {
    assert.ok(item.canonical.sourcePaths.includes(evidencePath), evidencePath);
  }
});

test("maps the published Alert Figma vocabulary to the compatible local API", async () => {
  const source = await readFile("src/components/ui/alert.figma.ts", "utf8");
  for (const fragment of [
    "node-id=6943-13522",
    'instance.getEnum("variant"',
    'instance.getEnum("system"',
    'instance.getBoolean("showIcon")',
    'instance.getBoolean("expand")',
    'instance.getBoolean("trailingItems")',
    'instance.getSlot("information")',
    'instance.findText("Additional")',
    'instance.getSlot("trailingSlot")',
    'import { Alert } from "@/components/ui/alert"',
    'figma.helpers.react.renderProp("showIcon", showIcon)',
    'defaultExpanded expand="${additional}"',
    "trailingItems={${trailingSlot}}",
    ">${information}</Alert>",
  ]) {
    assert.ok(source.includes(fragment), fragment);
  }
  for (const variant of ["danger", "info", "muted", "success", "warning"]) {
    assert.ok(source.includes(`${variant}: "${variant}"`), variant);
  }
  assert.doesNotMatch(source, /@sentry\/scraps|figma\.connect/);
});

test("keeps the exact Alert API, behavior, glyphs, and Tailwind geometry", async () => {
  const source = await readFile("src/components/ui/alert.tsx", "utf8");
  for (const fragment of [
    "handleExpandChange?:",
    "defaultExpanded?:",
    "showIcon?:",
    "system?:",
    "trailingItems?:",
    "Alert.Container = AlertContainer",
    "Alert.Button = AlertButton",
    "AlertLink.Container = AlertLinkContainer",
    "[container-type:inline-size]",
    "@[512px]:[grid-area:auto]",
    "@[768px]:row-start-2",
    "min-h-11",
    "w-11",
    "pl-14",
    'size="zero"',
    "ref-${variant}",
  ]) {
    assert.ok(source.includes(fragment), fragment);
  }
  for (const pathFragment of [
    "M13.72 3.22C14.01 2.93",
    "M8 0C12.42 0 16 3.58",
    "M6.81 0.65C7.26 -0.16",
    "M8 5C8.21 5 8.4 5.09",
  ]) {
    assert.ok(source.includes(pathFragment), pathFragment);
  }
  assert.doesNotMatch(source, /@emotion|styled\(|class-variance-authority|lucide-react/);
});

test("builds the exact local Alert registry artifact", async () => {
  const registry = JSON.parse(await readFile("registry.json", "utf8"));
  const item = registry.items.find(({ name }) => name === "alert");
  assert.equal(item.dependencies, undefined);
  assert.deepEqual(item.registryDependencies, [
    "https://scrapscn.sentry.dev/r/button.json",
    "https://scrapscn.sentry.dev/r/link.json",
    "https://scrapscn.sentry.dev/r/scraps-locale.json",
  ]);
  assert.deepEqual(item.cssVars, {
    light: {
      "scraps-alert-info-background": "#0008f012",
      "scraps-alert-info-border": "#b7b2ff",
      "scraps-alert-danger-background": "#f828081c",
      "scraps-alert-danger-border": "#ff978f",
      "scraps-alert-warning-background": "#e0b01030",
      "scraps-alert-warning-border": "#edca60",
      "scraps-alert-success-background": "#00b8001c",
      "scraps-alert-success-border": "#7cd88a",
    },
    dark: {
      "scraps-alert-info-background": "#4828b894",
      "scraps-alert-info-border": "#7553ff",
      "scraps-alert-danger-background": "#f8000033",
      "scraps-alert-danger-border": "#ff002b",
      "scraps-alert-warning-background": "#e8380029",
      "scraps-alert-warning-border": "#ca9b00",
      "scraps-alert-success-background": "#00f8001f",
      "scraps-alert-success-border": "#00a719",
    },
  });

  const directory = await mkdtemp(path.join(tmpdir(), "scrapscn-alert-"));
  try {
    execFileSync("pnpm", ["exec", "shadcn", "build", "registry.json", "--output", directory], {
      cwd: process.cwd(),
      stdio: "pipe",
    });
    const built = JSON.parse(await readFile(path.join(directory, "alert.json"), "utf8"));
    assert.equal(
      built.files.find(({ path: filePath }) => filePath.endsWith("alert.tsx"))?.content,
      await readFile("src/components/ui/alert.tsx", "utf8"),
    );
    assert.deepEqual(JSON.parse(await readFile("public/r/alert.json", "utf8")), built);
  } finally {
    await rm(directory, { recursive: true });
  }
});
