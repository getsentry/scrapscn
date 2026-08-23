import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const canonicalSources = [
  "static/less/fonts.less",
  "static/app/components/core/code/inlineCode.tsx",
  "static/app/components/core/hotkey/kbd.tsx",
  "static/app/components/core/layout/index.tsx",
  "static/app/components/core/layout/styles.tsx",
  "static/app/components/core/text/heading.tsx",
  "static/app/components/core/text/index.tsx",
  "static/app/components/core/text/prose.tsx",
  "static/app/components/core/text/styles.tsx",
  "static/app/components/core/text/text.tsx",
  "static/app/utils/theme/scraps/theme/dark.tsx",
  "static/app/utils/theme/scraps/theme/light.tsx",
  "static/app/utils/theme/scraps/tokens/color.tsx",
  "static/app/utils/theme/scraps/tokens/size.tsx",
  "static/app/utils/theme/scraps/tokens/typography.tsx",
  "static/app/utils/theme/types.tsx",
].sort();

test("records complete Text provenance and the exact public entry point", async () => {
  const manifest = JSON.parse(await readFile("scraps-parity.json", "utf8"));
  const text = manifest.modules.find(({ name }) => name === "text");
  const publicEntry = await readFile("src/components/ui/text-index.ts", "utf8");

  assert.deepEqual(text.canonical.sourcePaths, canonicalSources);
  assert.deepEqual(text.canonical.publicExports, {
    runtime: ["Heading", "Prose", "Text"],
    types: ["HeadingProps", "TextProps", "TextPropsWithRenderFunction"],
  });
  assert.deepEqual(text.local.implementationPaths, [
    "src/components/ui/heading.tsx",
    "src/components/ui/kbd-styles.tsx",
    "src/components/ui/prose.tsx",
    "src/components/ui/text-style-engine.tsx",
    "src/components/ui/text.tsx",
  ]);
  assert.equal(text.completion.complete, true);
  assert.equal(text.local.playgroundPath, "/?component=text");
  assert.deepEqual(text.local.registryItems, ["text"]);
  assert.equal(
    publicEntry,
    'export type { TextProps, TextPropsWithRenderFunction } from "./text";\n' +
      'export { Text } from "./text";\n' +
      'export type { HeadingProps } from "./heading";\n' +
      'export { Heading } from "./heading";\n' +
      'export { Prose } from "./prose";\n'
  );
});

test("publishes the self-contained Text registry closure and exact theme tokens", async () => {
  const registry = JSON.parse(await readFile("registry.json", "utf8"));
  const item = registry.items.find(({ name }) => name === "text");

  assert.deepEqual(item.dependencies, [
    "@emotion/is-prop-valid@1.4.0",
    "@fontsource-variable/roboto-mono@5.2.9",
  ]);
  assert.deepEqual(item.registryDependencies, [
    "https://scrapscn.sentry.dev/r/code.json",
  ]);
  assert.deepEqual(item.cssVars, {
    light: {
      "scraps-content-primary": "#302e36",
      "scraps-content-secondary": "#6a6772",
      "scraps-content-accent": "#653de9",
      "scraps-content-promotion": "#c8007e",
      "scraps-content-danger": "#d50000",
      "scraps-content-warning": "#a45200",
      "scraps-content-success": "#008900",
      "scraps-hotkey-background-primary": "#ffffff",
      "scraps-hotkey-background-secondary": "#f8f8f9",
      "scraps-hotkey-border-primary": "#dad9de",
      "scraps-hotkey-content-primary": "#302e36",
      "scraps-hotkey-content-secondary": "#6a6772",
    },
    dark: {
      "scraps-content-primary": "#e7e5ea",
      "scraps-content-secondary": "#b5b0bd",
      "scraps-content-accent": "#aba8f8",
      "scraps-content-promotion": "#ea95b9",
      "scraps-content-danger": "#f6938c",
      "scraps-content-warning": "#ffce00",
      "scraps-content-success": "#5ece73",
      "scraps-hotkey-background-primary": "#2e2936",
      "scraps-hotkey-background-secondary": "#24202b",
      "scraps-hotkey-border-primary": "#141119",
      "scraps-hotkey-content-primary": "#e7e5ea",
      "scraps-hotkey-content-secondary": "#b5b0bd",
    },
  });
  assert.deepEqual(item.files, [
    { path: "src/components/ui/roboto-mono.css", type: "registry:file", target: "src/components/ui/roboto-mono.css" },
    { path: "src/components/ui/text.module.css", type: "registry:file", target: "src/components/ui/text.module.css" },
    { path: "src/components/ui/container-query-context.ts", type: "registry:ui" },
    { path: "src/components/ui/layout-style-engine.ts", type: "registry:ui" },
    { path: "src/components/ui/kbd-styles.tsx", type: "registry:ui" },
    { path: "src/components/ui/text-style-engine.tsx", type: "registry:ui" },
    { path: "src/components/ui/text.tsx", type: "registry:ui" },
    { path: "src/components/ui/heading.tsx", type: "registry:ui" },
    { path: "src/components/ui/prose.tsx", type: "registry:ui" },
    { path: "src/components/ui/text-index.ts", type: "registry:ui" },
  ]);
});

