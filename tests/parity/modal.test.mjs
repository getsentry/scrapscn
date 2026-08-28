import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

test("records the complete regular Scraps Modal delivery", async () => {
  const manifest = JSON.parse(await readFile("scraps-parity.json", "utf8"));
  const modal = manifest.modules.find(({ name }) => name === "modal");
  assert.deepEqual(modal.canonical.publicExports, {
    runtime: [
      "GlobalModal",
      "ModalBody",
      "ModalFooter",
      "makeClosableHeader",
      "makeCloseButton",
      "useModal",
    ],
    types: ["ModalTypes"],
  });
  assert.deepEqual(modal.local.implementedExports, modal.canonical.publicExports);
  assert.equal(modal.completion.complete, true);
  assert.match(modal.completion.note, /ModalOptions\.modalCss Emotion interpolation input/);
  assert.deepEqual(modal.completion.excludedContractInputs, [
    "modal.modalCss.interpolation",
    "tooltip.overlayStyle.serializedStyles",
  ]);
});

test("tracks only canonical Modal evidence that exists at the pinned commit", async () => {
  const manifest = JSON.parse(await readFile("scraps-parity.json", "utf8"));
  const modal = manifest.modules.find(({ name }) => name === "modal");
  const sentryRepository = process.env.SENTRY_REPO_PATH ?? "../sentry";
  for (const sourcePath of modal.canonical.sourcePaths) {
    execFileSync(
      "git",
      ["-C", sentryRepository, "cat-file", "-e", `${manifest.canonical.commit}:${sourcePath}`],
      { stdio: "pipe" },
    );
  }
  assert.ok(
    modal.canonical.sourcePaths.includes("static/app/components/core/backdrop/backdrop.tsx"),
  );
  assert.ok(!modal.canonical.sourcePaths.includes("static/app/components/core/backdrop.tsx"));
});

test("uses Tailwind and focus-trap without a CSS-in-JS runtime", async () => {
  const source = await readFile("src/components/ui/modal.tsx", "utf8");
  for (const fragment of [
    "createFocusTrap",
    "fallbackFocus: () => dialogRef.current ?? portal",
    "focusTrap: state.focusTrap",
    "BodyAriaIsolation",
    "MutationObserver",
    "ContainerQueryProvider",
    "<Surface",
    'elevation="high"',
    'variant="overlay"',
    "[container-type:inline-size]",
    'data-test-id="modal-backdrop"',
    'role="dialog"',
    "aria-modal",
    'aria-label={t("Modal")}',
    "tabIndex={-1}",
    "useReducedMotion",
    "duration: 0.16",
    "ease: [0.24, 1, 0.32, 1]",
    "duration: 0.12",
    "ease: [0.64, 0, 0.8, 0]",
    "min-[992px]:mt-[50px]",
    "mb-6",
    "mt-6",
    "py-6",
    "border-[var(--scraps-theme-border-primary)]",
    "modalCss?: string",
  ])
    assert.ok(source.includes(fragment), fragment);
  const scrollLock = await readFile("src/components/ui/body-scroll-lock.ts", "utf8");
  for (const fragment of [
    "document.body.style.position",
    "--scrollbar-size",
    "requestAnimationFrame",
    "window.scrollTo",
  ])
    assert.ok(scrollLock.includes(fragment), fragment);
  assert.doesNotMatch(source, /document\.body\.style\.overflow\s*=\s*["']hidden/);
  assert.doesNotMatch(source, /useState<[^>]+>\([^)]*getPortal/);
  assert.doesNotMatch(source, /@emotion|styled\(|SerializedStyles|\.module\.css/);
});

test("publishes a Modal registry item", async () => {
  const registry = JSON.parse(await readFile("registry.json", "utf8"));
  const modal = registry.items.find(({ name }) => name === "modal");
  assert.deepEqual(modal.dependencies, ["focus-trap@8.2.2", "framer-motion@12.38.0"]);
  assert.deepEqual(modal.registryDependencies, [
    "https://scrapscn.sentry.dev/r/backdrop.json",
    "https://scrapscn.sentry.dev/r/button.json",
    "https://scrapscn.sentry.dev/r/layout.json",
    "https://scrapscn.sentry.dev/r/scraps-locale.json",
    "https://scrapscn.sentry.dev/r/tooltip.json",
  ]);
  assert.deepEqual(
    modal.files.map(({ path }) => path),
    [
      "THIRD_PARTY_NOTICES.md",
      "src/components/ui/body-scroll-lock.ts",
      "src/components/ui/modal.tsx",
    ],
  );
});

test("keeps published Modal registry artifacts equal to a fresh build", async () => {
  const directory = await mkdtemp(join(tmpdir(), "scrapscn-modal-registry-"));
  try {
    execFileSync("pnpm", ["exec", "shadcn", "build", "registry.json", "--output", directory], {
      cwd: process.cwd(),
      stdio: "pipe",
    });
    for (const filename of ["modal.json", "registry.json"]) {
      const published = JSON.parse(await readFile(join("public/r", filename), "utf8"));
      const fresh = JSON.parse(await readFile(join(directory, filename), "utf8"));
      assert.deepEqual(published, fresh, `public/r/${filename} must equal a fresh registry build`);
    }
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});
