import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import test from "node:test";

import { build } from "vite";

function importSpecifier(from, target) {
  const path = relative(from, target).replaceAll("\\", "/");
  return path.startsWith(".") ? path : `./${path}`;
}

async function compileMinifiedCss(cssPath) {
  const directory = await mkdtemp(join(process.cwd(), "tests/parity/.layout-css-"));
  const outputDirectory = join(directory, "dist");
  try {
    const entry = join(directory, "entry.js");
    await writeFile(entry, `import ${JSON.stringify(importSpecifier(directory, cssPath))};\n`);
    await build({
      configFile: false,
      root: process.cwd(),
      build: {
        cssCodeSplit: false,
        cssMinify: true,
        emptyOutDir: true,
        minify: false,
        outDir: outputDirectory,
        rollupOptions: {
          input: entry,
          output: {
            assetFileNames: "layout[extname]",
            entryFileNames: "layout.js",
          },
        },
      },
      logLevel: "silent",
    });
    const cssFile = (await readdir(outputDirectory)).find((name) => name.endsWith(".css"));
    assert.ok(cssFile, "Vite did not emit a CSS asset");
    return readFile(join(outputDirectory, cssFile), "utf8");
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
}

test("layout and separator keep the required public contract", async () => {
  const layout = await readFile("src/components/ui/layout.tsx", "utf8");
  const layoutStyleEngine = await readFile("src/components/ui/layout-style-engine.ts", "utf8");
  const layoutTailwind = await readFile("src/components/ui/layout-tailwind.ts", "utf8");
  const layoutTailwindCandidates = await readFile(
    "src/components/ui/layout-tailwind-candidates.ts",
    "utf8",
  );
  const layoutStories = await readFile("src/components/ui/layout.stories.tsx", "utf8");
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
  assert.match(layoutTailwindCandidates, /\[display:flex\]/);
  assert.match(
    layoutTailwindCandidates,
    /@\[576px\]:\[--scraps-layout-display:var\(--scraps-layout-container-md-display\)\]/,
  );
  assert.match(layoutTailwind, /finiteValueGroups/);
  assert.doesNotMatch(layoutTailwind, /layout-tailwind-candidates/);
  assert.doesNotMatch(layoutTailwind, /scraps-layout-layer|layeredProperties/);
  assert.match(layoutStories, /data-testid="responsive-render-function"/);
  assert.match(layoutStories, /renderFunctionStyle\.paddingTop/);
  assert.doesNotMatch(layoutStyleEngine, /LayoutCssDeclaration|compileLayoutStyle|<style/);
  assert.doesNotMatch(layout, /compileLayoutStyle|createLayoutCssDeclaration|<style/);
  assert.doesNotMatch(separator, /compileLayoutStyle|createLayoutCssDeclaration|<style/);
});

test("layout and separator have dedicated composition workbenches", async () => {
  const manifest = JSON.parse(await readFile("scraps-parity.json", "utf8"));
  const layout = manifest.modules.find(({ name }) => name === "layout");
  const separator = manifest.modules.find(({ name }) => name === "separator");
  const layoutWorkbench = await readFile(
    "src/components/playground/workbenches/layout-workbench.tsx",
    "utf8",
  );
  const separatorWorkbench = await readFile(
    "src/components/playground/workbenches/separator-workbench.tsx",
    "utf8",
  );

  assert.equal(layout.local.playgroundPath, "/?component=layout");
  assert.equal(separator.local.playgroundPath, "/?component=separator");
  for (const primitive of ["Container", "Flex", "Grid", "Stack", "Surface"]) {
    assert.match(layoutWorkbench, new RegExp(`\\b${primitive}\\b`));
  }
  for (const control of [
    "Separator orientation",
    "Separator border",
    "Separator margin",
    "Separator padding",
  ]) {
    assert.match(separatorWorkbench, new RegExp(control));
  }
});

test("the literal Layout Tailwind matrix matches its deterministic source", () => {
  execFileSync(process.execPath, ["scripts/generate-layout-tailwind.mjs", "--check"], {
    cwd: process.cwd(),
  });
});

test("the scan-only file covers every generated Layout Tailwind candidate", async () => {
  const runtime = await readFile("src/components/ui/layout-tailwind.ts", "utf8");
  const source = await readFile("src/components/ui/layout-tailwind-candidates.ts", "utf8");
  const body = source.match(/`\n([\s\S]*?)\n`;/)?.[1];
  assert.ok(body, "Missing the scan-only candidate string");
  const candidates = body.split("\n");
  const candidateSet = new Set(candidates);
  assert.equal(candidates.length, 1_616);
  assert.equal(candidateSet.size, candidates.length);
  assert.ok(
    Buffer.byteLength(source) < 125_000,
    `Layout candidate source is ${Buffer.byteLength(source)} bytes; limit is 125000`,
  );

  const propertyUnion = runtime.match(/export type LayoutProperty = (.*);/)?.[1];
  assert.ok(propertyUnion, "Missing the generated Layout property union");
  const properties = [...propertyUnion.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
  assert.equal(properties.length, 68);
  for (const property of properties) {
    assert.ok(
      candidateSet.has(`[--scraps-layout-${property}:var(--scraps-layout-base-${property})]`),
      `Missing the base variable candidate for ${property}`,
    );
    assert.ok(
      candidateSet.has(
        `@[576px]:[--scraps-layout-${property}:var(--scraps-layout-container-md-${property})]`,
      ),
      `Missing the container candidate for ${property}`,
    );
    assert.ok(
      candidateSet.has(
        `min-[800px]:![--scraps-layout-${property}:var(--scraps-layout-screen-sm-${property})]`,
      ),
      `Missing the viewport candidate for ${property}`,
    );
  }
  for (const candidate of [
    "[margin-top:0]",
    "[align-items:start]",
    "[row-gap:4px]",
    "[column-gap:12px]",
  ]) {
    assert.ok(candidateSet.has(candidate), `Missing ${candidate}`);
  }
  assert.ok(!candidateSet.has("@[576px]:[margin-left:0]"));
  assert.ok(!candidates.some((candidate) => candidate.includes("-layer-")));
  assert.ok(!candidates.some((candidate) => candidate.startsWith("[gap:")));
});

test("the generated Layout candidates stay within the compiled CSS budget", async () => {
  const directory = await mkdtemp(join(process.cwd(), "tests/parity/.layout-candidates-"));
  try {
    const sourcePath = join(directory, "candidates.css");
    await writeFile(
      sourcePath,
      `@import "tailwindcss" source(none);\n@source ${JSON.stringify(
        importSpecifier(
          directory,
          join(process.cwd(), "src/components/ui/layout-tailwind-candidates.ts"),
        ),
      )};\n`,
    );
    const css = await compileMinifiedCss(sourcePath);
    const bytes = Buffer.byteLength(css);
    const ruleBlocks = css.match(/{/g)?.length ?? 0;
    assert.ok(bytes < 260_000, `Layout candidate CSS is ${bytes} bytes; limit is 260000`);
    assert.ok(
      ruleBlocks < 1_750,
      `Layout candidate CSS has ${ruleBlocks} rule blocks; limit is 1750`,
    );
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("the full application stylesheet stays within its Layout CSS budget", async () => {
  const css = await compileMinifiedCss(join(process.cwd(), "src/app/globals.css"));
  const bytes = Buffer.byteLength(css);
  const ruleBlocks = css.match(/{/g)?.length ?? 0;
  assert.ok(bytes < 500_000, `Application CSS is ${bytes} bytes; limit is 500000`);
  assert.ok(ruleBlocks < 4_100, `Application CSS has ${ruleBlocks} rule blocks; limit is 4100`);
});

test("the imported Layout Tailwind runtime stays below its browser bundle budget", async () => {
  const directory = await mkdtemp(join(tmpdir(), "scrapscn-layout-bundle-"));
  try {
    await build({
      configFile: false,
      build: {
        emptyOutDir: true,
        lib: {
          entry: "src/components/ui/layout-tailwind.ts",
          formats: ["es"],
        },
        minify: "esbuild",
        outDir: directory,
        rollupOptions: {
          output: { entryFileNames: "layout-tailwind.js" },
        },
      },
      logLevel: "silent",
    });
    const bundle = await readFile(join(directory, "layout-tailwind.js"), "utf8");
    const bundleBytes = Buffer.byteLength(bundle);
    assert.ok(
      bundleBytes < 10_000,
      `Layout Tailwind browser bundle is ${bundleBytes} bytes; limit is 10000`,
    );
    assert.doesNotMatch(bundle, /layoutTailwindCandidates/);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("layout and separator registry items have an acyclic dependency closure", async () => {
  const registry = JSON.parse(await readFile("registry.json", "utf8"));
  const layout = registry.items.find((item) => item.name === "layout");
  const separator = registry.items.find((item) => item.name === "separator");

  const sentryBaseUrl = "https://scrapscn.sentry.dev/r/sentry-base.json";
  assert.deepEqual(layout.registryDependencies, [sentryBaseUrl]);
  assert.deepEqual(separator.registryDependencies, [sentryBaseUrl]);
  assert.deepEqual(layout.dependencies, []);
  assert.deepEqual(separator.dependencies, []);
  assert.deepEqual(
    layout.files.map((file) => file.path),
    [
      "src/components/ui/container-query-context.ts",
      "src/components/ui/layout-style-engine.ts",
      "src/components/ui/layout-tailwind-candidates.ts",
      "src/components/ui/layout-tailwind.ts",
      "src/components/ui/layout.tsx",
      "src/components/ui/separator.tsx",
    ],
  );
  assert.deepEqual(
    separator.files.map((file) => file.path),
    [
      "src/components/ui/container-query-context.ts",
      "src/components/ui/layout-style-engine.ts",
      "src/components/ui/layout-tailwind-candidates.ts",
      "src/components/ui/layout-tailwind.ts",
      "src/components/ui/separator.tsx",
    ],
  );

  for (const item of registry.items) {
    const paths = item.files?.map((file) => file.path) ?? [];
    if (paths.includes("src/components/ui/layout.tsx")) {
      assert.ok(
        paths.includes("src/components/ui/layout-tailwind.ts"),
        `${item.name} must publish the literal Layout Tailwind matrix`,
      );
    }
    if (paths.includes("src/components/ui/layout-tailwind.ts")) {
      assert.ok(
        paths.includes("src/components/ui/layout-tailwind-candidates.ts"),
        `${item.name} must publish the scan-only Layout candidates`,
      );
    }
  }
});

test("published Layout and Image registry artifacts match a fresh build", async () => {
  const directory = await mkdtemp(join(tmpdir(), "scrapscn-layout-registry-"));
  try {
    execFileSync("pnpm", ["exec", "shadcn", "build", "registry.json", "--output", directory], {
      cwd: process.cwd(),
      stdio: "pipe",
    });
    const registry = JSON.parse(await readFile("registry.json", "utf8"));
    const layoutArtifacts = registry.items
      .filter((item) =>
        item.files?.some(
          (file) =>
            file.path === "src/components/ui/layout-tailwind.ts" ||
            file.path === "src/components/ui/layout.tsx",
        ),
      )
      .map((item) => `${item.name}.json`);
    for (const filename of [...layoutArtifacts, "registry.json"]) {
      assert.deepEqual(
        JSON.parse(await readFile(join("public/r", filename), "utf8")),
        JSON.parse(await readFile(join(directory, filename), "utf8")),
        `public/r/${filename} must equal a fresh registry build`,
      );
    }
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("the playground proves the orientation-aware Stack separator", async () => {
  const playground = await readFile(
    "src/components/playground/workbenches/checkbox-workbench.tsx",
    "utf8",
  );

  assert.match(playground, /<Stack\.Separator/);
  assert.doesNotMatch(playground, /import \{ Separator \} from "@\/components\/ui\/separator"/);
});
