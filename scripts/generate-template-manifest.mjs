import { writeFile } from "node:fs/promises"

import { readTemplates } from "./template-files.mjs"

const templates = await readTemplates()
const imports = templates
  .map(({ directory }, index) => `import Template${index} from "./${directory}/template"`)
  .join("\n")
const entries = templates
  .map(({ metadata }, index) => `  { component: Template${index}, metadata: ${JSON.stringify(metadata)} },`)
  .join("\n")
const source = `${imports}\n\nimport type { TemplateDefinition } from "./types"\n\nexport const templates = [\n${entries}\n] satisfies TemplateDefinition[]\n`

await writeFile("src/templates/template-manifest.generated.ts", source)
process.stdout.write(`Generated ${templates.length} template${templates.length === 1 ? "" : "s"}.\n`)
