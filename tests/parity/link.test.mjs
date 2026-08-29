import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const registry = JSON.parse(await readFile("registry.json", "utf8"));
const manifest = JSON.parse(await readFile("scraps-parity.json", "utf8"));

test("Link registry has the exact local closure and type-only history dependency", () => {
  const item = registry.items.find((candidate) => candidate.name === "link");

  assert.deepEqual(item.dependencies, [
    "@sentry/react@10.69.0",
    "@types/history@3.2.5",
    "react-router-dom@7.18.3",
  ]);
  assert.deepEqual(
    item.files.map((file) => file.path),
    [
      "src/components/ui/link-behavior-context.tsx",
      "src/components/ui/link.tsx",
      "src/components/ui/tracking-context.tsx",
    ],
  );
  assert.deepEqual(item.cssVars, {
    light: { "scraps-link-disabled": "#878490" },
    dark: { "scraps-link-disabled": "#958e9f" },
  });
});

test("Link parity record pins the exact source, export, and evidence contract", () => {
  const link = manifest.modules.find((candidate) => candidate.name === "link");

  assert.deepEqual(link.canonical.sourcePaths, [
    "package.json",
    "static/app/components/core/button/types.tsx",
    "static/app/components/core/link/index.tsx",
    "static/app/components/core/link/link.mdx",
    "static/app/components/core/link/link.spec.tsx",
    "static/app/components/core/link/link.tsx",
    "static/app/components/core/link/linkBehaviorContext.tsx",
    "static/app/components/core/trackingContext.tsx",
    "static/app/utils/theme/scraps/theme/base.tsx",
    "static/app/utils/theme/scraps/theme/dark.tsx",
    "static/app/utils/theme/scraps/theme/light.tsx",
    "static/app/utils/theme/scraps/tokens/color.tsx",
    "static/app/utils/theme/theme.tsx",
  ]);
  assert.deepEqual(link.canonical.publicExports, {
    runtime: ["ExternalLink", "Link", "LinkBehaviorContextProvider"],
    types: ["LinkProps"],
  });
  assert.deepEqual(link.local.implementationPaths, [
    "src/components/ui/link-behavior-context.tsx",
    "src/components/ui/link.tsx",
    "src/components/ui/tracking-context.tsx",
  ]);
  assert.deepEqual(link.local.tests, [
    "src/components/ui/link.test.tsx",
    "tests/e2e/playground.spec.ts",
    "tests/parity/link.test.mjs",
    "tests/types/link-types.test.tsx",
  ]);
  assert.deepEqual(link.local.figmaNodes, []);
  assert.equal(link.completion.state, "complete");
});
