import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

const canonicalCommit = "046a07857f36741bb60d070abe2191d08da76d24";
const sentryRepository = path.resolve(process.cwd(), process.env.SENTRY_REPO_PATH ?? "../sentry");
const completionNote =
  "Exact regular Scraps PictureInPicture provider, hook, portal, native window lifecycle, synchronous compiled Tailwind CSS transfer into the isolated browser-created document, relative asset resolution, theme synchronization, tooltip container, workbench, production browser behavior, and standalone registry delivery are present without a CSS-in-JS runtime or main-document style injection. The canonical module has no approved PictureInPicture Figma node.";

test("records the complete regular Scraps PictureInPicture clone", async () => {
  const manifest = JSON.parse(await readFile("scraps-parity.json", "utf8"));
  const item = manifest.modules.find(({ name }) => name === "pictureInPicture");
  assert.deepEqual(item.canonical.sourcePaths, [
    "static/app/components/core/pictureInPicture/index.tsx",
    "static/app/components/core/pictureInPicture/pictureInPicture.spec.tsx",
    "static/app/components/core/pictureInPicture/pictureInPicture.tsx",
    "static/app/components/core/pictureInPicture/pictureInPicturePortal.tsx",
    "static/app/types/documentPictureInPicture.d.ts",
  ]);
  assert.deepEqual(item.canonical.publicExports, {
    runtime: ["PictureInPicturePortal", "PictureInPictureProvider", "usePictureInPicture"],
    types: [],
  });
  assert.deepEqual(item.local.implementationPaths, [
    "src/components/ui/picture-in-picture-portal.tsx",
    "src/components/ui/picture-in-picture.tsx",
  ]);
  assert.deepEqual(item.local.implementedExports, {
    runtime: ["PictureInPicturePortal", "PictureInPictureProvider", "usePictureInPicture"],
    types: [],
  });
  assert.deepEqual(item.local.registryItems, ["picture-in-picture"]);
  assert.deepEqual(item.local.codeConnect, []);
  assert.deepEqual(item.local.figmaNodes, []);
  assert.equal(item.local.playgroundPath, "/?component=picture-in-picture");
  assert.deepEqual(item.completion, {
    complete: true,
    note: completionNote,
    state: "complete",
  });
});

test("records no invented PictureInPicture Figma mapping", () => {
  const canonicalPaths = execFileSync(
    "git",
    [
      "ls-tree",
      "-r",
      "--name-only",
      canonicalCommit,
      "--",
      "static/app/components/core/pictureInPicture",
    ],
    { cwd: sentryRepository, encoding: "utf8" },
  )
    .trim()
    .split("\n")
    .filter(Boolean);
  assert.deepEqual(
    canonicalPaths.filter((sourcePath) => /\.figma\.tsx?$/.test(sourcePath)),
    [],
  );
});

test("keeps the native lifecycle and Tailwind portal adaptation without CSS-in-JS", async () => {
  const source = await readFile("src/components/ui/picture-in-picture.tsx", "utf8");
  const portal = await readFile("src/components/ui/picture-in-picture-portal.tsx", "utf8");
  for (const fragment of [
    "window.documentPictureInPicture ?? null",
    "documentPictureInPicture.requestWindow({",
    "preferInitialWindowPlacement",
    "requestInFlightRef.current",
    "pipWindowRef.current?.pipWindow !== pip",
    "Array.from(source.styleSheets)",
    "Array.from(sheet.cssRules)",
    "resolveCssUrls(cssText, sheet.href ?? source.baseURI)",
    "owner.cloneNode(true)",
    'pip.addEventListener("pagehide", handlePageHide, { once: true })',
    "trackedWindow.handlePageHide",
    "pip.close()",
  ])
    assert.ok(source.includes(fragment), fragment);
  for (const fragment of [
    "createPortal(",
    "TooltipContext.Provider",
    "container: pipWindow.document.body",
    'targetRoot.style.height = "100%"',
    'targetBody.style.height = "100%"',
    'targetBody.style.margin = "0"',
    "new MutationObserver(syncClasses)",
    "targetRoot.className = sourceRoot.className",
    "targetBody.className = sourceBody.className",
  ])
    assert.ok(portal.includes(fragment), fragment);
  assert.doesNotMatch(
    `${source}\n${portal}`,
    /@emotion|createCache|CacheProvider|ThemeProvider|styled\(|\.module\.css/,
  );
});

test("publishes a standalone PictureInPicture registry artifact", async () => {
  const registry = JSON.parse(await readFile("registry.json", "utf8"));
  const item = registry.items.find(({ name }) => name === "picture-in-picture");
  assert.deepEqual(item.registryDependencies, ["https://scrapscn.sentry.dev/r/tooltip.json"]);
  assert.deepEqual(item.files, [
    {
      path: "src/components/ui/picture-in-picture.tsx",
      type: "registry:ui",
    },
    {
      path: "src/components/ui/picture-in-picture-portal.tsx",
      type: "registry:ui",
    },
    {
      path: "src/types/document-picture-in-picture.d.ts",
      target: "src/types/document-picture-in-picture.d.ts",
      type: "registry:file",
    },
  ]);

  const directory = await mkdtemp(path.join(tmpdir(), "scrapscn-picture-in-picture-"));
  try {
    execFileSync("pnpm", ["exec", "shadcn", "build", "registry.json", "--output", directory], {
      cwd: process.cwd(),
      stdio: "pipe",
    });
    const built = JSON.parse(
      await readFile(path.join(directory, "picture-in-picture.json"), "utf8"),
    );
    assert.deepEqual(JSON.parse(await readFile("public/r/picture-in-picture.json", "utf8")), built);
    assert.deepEqual(
      JSON.parse(await readFile("public/r/registry.json", "utf8")),
      JSON.parse(await readFile(path.join(directory, "registry.json"), "utf8")),
    );
  } finally {
    await rm(directory, { recursive: true });
  }
});
