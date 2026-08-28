import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const manifest = JSON.parse(await readFile("scraps-parity.json", "utf8"));
const registry = JSON.parse(await readFile("registry.json", "utf8"));

test("Input records the exact canonical public contract", () => {
  const input = manifest.modules.find(({ name }) => name === "input");

  assert.deepEqual(input.canonical.publicExports, {
    runtime: [
      "Input",
      "InputGroup",
      "NumberDragInput",
      "NumberInput",
      "OTPInput",
      "useAutosizeInput",
    ],
    types: ["InputProps", "InputStylesProps"],
  });
  assert.deepEqual(input.canonical.excludedExports, { runtime: [], types: [] });
  assert.deepEqual(input.local.implementedExports, {
    runtime: [
      "Input",
      "InputGroup",
      "NumberDragInput",
      "NumberInput",
      "OTPInput",
      "useAutosizeInput",
    ],
    types: ["InputProps", "InputStylesProps", "NumberDragInput", "OTPInputProps"],
  });
  assert.deepEqual(input.local.codeConnect, []);
  assert.deepEqual(input.local.figmaNodes, []);
  assert.equal(input.local.playgroundPath, "/?component=input");
  assert.equal(input.completion.state, "complete");
  assert.match(input.completion.note, /no Input-specific Code Connect file/i);
});

test("Input is a literal Tailwind port of all six runtime exports", async () => {
  const source = await readFile("src/components/ui/input.tsx", "utf8");

  assert.doesNotMatch(
    source,
    /@emotion|styled\(|SerializedStyles|StrictCSSObject|@base-ui\/react\/input|\.module\.css/,
  );
  for (const symbol of [
    "function Input(",
    "const InputGroup",
    "function NumberDragInput(",
    "function NumberInput(",
    "function OTPInput<",
    "function useAutosizeInput(",
  ]) {
    assert.match(source, new RegExp(symbol.replace(/[()]/g, "\\$&")));
  }
  assert.match(source, /size = "md"/);
  assert.match(source, /size=\{nativeSize\}/);
  assert.match(source, /h-7 min-h-7 rounded-\[5px\]/);
  assert.match(source, /h-8 min-h-8 rounded-\[6px\]/);
  assert.match(source, /h-9 min-h-9 rounded-\[8px\]/);
  assert.match(source, /text-xs\/4/);
  assert.match(source, /text-sm\/4/);
  assert.match(source, /px-2 py-1\.5/);
  assert.match(source, /px-3 py-2/);
  assert.match(source, /px-4 py-3/);
  assert.match(source, /font-mono font-\[425\]/);
  assert.match(source, /import "\.\/roboto-mono\.css"/);
  assert.match(source, /tct\(/);
  assert.match(source, /icon=\{<Chevron direction="up" \/>\}/);
  assert.match(source, /new ResizeObserver\(updateWidth\)/);
  assert.match(source, /paddingLeft: `calc\(/);
  assert.match(source, /requestPointerLock\(\)/);
  assert.match(source, /document\.exitPointerLock\?\.\(\)/);
  assert.match(source, /useNumberFieldState/);
  assert.match(source, /useNumberField\(/);
  assert.match(source, /sizingDivRef\.current\?\.remove\(\)/);
  assert.match(source, /from "input-otp"/);
  assert.match(source, /REGEXP_ONLY_DIGITS_AND_CHARS/);
  assert.match(source, /pasteTransformer/);
});

test("Input registry item has the complete standalone dependency closure", () => {
  const input = registry.items.find(({ name }) => name === "input");

  assert.deepEqual(input.dependencies, [
    "@fontsource-variable/roboto-mono@5.2.9",
    "input-otp@1.5.0",
    "@react-aria/button@3.15.1",
    "@react-aria/i18n@3.13.1",
    "@react-aria/numberfield@3.13.1",
    "@react-aria/utils@3.34.1",
    "@react-stately/numberfield@3.12.1",
  ]);
  assert.deepEqual(input.registryDependencies, [
    "https://scrapscn.sentry.dev/r/button.json",
    "https://scrapscn.sentry.dev/r/scraps-locale.json",
    "https://scrapscn.sentry.dev/r/sentry-base.json",
    "https://scrapscn.sentry.dev/r/textarea.json",
    "https://scrapscn.sentry.dev/r/tooltip.json",
  ]);
  assert.deepEqual(input.cssVars, {
    light: {
      "scraps-input-background": "#10103008",
      "scraps-input-content-secondary": "#6a6772",
    },
    dark: {
      "scraps-input-background": "#00002033",
      "scraps-input-content-secondary": "#b5b0bd",
    },
  });
  assert.deepEqual(input.files, [
    {
      path: "src/components/ui/roboto-mono.css",
      type: "registry:file",
      target: "src/components/ui/roboto-mono.css",
    },
    { path: "src/components/ui/input.tsx", type: "registry:ui" },
  ]);
});

test("the checked Input registry artifact equals a fresh build", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "scrapscn-input-"));
  try {
    execFileSync("pnpm", ["exec", "shadcn", "build", "registry.json", "--output", directory], {
      cwd: process.cwd(),
      stdio: "pipe",
    });
    assert.deepEqual(
      JSON.parse(await readFile("public/r/input.json", "utf8")),
      JSON.parse(await readFile(path.join(directory, "input.json"), "utf8")),
    );
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});
