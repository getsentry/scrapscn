import { spawn } from "node:child_process"

const serviceName = `scrapscn-e2e-${process.pid}`
const child = spawn("pnpm", ["exec", "playwright", "test", ...process.argv.slice(2)], {
  env: { ...process.env, SCRAPSCN_E2E_NAME: serviceName },
  stdio: "inherit",
})

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal)
  process.exit(code ?? 1)
})
