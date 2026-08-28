import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

test("records the complete regular Scraps Badge clone and shared exclusion", async () => {
  const manifest = JSON.parse(await readFile("scraps-parity.json", "utf8"));
  const item = manifest.modules.find(({ name }) => name === "badge");
  assert.deepEqual(item.canonical.publicExports, {
    runtime: ["AlertBadge", "Badge", "DeployBadge", "FeatureBadge", "ProjectsBadge", "Tag"],
    types: ["FeatureBadgeProps", "TagProps"],
  });
  assert.deepEqual(item.local.implementationPaths, ["src/components/ui/badge.tsx"]);
  assert.deepEqual(item.local.implementedExports, item.canonical.publicExports);
  assert.deepEqual(item.local.registryItems, ["badge"]);
  assert.deepEqual(item.local.codeConnect, [
    "src/components/ui/feature-badge.figma.ts",
    "src/components/ui/tag.figma.ts",
  ]);
  assert.deepEqual(item.local.figmaNodes, [
    "https://www.figma.com/design/eTJz6aPgudMY9E6mzyZU0B?node-id=3574-5396",
    "https://www.figma.com/design/eTJz6aPgudMY9E6mzyZU0B?node-id=3574-5698",
  ]);
  assert.equal(item.local.playgroundPath, "/?component=badge");
  assert.equal(item.completion.state, "complete");
  assert.equal(item.completion.complete, true);
  assert.deepEqual(item.completion.excludedContractInputs, [
    "tooltip.overlayStyle.serializedStyles",
  ]);
  assert.match(item.completion.note, /deprecated and Variant/);
  assert.match(item.completion.note, /release-token output oracle/);
  assert.match(item.completion.note, /roving role=tab focus/);
  assert.match(item.completion.note, /render-time host locale resolution/);
  for (const evidencePath of [
    "package.json",
    "static/app/components/core/badge/alertBadge.spec.tsx",
    "static/app/components/core/badge/featureBadge.figma.tsx",
    "static/app/components/core/badge/featureBadge.spec.tsx",
    "static/app/components/core/badge/tag.figma.tsx",
    "static/app/components/core/badge/tag.spec.tsx",
    "static/app/components/core/useIsInsideInteractiveElement.ts",
    "static/app/components/searchSyntax/mutableSearch.tsx",
    "static/app/icons/iconAllProjects.tsx",
    "static/app/icons/iconBug.tsx",
    "static/app/icons/iconFire.tsx",
    "static/app/icons/iconMyProjects.tsx",
    "static/app/types/release.tsx",
    "static/app/utils/useStableMergeRef.ts",
  ]) {
    assert.ok(item.canonical.sourcePaths.includes(evidencePath), evidencePath);
  }
});

