import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

const runtimeExports = [
  "DrawerBody",
  "DrawerHeader",
  "GlobalDrawer",
  "useDrawer",
  "useDrawerContentContext",
];
const typeExports = ["DrawerConfig", "DrawerOptions"];

test("records the complete regular Scraps Drawer clone", async () => {
  const manifest = JSON.parse(await readFile("scraps-parity.json", "utf8"));
  const drawer = manifest.modules.find(({ name }) => name === "drawer");
  assert.deepEqual(drawer.canonical.publicExports, {
    runtime: runtimeExports,
    types: typeExports,
  });
  assert.deepEqual(drawer.local.implementedExports, {
    runtime: runtimeExports,
    types: typeExports,
  });
  assert.deepEqual(drawer.local.registryItems, ["drawer"]);
  assert.equal(drawer.local.playgroundPath, "/?component=drawer");
  assert.deepEqual(drawer.local.codeConnect, []);
  assert.deepEqual(drawer.local.figmaNodes, []);
  assert.deepEqual(drawer.completion.state, "complete");
  assert.equal(drawer.completion.complete, true);

  const requiredCanonicalSources = [
    "static/app/components/core/backdrop/backdrop.tsx",
    "static/app/components/core/drawer/components.tsx",
    "static/app/components/core/drawer/index.spec.tsx",
    "static/app/components/core/drawer/index.tsx",
    "static/app/components/core/drawer/useDrawerResizing.tsx",
    "static/app/components/core/hotkey/useHotkeys.tsx",
    "static/app/components/core/slideOverPanel/slideOverPanel.tsx",
    "static/app/components/core/useScrollLock.tsx",
    "static/app/icons/iconClose.tsx",
    "static/app/utils/createStorage.tsx",
    "static/app/utils/localStorage.tsx",
    "static/app/utils/useSyncedLocalStorageState.tsx",
  ];
  for (const sourcePath of requiredCanonicalSources) {
    assert.ok(drawer.canonical.sourcePaths.includes(sourcePath), sourcePath);
    execFileSync(
      "git",
      [
        "-C",
        process.env.SENTRY_REPO_PATH ?? "../sentry",
        "cat-file",
        "-e",
        `${manifest.canonical.commit}:${sourcePath}`,
      ],
      { stdio: "pipe" },
    );
  }
});

