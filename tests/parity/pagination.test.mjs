import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

const completionNote =
  "Exact regular Scraps Pagination, Link header parsing, cursor caption, button geometry, callback signature, standalone browser navigation, workbench, production browser behavior, and standalone registry delivery use literal Tailwind classes. The canonical module has no Figma component.";

test("records the complete regular Scraps Pagination clone", async () => {
  const manifest = JSON.parse(await readFile("scraps-parity.json", "utf8"));
  const pagination = manifest.modules.find(({ name }) => name === "pagination");
  assert.deepEqual(pagination.canonical.publicExports, {
    runtime: ["Pagination", "useGetPaginationCaption"],
    types: ["CursorHandler"],
  });
  assert.deepEqual(pagination.local.implementationPaths, ["src/components/ui/pagination.tsx"]);
  assert.deepEqual(pagination.local.implementedExports, {
    runtime: ["Pagination", "useGetPaginationCaption"],
    types: ["CursorHandler"],
  });
  assert.deepEqual(pagination.local.registryItems, ["pagination"]);
  assert.deepEqual(pagination.local.codeConnect, []);
  assert.deepEqual(pagination.local.figmaNodes, []);
  assert.equal(pagination.local.playgroundPath, "/?component=pagination");
  assert.deepEqual(pagination.completion, {
    state: "complete",
    complete: true,
    note: completionNote,
  });
});

test("keeps canonical parser, cursor, geometry, and icon contracts in literal Tailwind", async () => {
  const source = await readFile("src/components/ui/pagination.tsx", "utf8");
  for (const fragment of [
    "parseLinkHeader",
    "queryFromSearch",
    "cursorHandler(links.previous?.cursor, path, query, -1)",
    "cursorHandler(links.next?.cursor, path, query, 1)",
    'size = "sm"',
    "mt-6 flex items-center justify-end",
    "M8 5C8.21 5",
    'direction === "left" ? "rotate-[270deg]" : "rotate-90"',
    "window.history.pushState",
    "export function useGetPaginationCaption()",
    'tct("[start]-[end] of [total]"',
  ])
    assert.ok(source.includes(fragment), fragment);
  assert.doesNotMatch(source, /@emotion|styled\(|\.module\.css|lucide-react/);
});

test("publishes Pagination through Button and keeps its checked-in registry artifact current", async () => {
  const registry = JSON.parse(await readFile("registry.json", "utf8"));
  const pagination = registry.items.find(({ name }) => name === "pagination");
  assert.deepEqual(pagination.cssVars, {
    light: { "scraps-content-secondary": "#6a6772" },
    dark: { "scraps-content-secondary": "#b5b0bd" },
  });
  assert.deepEqual(pagination.registryDependencies, [
    "https://scrapscn.sentry.dev/r/button.json",
    "https://scrapscn.sentry.dev/r/scraps-locale.json",
  ]);
  const directory = await mkdtemp(path.join(tmpdir(), "scrapscn-pagination-"));
  try {
    execFileSync("pnpm", ["exec", "shadcn", "build", "registry.json", "--output", directory], {
      cwd: process.cwd(),
      stdio: "pipe",
    });
    assert.deepEqual(
      JSON.parse(await readFile("public/r/pagination.json", "utf8")),
      JSON.parse(await readFile(path.join(directory, "pagination.json"), "utf8")),
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
