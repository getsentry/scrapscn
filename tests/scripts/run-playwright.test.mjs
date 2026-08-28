import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { chmod, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../..", import.meta.url));
const runner = path.join(projectRoot, "scripts/run-playwright.mjs");

test("times out and stops Portless when it does not report an app port", async () => {
  const fixtureDirectory = await mkdtemp(path.join(tmpdir(), "scrapscn-portless-timeout-"));
  const fakePortless = path.join(fixtureDirectory, "portless");
  const stopMarker = path.join(fixtureDirectory, "stopped");

  await writeFile(
    fakePortless,
    "#!/bin/sh\ntrap 'printf stopped > \"$SCRAPSCN_STOP_MARKER\"; exit 0' TERM\nwhile :; do sleep 1; done\n",
  );
  await chmod(fakePortless, 0o755);

  const result = await run(process.execPath, [runner], {
    ...process.env,
    PATH: `${fixtureDirectory}:${process.env.PATH}`,
    SCRAPSCN_E2E_NAME: "timeout-test",
    SCRAPSCN_E2E_STARTUP_TIMEOUT_MS: "500",
    SCRAPSCN_STOP_MARKER: stopMarker,
  });

  assert.equal(result.code, 1);
  assert.match(result.stderr, /Timed out waiting for Portless to report its app port after 500ms/);
  assert.equal(await readFile(stopMarker, "utf8"), "stopped");
});

function run(command, arguments_, env) {
  return new Promise((resolve) => {
    execFile(command, arguments_, { cwd: projectRoot, env }, (error, stdout, stderr) => {
      resolve({ code: error?.code ?? 0, stdout, stderr });
    });
  });
}
