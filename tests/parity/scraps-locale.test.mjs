import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

test("publishes one shared locale adapter for localized Scraps strings", async () => {
  const registry = JSON.parse(await readFile("registry.json", "utf8"));
  const item = registry.items.find(({ name }) => name === "scraps-locale");

  assert.deepEqual(item, {
    description:
      "Shared standalone English locale fallback and host adapter for regular Scraps component strings.",
    dependencies: ["sprintf-js@1.0.3"],
    files: [{ path: "src/lib/scraps-locale.ts", type: "registry:lib" }],
    name: "scraps-locale",
    title: "Scraps Locale Adapter",
    type: "registry:lib",
  });

  const toast = registry.items.find(({ name }) => name === "toast");
  assert.ok(
    toast.registryDependencies.includes("https://scrapscn.sentry.dev/r/scraps-locale.json"),
  );

  const directory = await mkdtemp(path.join(tmpdir(), "scrapscn-locale-"));
  try {
    execFileSync("pnpm", ["exec", "shadcn", "build", "registry.json", "--output", directory], {
      cwd: process.cwd(),
      stdio: "pipe",
    });
    assert.deepEqual(
      JSON.parse(await readFile("public/r/scraps-locale.json", "utf8")),
      JSON.parse(await readFile(path.join(directory, "scraps-locale.json"), "utf8")),
    );
  } finally {
    await rm(directory, { recursive: true });
  }
});
