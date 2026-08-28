import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

const switchCssVars = {
  dark: {
    "scraps-switch-accent-background": "#7553ff",
    "scraps-switch-accent-chonk": "#120539",
    "scraps-switch-check": "#aba8f8",
    "scraps-switch-close": "#b5b0bd",
    "scraps-switch-focus": "#7553ff",
    "scraps-switch-focus-mask": "#2e2936",
    "scraps-switch-neutral-background": "#00002033",
    "scraps-switch-neutral-chonk": "#141119",
    "scraps-switch-thumb-surface": "#2e2936",
  },
  light: {
    "scraps-switch-accent-background": "#7553ff",
    "scraps-switch-accent-chonk": "#5827d6",
    "scraps-switch-check": "#653de9",
    "scraps-switch-close": "#6a6772",
    "scraps-switch-focus": "#7553ff",
    "scraps-switch-focus-mask": "#ffffff",
    "scraps-switch-neutral-background": "#10103008",
    "scraps-switch-neutral-chonk": "#dad9de",
    "scraps-switch-thumb-surface": "#ffffff",
  },
};

test("records the regular Scraps Switch contract and local Figma mapping", async () => {
  const manifest = JSON.parse(await readFile("scraps-parity.json", "utf8"));
  const component = manifest.modules.find(({ name }) => name === "switch");
  assert.deepEqual(component.canonical.sourcePaths, [
    "static/app/components/core/switch/index.tsx",
    "static/app/components/core/switch/switch.figma.tsx",
    "static/app/components/core/switch/switch.mdx",
    "static/app/components/core/switch/switch.snapshots.tsx",
    "static/app/components/core/switch/switch.spec.tsx",
    "static/app/components/core/switch/switch.tsx",
  ]);
  assert.deepEqual(component.canonical.publicExports, {
    runtime: ["Switch"],
    types: ["SwitchProps"],
  });
  assert.deepEqual(component.local.implementedExports, {
    runtime: ["Switch"],
    types: ["SwitchProps"],
  });
  assert.deepEqual(component.local.registryItems, ["switch"]);
  assert.deepEqual(component.local.codeConnect, ["src/components/ui/switch.figma.ts"]);
  assert.deepEqual(component.local.figmaNodes, [
    "https://www.figma.com/design/eTJz6aPgudMY9E6mzyZU0B?node-id=3277-4566",
  ]);
  assert.equal(component.local.playgroundPath, "/?component=switch");
  assert.equal(component.completion.state, "complete");
  assert.equal(component.completion.complete, true);
  assert.match(component.completion.note, /size sm\|lg and checked boolean/);
  const figma = execFileSync(
    "git",
    [
      "-C",
      process.env.SENTRY_REPO_PATH ?? "../sentry",
      "show",
      `${manifest.canonical.commit}:static/app/components/core/switch/switch.figma.tsx`,
    ],
    { encoding: "utf8" },
  );
  assert.match(figma, /node-id=3277-4566/);
  assert.match(figma, /size: figma\.enum/);
  assert.match(figma, /checked: figma\.boolean/);
});

test("uses the canonical native input API, Tailwind geometry, SVG paths, and springs", async () => {
  const source = await readFile("src/components/ui/switch.tsx", "utf8");
  assert.match(
    source,
    /extends Omit<\s*React\.InputHTMLAttributes<HTMLInputElement>,\s*"size" \| "type" \| "onClick"\s*>/,
  );
  for (const fragment of [
    "ref?: React.Ref<HTMLInputElement>",
    'size?: "sm" | "lg"',
    'type="checkbox"',
    "h-5 w-9",
    "h-6 w-10",
    "size-5",
    "size-6",
    "rounded-[5px]",
    "border-t-2",
    "[transform:translateY(-1px)]",
    "peer-checked:[&_[data-slot=switch-thumb]]:[transform:translateY(-1px)_translateX(-1px)_translateX(17px)]",
    "peer-disabled:[&_[data-slot=switch-thumb]]:[transform:translateY(0px)_translateX(-1px)]",
    "peer-checked:peer-disabled:[&_[data-slot=switch-thumb]]:[transform:translateY(0px)_translateX(17px)]",
    "peer-focus-visible:[box-shadow:0_0_0_0_var(--scraps-switch-focus-mask),0_0_0_2px_var(--scraps-switch-focus)]",
    "linear(0,0.2949,0.6842",
    "linear(0,0.4005,0.8613",
    "M12.72 2.22",
    "M13.72 3.22",
    "fill-[var(--scraps-switch-close)]",
    "fill-[var(--scraps-switch-check)]",
  ])
    assert.ok(source.includes(fragment), fragment);
  assert.doesNotMatch(
    source,
    /@emotion|@base-ui|styled\(|\.module\.css|<style\b|SwitchPrimitive|lucide-react|cva/,
  );
});

test("publishes Switch token closure without runtime dependencies", async () => {
  const registry = JSON.parse(await readFile("registry.json", "utf8"));
  const globals = await readFile("src/app/globals.css", "utf8");
  const component = registry.items.find(({ name }) => name === "switch");
  const darkStart = globals.indexOf(".dark {");
  assert.deepEqual(component.dependencies ?? [], []);
  assert.deepEqual(component.registryDependencies, []);
  assert.deepEqual(component.cssVars, switchCssVars);
  assert.deepEqual(component.files, [
    { path: "src/components/ui/switch.tsx", type: "registry:ui" },
  ]);
  for (const [name, value] of Object.entries(switchCssVars.light))
    assert.ok(globals.slice(0, darkStart).includes(`--${name}: ${value};`), name);
  for (const [name, value] of Object.entries(switchCssVars.dark))
    assert.ok(globals.slice(darkStart).includes(`--${name}: ${value};`), name);
});

test("ships Switch stories, workbench controls, and focused production evidence", async () => {
  const stories = await readFile("src/components/ui/switch.stories.tsx", "utf8");
  const workbench = await readFile(
    "src/components/playground/workbenches/switch-workbench.tsx",
    "utf8",
  );
  const e2e = await readFile("tests/e2e/playground.spec.ts", "utf8");
  for (const story of ["Default", "Unchecked", "Sizes", "Disabled", "Playground"])
    assert.match(stories, new RegExp(`export const ${story}: Story`));
  for (const fragment of [
    'aria-label="Switch size"',
    'aria-label="Enable switch"',
    'aria-label="Disable switch"',
    'name="notifications"',
    'type="reset"',
    'data-testid="switch-submit-result"',
  ])
    assert.ok(workbench.includes(fragment), fragment);
  assert.match(e2e, /test\("runs the Switch workbench/);
});

test("keeps published Switch artifacts equal to a fresh registry build", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "scrapscn-switch-"));
  try {
    execFileSync("pnpm", ["exec", "shadcn", "build", "registry.json", "--output", directory], {
      cwd: process.cwd(),
      stdio: "pipe",
    });
    assert.deepEqual(
      JSON.parse(await readFile("public/r/switch.json", "utf8")),
      JSON.parse(await readFile(path.join(directory, "switch.json"), "utf8")),
    );
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});
