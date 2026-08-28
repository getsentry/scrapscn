import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

const completionNote =
  "Exact regular Scraps Markdown exports, marked token and custom tag parsing, non-overridable link and HTML safety, component overrides, default composition, grapheme-safe streaming decode behavior, workbench, production browser behavior, and a locally built registry artifact with a validated dependency closure use literal Tailwind classes and static CSS. Hosted registry installation is a separate release gate. The canonical module has no Figma node or Code Connect source.";

test("records the complete regular Scraps Markdown clone", async () => {
  const manifest = JSON.parse(await readFile("scraps-parity.json", "utf8"));
  const item = manifest.modules.find(({ name }) => name === "markdown");
  assert.deepEqual(item.canonical.publicExports, {
    runtime: ["Markdown", "streamingAnimationStyles", "useTextDecodeAnimation"],
    types: ["MarkdownProps"],
  });
  assert.deepEqual(item.local.implementationPaths, [
    "src/components/ui/markdown-default-components.tsx",
    "src/components/ui/markdown-token.tsx",
    "src/components/ui/markdown.tsx",
  ]);
  for (const exportName of item.canonical.publicExports.runtime) {
    assert.ok(item.local.implementedExports.runtime.includes(exportName), exportName);
  }
  for (const exportName of item.canonical.publicExports.types) {
    assert.ok(item.local.implementedExports.types.includes(exportName), exportName);
  }
  assert.deepEqual(item.local.registryItems, ["markdown"]);
  assert.deepEqual(item.local.codeConnect, []);
  assert.deepEqual(item.local.figmaNodes, []);
  assert.equal(item.local.playgroundPath, "/?component=markdown");
  assert.deepEqual(item.completion, {
    complete: true,
    note: completionNote,
    state: "complete",
  });
  for (const evidence of [
    "static/app/components/core/markdown/defaultComponents.tsx",
    "static/app/components/core/markdown/markdown.spec.tsx",
    "static/app/components/core/markdown/token.tsx",
    "static/app/utils/marked/extensions/tag.spec.ts",
    "static/app/utils/marked/marked.tsx",
  ]) {
    assert.ok(item.canonical.sourcePaths.includes(evidence), evidence);
  }
});