test("keeps the exact Badge APIs, branches, icon paths, and literal Tailwind geometry", async () => {
  const source = await readFile("src/components/ui/badge.tsx", "utf8");
  const interactiveHookSource = await readFile(
    "src/components/ui/use-is-inside-interactive-element.ts",
    "utf8",
  );
  for (const fragment of [
    "type FeatureBadgeType =",
    "rounded-[5px] px-1 py-1 text-xs [line-height:initial] font-medium",
    "export interface TagProps extends HTMLAttributes<HTMLSpanElement>",
    'data-test-id={testId ?? "tag-background"}',
    "rounded-[4px] px-2 text-xs",
    "[&_svg:not([width]):not([height])]:size-3",
    "event.preventDefault();",
    "type: FeatureType;",
    "t(defaultTitles[type])",
    '"isHoverable" | "skipWrapper"',
    "isInteractiveElementFocusVisible",
    "tabIndex={isInsideInteractiveElement ? undefined : 0}",
    "forceVisible={",
    "status?: 1 | 2 | 10 | 20;",
    "const text = t(config.text);",
    "isIssue",
    "size-[26px]",
    "height={13}",
    '["environment", deploy.environment]',
    '["project", String(projectId)]',
    "formatReleaseSearch(version)",
    "compactTerminalReleaseGroup",
    "Unsupported badge variant:",
    "Unsupported badge type:",
    'className="max-w-24"',
    "switch (projectPlatforms.length)",
    "rounded-[3px]",
    'platform={projectPlatforms[1] ?? ""}',
  ]) {
    assert.ok(source.includes(fragment), fragment);
  }
  assert.ok(interactiveHookSource.includes("mergeRefs(ref, interactiveElementRef)"));
  for (const iconPath of [
    "M2.9 1.84C3.22 1.57",
    "M8 0a3 3 0 0 1 3 3",
    "M12.25 0.5C12.66 0.5",
    "M9.18 0C9.43 0",
    "M6.81 0.65C7.26 -0.16",
    "M13.25 1C14.22 1",
    "M11.25 0C12.216 0",
    "M11.25 0C12.22 0",
  ]) {
    assert.ok(source.includes(iconPath), iconPath);
  }
  assert.doesNotMatch(
    source,
    /@emotion|styled\(|class-variance-authority|lucide-react|@base-ui\/react|color-mix|badgeVariants|tagVariants/,
  );
});

test("publishes one exact self-contained Badge registry artifact", async () => {
  const registry = JSON.parse(await readFile("registry.json", "utf8"));
  const item = registry.items.find(({ name }) => name === "badge");
  assert.deepEqual(item.dependencies, ["@react-aria/utils@3.34.1", "platformicons@9.6.0"]);
  assert.deepEqual(item.registryDependencies, [
    "https://scrapscn.sentry.dev/r/button.json",
    "https://scrapscn.sentry.dev/r/link.json",
    "https://scrapscn.sentry.dev/r/scraps-locale.json",
    "https://scrapscn.sentry.dev/r/tooltip.json",
  ]);
  assert.deepEqual(item.files, [
    { path: "src/components/ui/badge.tsx", type: "registry:ui" },
    { path: "src/components/ui/translation-context.tsx", type: "registry:ui" },
    { path: "src/components/ui/use-is-inside-interactive-element.ts", type: "registry:ui" },
  ]);
  assert.equal(
    registry.items.some(({ name }) => name === "tag"),
    false,
  );
  assert.equal(
    registry.items.some(({ name }) => name === "feature-badge"),
    false,
  );
  assert.deepEqual(item.cssVars.light, {
    "scraps-badge-neutral-muted": "#0000200f",
    "scraps-badge-accent-muted": "#0008f012",
    "scraps-badge-promotion-muted": "#f000901a",
    "scraps-badge-danger-muted": "#f828081c",
    "scraps-badge-warning-muted": "#e0b01030",
    "scraps-badge-success-muted": "#00b8001c",
    "scraps-badge-promotion-vibrant": "#fc5cb4",
    "scraps-badge-danger-vibrant": "#ff002b",
    "scraps-badge-warning-vibrant": "#ffce00",
    "scraps-badge-success-vibrant": "#00f261",
    "scraps-badge-on-vibrant-dark": "#000000",
    "scraps-badge-on-vibrant-light": "#ffffff",
  });

  const directory = await mkdtemp(path.join(tmpdir(), "scrapscn-badge-"));
  try {
    execFileSync("pnpm", ["exec", "shadcn", "build", "registry.json", "--output", directory], {
      cwd: process.cwd(),
      stdio: "pipe",
    });
    const built = JSON.parse(await readFile(path.join(directory, "badge.json"), "utf8"));
    assert.equal(
      built.files.find(({ path: filePath }) => filePath === "src/components/ui/badge.tsx")?.content,
      await readFile("src/components/ui/badge.tsx", "utf8"),
    );
    assert.deepEqual(JSON.parse(await readFile("public/r/badge.json", "utf8")), built);
    assert.deepEqual(
      JSON.parse(await readFile("public/r/registry.json", "utf8")),
      JSON.parse(await readFile(path.join(directory, "registry.json"), "utf8")),
    );
  } finally {
    await rm(directory, { recursive: true });
  }
});
