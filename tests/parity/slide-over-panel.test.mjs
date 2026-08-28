import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

test("records the complete regular Scraps SlideOverPanel Tailwind clone", async () => {
  const manifest = JSON.parse(await readFile("scraps-parity.json", "utf8"));
  const panel = manifest.modules.find(({ name }) => name === "slideOverPanel");

  assert.deepEqual(panel.canonical.sourcePaths, [
    "static/app/components/core/boundaryContext.tsx",
    "static/app/components/core/slideOverPanel/index.tsx",
    "static/app/components/core/slideOverPanel/slideOverPanel.tsx",
    "static/app/utils/theme/scraps/theme/base.tsx",
    "static/app/utils/theme/scraps/theme/dark.tsx",
    "static/app/utils/theme/scraps/theme/light.tsx",
    "static/app/utils/theme/scraps/tokens/color.tsx",
    "static/app/utils/theme/scraps/tokens/size.tsx",
    "static/app/utils/theme/scraps/tokens/typography.tsx",
    "static/app/utils/theme/theme.tsx",
    "static/app/utils/theme/types.tsx",
    "static/app/views/navigation/constants.tsx",
    "static/app/views/navigation/useTopOffset.tsx",
  ]);
  assert.deepEqual(panel.canonical.publicExports, {
    runtime: ["SlideOverPanel"],
    types: [],
  });
  assert.deepEqual(panel.local.implementationPaths, ["src/components/ui/slide-over-panel.tsx"]);
  assert.deepEqual(panel.local.implementedExports, {
    runtime: ["SlideOverPanel"],
    types: [],
  });
  assert.deepEqual(panel.local.registryItems, ["slide-over-panel"]);
  assert.deepEqual(panel.local.stories, ["src/components/ui/slide-over-panel.stories.tsx"]);
  assert.deepEqual(panel.local.tests, [
    "src/components/ui/slide-over-panel.test.tsx",
    "tests/e2e/playground.spec.ts",
    "tests/parity/slide-over-panel.test.mjs",
    "tests/types/slide-over-panel-types.test.tsx",
  ]);
  assert.deepEqual(panel.local.figmaNodes, []);
  assert.equal(panel.local.playgroundPath, "/?component=slide-over-panel");
  assert.deepEqual(panel.completion, {
    state: "complete",
    complete: true,
    note: "Exact regular Scraps SlideOverPanel API, deferred content, motion, navigation offset, boundary context, responsive placement, theme surface, workbench, and standalone registry delivery use literal Tailwind classes. The canonical module has no Figma component.",
  });
});

test("publishes a self-contained SlideOverPanel registry item with exact theme tokens", async () => {
  const registry = JSON.parse(await readFile("registry.json", "utf8"));
  const panel = registry.items.find(({ name }) => name === "slide-over-panel");

  assert.deepEqual(panel.dependencies, ["framer-motion@12.38.0"]);
  assert.deepEqual(panel.registryDependencies, []);
  assert.deepEqual(panel.cssVars, {
    light: {
      "scraps-slide-over-background": "#ffffff",
      "scraps-slide-over-content": "#302e36",
      "scraps-slide-over-shadow": "0px 4px 0px 2px #10103008, 0px 1px 0px 1px #10103008",
    },
    dark: {
      "scraps-slide-over-background": "#393442",
      "scraps-slide-over-content": "#e7e5ea",
      "scraps-slide-over-shadow": "0px 4px 0px 2px #0000181a, 0px 1px 0px 1px #0000181a",
    },
  });
  assert.deepEqual(panel.files, [
    {
      path: "src/components/ui/boundary-context.tsx",
      type: "registry:file",
      target: "src/components/ui/boundary-context.tsx",
    },
    {
      path: "src/components/ui/slide-over-panel-environment.tsx",
      type: "registry:file",
      target: "src/components/ui/slide-over-panel-environment.tsx",
    },
    {
      path: "src/components/ui/slide-over-panel.tsx",
      type: "registry:ui",
    },
  ]);

  const temporaryDirectory = await mkdtemp(path.join(tmpdir(), "scrapscn-slide-over-panel-"));
  try {
    execFileSync(
      "pnpm",
      ["exec", "shadcn", "build", "registry.json", "--output", temporaryDirectory],
      { cwd: process.cwd(), stdio: "pipe" },
    );
    const builtItem = JSON.parse(
      await readFile(path.join(temporaryDirectory, "slide-over-panel.json"), "utf8"),
    );
    const builtSource = builtItem.files.find(
      ({ path: filePath }) => filePath === "src/components/ui/slide-over-panel.tsx",
    );

    assert.equal(
      builtSource?.content,
      await readFile("src/components/ui/slide-over-panel.tsx", "utf8"),
    );
    assert.equal(
      builtItem.files.some(({ path: filePath }) => filePath.endsWith(".module.css")),
      false,
    );
  } finally {
    await rm(temporaryDirectory, { recursive: true });
  }
});

test("keeps the canonical panel motion, DOM filter, boundary, navigation, and responsive seams", async () => {
  const source = await readFile("src/components/ui/slide-over-panel.tsx", "utf8");
  const boundary = await readFile("src/components/ui/boundary-context.tsx", "utf8");
  const environment = await readFile("src/components/ui/slide-over-panel-environment.tsx", "utf8");

  for (const fragment of [
    "useTransition",
    "isOpening",
    'role="complementary"',
    "const forwardedMode = { mode }",
    "{...forwardedMode}",
    "slide out drawer",
    "useReducedMotion",
    "stiffness: 1000",
    "damping: 50",
    "translateX(100%) translateY(0)",
    "translateX(-100%) translateY(0)",
    "position ? OPEN_STYLES[position] : OPEN_STYLES.right",
    "? COLLAPSED_STYLES[position]",
    "BoundaryContextProvider",
    "useTopOffset",
  ]) {
    assert.ok(source.includes(fragment), fragment);
  }
  assert.doesNotMatch(source, /export (interface|type) SlideOverPanelProps/);
  assert.doesNotMatch(source, /data-position|data-mode/);

  for (const fragment of [
    "min-[800px]:sticky",
    "top-4",
    "right-4",
    "bottom-4",
    "left-4",
    "50vw",
    "40vw",
    "50vh",
    "min-w-[450px]",
    "overscroll-contain",
    "POSITION_CLASSES",
    "--scraps-slide-over-panel-top",
    "--scraps-slide-over-panel-width",
    "--scraps-slide-over-background",
    "--scraps-slide-over-content",
    "--scraps-slide-over-shadow",
  ]) {
    assert.ok(source.includes(fragment), fragment);
  }
  assert.doesNotMatch(source, /\.module\.css|@emotion|styled\(/);
  assert.match(boundary, /createContext<string \| null>\(null\)/);
  assert.match(boundary, /BoundaryContext\.Provider/);
  assert.match(boundary, /useContext\(BoundaryContext\)/);
  for (const fragment of [
    "PRIMARY_HEADER_HEIGHT = 53",
    "SUPERUSER_MARQUEE_HEIGHT = 24",
    "NAVIGATION_MOBILE_CONTENT_HEIGHT = 48",
    "NAVIGATION_DESKTOP_BREAKPOINT = 992",
    "useSyncExternalStore",
  ]) {
    assert.ok(environment.includes(fragment), fragment);
  }
});
