import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

const completionNote =
  "Exact regular Scraps InfoText, InfoTip, and DisabledTip APIs, overflow-only behavior, tooltip integration, focus handling, icon paths and sizes, workbench, production browser behavior, and standalone registry delivery use literal Tailwind classes. The canonical module has no Figma component.";

test("records the complete regular Scraps Info clone", async () => {
  const manifest = JSON.parse(await readFile("scraps-parity.json", "utf8"));
  const info = manifest.modules.find(({ name }) => name === "info");
  assert.deepEqual(info.canonical.sourcePaths, [
    "static/app/components/core/info/index.tsx",
    "static/app/components/core/info/infoText.spec.tsx",
    "static/app/components/core/info/infoText.tsx",
    "static/app/components/core/info/infoTip.tsx",
    "static/app/icons/iconLock.tsx",
    "static/app/icons/iconQuestion.tsx",
    "static/app/icons/svgIcon.tsx",
    "static/app/utils/theme/scraps/theme/dark.tsx",
    "static/app/utils/theme/scraps/theme/light.tsx",
    "static/app/utils/theme/theme.tsx",
  ]);
  assert.deepEqual(info.canonical.publicExports, {
    runtime: ["DisabledTip", "InfoText", "InfoTip"],
    types: ["InfoTextProps"],
  });
  assert.deepEqual(info.local.implementationPaths, ["src/components/ui/info.tsx"]);
  assert.deepEqual(info.local.implementedExports, {
    runtime: ["DisabledTip", "InfoText", "InfoTip"],
    types: ["InfoTextProps"],
  });
  assert.deepEqual(info.local.registryItems, ["info"]);
  assert.deepEqual(info.local.codeConnect, []);
  assert.deepEqual(info.local.figmaNodes, []);
  assert.equal(info.local.playgroundPath, "/?component=info");
  assert.deepEqual(info.completion, { state: "complete", complete: true, note: completionNote });
});

test("keeps the canonical API, overflow gate, icon paths, and Tailwind focus treatment", async () => {
  const source = await readFile("src/components/ui/info.tsx", "utf8");
  for (const fragment of [
    "type DistributedOmit",
    'mode: "overflowOnly"',
    "ellipsis: true as const",
    "onOverflowChange={isOverflowOnly ? setIsOverflowing : undefined}",
    "showOnlyOnOverflow={isOverflowOnly}",
    "showUnderline={!isOverflowOnly}",
    "tabIndex={isOverflowOnly && !isOverflowing ? undefined : 0}",
    "M8 0C12.42 0 16 3.58",
    "M8 0C10.49 0 12.5 2.01",
    'aria-label="More information"',
    'aria-label="Disabled"',
    'size = "md"',
    "scraps-info-graphics-warning-vibrant",
  ])
    assert.ok(source.includes(fragment), fragment);
  assert.doesNotMatch(source, /@emotion|styled\(|\.module\.css|lucide-react/);
});

test("publishes Info with its Text and Tooltip closure", async () => {
  const registry = JSON.parse(await readFile("registry.json", "utf8"));
  const info = registry.items.find(({ name }) => name === "info");
  assert.deepEqual(info.registryDependencies, [
    "https://scrapscn.sentry.dev/r/text.json",
    "https://scrapscn.sentry.dev/r/tooltip.json",
  ]);
  assert.deepEqual(info.files, [{ path: "src/components/ui/info.tsx", type: "registry:ui" }]);
  const directory = await mkdtemp(path.join(tmpdir(), "scrapscn-info-"));
  try {
    execFileSync("pnpm", ["exec", "shadcn", "build", "registry.json", "--output", directory], {
      cwd: process.cwd(),
      stdio: "pipe",
    });
    const item = JSON.parse(await readFile(path.join(directory, "info.json"), "utf8"));
    assert.equal(
      item.files.find(({ path: filePath }) => filePath === "src/components/ui/info.tsx")?.content,
      await readFile("src/components/ui/info.tsx", "utf8"),
    );
  } finally {
    await rm(directory, { recursive: true });
  }
});
