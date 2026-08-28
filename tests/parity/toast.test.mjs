import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

const completionNote =
  "Exact regular Scraps Toast API, indicator contract, motion, type rails, icons, spinner, dismiss and undo bubbling behavior, host locale delegation, workbench, production browser behavior, and standalone registry delivery use literal Tailwind classes. The Toast MDX URL is the generic Button node, not an approved Toast Figma node.";

test("records the complete regular Scraps Toast clone", async () => {
  const manifest = JSON.parse(await readFile("scraps-parity.json", "utf8"));
  const item = manifest.modules.find(({ name }) => name === "toast");
  assert.deepEqual(item.canonical.publicExports, {
    runtime: ["Toast"],
    types: [],
  });
  assert.deepEqual(item.local.implementationPaths, ["src/components/ui/toast.tsx"]);
  assert.deepEqual(item.local.implementedExports, {
    runtime: ["Toast"],
    types: [],
  });
  assert.deepEqual(item.local.registryItems, ["toast"]);
  assert.deepEqual(item.local.codeConnect, []);
  assert.deepEqual(item.local.figmaNodes, []);
  assert.equal(item.local.playgroundPath, "/?component=toast");
  assert.deepEqual(item.completion, {
    complete: true,
    note: completionNote,
    state: "complete",
  });
});

test("keeps the canonical indicator, motion, layout, icon, spinner, and no-invention contracts", async () => {
  const source = await readFile("src/components/ui/toast.tsx", "utf8");
  for (const fragment of [
    'type IndicatorType = "loading" | "error" | "success" | "undo" | ""',
    "clearId?: null | number",
    "disableDismiss?: boolean",
    "onDismiss: (indicator: Indicator, event: MouseEvent) => void",
    "initial: { opacity: 0, y: 70 }",
    "animate: { opacity: 1, y: 0 }",
    "exit: { opacity: 0, y: 70 }",
    "stiffness: 450",
    "damping: 25",
    "ref-toast ref-${indicator.type}",
    'data-test-id={indicator.type ? `toast-${indicator.type}` : "toast"}',
    "indicator.options?.disableDismiss",
    'typeof indicator.options.undo === "function"',
    'size="xs"',
    'variant="secondary"',
    't("Undo")',
    "Sentry.captureException(new Error(`Unknown toast type: ${type}`))",
    "M13.72 3.22",
    "M6.81 0.65",
    "M8 16C3.58",
    "border-[1.2px]",
    "border-[#E6E9EC]",
    "border-l-[#6c5fc7]",
    "dark:bg-[#272433]",
    "animate-[scraps-toast-spin_0.55s_linear_infinite]",
    "rounded-[8px]",
    "[box-shadow:var(--scraps-theme-shadow-medium)]",
    "overflow-hidden leading-[1.2] text-ellipsis whitespace-nowrap",
  ])
    assert.ok(source.includes(fragment), fragment);
  assert.doesNotMatch(
    source,
    /@emotion|styled\(|\.module\.css|role="alert"|Close|duration handling/i,
  );
  assert.deepEqual(
    Array.from(source.matchAll(/export\s+(?:async\s+)?function\s+(\w+)/g), ([, name]) => name),
    ["Toast"],
  );
  assert.doesNotMatch(source, /export\s+(?:interface|type|const|class)\s+/);
});

test("publishes the standalone Toast registry artifact", async () => {
  const registry = JSON.parse(await readFile("registry.json", "utf8"));
  const item = registry.items.find(({ name }) => name === "toast");
  assert.deepEqual(item.dependencies, ["@sentry/react@10.69.0", "framer-motion@12.38.0"]);
  assert.deepEqual(item.registryDependencies, [
    "https://scrapscn.sentry.dev/r/button.json",
    "https://scrapscn.sentry.dev/r/scraps-locale.json",
  ]);
  const itemByName = new Map(registry.items.map((entry) => [entry.name, entry]));
  const dependencyNames = new Set();
  const pending = ["toast"];
  while (pending.length > 0) {
    const name = pending.pop();
    if (!name || dependencyNames.has(name)) continue;
    dependencyNames.add(name);
    const dependencyItem = itemByName.get(name);
    for (const dependency of dependencyItem?.registryDependencies ?? []) {
      const dependencyName = dependency
        .split("/")
        .at(-1)
        ?.replace(/\.json$/, "");
      if (dependencyName) pending.push(dependencyName);
    }
  }
  assert.ok(dependencyNames.has("sentry-base"));
  const baseStyles = await readFile("src/app/globals.css", "utf8");
  assert.match(baseStyles, /@keyframes scraps-toast-spin/);
  assert.match(baseStyles, /--scraps-theme-shadow-medium:/);
  const directory = await mkdtemp(path.join(tmpdir(), "scrapscn-toast-"));
  try {
    execFileSync("pnpm", ["exec", "shadcn", "build", "registry.json", "--output", directory], {
      cwd: process.cwd(),
      stdio: "pipe",
    });
    assert.deepEqual(
      JSON.parse(await readFile("public/r/toast.json", "utf8")),
      JSON.parse(await readFile(path.join(directory, "toast.json"), "utf8")),
    );
    assert.deepEqual(
      JSON.parse(await readFile("public/r/registry.json", "utf8")),
      JSON.parse(await readFile(path.join(directory, "registry.json"), "utf8")),
    );
  } finally {
    await rm(directory, { recursive: true });
  }
});
