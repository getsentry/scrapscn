import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const mappings = [
  {
    component: "Button",
    path: "src/components/ui/button.figma.ts",
    source: "src/components/ui/button.tsx",
    node: "https://www.figma.com/design/eTJz6aPgudMY9E6mzyZU0B/%F0%9F%90%A6-Components?node-id=384-2119",
    snippet: "<Button",
  },
  {
    component: "EmptyState",
    path: "src/components/ui/empty-state.figma.ts",
    source: "src/components/ui/empty-state.tsx",
    node: "https://www.figma.com/design/eTJz6aPgudMY9E6mzyZU0B/branch/My2KYguV39r2PtkmKKJVTh/%F0%9F%90%A6-Components?node-id=13363-6895",
    snippet: '<EmptyState title="Empty state" />',
  },
  {
    component: "Slider",
    path: "src/components/ui/slider.figma.ts",
    source: "src/components/ui/slider.tsx",
    node: "https://www.figma.com/design/eTJz6aPgudMY9E6mzyZU0B/%F0%9F%90%A6-Components?node-id=3538-6616",
    snippet: "<Slider />",
  },
  {
    component: "Switch",
    path: "src/components/ui/switch.figma.ts",
    source: "src/components/ui/switch.tsx",
    node: "https://www.figma.com/design/eTJz6aPgudMY9E6mzyZU0B/%F0%9F%90%A6-Components?node-id=3277-4566",
    snippet: "<Switch",
  },
  {
    component: "TextArea",
    path: "src/components/ui/textarea.figma.ts",
    source: "src/components/ui/textarea.tsx",
    node: "https://www.figma.com/design/eTJz6aPgudMY9E6mzyZU0B/%F0%9F%90%A6-Components?node-id=3537-20061",
    snippet: "<TextArea",
  },
];

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

test("uses local parserless Code Connect mappings with the Scrapscn label", async () => {
  const config = JSON.parse(await readFile("figma.config.json", "utf8"));
  assert.equal(config.codeConnect.label, "Scrapscn React");

  for (const mapping of mappings) {
    const source = await readFile(mapping.path, "utf8");
    assert.match(source, new RegExp(`// url=${escapeRegExp(mapping.node)}`));
    assert.match(source, new RegExp(`// source=${escapeRegExp(mapping.source)}`));
    assert.match(source, new RegExp(`// component=${mapping.component}`));
    assert.match(source, new RegExp(`id: "${mapping.component}"`));
    assert.match(source, new RegExp(escapeRegExp(mapping.snippet)));
    assert.match(source, /import figma from "figma"/);
    assert.match(
      source,
      new RegExp(`@/components/ui/${mapping.source.split("/").at(-1)?.replace(".tsx", "")}`),
    );
    assert.match(source, /figma\.code`/);
    assert.doesNotMatch(source, /figma\.connect|@sentry\//);
  }
});

test("preserves only the pinned Switch property vocabulary", async () => {
  const source = await readFile("src/components/ui/switch.figma.ts", "utf8");
  assert.match(source, /getEnum\("size", \{ lg: "lg", sm: "sm" \}\)/);
  assert.match(source, /getBoolean\("checked"\)/);
  assert.match(source, /renderProp\(\s*"size",\s*size,?\s*\)/);
  assert.match(source, /renderProp\("checked", checked\)/);
  assert.doesNotMatch(source, /getString|getInstanceSwap|getSlot|findInstance/);
});

test("preserves the pinned Button property vocabulary", async () => {
  const source = await readFile("src/components/ui/button.figma.ts", "utf8");
  assert.match(
    source,
    /getEnum\("priority", \{\s*default: "secondary",\s*primary: "primary",\s*danger: "danger",\s*warning: "warning",\s*transparent: "transparent",\s*link: "link",?\s*\}\)/,
  );
  assert.match(
    source,
    /getEnum\("size", \{\s*zero: "zero",\s*xs: "xs",\s*sm: "sm",\s*md: "md",?\s*\}\)/,
  );
  assert.match(
    source,
    /getEnum\("state", \{\s*Default: false,\s*Hover: false,\s*Active: false,\s*disabled: true,\s*Focused: false,?\s*\}\)/,
  );
  assert.match(source, /findText\("Children"\)\?\.textContent/);
  assert.match(source, /variant="\$\{variant\}" size="\$\{size\}"/);
  assert.match(source, /\$\{disabled \? " disabled" : ""\}/);
  assert.doesNotMatch(
    source,
    /getBoolean|getString|getInstanceSwap|getSlot|findInstance|renderProp/,
  );
});

test("preserves the pinned TextArea property vocabulary", async () => {
  const source = await readFile("src/components/ui/textarea.figma.ts", "utf8");
  assert.match(source, /getEnum\("size", \{\s*sm: "sm",\s*md: "md",?\s*\}\)/);
  assert.match(source, /getEnum\("state", \{\s*default: false,\s*disabled: true,?\s*\}\)/);
  assert.match(source, /renderProp\("size", size\)/);
  assert.match(source, /renderProp\("disabled", disabled\)/);
  assert.doesNotMatch(source, /getBoolean|getString|getInstanceSwap|getSlot|findInstance|findText/);
});

test("keeps EmptyState and Slider property-free when canonical evidence is property-free", async () => {
  for (const path of [
    "src/components/ui/empty-state.figma.ts",
    "src/components/ui/slider.figma.ts",
  ]) {
    const source = await readFile(path, "utf8");
    assert.doesNotMatch(
      source,
      /getBoolean|getEnum|getString|getInstanceSwap|getSlot|findInstance|renderProp/,
    );
  }
});
