import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

const sliderDependencies = [
  "@react-aria/i18n@3.13.1",
  "@react-aria/slider@3.9.1",
  "@react-aria/visually-hidden@3.9.1",
  "@react-stately/slider@3.8.1",
];

const sliderCssVars = {
  light: {
    "scraps-slider-accent-background": "#7553ff",
    "scraps-slider-accent-chonk": "#5827d6",
    "scraps-slider-neutral-background": "#10103008",
    "scraps-slider-neutral-chonk": "#dad9de",
    "scraps-slider-thumb-surface": "#ffffff",
    "scraps-slider-label-content": "#6a6772",
    "scraps-slider-label-hover": "#653de9",
    "scraps-slider-focus-mask": "#ffffff",
    "scraps-slider-focus": "#7553ff",
    "scraps-slider-disabled-content": "#878490",
    "scraps-slider-on-vibrant": "#ffffff",
  },
  dark: {
    "scraps-slider-accent-background": "#7553ff",
    "scraps-slider-accent-chonk": "#120539",
    "scraps-slider-neutral-background": "#00002033",
    "scraps-slider-neutral-chonk": "#141119",
    "scraps-slider-thumb-surface": "#393442",
    "scraps-slider-label-content": "#b5b0bd",
    "scraps-slider-label-hover": "#aba8f8",
    "scraps-slider-focus-mask": "#2e2936",
    "scraps-slider-focus": "#7553ff",
    "scraps-slider-disabled-content": "#958e9f",
    "scraps-slider-on-vibrant": "#ffffff",
  },
};

test("records the regular Scraps Slider contract and local Figma mapping", async () => {
  const manifest = JSON.parse(await readFile("scraps-parity.json", "utf8"));
  const slider = manifest.modules.find(({ name }) => name === "slider");

  assert.deepEqual(slider.canonical.sourcePaths, [
    "static/app/components/core/slider/index.tsx",
    "static/app/components/core/slider/slider.figma.tsx",
    "static/app/components/core/slider/slider.mdx",
    "static/app/components/core/slider/slider.spec.tsx",
    "static/app/components/core/slider/slider.tsx",
  ]);
  assert.deepEqual(slider.canonical.publicExports, {
    runtime: ["Slider"],
    types: ["SliderProps"],
  });
  assert.deepEqual(slider.canonical.excludedExports, {
    runtime: [],
    types: [],
  });
  assert.deepEqual(slider.local.implementationPaths, ["src/components/ui/slider.tsx"]);
  assert.deepEqual(slider.local.implementedExports, {
    runtime: ["Slider"],
    types: ["SliderProps"],
  });
  assert.deepEqual(slider.local.registryItems, ["slider"]);
  assert.deepEqual(slider.local.codeConnect, ["src/components/ui/slider.figma.ts"]);
  assert.deepEqual(slider.local.figmaNodes, [
    "https://www.figma.com/design/eTJz6aPgudMY9E6mzyZU0B?node-id=3538-6616",
  ]);
  assert.equal(slider.local.playgroundPath, "/?component=slider");
  assert.equal(slider.completion.state, "complete");
  assert.equal(slider.completion.complete, true);
  assert.match(slider.completion.note, /empty props map/);
  assert.match(slider.completion.note, /empty props map/);

  const canonicalFigmaMapping = execFileSync(
    "git",
    [
      "-C",
      process.env.SENTRY_REPO_PATH ?? "../sentry",
      "show",
      `${manifest.canonical.commit}:static/app/components/core/slider/slider.figma.tsx`,
    ],
    { encoding: "utf8" },
  );
  assert.match(canonicalFigmaMapping, /node-id=3538-6616/);
  assert.match(canonicalFigmaMapping, /props:\s*\{\}/);
});

