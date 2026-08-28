import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

const completionNote =
  "Exact regular Scraps Disclosure compound API, React Aria controlled and uncontrolled state, keyboard behavior, size and outline geometry, canonical chevron path, slots, workbench, production browser behavior, and standalone registry delivery use literal Tailwind classes. The canonical module has no Figma component.";

test("records the complete regular Scraps Disclosure clone", async () => {
  const manifest = JSON.parse(await readFile("scraps-parity.json", "utf8"));
  const disclosure = manifest.modules.find(({ name }) => name === "disclosure");
  assert.deepEqual(disclosure.canonical.publicExports, {
    runtime: ["Disclosure"],
    types: [],
  });
  assert.deepEqual(disclosure.local.implementationPaths, ["src/components/ui/disclosure.tsx"]);
  assert.deepEqual(disclosure.local.implementedExports, {
    runtime: ["Disclosure"],
    types: [],
  });
  assert.deepEqual(disclosure.local.registryItems, ["disclosure"]);
  assert.deepEqual(disclosure.local.codeConnect, []);
  assert.deepEqual(disclosure.local.figmaNodes, []);
  assert.equal(disclosure.local.playgroundPath, "/?component=disclosure");
  assert.deepEqual(disclosure.completion, {
    state: "complete",
    complete: true,
    note: completionNote,
  });
});

test("keeps canonical state, slot, and chevron contracts in literal Tailwind", async () => {
  const source = await readFile("src/components/ui/disclosure.tsx", "utf8");
  for (const fragment of [
    "useDisclosureState",
    "useDisclosure(",
    "usePress(restButtonProps)",
    'size = "md"',
    'variant = "default"',
    "leadingItems",
    "trailingItems",
    'variant === "outline"',
    "alignedPaddingClasses",
    'leadingItems && "pl-1"',
    "active:bg-[var(--scraps-button-transparent-active)]",
    "M8 5C8.21 5",
    'direction === "right" ? "rotate-90" : "rotate-180"',
  ])
    assert.ok(source.includes(fragment), fragment);
  assert.doesNotMatch(source, /@emotion|styled\(|\.module\.css|lucide-react/);
});

test("publishes Disclosure with its runtime and primitive closure", async () => {
  const registry = JSON.parse(await readFile("registry.json", "utf8"));
  const disclosure = registry.items.find(({ name }) => name === "disclosure");
  assert.deepEqual(disclosure.dependencies, [
    "@react-aria/disclosure@3.2.1",
    "@react-aria/interactions@3.28.1",
    "@react-stately/disclosure@3.1.1",
  ]);
  assert.deepEqual(disclosure.registryDependencies, [
    "https://scrapscn.sentry.dev/r/button.json",
    "https://scrapscn.sentry.dev/r/layout.json",
    "https://scrapscn.sentry.dev/r/text.json",
  ]);
  const directory = await mkdtemp(path.join(tmpdir(), "scrapscn-disclosure-"));
  try {
    execFileSync("pnpm", ["exec", "shadcn", "build", "registry.json", "--output", directory], {
      cwd: process.cwd(),
      stdio: "pipe",
    });
    const item = JSON.parse(await readFile(path.join(directory, "disclosure.json"), "utf8"));
    assert.equal(
      item.files.find(({ path: filePath }) => filePath === "src/components/ui/disclosure.tsx")
        ?.content,
      await readFile("src/components/ui/disclosure.tsx", "utf8"),
    );
    assert.deepEqual(
      JSON.parse(await readFile("public/r/disclosure.json", "utf8")),
      item,
      "public/r/disclosure.json must equal a fresh registry build",
    );
    assert.deepEqual(
      JSON.parse(await readFile("public/r/registry.json", "utf8")),
      JSON.parse(await readFile(path.join(directory, "registry.json"), "utf8")),
      "public/r/registry.json must equal a fresh registry build",
    );
  } finally {
    await rm(directory, { recursive: true });
  }
});
