import assert from "node:assert/strict";
import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const fontFamily = /font-family:\s*["']?Roboto Mono(?: Variable)?["']?/;

function extractRules(css, ruleName) {
  return [...css.matchAll(new RegExp(`${ruleName}\\s*\\{[^}]*\\}`, "g"))].map(
    ([rule]) => rule
  );
}

async function assertSingleRobotoMonoSet(cssFiles) {
  const sources = await Promise.all(
    cssFiles.map(async (cssFile) => ({
      cssFile,
      source: await readFile(cssFile, "utf8"),
    }))
  );
  const faces = sources.flatMap(({ cssFile, source }) =>
    extractRules(source, "@font-face")
      .filter((rule) => fontFamily.test(rule))
      .map((rule) => ({ cssFile, rule }))
  );

  assert.equal(faces.length, 6);

  const assets = new Set();
  for (const { cssFile, rule } of faces) {
    const sourceMatch = rule.match(/src:\s*url\(([^)]+)\)/);
    assert.ok(sourceMatch, `Missing source URL in ${cssFile}`);
    const sourceUrl = sourceMatch[1].replaceAll(/["']/g, "");
    const assetPath = path.resolve(path.dirname(cssFile), sourceUrl);
    await access(assetPath);
    assets.add(assetPath);
  }
  assert.equal(assets.size, 6);

  const bundledCss = sources.map(({ source }) => source).join("\n");
  assert.match(bundledCss, /font-weight:\s*425/);
  assert.match(bundledCss, /font-weight:\s*500/);
}

async function readNextPageCssFiles() {
  const manifestPath = ".next/server/app/page_client-reference-manifest.js";
  const manifest = await readFile(manifestPath, "utf8");
  const entryStart = manifest.indexOf('"entryCSSFiles":');
  const entryEnd = manifest.indexOf(',"entryJSFiles":', entryStart);

  assert.notEqual(entryStart, -1);
  assert.notEqual(entryEnd, -1);

  const entries = JSON.parse(
    manifest.slice(entryStart + '"entryCSSFiles":'.length, entryEnd)
  );
  const pageEntry = Object.entries(entries).find(([entry]) =>
    entry.endsWith("/src/app/page")
  );

  assert.ok(pageEntry, "Missing the playground page CSS manifest entry");
  return pageEntry[1].map(({ path: assetPath }) => path.join(".next", assetPath));
}

test("the Next playground ships one Roboto Mono variable font set", async () => {
  await assertSingleRobotoMonoSet(await readNextPageCssFiles());
});

test("the Storybook preview ships one Roboto Mono variable font set", async () => {
  const outputRoot = process.env.STORYBOOK_OUTPUT ?? "storybook-static";
  const assetsRoot = path.join(outputRoot, "assets");
  const cssFiles = (await readdir(assetsRoot))
    .filter((fileName) => fileName.endsWith(".css"))
    .map((fileName) => path.join(assetsRoot, fileName));

  await assertSingleRobotoMonoSet(cssFiles);
});
