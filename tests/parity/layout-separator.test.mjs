import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("layout and separator keep the required public contract", async () => {
  const layout = await readFile("src/components/ui/layout.tsx", "utf8");
  const layoutStyleEngine = await readFile(
    "src/components/ui/layout-style-engine.ts",
    "utf8"
  );
  const separator = await readFile("src/components/ui/separator.tsx", "utf8");
  for (const name of [
    "Container",
    "ContainerQueryProvider",
    "Flex",
    "Grid",
    "Stack",
    "Surface",
    "getBorder",
    "getMargin",
    "getRadius",
    "getSpacing",
    "rc",
    "useContainerBreakpoint",
    "useHasContainerQuery",
    "useResponsivePropValue",
  ])
    assert.match(layout, new RegExp(`export (?:const|function) ${name}`));
  for (const name of [
    "ContainerProps",
    "ContainerPropsWithRenderFunction",
    "FlexProps",
    "GridProps",
    "Responsive",
    "ResponsiveKey",
    "StackProps",
  ])
    assert.match(layout, new RegExp(`export type ${name}`));
  assert.match(separator, /export type SeparatorProps/);
  assert.match(separator, /<hr/);
  assert.match(separator, /children\?: never/);
  assert.match(layoutStyleEngine, /@container/);
  assert.match(layoutStyleEngine, /@media/);
});

test("layout and separator registry items have an acyclic dependency closure", async () => {
  const registry = JSON.parse(await readFile("registry.json", "utf8"));
  const layout = registry.items.find((item) => item.name === "layout");
  const separator = registry.items.find((item) => item.name === "separator");

  const sentryBaseUrl = "https://scrapscn.sentry.dev/r/sentry-base.json";
  assert.deepEqual(layout.registryDependencies, [sentryBaseUrl]);
  assert.deepEqual(separator.registryDependencies, [sentryBaseUrl]);
  assert.deepEqual(layout.dependencies, ["@emotion/is-prop-valid"]);
  assert.deepEqual(separator.dependencies, ["@emotion/is-prop-valid"]);
  assert.deepEqual(
    layout.files.map((file) => file.path),
    [
      "src/components/ui/container-query-context.ts",
      "src/components/ui/layout-style-engine.ts",
      "src/components/ui/layout.tsx",
      "src/components/ui/separator.tsx",
    ]
  );
  assert.deepEqual(
    separator.files.map((file) => file.path),
    [
      "src/components/ui/container-query-context.ts",
      "src/components/ui/layout-style-engine.ts",
      "src/components/ui/separator.tsx",
    ]
  );
});

test("the playground proves the orientation-aware Stack separator", async () => {
  const playground = await readFile(
    "src/components/playground/checkbox-playground.tsx",
    "utf8"
  );

  assert.match(playground, /<Stack\.Separator/);
  assert.doesNotMatch(
    playground,
    /import \{ Separator \} from "@\/components\/ui\/separator"/
  );
});
