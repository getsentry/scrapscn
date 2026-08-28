import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const reservedServiceNames = new Set([
  "alias",
  "clean",
  "get",
  "hosts",
  "list",
  "proxy",
  "prune",
  "run",
  "service",
  "trust",
]);
const serviceName = process.env.SCRAPSCN_E2E_NAME ?? `scrapscn-e2e-${process.pid}`;
if (
  !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(serviceName) ||
  reservedServiceNames.has(serviceName)
) {
  throw new Error(`Invalid Portless service name: ${serviceName}`);
}

const startScript = process.env.SCRAPSCN_E2E_MODE === "development" ? "dev" : "start";
const startupTimeoutMs = readPositiveInteger(
  process.env.SCRAPSCN_E2E_STARTUP_TIMEOUT_MS ?? "30000",
  "SCRAPSCN_E2E_STARTUP_TIMEOUT_MS",
);
const playwrightCli = fileURLToPath(new URL("../node_modules/playwright/cli.js", import.meta.url));
const server = spawn("portless", [serviceName, "pnpm", startScript], {
  env: process.env,
  stdio: ["ignore", "pipe", "pipe"],
});

let testProcess;
let exitSignal;
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => {
    exitSignal = signal;
    if (testProcess) testProcess.kill(signal);
    else server.kill(signal);
  });
}
try {
  const appPort = await readAppPort(server);
  const baseURL = `http://127.0.0.1:${appPort}`;
  await waitForServer(baseURL, server);

  testProcess = spawn(process.execPath, [playwrightCli, "test", ...process.argv.slice(2)], {
    env: { ...process.env, SCRAPSCN_E2E_BASE_URL: baseURL },
    stdio: "inherit",
  });
  const result = await waitForExit(testProcess);
  if (result.signal) exitSignal = result.signal;
  else process.exitCode = result.code ?? 1;
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
} finally {
  if (testProcess) await stopProcess(testProcess);
  await stopProcess(server);
}
if (exitSignal) process.kill(process.pid, exitSignal);

function readPositiveInteger(value, name) {
  if (!/^\d+$/.test(value)) throw new Error(`${name} must be a positive integer`);
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 1) {
    throw new Error(`${name} must be a positive integer`);
  }
  return number;
}

function readAppPort(child) {
  return new Promise((resolve, reject) => {
    let output = "";
    const timeout = setTimeout(() => {
      settle(
        reject,
        new Error(
          `Timed out waiting for Portless to report its app port after ${startupTimeoutMs}ms`,
        ),
      );
    }, startupTimeoutMs);

    function settle(callback, value) {
      clearTimeout(timeout);
      child.off("error", handleError);
      child.off("exit", handleExit);
      callback(value);
    }

    function handleError(error) {
      settle(reject, error);
    }

    function handleExit(code, signal) {
      settle(
        reject,
        new Error(
          `Portless exited before reporting its app port (${signal ?? `code ${code ?? 1}`})`,
        ),
      );
    }

    function inspect(chunk, destination) {
      destination.write(chunk);
      output = `${output}${chunk}`.slice(-8192);
      const match = output.match(/Using port\s+(\d+)/);
      if (!match) return;
      const port = Number(match[1]);
      if (!Number.isInteger(port) || port < 1 || port > 65535) {
        settle(reject, new Error(`Portless returned an invalid app port: ${match[1]}`));
        return;
      }
      settle(resolve, port);
    }

    child.stdout.on("data", (chunk) => inspect(chunk, process.stdout));
    child.stderr.on("data", (chunk) => inspect(chunk, process.stderr));
    child.once("error", handleError);
    child.once("exit", handleExit);
  });
}

async function waitForServer(baseURL, child) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null || child.signalCode !== null) {
      throw new Error("Portless exited before the app became ready");
    }
    try {
      const response = await fetch(baseURL, { signal: AbortSignal.timeout(1_000) });
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for ${baseURL}`);
}

function waitForExit(child) {
  return new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code, signal) => resolve({ code, signal }));
  });
}

async function stopProcess(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  const exit = waitForExit(child);
  child.kill("SIGTERM");
  let timeout;
  await Promise.race([
    exit,
    new Promise((resolve) => {
      timeout = setTimeout(resolve, 5_000);
    }),
  ]);
  clearTimeout(timeout);
  if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
}
