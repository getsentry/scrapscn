import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

test("records the complete regular Scraps Checkbox clone and Figma seam", async () => {
  const manifest = JSON.parse(await readFile("scraps-parity.json", "utf8"));
  const checkbox = manifest.modules.find(({ name }) => name === "checkbox");

  assert.deepEqual(checkbox.canonical.sourcePaths, [
    "static/app/components/core/checkbox/checkbox.tsx",
    "static/app/components/core/checkbox/index.tsx",
  ]);
  assert.deepEqual(checkbox.canonical.publicExports, {
    runtime: ["Checkbox"],
    types: ["CheckboxProps"],
  });
  assert.deepEqual(checkbox.local.implementationPaths, ["src/components/ui/checkbox.tsx"]);
  assert.deepEqual(checkbox.local.implementedExports, {
    runtime: ["Checkbox"],
    types: ["CheckboxProps"],
  });
  assert.deepEqual(checkbox.local.registryItems, ["checkbox"]);
  assert.deepEqual(checkbox.local.codeConnect, ["src/components/ui/checkbox.figma.ts"]);
  assert.deepEqual(checkbox.local.figmaNodes, [
    "https://www.figma.com/design/eTJz6aPgudMY9E6mzyZU0B?node-id=3481-4211",
  ]);
  assert.equal(checkbox.local.playgroundPath, "/?component=checkbox");
  assert.deepEqual(checkbox.completion, {
    state: "complete",
    complete: true,
    note: "Exact regular Scraps Checkbox API, native form behavior, sizes, checked and indeterminate states, disabled treatment, focus ring, interaction layer, workbench, standalone registry delivery, and local Code Connect mapping use literal Tailwind classes. The mapping preserves the live size, checked, and state property vocabulary under the Scrapscn React label.",
  });
});

test("publishes Checkbox with its exact theme and interaction closure", async () => {
  const registry = JSON.parse(await readFile("registry.json", "utf8"));
  const checkbox = registry.items.find(({ name }) => name === "checkbox");

  assert.deepEqual(checkbox.registryDependencies, []);
  assert.deepEqual(checkbox.cssVars, {
    light: {
      "checkbox-border": "#dad9de",
      "checkbox-checked": "#7553ff",
      "checkbox-checked-chonk": "#5827d6",
      "checkbox-focus": "#7553ff",
      "scraps-checkbox-focus-mask": "#ffffff",
    },
    dark: {
      "checkbox-border": "#141119",
      "checkbox-checked": "#7553ff",
      "checkbox-checked-chonk": "#120539",
      "checkbox-focus": "#7553ff",
      "scraps-checkbox-focus-mask": "#2e2936",
    },
  });
  assert.deepEqual(checkbox.files, [
    {
      path: "src/components/ui/interaction-state-layer.tsx",
      type: "registry:ui",
    },
    { path: "src/components/ui/checkbox.tsx", type: "registry:ui" },
  ]);

  const temporaryDirectory = await mkdtemp(path.join(tmpdir(), "scrapscn-checkbox-"));
  try {
    execFileSync(
      "pnpm",
      ["exec", "shadcn", "build", "registry.json", "--output", temporaryDirectory],
      { cwd: process.cwd(), stdio: "pipe" },
    );
    const builtItem = JSON.parse(
      await readFile(path.join(temporaryDirectory, "checkbox.json"), "utf8"),
    );
    const builtSource = builtItem.files.find(
      ({ path: filePath }) => filePath === "src/components/ui/checkbox.tsx",
    );
    const builtInteractionLayer = builtItem.files.find(
      ({ path: filePath }) => filePath === "src/components/ui/interaction-state-layer.tsx",
    );

    assert.deepEqual(builtItem.registryDependencies, []);
    assert.equal(builtSource?.content, await readFile("src/components/ui/checkbox.tsx", "utf8"));
    assert.equal(
      builtInteractionLayer?.content,
      await readFile("src/components/ui/interaction-state-layer.tsx", "utf8"),
    );
  } finally {
    await rm(temporaryDirectory, { recursive: true });
  }
});

test("keeps the exact Checkbox Tailwind geometry and native state seams", async () => {
  const source = await readFile("src/components/ui/checkbox.tsx", "utf8");

  for (const fragment of [
    "node.indeterminate = isIndeterminate",
    "checked={!isIndeterminate && checked}",
    'type="checkbox"',
    "peer-checked:bg-[var(--checkbox-checked)]",
    "peer-indeterminate:bg-[var(--checkbox-checked)]",
    "peer-disabled:peer-checked:border-[var(--checkbox-checked-chonk)]",
    "--scraps-checkbox-focus-mask",
    '<path d="M3 8H13" />',
    '<path d="M2.86 9.14C4.42 10.7 6.9 13.14 6.86 13.14L12.57 3.43" />',
    "<InteractionStateLayer",
  ]) {
    assert.ok(source.includes(fragment), fragment);
  }
  for (const pattern of [
    /xs:\s*\{[\s\S]*?box: "size-3"[\s\S]*?icon: "size-2\.5"[\s\S]*?radius: "rounded-\[2px\]"[\s\S]*?strokeWidth: 1\.8/,
    /sm:\s*\{[\s\S]*?box: "size-4"[\s\S]*?icon: "size-3"[\s\S]*?radius: "rounded-\[4px\]"[\s\S]*?strokeWidth: 1\.88/,
    /md:\s*\{[\s\S]*?box: "size-\[22px\]"[\s\S]*?icon: "size-\[18px\]"[\s\S]*?radius: "rounded-\[6px\]"[\s\S]*?strokeWidth: 2\.12/,
    /checked\?:\s*(?:\|\s*)?React\.InputHTMLAttributes<HTMLInputElement>\["checked"\]\s*\| "indeterminate"/,
  ]) {
    assert.match(source, pattern);
  }
  assert.doesNotMatch(source, /@emotion|styled\(|\.module\.css|<style\b/);
});

test("maps the live Checkbox Figma vocabulary to only public code props", async () => {
  const mapping = await readFile("src/components/ui/checkbox.figma.ts", "utf8");
  const config = JSON.parse(await readFile("figma.config.json", "utf8"));

  assert.equal(config.codeConnect.label, "Scrapscn React");
  assert.match(mapping, /node-id=3481-4211/);
  assert.match(mapping, /getEnum\("size", \{[\s\S]*xs: "xs"[\s\S]*sm: "sm"[\s\S]*md: "md"/);
  assert.match(
    mapping,
    /getEnum\("checked", \{[\s\S]*False: false[\s\S]*indeterminate: "indeterminate"[\s\S]*True: true/,
  );
  assert.match(
    mapping,
    /getEnum\("state", \{[\s\S]*Default: false[\s\S]*Hover: false[\s\S]*Active: false[\s\S]*disabled: true[\s\S]*Focused: false/,
  );
  assert.match(mapping, /import \{ Checkbox \} from "@\/components\/ui\/checkbox"/);
  assert.doesNotMatch(mapping, /@sentry\/scraps|figma\.connect\(/);
});
