import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("records the complete regular Scraps Quote delivery", async () => {
  const manifest = JSON.parse(await readFile("scraps-parity.json", "utf8"));
  const quote = manifest.modules.find(({ name }) => name === "quote");
  assert.deepEqual(quote.canonical.sourcePaths, [
    "static/app/components/core/layout/container.tsx",
    "static/app/components/core/layout/flex.tsx",
    "static/app/components/core/layout/index.tsx",
    "static/app/components/core/layout/stack.tsx",
    "static/app/components/core/layout/styles.tsx",
    "static/app/components/core/quote/index.tsx",
    "static/app/components/core/quote/quote.mdx",
    "static/app/components/core/quote/quote.tsx",
    "static/app/components/core/text/index.tsx",
    "static/app/components/core/text/styles.tsx",
    "static/app/components/core/text/text.tsx",
    "static/app/utils/theme/index.tsx",
    "static/app/utils/theme/scraps/theme/base.tsx",
    "static/app/utils/theme/scraps/theme/dark.tsx",
    "static/app/utils/theme/scraps/theme/light.tsx",
    "static/app/utils/theme/scraps/tokens/color.tsx",
    "static/app/utils/theme/scraps/tokens/size.tsx",
    "static/app/utils/theme/scraps/tokens/typography.tsx",
    "static/app/utils/theme/theme.tsx",
    "static/app/utils/theme/types.tsx",
  ]);
  assert.deepEqual(quote.canonical.publicExports, { runtime: ["Quote"], types: ["QuoteProps"] });
  assert.deepEqual(quote.local.implementedExports, { runtime: ["Quote"], types: ["QuoteProps"] });
  assert.deepEqual(quote.local.registryItems, ["quote"]);
  assert.deepEqual(quote.local.tests, [
    "src/app/evidence/quote-server/page.tsx",
    "src/components/ui/quote.test.tsx",
    "tests/e2e/playground.spec.ts",
    "tests/parity/quote.test.mjs",
    "tests/types/quote-types.test.tsx",
  ]);
  assert.equal(quote.local.playgroundPath, "/?component=quote");
  assert.equal(quote.completion.complete, true);
});

test("publishes Quote through its complete Layout and Text registry dependencies", async () => {
  const registry = JSON.parse(await readFile("registry.json", "utf8"));
  const quote = registry.items.find(({ name }) => name === "quote");
  assert.deepEqual(quote.registryDependencies, [
    "https://scrapscn.sentry.dev/r/layout.json",
    "https://scrapscn.sentry.dev/r/text.json",
  ]);
  assert.deepEqual(quote.files, [
    { path: "src/components/ui/quote.module.css", type: "registry:file", target: "src/components/ui/quote.module.css" },
    { path: "src/components/ui/quote.tsx", type: "registry:ui" },
  ]);
});

test("keeps Quote available across the Next.js server-component boundary", async () => {
  const serverPage = await readFile(
    "src/app/evidence/quote-server/page.tsx",
    "utf8"
  );

  assert.doesNotMatch(serverPage, /["']use client["']/);
  assert.match(serverPage, /import \{ Quote \}/);
  assert.match(serverPage, /id: "absent", source: undefined/);
  assert.match(serverPage, /id: "empty", source: \{\}/);
  assert.match(serverPage, /id: "href-only"/);
  assert.match(serverPage, /id: "author-only"/);
  assert.match(serverPage, /id: "label-only"/);
  assert.match(serverPage, /id: "full"/);
});
