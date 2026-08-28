import { execFileSync } from "node:child_process";
import { realpathSync } from "node:fs";

function run(command, arguments_, runCommand) {
  return runCommand(command, arguments_, { encoding: "utf8" }).trim();
}

export function assertPinnedSentryCheckout({ repository, commit, runCommand = execFileSync }) {
  const resolvedRepository = realpathSync(repository);
  const head = run("git", ["-C", resolvedRepository, "rev-parse", "HEAD"], runCommand);
  if (head !== commit) {
    throw new Error(`Sentry review requires ${commit}; found ${head}`);
  }
  const trackedChanges = run(
    "git",
    ["-C", resolvedRepository, "status", "--short", "--untracked-files=no"],
    runCommand,
  );
  if (trackedChanges) {
    throw new Error(`Sentry review requires a clean pinned checkout:\n${trackedChanges}`);
  }
  return resolvedRepository;
}

export function assertSentryReviewServer({
  repository,
  commit,
  origin = "https://sentry.dev.getsentry.net:8000",
  runCommand = execFileSync,
  resolvePath = realpathSync,
}) {
  if (origin !== "https://sentry.dev.getsentry.net:8000") {
    throw new Error("Canonical capture accepts only https://sentry.dev.getsentry.net:8000");
  }
  const listenerOutput = run("lsof", ["-nP", "-t", "-iTCP:8000", "-sTCP:LISTEN"], runCommand);
  const listeners = listenerOutput.split(/\s+/).filter(Boolean);
  if (listeners.length !== 1) {
    throw new Error(`Expected one Sentry listener on port 8000; found ${listeners.length}`);
  }
  const listenerCwd = run("lsof", ["-a", "-p", listeners[0], "-d", "cwd", "-Fn"], runCommand)
    .split("\n")
    .find((line) => line.startsWith("n"))
    ?.slice(1);
  if (!listenerCwd) throw new Error(`Cannot resolve cwd for Sentry listener ${listeners[0]}`);

  const resolvedRepository = resolvePath(repository);
  if (resolvePath(listenerCwd) !== resolvedRepository) {
    throw new Error(`Sentry listener cwd must equal ${resolvedRepository}; found ${listenerCwd}`);
  }
  assertPinnedSentryCheckout({ repository: resolvedRepository, commit, runCommand });
  return { cwd: resolvedRepository, pid: listeners[0] };
}