test("keeps canonical sizes, responsive resources, decoration composition, and React 19 refs", async () => {
  const text = await readFile("src/components/ui/text.tsx", "utf8");
  const heading = await readFile("src/components/ui/heading.tsx", "utf8");
  const prose = await readFile("src/components/ui/prose.tsx", "utf8");
  const engine = await readFile("src/components/ui/text-style-engine.tsx", "utf8");
  const css = await readFile("src/components/ui/text.module.css", "utf8");
  const fontStyles = await readFile("src/components/ui/roboto-mono.css", "utf8");

  for (const [token, value] of Object.entries({
    xs: "11px",
    sm: "12px",
    md: "14px",
    lg: "16px",
    xl: "20px",
    "2xl": "24px",
    "3xl": "32px",
    "4xl": "40px",
  })) {
    const sourceToken = /^\d/.test(token) ? `"${token}"` : token;
    assert.ok(engine.includes(`${sourceToken}: "${value}"`));
  }
  assert.match(engine, /compileLayoutStyle\("text", declarations\)/);
  assert.match(text, /zero: fallback \?\? getNativeDisplay\(props\.as\)/);
  assert.match(text, /styles\.strikeDotted/);
  assert.match(text, /styles\.tabularFraction/);
  assert.doesNotMatch(text, /forwardRef/);
  assert.doesNotMatch(heading, /forwardRef/);
  assert.match(heading, /variant === "inherit" && props\.size === undefined/);
  assert.match(text, /inherit: undefined/);
  assert.match(heading, /inherit: undefined/);
  assert.doesNotMatch(css, /\.inherit\s*\{/);
  assert.match(css, /\.strikeDotted \{ text-decoration: line-through underline dotted; \}/);
  assert.match(css, /\.regularMono \{ font-weight: 425; \}/);
  assert.doesNotMatch(css, /@fontsource-variable\/roboto-mono\/wght\.css/);
  assert.match(fontStyles, /@fontsource-variable\/roboto-mono\/wght\.css/);
  assert.match(text, /import "\.\/roboto-mono\.css"/);
  assert.match(heading, /import "\.\/roboto-mono\.css"/);
  assert.match(prose, /import "\.\/roboto-mono\.css"/);
  assert.match(css, /\.mono[\s\S]*font-weight: 425/);
});

test("composes raw Prose code and kbd styles without touching pre code", async () => {
  const prose = await readFile("src/components/ui/prose.tsx", "utf8");
  const kbd = await readFile("src/components/ui/kbd-styles.tsx", "utf8");
  const inlineCode = await readFile("src/components/ui/code.tsx", "utf8");

  assert.match(prose, /code:not\(pre code\)/);
  assert.match(prose, /font-weight:425/);
  assert.match(prose, /inlineCodeStyles\(proseTheme\)\.styles/);
  assert.match(prose, /kbdStyles\(proseTheme\)\.styles/);
  assert.match(kbd, /height:1\.67em/);
  assert.match(kbd, /border-bottom:/);
  assert.match(inlineCode, /interface InlineCodeTheme/);
});

test("documents every canonical Text, Heading, render, responsive, and Prose group", async () => {
  const stories = await readFile("src/components/ui/text.stories.tsx", "utf8");
  const names = [...stories.matchAll(/export const (\w+): Story/g)].map((match) => match[1]);

  assert.deepEqual(names, [
    "Sizes",
    "Variants",
    "SemanticElements",
    "TypographyFeatures",
    "AlignmentAndDensity",
    "OverflowAndWrapping",
    "NumericAndMonospaceFeatures",
    "InheritConsumerOverrides",
    "ResponsiveContainerAndViewport",
    "RenderFunctions",
    "HeadingLevelsAndSizes",
    "HeadingVariantsAndFeatures",
    "ProseComposition",
  ]);
});