test("keeps parser safety, custom tags, defaults, and streaming in Tailwind", async () => {
  const files = await Promise.all(
    [
      "src/components/ui/markdown.tsx",
      "src/components/ui/markdown-parser.ts",
      "src/components/ui/markdown-token.tsx",
      "src/components/ui/markdown-default-components.tsx",
      "src/components/ui/markdown-streaming.ts",
      "src/components/ui/markdown.css",
    ].map((file) => readFile(file, "utf8")),
  );
  const source = files.join("\n");
  for (const fragment of [
    'variant = "static"',
    'variant === "streaming"',
    "marked.use({ extensions: [blockTagExtension, inlineTagExtension] })",
    "SAFE_LINK_PATTERN",
    "INTERNAL_PATH_PATTERN",
    "ALLOWED_TAGS",
    "DOMPurify.sanitize",
    "!isSafeHref(token.href) && !isInternalHref(token.href)",
    "Markdown cannot start network requests",
    "stripPartialTag",
    "components.Tag ?? DefaultTag",
    "components.Text",
    "MutationObserver",
    "Intl.Segmenter",
    "prefersReducedMotion",
    "@keyframes scraps-markdown-decode-accent",
    "[data-streaming-hidden]",
  ]) {
    assert.ok(source.includes(fragment), fragment);
  }
  assert.doesNotMatch(source, /@emotion|styled\(|css`|\.module\.css|legacy/i);
});

test("keeps the exported streaming styles synchronized with the static stylesheet", async () => {
  const source = await readFile("src/components/ui/markdown-streaming.ts", "utf8");
  const stylesheet = await readFile("src/components/ui/markdown.css", "utf8");
  const exportedStyles = source.match(/export const streamingAnimationStyles = `([\s\S]*?)`;/)?.[1];
  assert.ok(exportedStyles);
  const normalizeCss = (value) =>
    value
      .replace(/\s+/g, " ")
      .replace(/\s*([{}:;])\s*/g, "$1")
      .trim();
  assert.equal(normalizeCss(exportedStyles), normalizeCss(stylesheet));
});

test("records no invented Markdown Figma mapping", () => {
  const canonicalCommit = "046a07857f36741bb60d070abe2191d08da76d24";
  const sentryRepository = path.resolve(process.cwd(), process.env.SENTRY_REPO_PATH ?? "../sentry");
  const paths = execFileSync(
    "git",
    ["ls-tree", "-r", "--name-only", canonicalCommit, "--", "static/app/components/core/markdown"],
    { cwd: sentryRepository, encoding: "utf8" },
  )
    .trim()
    .split("\n")
    .filter(Boolean);
  assert.deepEqual(
    paths.filter((sourcePath) => /\.figma\.tsx?$/.test(sourcePath)),
    [],
  );
});

test("builds the local Markdown registry artifact and dependency closure", async () => {
  const registry = JSON.parse(await readFile("registry.json", "utf8"));
  const item = registry.items.find(({ name }) => name === "markdown");
  assert.deepEqual(item.dependencies, [
    "framer-motion@12.38.0",
    "isomorphic-dompurify@2.20.0",
    "marked@18.0.2",
  ]);
  assert.deepEqual(item.registryDependencies, [
    "https://scrapscn.sentry.dev/r/checkbox.json",
    "https://scrapscn.sentry.dev/r/code.json",
    "https://scrapscn.sentry.dev/r/layout.json",
    "https://scrapscn.sentry.dev/r/link.json",
    "https://scrapscn.sentry.dev/r/quote.json",
    "https://scrapscn.sentry.dev/r/text.json",
  ]);

  const registryItems = new Map(
    registry.items.map((registryItem) => [registryItem.name, registryItem]),
  );
  const visited = new Set();
  async function validateLocalClosure(registryItem) {
    if (visited.has(registryItem.name)) return;
    visited.add(registryItem.name);
    for (const dependencyUrl of registryItem.registryDependencies ?? []) {
      const dependencyName = path.basename(new URL(dependencyUrl).pathname, ".json");
      const dependency = registryItems.get(dependencyName);
      assert.ok(dependency, `${registryItem.name} -> ${dependencyName}`);
      assert.equal(
        JSON.parse(await readFile(`public/r/${dependencyName}.json`, "utf8")).name,
        dependencyName,
      );
      await validateLocalClosure(dependency);
    }
  }
  await validateLocalClosure(item);

  const sanitizerPackage = JSON.parse(
    await readFile("node_modules/isomorphic-dompurify/package.json", "utf8"),
  );
  assert.equal(sanitizerPackage.version, "2.20.0");
  assert.equal(sanitizerPackage.engines.node, ">=18");
  const domPackage = JSON.parse(await readFile("node_modules/jsdom/package.json", "utf8"));
  assert.equal(domPackage.engines.node, ">=18");

  const directory = await mkdtemp(path.join(tmpdir(), "scrapscn-markdown-"));
  try {
    execFileSync("pnpm", ["exec", "shadcn", "build", "registry.json", "--output", directory], {
      cwd: process.cwd(),
      stdio: "pipe",
    });
    const built = JSON.parse(await readFile(path.join(directory, "markdown.json"), "utf8"));
    for (const sourcePath of [
      "src/components/ui/markdown.css",
      "src/components/ui/markdown-default-components.tsx",
      "src/components/ui/markdown-parser.ts",
      "src/components/ui/markdown-streaming.ts",
      "src/components/ui/markdown-token.tsx",
      "src/components/ui/markdown-types.ts",
      "src/components/ui/markdown.tsx",
    ]) {
      assert.equal(
        built.files.find(({ path: filePath }) => filePath.endsWith(path.basename(sourcePath)))
          ?.content,
        await readFile(sourcePath, "utf8"),
        sourcePath,
      );
    }
    assert.deepEqual(JSON.parse(await readFile("public/r/markdown.json", "utf8")), built);
  } finally {
    await rm(directory, { recursive: true });
  }
});
