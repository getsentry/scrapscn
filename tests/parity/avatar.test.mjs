import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

const completionNote =
  "Exact regular Scraps Avatar module exports, discriminated base contract, image and letter resolution, deterministic theme swatches, upload and Gravatar fallback, derived user, team, organization, project and integration avatars, provider-backed actor record resolution, collapsed avatar lists, literal Tailwind styling, workbench, focused tests, production browser behavior, and standalone registry delivery are present. AvatarProps.tooltipOptions inherits the shared TooltipProps.overlayStyle portable-contract input exclusion recorded in scope.excludedContractInputs. The canonical Avatar MDX has no Figma component or Code Connect property vocabulary.";
const exports = {
  runtime: [
    "ActorAvatar",
    "Avatar",
    "AvatarList",
    "CollapsedAvatars",
    "DocIntegrationAvatar",
    "ImageAvatar",
    "LetterAvatar",
    "OrganizationAvatar",
    "ProjectAvatar",
    "SentryAppAvatar",
    "TeamAvatar",
    "UserAvatar",
    "useAvatar",
  ],
  types: ["ActorAvatarProps", "AvatarProps", "BaseAvatarProps"],
};

test("records the complete pinned regular Scraps Avatar clone", async () => {
  const manifest = JSON.parse(await readFile("scraps-parity.json", "utf8"));
  const component = manifest.modules.find(({ name }) => name === "avatar");
  assert.deepEqual(component.canonical.publicExports, exports);
  assert.deepEqual(component.local.implementedExports, exports);
  assert.deepEqual(component.local.implementationPaths, [
    "src/components/ui/avatar-actor-resolver.tsx",
    "src/components/ui/avatar.tsx",
  ]);
  assert.deepEqual(component.local.registryItems, ["avatar"]);
  assert.equal(component.local.playgroundPath, "/?component=avatar");
  assert.deepEqual(component.local.codeConnect, []);
  assert.deepEqual(component.local.figmaNodes, []);
  const requiredCanonicalInputs = [
    "package.json",
    "static/app/components/core/avatar/avatar.mdx",
    "static/app/components/core/avatar/avatarComponentStyles.tsx",
    "static/app/components/core/badge/index.tsx",
    "static/app/components/core/badge/tag.tsx",
    "static/app/components/core/image/image.tsx",
    "static/app/components/core/tooltip/index.tsx",
    "static/app/components/core/tooltip/tooltip.tsx",
    "static/app/components/placeholder.tsx",
    "static/app/components/platformList.tsx",
    "static/app/icons/iconGeneric.tsx",
    "static/app/icons/svgIcon.tsx",
    "static/app/icons/useIconDefaults.tsx",
    "static/app/stores/configStore.tsx",
    "static/app/types/core.tsx",
    "static/app/types/integrations.tsx",
    "static/app/types/organization.tsx",
    "static/app/types/platform.tsx",
    "static/app/types/project.tsx",
    "static/app/types/system.tsx",
    "static/app/types/user.tsx",
    "static/app/utils.tsx",
    "static/app/utils/formatters.tsx",
    "static/app/utils/members/useMembers.tsx",
    "static/app/utils/theme/scraps/theme/base.tsx",
    "static/app/utils/theme/scraps/theme/dark.tsx",
    "static/app/utils/theme/scraps/theme/light.tsx",
    "static/app/utils/theme/scraps/tokens/color.tsx",
    "static/app/utils/theme/scraps/tokens/size.tsx",
    "static/app/utils/theme/swatch.tsx",
    "static/app/utils/theme/theme.tsx",
    "static/app/utils/useTeamsById.tsx",
    "static/less/shared-components.less",
  ];
  for (const canonicalPath of requiredCanonicalInputs) {
    assert.ok(component.canonical.sourcePaths.includes(canonicalPath), canonicalPath);
  }
  assert.deepEqual(component.completion, {
    complete: true,
    excludedContractInputs: ["tooltip.overlayStyle.serializedStyles"],
    note: completionNote,
    state: "complete",
  });
});

test("publishes a self-contained Avatar registry artifact", async () => {
  const registry = JSON.parse(await readFile("registry.json", "utf8"));
  const component = registry.items.find(({ name }) => name === "avatar");
  assert.deepEqual(component.dependencies, ["platformicons@9.6.0"]);
  assert.deepEqual(component.registryDependencies, [
    "https://scrapscn.sentry.dev/r/badge.json",
    "https://scrapscn.sentry.dev/r/image.json",
    "https://scrapscn.sentry.dev/r/sentry-base.json",
    "https://scrapscn.sentry.dev/r/tooltip.json",
  ]);
  assert.deepEqual(component.cssVars, {
    dark: {
      "scraps-border-neutral-vibrant": "#b5b0bd",
      "scraps-border-primary": "#141119",
      "scraps-border-transparent-neutral-muted": "#c0a8e03d",
    },
    light: {
      "scraps-border-neutral-vibrant": "#a29faa",
      "scraps-border-primary": "#dad9de",
      "scraps-border-transparent-neutral-muted": "#00002026",
    },
  });
  assert.deepEqual(component.files, [
    {
      path: "src/components/ui/avatar-actor-resolver.tsx",
      type: "registry:ui",
    },
    { path: "src/components/ui/avatar.tsx", type: "registry:ui" },
  ]);

  const directory = await mkdtemp(path.join(tmpdir(), "scrapscn-avatar-"));
  try {
    execFileSync("pnpm", ["exec", "shadcn", "build", "registry.json", "--output", directory], {
      cwd: process.cwd(),
      stdio: "pipe",
    });
    const built = JSON.parse(await readFile(path.join(directory, "avatar.json"), "utf8"));
    assert.equal(
      built.files.find(
        ({ path: filePath }) => filePath === "src/components/ui/avatar-actor-resolver.tsx",
      )?.content,
      await readFile("src/components/ui/avatar-actor-resolver.tsx", "utf8"),
    );
    assert.equal(
      built.files.find(({ path: filePath }) => filePath === "src/components/ui/avatar.tsx")
        ?.content,
      await readFile("src/components/ui/avatar.tsx", "utf8"),
    );
    assert.deepEqual(JSON.parse(await readFile("public/r/avatar.json", "utf8")), built);
  } finally {
    await rm(directory, { recursive: true });
  }
});

test("keeps Avatar behavior in literal Tailwind without monolith or CSS-in-JS imports", async () => {
  const source = await readFile("src/components/ui/avatar.tsx", "utf8");
  const resolverSource = await readFile("src/components/ui/avatar-actor-resolver.tsx", "utf8");
  for (const fragment of [
    'type: "gravatar"',
    'type: "letter_avatar"',
    'type: "upload"',
    'digest("SHA-256"',
    "?d=404&s=120",
    "getInitials",
    "getSwatch",
    "useSyncExternalStore",
    "grayscale",
    "flex-row-reverse",
    "platform-icon-default",
    "default-sentry-app-avatar",
    "useAvatarActorResolver",
    'data-slot="avatar-placeholder"',
    'data-slot="avatar-list"',
    "group-hover/avatar-list:cursor-pointer",
    'from "./image"',
    "radius={radius ??",
    "scraps-border-neutral-vibrant,#a29faa",
    "scraps-border-neutral-vibrant,#b5b0bd",
    "rounded-[6px]",
    "radius={6}",
  ]) {
    assert.ok(source.includes(fragment), fragment);
  }
  assert.doesNotMatch(
    `${source}\n${resolverSource}`,
    /@emotion|styled\(|classNames|sentry\/stores|sentry\/types|sentry\/utils|\.module\.css/,
  );
});
