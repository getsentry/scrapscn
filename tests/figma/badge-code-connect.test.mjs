import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("keeps the parserless Tag mapping on the canonical node and vocabulary", async () => {
  const source = await readFile("src/components/ui/tag.figma.ts", "utf8");
  for (const fragment of [
    "node-id=3574-5396",
    "source=src/components/ui/badge.tsx",
    "component=Tag",
    'instance.getEnum("variant"',
    'instance.findText("Label")?.textContent',
    'import { Tag } from "@/components/ui/badge"',
    'figma.code`<Tag variant="${variant}">${label}</Tag>`',
  ]) {
    assert.ok(source.includes(fragment), fragment);
  }
  for (const variant of ["info", "danger", "warning", "success", "muted", "promotion"]) {
    assert.ok(source.includes(`${variant}: "${variant}"`), variant);
  }
  assert.doesNotMatch(source, /figma\.connect|@sentry\/scraps/);
});

test("keeps FeatureBadge on the canonical five-type vocabulary without inventing live drift props", async () => {
  const source = await readFile("src/components/ui/feature-badge.figma.ts", "utf8");
  for (const fragment of [
    "node-id=3574-5698",
    "source=src/components/ui/badge.tsx",
    "component=FeatureBadge",
    'getEnum("type"',
    'import { FeatureBadge } from "@/components/ui/badge"',
    'figma.code`<FeatureBadge type="${type}" />`',
  ]) {
    assert.ok(source.includes(fragment), fragment);
  }
  for (const type of ["alpha", "beta", "new", "experimental", "debug"]) {
    assert.ok(source.includes(`${type}: "${type}"`), type);
  }
  assert.doesNotMatch(source, /get(?:Boolean|Enum)\("(?:deprecated|Variant)"/);
  assert.doesNotMatch(source, /figma\.connect|@sentry\/scraps/);
});
