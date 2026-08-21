import { access, readFile } from "node:fs/promises"

import { readTemplates } from "./template-files.mjs"

const templates = await readTemplates()

if (templates.length === 0) throw new Error("At least one template is required")
if (!templates.some(({ metadata }) => metadata.slug === "checkbox-settings")) {
  throw new Error("The Checkbox settings slice template is missing")
}

const generatedManifest = await readFile("src/templates/template-manifest.generated.ts", "utf8")
for (const { directory, metadata } of templates) {
  await access(`src/templates/${directory}/template.tsx`)
  if (!generatedManifest.includes(`./${directory}/template`) || !generatedManifest.includes(`\"slug\":${JSON.stringify(metadata.slug)}`)) {
    throw new Error(`Generated template manifest is stale: ${metadata.slug}`)
  }
}

process.stdout.write(`Validated ${templates.length} template${templates.length === 1 ? "" : "s"}.\n`)
