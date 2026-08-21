import { spawnSync } from "node:child_process"

if (!process.env.FIGMA_ACCESS_TOKEN) {
  throw new Error("FIGMA_ACCESS_TOKEN is required for the authenticated Figma preview check")
}

const result = spawnSync("pnpm", [
  "exec",
  "figma",
  "connect",
  "preview",
  "src/components/ui/checkbox.figma.ts",
  "--all",
  "--max-combinations",
  "18",
  "--output",
  "json",
  "--exit-on-unreadable-files",
  "--skip-update-check",
], { encoding: "utf8", env: process.env })

if (result.status !== 0) {
  process.stderr.write(result.stderr)
  process.stdout.write(result.stdout)
  process.exit(result.status ?? 1)
}

const jsonStart = result.stdout.indexOf("[")
if (jsonStart < 0) throw new Error("Figma preview did not return JSON results")
const previews = JSON.parse(result.stdout.slice(jsonStart))
if (!Array.isArray(previews) || previews.length !== 18) {
  throw new Error(`Expected 18 Figma Checkbox combinations, received ${Array.isArray(previews) ? previews.length : "invalid output"}`)
}

const failures = previews.filter((preview) => preview.success !== true)
if (failures.length) throw new Error(`${failures.length} Figma Checkbox previews failed`)
process.stdout.write("Validated all 18 Figma Checkbox combinations.\n")
