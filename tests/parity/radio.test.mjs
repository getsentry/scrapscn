import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

const completionNote =
  "Exact regular Scraps Radio API, native form behavior, xs, sm, and md geometry, checked and disabled states, focus treatment, motion, workbench, production browser behavior, standalone registry delivery, and local Code Connect mapping use literal Tailwind classes. The mapping preserves the live size, checked, and state property vocabulary under the Scrapscn React label.";

test("records the complete regular Scraps Radio clone", async () => {
  const manifest = JSON.parse(await readFile("scraps-parity.json", "utf8"));
  const radio = manifest.modules.find(({ name }) => name === "radio");

  assert.deepEqual(radio.canonical.sourcePaths, [
    "static/app/components/core/radio/index.tsx",
    "static/app/components/core/radio/radio.tsx",
  ]);
  assert.deepEqual(radio.canonical.publicExports, {
    runtime: ["Radio"],
    types: [],
  });
  assert.deepEqual(radio.local.implementationPaths, ["src/components/ui/radio.tsx"]);
  assert.deepEqual(radio.local.implementedExports, {
    runtime: ["Radio"],
    types: [],
  });
  assert.deepEqual(radio.local.registryItems, ["radio"]);
  assert.deepEqual(radio.local.codeConnect, ["src/components/ui/radio.figma.ts"]);
  assert.equal(radio.local.playgroundPath, "/?component=radio");
  assert.deepEqual(radio.completion, {
    state: "complete",
    complete: true,
    note: completionNote,
  });
});

test("publishes Radio as a self-contained registry artifact", async () => {
  const registry = JSON.parse(await readFile("registry.json", "utf8"));
  const radio = registry.items.find(({ name }) => name === "radio");

  assert.deepEqual(radio.registryDependencies, []);
  assert.deepEqual(radio.cssVars, {
    light: {
      "radio-border": "#dad9de",
      "radio-checked": "#7553ff",
      "radio-checked-chonk": "#5827d6",
      "radio-focus": "#7553ff",
      "scraps-radio-focus-mask": "#ffffff",
    },
    dark: {
      "radio-border": "#141119",
      "radio-checked": "#7553ff",
      "radio-checked-chonk": "#120539",
      "radio-focus": "#7553ff",
      "scraps-radio-focus-mask": "#2e2936",
    },
  });
  assert.deepEqual(radio.files, [
    {
      path: "src/components/ui/radio.css",
      type: "registry:file",
      target: "src/components/ui/radio.css",
    },
    { path: "src/components/ui/radio.tsx", type: "registry:ui" },
  ]);

  const temporaryDirectory = await mkdtemp(path.join(tmpdir(), "scrapscn-radio-"));
  try {
    execFileSync(
      "pnpm",
      ["exec", "shadcn", "build", "registry.json", "--output", temporaryDirectory],
      { cwd: process.cwd(), stdio: "pipe" },
    );
    const builtItem = JSON.parse(
      await readFile(path.join(temporaryDirectory, "radio.json"), "utf8"),
    );

    for (const filePath of ["src/components/ui/radio.css", "src/components/ui/radio.tsx"]) {
      assert.equal(
        builtItem.files.find(({ path: builtPath }) => builtPath === filePath)?.content,
        await readFile(filePath, "utf8"),
      );
    }
  } finally {
    await rm(temporaryDirectory, { recursive: true });
  }
});

test("keeps the exact native Radio API and Tailwind geometry", async () => {
  const source = await readFile("src/components/ui/radio.tsx", "utf8");
  const keyframes = await readFile("src/components/ui/radio.css", "utf8");

  for (const fragment of [
    '"type" | "size"',
    'interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size">',
    'xs: "size-3 after:size-1.5"',
    'sm: "size-5 after:size-2.5"',
    'md: "size-6 after:size-3"',
    'size = "md"',
    'type="radio"',
    "checked:bg-[var(--radio-checked)]",
    "disabled:cursor-not-allowed disabled:opacity-60",
    "radioGrowIn_160ms_cubic-bezier(0.72,0,0.16,1)",
  ]) {
    assert.ok(source.includes(fragment), fragment);
  }
  assert.doesNotMatch(source, /nativeSize/);
  assert.match(keyframes, /0%[\s\S]*opacity: 0;[\s\S]*scale\(0\.75\)/);
  assert.match(keyframes, /100%[\s\S]*opacity: 1;[\s\S]*scale\(1\)/);
  assert.doesNotMatch(source, /@emotion|@base-ui|styled\(|\.module\.css|<style\b/);
});

test("maps the live Radio Figma vocabulary to only public code props", async () => {
  const mapping = await readFile("src/components/ui/radio.figma.ts", "utf8");
  const config = JSON.parse(await readFile("figma.config.json", "utf8"));

  assert.equal(config.codeConnect.label, "Scrapscn React");
  assert.match(mapping, /node-id=3482-4251/);
  assert.match(mapping, /getEnum\("size", \{[\s\S]*md: "md"[\s\S]*sm: "sm"/);
  assert.match(mapping, /getEnum\("checked", \{[\s\S]*False: false[\s\S]*True: true/);
  assert.match(
    mapping,
    /getEnum\("state", \{[\s\S]*Default: false[\s\S]*Hover: false[\s\S]*Active: false[\s\S]*disabled: true[\s\S]*Focused: false/,
  );
  assert.match(mapping, /import \{ Radio \} from "@\/components\/ui\/radio"/);
  assert.doesNotMatch(mapping, /@sentry\/scraps|figma\.connect\(/);
});
