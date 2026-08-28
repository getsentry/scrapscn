import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

const note =
  "SegmentedControl behavior, exact Tailwind styling, workbench, focused tests, and standalone registry delivery are present. The explicit portable-contract input exclusion for TooltipProps.overlayStyle is owner-authorized and recorded in scope.excludedContractInputs. The canonical MDX Figma resource resolves to frame 384:2119 named Button, so it provides no SegmentedControl component or property vocabulary to map.";

test("records the complete pinned SegmentedControl clone", async () => {
  const manifest = JSON.parse(await readFile("scraps-parity.json", "utf8"));
  const component = manifest.modules.find(({ name }) => name === "segmentedControl");
  const button = manifest.modules.find(({ name }) => name === "button");

  assert.deepEqual(component.canonical.publicExports, {
    runtime: ["SegmentedControl"],
    types: [],
  });
  for (const canonicalPath of [
    "static/app/components/core/button/styles.tsx",
    "static/app/components/core/segmentedControl/segmentedControl.mdx",
    "static/app/components/core/segmentedControl/segmentedControl.spec.tsx",
    "static/app/components/core/tooltip/tooltip.tsx",
    "static/app/utils/theme/scraps/theme/base.tsx",
    "static/app/utils/theme/scraps/theme/dark.tsx",
    "static/app/utils/theme/scraps/theme/light.tsx",
    "static/app/utils/theme/scraps/tokens/color.tsx",
    "static/app/utils/theme/scraps/tokens/size.tsx",
    "static/app/utils/theme/scraps/tokens/typography.tsx",
    "static/app/utils/theme/theme.tsx",
  ]) {
    assert.ok(
      component.canonical.sourcePaths.includes(canonicalPath),
      `Missing canonical SegmentedControl evidence: ${canonicalPath}`,
    );
  }
  assert.deepEqual(component.local.implementedExports, {
    runtime: ["SegmentedControl"],
    types: [],
  });
  assert.equal(component.local.playgroundPath, "/?component=segmented-control");
  assert.deepEqual(component.local.figmaNodes, []);
  assert.deepEqual(button.local.figmaNodes, [
    "https://www.figma.com/design/eTJz6aPgudMY9E6mzyZU0B?node-id=384-2119",
  ]);
  assert.deepEqual(component.completion, {
    state: "complete",
    complete: true,
    note,
    excludedContractInputs: ["tooltip.overlayStyle.serializedStyles"],
  });
});

