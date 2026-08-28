import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("records the Tailwind interaction state layer as complete", async () => {
  const manifest = JSON.parse(await readFile("scraps-parity.json", "utf8"));
  const interactionStateLayer = manifest.modules.find(
    ({ name }) => name === "interactionStateLayer",
  );

  assert.deepEqual(interactionStateLayer.local.implementationPaths, [
    "src/components/ui/interaction-state-layer.tsx",
  ]);
  assert.deepEqual(interactionStateLayer.local.registryItems, ["interaction-state-layer"]);
  assert.deepEqual(interactionStateLayer.local.tests, [
    "tests/e2e/playground.spec.ts",
    "tests/parity/interaction-state-layer.test.mjs",
  ]);
  assert.equal(interactionStateLayer.local.playgroundPath, "/?component=interaction-state-layer");
  assert.equal(interactionStateLayer.completion.state, "complete");
  assert.equal(interactionStateLayer.completion.complete, true);
  assert.deepEqual(interactionStateLayer.local.figmaNodes, []);
});

test("publishes a registry that passes the installed shadcn schema", () => {
  const output = execFileSync("pnpm", ["exec", "shadcn", "registry", "validate", "registry.json"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });

  assert.match(output, /registry\.json/);
});

test("keeps parent interaction selectors in literal Tailwind classes", async () => {
  const source = await readFile("src/components/ui/interaction-state-layer.tsx", "utf8");

  assert.match(source, /\[&\[data-is-pressed=true\]\]:!opacity-/);
  assert.match(source, /\[\*:active>_&\[data-is-pressed=undefined\]\]:!opacity-/);
  assert.match(
    source,
    /\[\*\[aria-selected=true\]>_&\[data-is-pressed=undefined\]\[data-has-selected-background=true\]\]:!opacity-/,
  );
  assert.match(
    source,
    /\[\*:disabled_&\[data-is-hovered\]\[data-is-pressed\]\[data-has-selected-background\]\]:!opacity-0/,
  );
  assert.match(
    source,
    /\[\*\[aria-disabled=true\]_&\[data-is-hovered\]\[data-is-pressed\]\[data-has-selected-background\]\]:!opacity-0/,
  );
  assert.doesNotMatch(source, /\.module\.css/);
});
