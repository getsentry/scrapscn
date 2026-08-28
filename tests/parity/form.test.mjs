import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("records the portable regular Scraps Form implementation", async () => {
  const manifest = JSON.parse(await readFile("scraps-parity.json", "utf8"));
  const item = manifest.modules.find(({ name }) => name === "form");
  assert.deepEqual(item.canonical.publicExports.runtime, [
    "AutoSaveContextProvider",
    "AutoSaveForm",
    "FieldGroup",
    "FormSearch",
    "defaultFormOptions",
    "formOptions",
    "setFieldErrors",
    "useScrapsForm",
    "useStore",
    "withFieldGroup",
    "withForm",
  ]);
  assert.deepEqual(item.local.implementedExports, item.canonical.publicExports);
  assert.deepEqual(item.local.registryItems, ["form"]);
  assert.deepEqual(item.local.stories, ["src/components/ui/form.stories.tsx"]);
  assert.ok(item.local.stories.every((story) => story.endsWith(".stories.tsx")));
  assert.equal(item.local.playgroundPath, "/?component=form");
  assert.equal(item.completion.state, "complete");
});

test("keeps Form portable and Tailwind-only", async () => {
  const sources = await Promise.all(
    [
      "src/components/ui/form.tsx",
      "src/components/ui/form-fields.tsx",
      "src/components/ui/form-auto-save-context.tsx",
      "src/components/ui/form-context.ts",
    ].map((path) => readFile(path, "utf8")),
  );
  const source = sources.join("\n");
  assert.doesNotMatch(source, /@emotion|styled\(|css`/);
  assert.match(source, /createFormHook/);
  assert.match(source, /fieldComponents/);
  assert.match(source, /className="overflow-hidden rounded-md border/);
  assert.match(source, /DialogPrimitive\.Root/);
  assert.match(source, /DialogPrimitive\.Portal/);
  assert.match(source, /DialogPrimitive\.Backdrop/);
  assert.match(source, /DialogPrimitive\.Popup/);
  assert.match(source, /finalFocus/);
  assert.match(source, /aria-describedby/);
  assert.match(source, /aria-labelledby/);

  const registry = JSON.parse(await readFile("registry.json", "utf8"));
  const item = registry.items.find(({ name }) => name === "form");
  assert.deepEqual(item.dependencies, [
    "@base-ui/react@1.5.0",
    "@tanstack/react-form@1.28.6",
    "@tanstack/react-query@5.101.4",
    "type-fest@5.8.0",
    "zod@4.3.5",
  ]);
  assert.deepEqual(
    item.files.map(({ path }) => path),
    [
      "src/components/ui/form-auto-save-context.tsx",
      "src/components/ui/form-context.ts",
      "src/components/ui/form-fields.tsx",
      "src/components/ui/form.tsx",
    ],
  );
});