test("uses the canonical React Aria state and literal Tailwind geometry", async () => {
  const source = await readFile("src/components/ui/slider.tsx", "utf8");

  for (const fragment of [
    'import { useNumberFormatter } from "@react-aria/i18n"',
    'import { useSlider, useSliderThumb } from "@react-aria/slider"',
    'import { VisuallyHidden } from "@react-aria/visually-hidden"',
    'import { useSliderState } from "@react-stately/slider"',
    'value: number | ""',
    "onChange: (value: number) => void",
    "useSliderState({ ...ariaProps, numberFormatter })",
    "useSlider(ariaProps, state, trackRef)",
    "useSliderThumb(",
    'aria-invalid={htmlProps["aria-invalid"]}',
    "state.getThumbPercent(0)",
    "state.getValuePercent(tickValue)",
    'formatOptions === "hidden"',
    "h-16",
    "pt-5 pb-1.5",
    "h-[23px]",
    "w-[22px]",
    "pointer-events-none flex h-[23px]",
    "rounded-[5px]",
    "px-0.5 py-px text-center text-[12px]/none",
    "text-[11px] font-normal whitespace-nowrap text-[var(--scraps-slider-label-content)] tabular-nums",
    "group-not-data-[disabled]/slider:group-hover/slider:[--opacity:1]",
    "after:inset-[-4px]",
    "after:bottom-[-32px]",
    "group-has-[input:focus-visible]/slider",
    "group-[&:hover:not(:active,:focus-within)]/slider:text-[var(--scraps-slider-label-hover)]",
    "duration-120 ease-[ease]",
    "duration-160 ease-[cubic-bezier(0.8,-0.4,0.5,1)]",
  ]) {
    assert.ok(source.includes(fragment), fragment);
  }
  assert.match(
    source,
    /transitionDelay:\s*`\$\{\(\(index \+ 1\) \* tickDelay\)\.toFixed\(\s*2\s*\)\}ms`/,
  );

  assert.doesNotMatch(
    source,
    /@emotion|@base-ui|styled\(|SerializedStyles|\.module\.css|<style\b|createElement\(["']style["']\)|dangerouslySetInnerHTML/,
  );
});

test("publishes the standalone React Aria dependency and token closure", async () => {
  const registry = JSON.parse(await readFile("registry.json", "utf8"));
  const packageJson = JSON.parse(await readFile("package.json", "utf8"));
  const globals = await readFile("src/app/globals.css", "utf8");
  const slider = registry.items.find(({ name }) => name === "slider");

  assert.deepEqual(slider.dependencies, sliderDependencies);
  assert.deepEqual(slider.registryDependencies ?? [], []);
  assert.deepEqual(slider.cssVars, sliderCssVars);
  assert.deepEqual(slider.files, [{ path: "src/components/ui/slider.tsx", type: "registry:ui" }]);

  const darkStart = globals.indexOf(".dark {");
  assert.ok(darkStart > 0, "global dark theme selector");
  const lightTheme = globals.slice(0, darkStart);
  const darkTheme = globals.slice(darkStart);
  for (const [name, value] of Object.entries(sliderCssVars.light)) {
    assert.ok(lightTheme.includes(`--${name}: ${value};`), `${name} light`);
  }
  for (const [name, value] of Object.entries(sliderCssVars.dark)) {
    assert.ok(darkTheme.includes(`--${name}: ${value};`), `${name} dark`);
  }

  for (const dependency of sliderDependencies) {
    const separator = dependency.lastIndexOf("@");
    const name = dependency.slice(0, separator);
    const version = dependency.slice(separator + 1);
    assert.equal(packageJson.dependencies[name], version, dependency);
  }
});

test("ships Slider stories, workbench controls, and production interaction evidence", async () => {
  const stories = await readFile("src/components/ui/slider.stories.tsx", "utf8");
  const workbench = await readFile(
    "src/components/playground/workbenches/slider-workbench.tsx",
    "utf8",
  );
  const e2e = await readFile("tests/e2e/playground.spec.ts", "utf8");

  for (const story of [
    "Default",
    "Steps",
    "Ticks",
    "TickLabels",
    "Formatted",
    "Disabled",
    "Playground",
  ]) {
    assert.match(stories, new RegExp(`export const ${story}: Story`));
  }
  for (const fragment of [
    'aria-label="Slider value"',
    'aria-label="Disable slider"',
    "onChangeEnd={setLastCommit}",
    "ticks={{ count: 5, labels: true }}",
    "normalizeSliderValue(Number(parameter))",
    "normalizeSliderValue(",
    "step={SLIDER_STEP}",
    "onSearchChange(serialize(next))",
  ]) {
    assert.ok(workbench.includes(fragment), fragment);
  }
  assert.match(e2e, /test\("runs the Slider workbench/);
  assert.match(e2e, /pointerType: "touch"/);
  assert.match(e2e, /Last commit: \$\{pointerValue\}/);
  assert.match(e2e, /navigator\.clipboard\.readText\(\)/);
});

test("keeps published Slider artifacts equal to a fresh registry build", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "scrapscn-slider-"));
  try {
    execFileSync("pnpm", ["exec", "shadcn", "build", "registry.json", "--output", directory], {
      cwd: process.cwd(),
      stdio: "pipe",
    });
    for (const filename of ["slider.json", "registry.json"]) {
      assert.deepEqual(
        JSON.parse(await readFile(path.join("public/r", filename), "utf8")),
        JSON.parse(await readFile(path.join(directory, filename), "utf8")),
        `public/r/${filename} must equal a fresh registry build`,
      );
    }
  } finally {
    await rm(directory, { recursive: true });
  }
});
