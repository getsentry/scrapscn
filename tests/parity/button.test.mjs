import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const registry = JSON.parse(await readFile("registry.json", "utf8"));
const manifest = JSON.parse(await readFile("scraps-parity.json", "utf8"));

test("Button completes the consumer contract and excludes only the CSS-in-JS helper", () => {
  const button = manifest.modules.find((candidate) => candidate.name === "button");

  assert.deepEqual(button.canonical.publicExports, {
    runtime: ["Button", "ButtonBar", "DO_NOT_USE_getButtonStyles", "LinkButton"],
    types: ["ButtonBarProps", "ButtonProps", "LinkButtonProps"],
  });
  assert.deepEqual(button.canonical.excludedExports, {
    runtime: ["DO_NOT_USE_getButtonStyles"],
    types: [],
  });
  assert.deepEqual(button.local.implementedExports, {
    runtime: ["Button", "ButtonBar", "LinkButton"],
    types: ["ButtonBarProps", "ButtonProps", "LinkButtonProps"],
  });
  assert.deepEqual(button.local.codeConnect, ["src/components/ui/button.figma.ts"]);
  assert.equal(button.local.playgroundPath, "/?component=button");
  assert.equal(button.completion.state, "complete");
  assert.equal(button.completion.complete, true);
  assert.deepEqual(button.completion.excludedContractInputs, [
    "tooltip.overlayStyle.serializedStyles",
  ]);
  assert.match(
    button.completion.note,
    /ButtonTooltipProps inherits the shared TooltipProps\.overlayStyle portable-contract input exclusion/,
  );
  assert.match(
    button.completion.note,
    /DO_NOT_USE_getButtonStyles exclusion is an Emotion StrictCSSObject helper/,
  );
});

test("Button registry publishes the Tailwind implementation and shared size context", () => {
  const button = registry.items.find((candidate) => candidate.name === "button");

  assert.deepEqual(
    button.files.map((file) => file.path),
    ["src/components/ui/button.tsx", "src/components/ui/size-context.tsx"],
  );
  assert.equal(button.dependencies, undefined);
  assert.ok(
    button.registryDependencies.every((dependency) =>
      dependency.startsWith("https://scrapscn.sentry.dev/r/"),
    ),
  );
});

test("Button implementation has no CSS-in-JS styling runtime or legacy style helper", async () => {
  const source = await readFile("src/components/ui/button.tsx", "utf8");

  for (const forbidden of [
    "@emotion/",
    "SerializedStyles",
    "DO_NOT_USE_getButtonStyles",
    "styled(",
  ]) {
    assert.doesNotMatch(source, new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(source, /buttonVariantClasses/);
  assert.match(source, /focus-visible:after:/);
  assert.match(source, /motion-reduce:after:duration-0/);
  assert.match(source, /:active:active\]:bg-\[var\(--scraps-button-transparent-active\)\]/);
});
