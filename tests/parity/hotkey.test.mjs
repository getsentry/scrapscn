import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

const behaviorDependencies = [
  "static/app/components/core/hotkey/keyMappings.tsx",
  "static/app/icons/iconArrow.tsx",
  "static/app/icons/iconCommand.tsx",
  "static/app/icons/iconControl.tsx",
  "static/app/icons/iconOption.tsx",
  "static/app/icons/iconReturn.tsx",
  "static/app/icons/iconShift.tsx",
  "static/app/icons/svgIcon.tsx",
  "static/app/icons/useIconDefaults.tsx",
  "static/app/utils/array/toArray.tsx",
  "static/app/utils/string/toTitleCase.tsx",
  "static/app/utils/theme/scraps/theme/base.tsx",
  "static/app/utils/theme/scraps/theme/dark.tsx",
  "static/app/utils/theme/scraps/theme/light.tsx",
  "static/app/utils/theme/scraps/tokens/size.tsx",
  "static/app/utils/theme/scraps/tokens/color.tsx",
  "static/app/utils/theme/scraps/tokens/typography.tsx",
];

test("records the complete regular Scraps Hotkey delivery and behavior sources", async () => {
  const manifest = JSON.parse(await readFile("scraps-parity.json", "utf8"));
  const hotkey = manifest.modules.find(({ name }) => name === "hotkey");

  assert.deepEqual(
    hotkey.canonical.sourcePaths,
    [
      "static/app/components/core/hotkey/hotkey.tsx",
      "static/app/components/core/hotkey/index.tsx",
      "static/app/components/core/hotkey/kbd.tsx",
      "static/app/components/core/hotkey/useHotkeys.tsx",
      ...behaviorDependencies,
    ].sort(),
  );
  assert.equal("behaviorDependencies" in hotkey.canonical, false);
  assert.deepEqual(hotkey.canonical.publicExports, {
    runtime: ["Hotkey", "Kbd", "matchesHotkey", "useHotkeys"],
    types: [],
  });
  assert.deepEqual(hotkey.local.implementationPaths, ["src/components/ui/hotkey.tsx"]);
  assert.deepEqual(hotkey.local.implementedExports, {
    runtime: ["Hotkey", "Kbd", "matchesHotkey", "useHotkeys"],
    types: [],
  });
  assert.deepEqual(hotkey.local.registryItems, ["hotkey"]);
  assert.deepEqual(hotkey.local.tests, [
    "src/components/ui/hotkey.test.tsx",
    "tests/e2e/playground.spec.ts",
    "tests/parity/hotkey.test.mjs",
    "tests/types/hotkey-types.test.tsx",
  ]);
  assert.deepEqual(hotkey.local.figmaNodes, []);
  assert.equal(hotkey.local.playgroundPath, "/?component=hotkey");
  assert.equal(hotkey.completion.state, "complete");
  assert.equal(hotkey.completion.complete, true);
});

test("publishes the exact self-contained Hotkey registry item", async () => {
  const registry = JSON.parse(await readFile("registry.json", "utf8"));
  const item = registry.items.find(({ name }) => name === "hotkey");

  assert.deepEqual(item.dependencies, [
    "@fontsource-variable/roboto-mono@5.2.9",
    "@react-aria/utils@3.34.1",
    "@sentry/react@10.69.0",
  ]);
  assert.deepEqual(item.registryDependencies, []);
  assert.deepEqual(item.cssVars, {
    light: {
      "scraps-hotkey-background-primary": "#ffffff",
      "scraps-hotkey-background-secondary": "#f8f8f9",
      "scraps-hotkey-border-primary": "#dad9de",
      "scraps-hotkey-content-primary": "#302e36",
      "scraps-hotkey-content-secondary": "#6a6772",
    },
    dark: {
      "scraps-hotkey-background-primary": "#2e2936",
      "scraps-hotkey-background-secondary": "#24202b",
      "scraps-hotkey-border-primary": "#141119",
      "scraps-hotkey-content-primary": "#e7e5ea",
      "scraps-hotkey-content-secondary": "#b5b0bd",
    },
  });
  assert.deepEqual(item.files, [
    {
      path: "src/components/ui/roboto-mono.css",
      type: "registry:file",
      target: "src/components/ui/roboto-mono.css",
    },
    { path: "src/components/ui/hotkey.tsx", type: "registry:ui" },
  ]);

  const directory = await mkdtemp(path.join(tmpdir(), "scrapscn-hotkey-"));
  try {
    execFileSync("pnpm", ["exec", "shadcn", "build", "registry.json", "--output", directory], {
      cwd: process.cwd(),
      stdio: "pipe",
    });
    const builtItem = JSON.parse(await readFile(path.join(directory, "hotkey.json"), "utf8"));
    for (const filePath of ["src/components/ui/roboto-mono.css", "src/components/ui/hotkey.tsx"]) {
      assert.equal(
        builtItem.files.find(({ path: builtPath }) => builtPath === filePath)?.content,
        await readFile(filePath, "utf8"),
      );
    }
  } finally {
    await rm(directory, { recursive: true });
  }
});

