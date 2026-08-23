import { spawn } from "node:child_process"
import { fileURLToPath } from "node:url"

const serviceName = `scrapscn-e2e-${process.pid}`
const playwrightCli = fileURLToPath(new URL("../node_modules/playwright/cli.js", import.meta.url))
const child = spawn(process.execPath, [playwrightCli, "test", ...process.argv.slice(2)], {
  env: { ...process.env, SCRAPSCN_E2E_NAME: serviceName },
  stdio: "inherit",
})

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal)
  process.exit(code ?? 1)
})
