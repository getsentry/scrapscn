import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

const completionNote =
  "Exact regular Scraps AvatarButton API, letter and image avatar resolution, deterministic swatches, image sampling, Button behavior, workbench, and standalone registry delivery use literal Tailwind classes. AvatarButton tooltipProps inherit the shared TooltipProps.overlayStyle portable-contract input exclusion recorded in scope.excludedContractInputs. The canonical module has no approved AvatarButton Figma node.";

test("records the complete regular Scraps AvatarButton clone", async () => {
  const manifest = JSON.parse(await readFile("scraps-parity.json", "utf8"));
  const item = manifest.modules.find(({ name }) => name === "avatarButton");
  assert.deepEqual(item.canonical.publicExports, {
    runtime: ["AvatarButton"],
    types: [],
  });
  assert.deepEqual(item.canonical.sourcePaths, [
    "package.json",
    "static/app/components/core/avatar/avatar.tsx",
    "static/app/components/core/avatar/avatarComponentStyles.tsx",
    "static/app/components/core/avatar/imageAvatar/imageAvatar.tsx",
    "static/app/components/core/avatar/letterAvatar/letterAvatar.tsx",
    "static/app/components/core/avatar/useAvatar.spec.tsx",
    "static/app/components/core/avatar/useAvatar.ts",
    "static/app/components/core/avatarButton/avatarButton.mdx",
    "static/app/components/core/avatarButton/avatarButton.spec.tsx",
    "static/app/components/core/avatarButton/avatarButton.tsx",
    "static/app/components/core/avatarButton/index.tsx",
    "static/app/components/core/button/button.tsx",
    "static/app/components/core/button/styles.tsx",
    "static/app/components/core/button/types.tsx",
    "static/app/components/core/button/useButtonFunctionality.tsx",
    "static/app/components/core/image/image.tsx",
    "static/app/components/core/sizeContext.tsx",
    "static/app/utils/queryClient.tsx",
    "static/app/utils/theme/swatch.tsx",
    "static/app/utils/theme/theme.tsx",
  ]);
  assert.deepEqual(item.local.implementationPaths, ["src/components/ui/avatar-button.tsx"]);
  assert.deepEqual(item.local.implementedExports, {
    runtime: ["AvatarButton"],
    types: [],
  });
  assert.deepEqual(item.local.registryItems, ["avatar-button"]);
  assert.deepEqual(item.local.codeConnect, []);
  assert.deepEqual(item.local.figmaNodes, []);
  assert.equal(item.local.playgroundPath, "/?component=avatar-button");
  assert.deepEqual(item.completion, {
    complete: true,
    excludedContractInputs: ["tooltip.overlayStyle.serializedStyles"],
    note: completionNote,
    state: "complete",
  });
});

test("keeps source, sampling, fallback, and theme behavior in literal Tailwind", async () => {
  const source = await readFile("src/components/ui/avatar-button.tsx", "utf8");
  for (const fragment of [
    "type BaseAvatarProps =",
    'type: "letter_avatar"',
    'type: "upload"',
    'type: "gravatar"',
    '"children" | "data-size" | "icon" | "size" | "variant"',
    'return `${source}${source.includes("?") ? "&" : "?"}s=120`',
    "identifier.charCodeAt(index)",
    'digest("SHA-256"',
    "gravatarHashResources",
    "sampleResources",
    "RESOURCE_GC_TIME = 5 * 60 * 1000",
    "observedEntry.gcTimer = setTimeout",
    "useSyncExternalStore",
    'return parsed.href.replace(/\\/+$/, "")',
    "const image = new Image()",
    'image.crossOrigin = "anonymous"',
    "image.onerror = () => resolve(null)",
    "darkChonk: Color(hex).darken(0.85).hex()",
    "lightChonk: Color(hex).darken(0.45).hex()",
    "chonk ? chonkOverrideClasses : null",
    "border will-change-transform",
    'chonk ? "border-[var(--avatar-chonk)]" : "border-transparent"',
    'md: "size-9 rounded-[8px]"',
    'sm: "size-8 rounded-[6px]"',
    'xs: "size-7 rounded-[5px]"',
    "size-9 min-w-9",
    "size-8 min-w-8",
    "size-7 min-w-7",
    "dark:[--avatar-chonk:var(--avatar-chonk-dark)]",
    "dark:[--avatar-letter-background:var(--avatar-letter-background-dark)]",
    'loading="lazy"',
    "<div",
    'data-slot="avatar-button-frame"',
    'viewBox="0 0 120 120"',
  ]) {
    assert.ok(source.includes(fragment), fragment);
  }
  assert.doesNotMatch(
    source,
    /next-themes|useTheme|@emotion|styled\(|@tanstack|@sentry|\.module\.css|Base UI|@base-ui\/react|legacy/,
  );
  assert.deepEqual(
    Array.from(source.matchAll(/export\s+(?:async\s+)?function\s+(\w+)/g), ([, name]) => name),
    ["AvatarButton"],
  );
  assert.doesNotMatch(source, /export\s+(?:interface|type|const|class)\s+/);
});

test("publishes the exact standalone AvatarButton registry closure", async () => {
  const registry = JSON.parse(await readFile("registry.json", "utf8"));
  const item = registry.items.find(({ name }) => name === "avatar-button");
  assert.deepEqual(item.dependencies, ["color@5.0.2"]);
  assert.deepEqual(item.registryDependencies, ["https://scrapscn.sentry.dev/r/button.json"]);
  assert.deepEqual(item.cssVars, {
    light: { "scraps-avatar-padded-background": "#fff" },
    dark: { "scraps-avatar-padded-background": "#2e2936" },
  });
  assert.deepEqual(item.files, [
    {
      path: "src/components/ui/avatar-button.tsx",
      type: "registry:ui",
    },
  ]);

  const directory = await mkdtemp(path.join(tmpdir(), "scrapscn-avatar-button-"));
  try {
    execFileSync("pnpm", ["exec", "shadcn", "build", "registry.json", "--output", directory], {
      cwd: process.cwd(),
      stdio: "pipe",
    });
    const builtItem = JSON.parse(
      await readFile(path.join(directory, "avatar-button.json"), "utf8"),
    );
    assert.equal(
      builtItem.files.find(
        ({ path: filePath }) => filePath === "src/components/ui/avatar-button.tsx",
      )?.content,
      await readFile("src/components/ui/avatar-button.tsx", "utf8"),
    );
    assert.deepEqual(
      JSON.parse(await readFile("public/r/avatar-button.json", "utf8")),
      builtItem,
      "public/r/avatar-button.json must equal a fresh registry build",
    );
    assert.deepEqual(
      JSON.parse(await readFile("public/r/registry.json", "utf8")),
      JSON.parse(await readFile(path.join(directory, "registry.json"), "utf8")),
      "public/r/registry.json must equal a fresh registry build",
    );
    assert.doesNotMatch(JSON.stringify(builtItem), /next-themes/);
  } finally {
    await rm(directory, { recursive: true });
  }
});