test("keeps the exact maps, Sentry glyph paths, warning, and Kbd geometry", async () => {
  const source = await readFile("src/components/ui/hotkey.tsx", "utf8");
  const fontStyles = await readFile("src/components/ui/roboto-mono.css", "utf8");

  assert.match(source, /import \{ isMac \} from "@react-aria\/utils"/);
  assert.match(source, /useSyncExternalStore\(subscribeToPlatform, isMac, \(\) => false\)/);
  assert.match(source, /canonicalizeForPlatform\(keyName, mac\)/);
  assert.match(
    source,
    /export function matchesHotkey\(match: string \| string\[\], event: KeyboardEvent\)/,
  );
  assert.match(source, /if \(event\.isComposing\) return false/);
  assert.match(source, /return \(Array\.isArray\(match\) \? match : \[match\]\)\.some/);
  assert.match(source, /Sentry\.logger\.warn\("Missing key glyph mapping", \{ keyName \}\)/);
  assert.match(source, /eventKey\.charCodeAt\(0\) > 0x7f/);
  assert.match(source, /if \(event\.shiftKey\) return true/);
  assert.match(source, /"\\\\": "Backslash"/);
  assert.match(source, /M12 1\.25a2\.75 2\.75 0 1 1 0 5\.5/);
  assert.match(source, /M8 2a\.75\.75 0 0 1 \.545\.235/);
  assert.match(source, /M5\.632 2c\.746 0 1\.41\.474/);
  assert.match(source, /M13\.25 4a\.75\.75 0 0 1 \.75\.75/);
  assert.match(source, /M7\.47 1\.22a\.75\.75 0 0 1 1\.06 0/);
  assert.match(source, /M12\.79 6\.74C13\.08 7\.04/);
  assert.match(source, /<svg[\s\S]*role="img"[\s\S]*viewBox="0 0 16 16"/);
  assert.doesNotMatch(source, /aria-hidden/);
  assert.match(source, /<kbd aria-label=\{glyph\.label\} className=\{keyClasses\} key=\{index\}>/);
  assert.match(source, /if \(!finalKeys \|\| finalKeys\.length === 0\)/);
  assert.doesNotMatch(source, /finalKeys\.every/);
  assert.match(source, /h-\[1\.67em\]/);
  assert.match(fontStyles, /font-family: "Roboto Mono"/);
  assert.match(fontStyles, /font-weight: 425 600/);
  assert.match(
    fontStyles,
    /@fontsource-variable\/roboto-mono\/files\/roboto-mono-latin-wght-normal\.woff2/,
  );
  assert.match(source, /import "\.\/roboto-mono\.css"/);
  assert.match(
    source,
    /\[font-family:'Roboto_Mono',Monaco,Consolas,'Courier_New',monospace\] text-xs font-medium/,
  );
  assert.doesNotMatch(source, /\bfont-mono\b/);
  assert.match(source, /border-b-2/);
  assert.match(source, /rounded-\[5px\]/);
  assert.match(source, /scale-90/);
  assert.doesNotMatch(source, /\.module\.css/);
});

test("ports every pinned canonical Hotkey test declaration", async () => {
  const testSource = await readFile("src/components/ui/hotkey.test.tsx", "utf8");
  const declarationNames = [...testSource.matchAll(/\bit\("([^"]+)"/g)].map(([, name]) => name);
  const canonicalNames = [
    "renders a kbd element",
    "forwards className",
    "renders glyph characters",
    "renders command as ⌘ icon",
    "renders ctrl as ⌃ icon",
    "renders option as ⌥ icon",
    "renders command as Ctrl text",
    "renders ctrl as Ctrl text",
    "renders option as Alt text",
    "renders shift as ⇧ icon",
    "accepts a single string",
    "uses first combo from array",
    "renders nested kbd elements",
    "handles a simple match",
    "handles multiple matches",
    "handles a complex match",
    "does not match when extra modifiers are pressed",
    "updates with rerender",
    "skips input and textarea",
    "does not skips input and textarea with includesInputs",
    "skips preventDefault",
    "matches shift+digit when event.key is the shifted symbol",
    "matches a letter via event.key regardless of physical position",
    "matches a letter via event.code on non-Latin layouts",
    "matches Escape via event.key",
    "matches arrow keys via event.key",
    "matches vim-style alternatives alongside arrow keys",
    "skips a disabled hotkey without preventing default",
    "respects toggling enabled between renders",
    "matches a letter shortcut even when shift is held (case-insensitive)",
    "does not match mod+/ on AZERTY when user presses Cmd++ (physical Slash key)",
    "matches command on macOS",
    "matches control on non-mac platforms",
    "rejects extra non-mod modifiers",
  ];

  for (const name of canonicalNames) assert.ok(declarationNames.includes(name), name);
  assert.equal(canonicalNames.length, 34);
});
