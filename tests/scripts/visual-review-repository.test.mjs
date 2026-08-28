import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { chmod, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import parityManifest from "../../scraps-parity.json" with { type: "json" };

const projectDirectory = path.resolve(import.meta.dirname, "../..");
const canonicalCommit = parityManifest.canonical.commit;

async function runGeneratorWithGit({ head = canonicalCommit, trackedChanges = "" }) {
  const fixtureDirectory = await mkdtemp(path.join(tmpdir(), "scrapscn-visual-review-"));
  const gitShim = path.join(fixtureDirectory, "git");
  await writeFile(
    gitShim,
    `#!/bin/sh
case "$*" in
  *"rev-parse HEAD"*) printf '%s\\n' '${head}' ;;
  *"status --short --untracked-files=no"*) printf '%s' '${trackedChanges}' ;;
  *) exit 2 ;;
esac
`,
  );
  await chmod(gitShim, 0o755);

  let generatorError;
  try {
    execFileSync(process.execPath, ["scripts/generate-visual-review.mjs"], {
      cwd: projectDirectory,
      env: {
        ...process.env,
        PATH: `${fixtureDirectory}:${process.env.PATH}`,
        SENTRY_REPO_PATH: fixtureDirectory,
      },
      encoding: "utf8",
      stdio: "pipe",
    });
  } catch (error) {
    generatorError = error;
  } finally {
    await rm(fixtureDirectory, { recursive: true, force: true });
  }
  assert.ok(generatorError, "Expected the visual review generator to reject the Sentry checkout");
  return generatorError;
}

test("rejects a Sentry checkout at the wrong commit", async () => {
  const error = await runGeneratorWithGit({ head: "0000000000000000000000000000000000000000" });
  assert.ok(error.stderr.includes(canonicalCommit));
  assert.match(error.stderr, /found 0000000/);
});

test("rejects a pinned Sentry checkout with tracked changes", async () => {
  const error = await runGeneratorWithGit({
    trackedChanges: " M static/app/components/core/checkbox/checkbox.tsx\n",
  });
  assert.match(error.stderr, /requires a clean pinned checkout/);
  assert.match(error.stderr, /checkbox\.tsx/);
});
