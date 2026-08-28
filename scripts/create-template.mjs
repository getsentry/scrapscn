import { mkdir, mkdtemp, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { templatesDirectory } from "./template-files.mjs";

export async function scaffoldTemplate({ slug, title, templatesRoot = templatesDirectory }) {
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error("Template slug must use lowercase kebab case");
  }

  const resolvedTitle =
    title ||
    slug
      .split("-")
      .map((word) => word[0].toUpperCase() + word.slice(1))
      .join(" ");
  const targetDirectory = path.join(templatesRoot, slug);
  await mkdir(templatesRoot, { recursive: true });
  const stagingDirectory = await mkdtemp(path.join(templatesRoot, ".template-"));

  try {
    await writeFile(
      path.join(stagingDirectory, "template.json"),
      `${JSON.stringify({ slug, title: resolvedTitle, description: `${resolvedTitle} design review template.`, tags: [] }, null, 2)}\n`,
    );
    const componentName = `Template${resolvedTitle.replace(/[^A-Za-z0-9]/g, "")}Template`;
    await writeFile(
      path.join(stagingDirectory, "template.tsx"),
      `import { SentryPageFrame } from "@/components/playground/sentry-page-frame"\n\nimport type { TemplateProps } from "../types"\n\nexport default function ${componentName}({ templates }: TemplateProps) {\n  return (\n    <SentryPageFrame title=${JSON.stringify(resolvedTitle)}>\n      <p>Edit src/templates/${slug}/template.tsx to build this composition. {templates.length} templates are available.</p>\n    </SentryPageFrame>\n  )\n}\n`,
    );
    await rename(stagingDirectory, targetDirectory);
  } catch (error) {
    await rm(stagingDirectory, { recursive: true, force: true });
    throw error;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const slug = process.argv[2];
  if (!slug) throw new Error("Usage: pnpm template:create <lowercase-kebab-slug> [title]");
  await scaffoldTemplate({ slug, title: process.argv.slice(3).join(" ") });
  await import("./generate-template-manifest.mjs");
  process.stdout.write(`Created /templates/${slug}.\n`);
}
