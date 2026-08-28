import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const manifest = JSON.parse(await readFile("scraps-parity.json", "utf8"));
const registry = JSON.parse(await readFile("registry.json", "utf8"));

test("TextArea records the exact canonical consumer and Figma contracts", () => {
  const textArea = manifest.modules.find(({ name }) => name === "textarea");

  assert.deepEqual(textArea.canonical.publicExports, {
    runtime: ["TextArea"],
    types: ["TextAreaProps"],
  });
  assert.deepEqual(textArea.canonical.excludedExports, {
    runtime: [],
    types: [],
  });
  assert.deepEqual(textArea.local.implementedExports, {
    runtime: ["TextArea", "Textarea"],
    types: ["TextAreaProps"],
  });
  assert.deepEqual(textArea.local.codeConnect, ["src/components/ui/textarea.figma.ts"]);
  assert.deepEqual(textArea.local.figmaNodes, [
    "https://www.figma.com/design/eTJz6aPgudMY9E6mzyZU0B?node-id=3537-20061",
  ]);
  assert.equal(textArea.local.playgroundPath, "/?component=textarea");
  assert.equal(textArea.completion.state, "complete");
});

test("TextArea uses literal Tailwind and preserves autosize width observation", async () => {
  const source = await readFile("src/components/ui/textarea.tsx", "utf8");

  assert.doesNotMatch(source, /@emotion|styled\(|SerializedStyles|\.module\.css/);
  assert.match(source, /react-textarea-autosize/);
  assert.match(source, /rows = 3/);
  assert.match(source, /observer\.observe\(element, \{ box: "border-box" \}\)/);
  assert.match(source, /rounded-\[5px\]/);
  assert.match(source, /rounded-\[6px\]/);
  assert.match(source, /rounded-\[8px\]/);
  assert.match(source, /inset-shadow-\[0_1px_0_0_var\(--input-shadow\)\]/);
  assert.match(source, /focus:ring-2 focus:ring-ring/);
  assert.doesNotMatch(source, /ring-offset/);
  assert.match(source, /font-mono font-\[425\]/);
  assert.match(source, /disabled:text-\[#878490\]/);
  assert.match(source, /dark:disabled:text-\[#958e9f\]/);
});

test("TextArea registry publishes the standalone dependency closure", () => {
  const textArea = registry.items.find(({ name }) => name === "textarea");

  assert.deepEqual(textArea.dependencies, ["react-textarea-autosize@8.5.7"]);
  assert.deepEqual(textArea.registryDependencies, [
    "https://scrapscn.sentry.dev/r/sentry-base.json",
  ]);
  assert.deepEqual(textArea.files, [
    { path: "src/components/ui/textarea.tsx", type: "registry:ui" },
  ]);
});