test("publishes the self-contained SegmentedControl registry artifact", async () => {
  const registry = JSON.parse(await readFile("registry.json", "utf8"));
  const component = registry.items.find(({ name }) => name === "segmented-control");
  const base = registry.items.find(({ name }) => name === "sentry-base");

  assert.deepEqual(component.dependencies, [
    "@react-aria/radio@3.13.1",
    "@react-stately/collections@3.13.1",
    "@react-stately/list@3.14.1",
    "@react-stately/radio@3.12.1",
    "@react-types/shared@3.36.0",
  ]);
  assert.deepEqual(component.registryDependencies, [
    "https://scrapscn.sentry.dev/r/sentry-base.json",
    "https://scrapscn.sentry.dev/r/tooltip.json",
  ]);
  assert.deepEqual(component.cssVars, {
    light: {
      "scraps-segmented-control-focus-mask": "#ffffff",
      "scraps-segmented-control-focus": "#7553ff",
    },
    dark: {
      "scraps-segmented-control-focus-mask": "#2e2936",
      "scraps-segmented-control-focus": "#7553ff",
    },
  });
  assert.ok(
    base.files.some(({ path: file }) => file === "src/app/globals.css"),
    "sentry-base must deliver the semantic variables used by SegmentedControl",
  );

  const baseStyles = await readFile("src/app/globals.css", "utf8");
  assert.match(baseStyles, /--scraps-content-secondary: #6a6772/);
  assert.match(baseStyles, /--scraps-content-secondary: #b5b0bd/);
  assert.match(baseStyles, /--scraps-segmented-control-focus-mask: #ffffff/);
  assert.match(baseStyles, /--scraps-segmented-control-focus-mask: #2e2936/);
  assert.equal((baseStyles.match(/--scraps-segmented-control-focus: #7553ff/g) ?? []).length, 2);
  assert.match(baseStyles, /--background: oklch\(1 0 0\)/);
  assert.match(baseStyles, /--background: oklch\(0\.292 0\.024 302\.5\)/);

  const directory = await mkdtemp(path.join(tmpdir(), "scrapscn-segmented-control-"));
  try {
    execFileSync("pnpm", ["exec", "shadcn", "build", "registry.json", "--output", directory], {
      cwd: process.cwd(),
      stdio: "pipe",
    });
    const built = JSON.parse(
      await readFile(path.join(directory, "segmented-control.json"), "utf8"),
    );
    const published = JSON.parse(await readFile("public/r/segmented-control.json", "utf8"));
    assert.equal(
      built.files.find(({ path: file }) => file === "src/components/ui/segmented-control.tsx")
        ?.content,
      await readFile("src/components/ui/segmented-control.tsx", "utf8"),
    );
    assert.deepEqual(published, built);
  } finally {
    await rm(directory, { recursive: true });
  }
});

test("keeps source-grounded React Aria and literal style evidence", async () => {
  const source = await readFile("src/components/ui/segmented-control.tsx", "utf8");

  for (const fragment of [
    "@react-aria/radio",
    "@react-stately/radio",
    "@react-stately/collections",
    "SegmentedControl.Item = Item",
    'orientation: "horizontal"',
    "{...radioGroupProps}",
    "rounded-[8px]",
    "rounded-[6px]",
    "rounded-[5px]",
    "sizeClasses",
    "segmentGeometryClasses",
    "rectangularPaddingClasses",
    "squareShapeClasses",
    'md: "px-4 py-2"',
    'sm: "px-3 py-2"',
    'xs: "px-2 py-1.5"',
    'md: "min-w-9 p-0"',
    "relative z-1 inline-flex flex-1 items-center justify-center [gap:inherit] overflow-hidden whitespace-nowrap",
    "[transform:translateX(calc(-1px*var(--segment-index)))]",
    "before:[transform:translateY(calc(-1*var(--segment-lift-base)))]",
    "after:[transform:translateY(calc(-1*var(--segment-lift)))]",
    "hover:[--segment-lift:calc(var(--segment-lift-base)+1px)]",
    "active:[--segment-lift:0px]",
    "data-[selected=true]:[--segment-lift:0px]",
    "data-selected={isSelected || undefined}",
    "aria-[disabled=true]:[--segment-lift:0px]",
    "selectedSegmentMotionClasses",
    "unselectedSegmentMotionClasses",
    "selectedContentMotionClasses",
    "unselectedContentMotionClasses",
    'const selectedSegmentMotionClasses = "after:transition-none"',
    "after:duration-[120ms]",
    "after:ease-[cubic-bezier(0.8,-0.4,0.5,1)]",
    'const selectedContentMotionClasses = "transition-none"',
    "transition-transform duration-[120ms] ease-[cubic-bezier(0.8,-0.4,0.5,1)]",
    "neutralSurfaceClasses",
    "primarySurfaceClasses",
    "unselectedContentClasses",
    "selectedPrimaryContentClasses",
    "[--segment-content:var(--scraps-content-secondary)]",
    "[&:has(input:focus-visible)_span]:![box-shadow:none]",
    "peer-focus-visible:[box-shadow:0_0_0_0_var(--scraps-segmented-control-focus-mask),0_0_0_2px_var(--scraps-segmented-control-focus)]",
    "aria-[disabled=true]:opacity-60",
    "cursor-pointer",
    "delay: 500",
    'position: "bottom"',
  ]) {
    assert.ok(source.includes(fragment), fragment);
  }

  assert.doesNotMatch(source, /var\(--muted-foreground\)/);
  assert.doesNotMatch(source, /cursor-not-allowed/);
  assert.doesNotMatch(source, /@react-aria\/utils|ComponentPropsWithoutRef|GlobalDOMAttributes/);
  assert.doesNotMatch(source, /aria-checked=\{isSelected\}/);
  assert.doesNotMatch(
    source,
    /aria-\[checked=true\]:after:transition-none|group-aria-\[checked=true\]\/segment:transition-none/,
  );
  assert.doesNotMatch(source, /(?:before:|after:)?translate-[xy]-\[/);
  assert.doesNotMatch(source, /has-\[:focus-visible\]:after:shadow|focus-visible:after:border/);
  assert.doesNotMatch(source, /@base-ui|@emotion|styled\(|export\s*\{[^}]*SegmentedControlItem/);
});
