import { readdir, readFile } from "node:fs/promises"
import path from "node:path"

export const templatesDirectory = path.resolve("src/templates")

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export async function readTemplates(templatesRoot = templatesDirectory) {
  const entries = await readdir(templatesRoot, { withFileTypes: true })
  const templates = []

  for (const entry of entries) {
    if (!entry.isDirectory()) continue

    const metadataPath = path.join(templatesRoot, entry.name, "template.json")
    const implementationPath = path.join(templatesRoot, entry.name, "template.tsx")
    const metadata = JSON.parse(await readFile(metadataPath, "utf8"))

    const keys = Object.keys(metadata).sort()
    const expectedKeys = ["description", "slug", "tags", "title"]
    if (keys.join(",") !== expectedKeys.join(",")) {
      throw new Error(`Template metadata keys are invalid: ${metadataPath}`)
    }

    if (!slugPattern.test(entry.name) || metadata.slug !== entry.name) {
      throw new Error(`Template directory and slug must match: ${entry.name}`)
    }
    if (typeof metadata.title !== "string" || !metadata.title.trim() || typeof metadata.description !== "string" || !metadata.description.trim() || !Array.isArray(metadata.tags) || metadata.tags.some((tag) => typeof tag !== "string" || !tag.trim()) || new Set(metadata.tags).size !== metadata.tags.length) {
      throw new Error(`Template metadata is incomplete: ${metadataPath}`)
    }
    await readFile(implementationPath, "utf8")
    templates.push({ directory: entry.name, metadata })
  }

  const slugs = templates.map(({ metadata }) => metadata.slug)
  if (new Set(slugs).size !== slugs.length) {
    throw new Error("Template slugs must be unique")
  }

  return templates.sort((left, right) => left.metadata.title.localeCompare(right.metadata.title))
}
