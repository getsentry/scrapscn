import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { assertSentryReviewServer } from "../../scripts/sentry-review-server.mjs";

const commit = "a2db8365e2ec17c96b200bface596081c68f12c9";

async function fixture() {
  const repository = await mkdtemp(path.join(tmpdir(), "sentry-review-server-"));
  return {
    repository,
    runCommand(command, arguments_) {
      const value = arguments_.join(" ");
      if (command === "lsof" && value.includes("-t -iTCP:8000")) return "123\n";
      if (command === "lsof" && value.includes("-d cwd")) return `p123\nfcwd\nn${repository}\n`;
      if (command === "git" && value.includes("rev-parse HEAD")) return `${commit}\n`;
      if (command === "git" && value.includes("status --short")) return "";
      throw new Error(`${command} ${value}`);
    },
  };
}

test("rejects no or multiple port 8000 listeners", async () => {
  const { repository, runCommand } = await fixture();
  try {
    for (const listeners of ["", "123\n456\n"]) {
      assert.throws(
        () =>
          assertSentryReviewServer({
            repository,
            commit,
            runCommand: (command, arguments_) =>
              command === "lsof" && arguments_.includes("-t")
                ? listeners
                : runCommand(command, arguments_),
          }),
        /Expected one Sentry listener/,
      );
    }
  } finally {
    await rm(repository, { force: true, recursive: true });
  }
});

test("rejects a listener from another checkout", async () => {
  const { repository, runCommand } = await fixture();
  const otherRepository = await mkdtemp(path.join(tmpdir(), "other-sentry-review-server-"));
  try {
    assert.throws(
      () =>
        assertSentryReviewServer({
          repository,
          commit,
          runCommand: (command, arguments_) =>
            command === "lsof" && arguments_.includes("cwd")
              ? `p123\nfcwd\nn${otherRepository}\n`
              : runCommand(command, arguments_),
        }),
      /listener cwd/,
    );
  } finally {
    await rm(repository, { force: true, recursive: true });
    await rm(otherRepository, { force: true, recursive: true });
  }
});

test("rejects the wrong pinned commit and tracked changes", async () => {
  const { repository, runCommand } = await fixture();
  try {
    assert.throws(
      () =>
        assertSentryReviewServer({
          repository,
          commit,
          runCommand: (command, arguments_) =>
            command === "git" && arguments_.includes("rev-parse")
              ? "wrong\n"
              : runCommand(command, arguments_),
        }),
      /found wrong/,
    );
    assert.throws(
      () =>
        assertSentryReviewServer({
          repository,
          commit,
          runCommand: (command, arguments_) =>
            command === "git" && arguments_.includes("status")
              ? " M static/app/x.tsx\n"
              : runCommand(command, arguments_),
        }),
      /clean pinned checkout/,
    );
  } finally {
    await rm(repository, { force: true, recursive: true });
  }
});