test("keeps controller, close policy, layout, and resize behavior in Tailwind", async () => {
  const drawer = await readFile("src/components/ui/drawer.tsx", "utf8");
  const resizing = await readFile("src/components/ui/drawer-resizing.ts", "utf8");
  const scrollLock = await readFile("src/components/ui/body-scroll-lock.ts", "utf8");

  for (const fragment of [
    'import type { Location } from "history"',
    "useHotkeys([",
    'match: "Escape"',
    "skipPreventDefault: true",
    "querySelector(\"#modal-portal [role='dialog']\")",
    "shouldCloseOnInteractOutsideByDefault",
    'getElementById("modal-portal")',
    'closest("[data-overlay]")',
    'hasAttribute("data-drawer-backdrop")',
    'current.options.mode !== "passive"',
    "shouldCloseOnLocationChange?.(location)",
    "currentDrawerConfigRef.current?.options.onClose?.()",
    "bodyScrollLock.acquire(lockId)",
    "bodyScrollLock.release(lockId)",
    "activeDrawerId: current?.callerId ?? null",
    "z-[9999]",
    "z-[10000]",
    "z-[10001]",
    "h-[53px]",
    "px-3 py-1.5",
    'hideCloseButton && "py-3"',
    "px-6 py-4 text-sm",
    "[width:clamp(var(--drawer-min-width),var(--drawer-width),var(--drawer-max-width))]!",
    "max-[800px]:overscroll-x-auto",
    "data-[resizing]:overflow-hidden!",
    "data-[resizing]:[scrollbar-width:none]",
    "data-[resizing]:[&::-webkit-scrollbar]:hidden",
    "data-[resizing]:[&_*]:[scrollbar-width:none]",
    "data-[resizing]:[&_*::-webkit-scrollbar]:hidden",
    "after:ease-[ease]",
    "drawerMaxWidth",
    'role="alert"',
  ]) {
    assert.ok(drawer.includes(fragment), fragment);
  }

  for (const fragment of [
    'const SMALL_SCREEN_QUERY = "(max-width: 800px)"',
    "window.matchMedia",
    'window.addEventListener("resize", update)',
    "readSavedWidth(drawerKey)",
    "useSyncExternalStore",
    "widthChannels",
    "widthToPercent(drawerWidth)",
    "clampWidth",
    'setProperty("--drawer-width"',
    'setProperty("--drawer-min-width"',
    'setProperty("--drawer-max-width"',
    "min(${MAX_WIDTH_PERCENT}%, ${drawerMaxWidth})",
    "window.localStorage.setItem(",
    'document.addEventListener("mousemove"',
    'document.removeEventListener("mousemove"',
    "stopDraggingRef.current()",
    "[canResize, widthIdentity]",
  ]) {
    assert.ok(resizing.includes(fragment), fragment);
  }

  for (const fragment of [
    "private acquiredBy = new Map<string, ScrollLock>()",
    "document.body.style.position",
    'setProperty("--scrollbar-size"',
    "window.scrollTo",
  ]) {
    assert.ok(scrollLock.includes(fragment), fragment);
  }

  assert.doesNotMatch(
    `${drawer}\n${resizing}\n${scrollLock}`,
    /@emotion|styled\(|\.module\.css|SerializedStyles/,
  );
});

test("publishes the standalone Drawer registry closure", async () => {
  const registry = JSON.parse(await readFile("registry.json", "utf8"));
  const drawer = registry.items.find(({ name }) => name === "drawer");
  assert.deepEqual(drawer.dependencies, ["@types/history@3.2.5", "framer-motion@12.38.0"]);
  assert.deepEqual(drawer.registryDependencies, [
    "https://scrapscn.sentry.dev/r/backdrop.json",
    "https://scrapscn.sentry.dev/r/button.json",
    "https://scrapscn.sentry.dev/r/hotkey.json",
    "https://scrapscn.sentry.dev/r/scraps-locale.json",
    "https://scrapscn.sentry.dev/r/slide-over-panel.json",
    "https://scrapscn.sentry.dev/r/tooltip.json",
  ]);
  assert.deepEqual(
    drawer.files.map(({ path: filePath }) => filePath),
    [
      "src/components/ui/body-scroll-lock.ts",
      "src/components/ui/drawer-resizing.ts",
      "src/components/ui/drawer.tsx",
    ],
  );

  const compactSelect = registry.items.find(({ name }) => name === "compact-select");
  assert.ok(
    compactSelect.files.every(
      ({ path: filePath }) => filePath !== "src/components/ui/body-scroll-lock.ts",
    ),
  );
});

test("ships canonical stories, workbench controls, and a production workflow", async () => {
  const stories = await readFile("src/components/ui/drawer.stories.tsx", "utf8");
  for (const story of ["Blocking", "Passive", "FixedWidth", "MaximumWidth", "HeaderVariants"]) {
    assert.match(stories, new RegExp(`export function ${story}\\(`));
  }

  const workbench = await readFile(
    "src/components/playground/workbenches/drawer-workbench.tsx",
    "utf8",
  );
  for (const fragment of [
    "getLocation(",
    "useMemo(",
    'aria-label="Drawer mode"',
    'aria-label="Drawer route policy"',
    'aria-label="Drawer resizable"',
    'aria-label="Drawer key"',
    'aria-label="Drawer width"',
    'aria-label="Drawer maximum width"',
    "Change test location",
    "Interact with page",
    "Open modal over drawer",
  ]) {
    assert.ok(workbench.includes(fragment), fragment);
  }

  const e2e = await readFile("tests/e2e/playground.spec.ts", "utf8");
  assert.match(e2e, /test\("runs the Drawer workbench/);
});

test("keeps published Drawer artifacts equal to a fresh registry build", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "scrapscn-drawer-"));
  try {
    execFileSync("pnpm", ["exec", "shadcn", "build", "registry.json", "--output", directory], {
      cwd: process.cwd(),
      stdio: "pipe",
    });
    for (const filename of ["drawer.json", "registry.json"]) {
      assert.deepEqual(
        JSON.parse(await readFile(path.join("public/r", filename), "utf8")),
        JSON.parse(await readFile(path.join(directory, filename), "utf8")),
        `public/r/${filename} must equal a fresh registry build`,
      );
    }
  } finally {
    await rm(directory, { recursive: true });
  }
});
