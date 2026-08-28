import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { scaffoldTemplate } from "../../scripts/create-template.mjs";
import { readTemplates } from "../../scripts/template-files.mjs";

async function withTemplates(run) {
  const root = await mkdtemp(path.join(tmpdir(), "scrapscn-templates-"));
  try {
    await run(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test("a scaffolded template is discovered without a registry edit", async () => {
  await withTemplates(async (root) => {
    await scaffoldTemplate({ slug: "issue-review", templatesRoot: root });
    const templates = await readTemplates(root);

    assert.deepEqual(
      templates.map(({ metadata }) => metadata.slug),
      ["issue-review"],
    );
    assert.equal(templates[0].metadata.title, "Issue Review");
    assert.match(
      await readFile(path.join(root, "issue-review", "template.tsx"), "utf8"),
      /SentryPageFrame/,
    );
  });
});

test("discovery rejects invalid metadata and missing implementations", async () => {
  await withTemplates(async (root) => {
    await mkdir(path.join(root, "broken"));
    await writeFile(
      path.join(root, "broken", "template.json"),
      JSON.stringify({
        slug: "broken",
        title: "Broken",
        description: "Broken template",
        tags: [],
        extra: true,
      }),
    );
    await assert.rejects(readTemplates(root), /metadata keys are invalid/);
  });
});

test("the scaffold refuses invalid slugs and existing targets", async () => {
  await withTemplates(async (root) => {
    await assert.rejects(
      scaffoldTemplate({ slug: "Not Valid", templatesRoot: root }),
      /lowercase kebab case/,
    );
    await scaffoldTemplate({ slug: "existing", templatesRoot: root });
    await assert.rejects(
      scaffoldTemplate({ slug: "existing", templatesRoot: root }),
      /exist|not empty/i,
    );
  });
});

test("a digit-leading slug still creates a valid component identifier", async () => {
  await withTemplates(async (root) => {
    await scaffoldTemplate({ slug: "123-review", templatesRoot: root });
    const implementation = await readFile(path.join(root, "123-review", "template.tsx"), "utf8");

    assert.match(implementation, /function Template123ReviewTemplate/);
    assert.equal((await readTemplates(root))[0].metadata.slug, "123-review");
  });
});
