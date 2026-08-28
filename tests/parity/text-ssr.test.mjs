import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { build } from "vite";

test("Text and Prose literal classes survive SSR without runtime styles", async () => {
  const outputDirectory = await mkdtemp(path.join(process.cwd(), "tests/parity/.text-ssr-"));
  try {
    await build({
      build: {
        emptyOutDir: true,
        lib: { entry: "src/components/ui/text-index.ts", formats: ["es"] },
        minify: false,
        outDir: outputDirectory,
        rollupOptions: {
          external: ["react", "react-dom", "react/jsx-runtime"],
          output: { entryFileNames: "text.mjs" },
        },
      },
      logLevel: "silent",
    });
    const { Heading, Prose, Text } = await import(
      pathToFileURL(path.join(outputDirectory, "text.mjs"))
    );
    const body = createElement(
      "body",
      null,
      createElement(Text, { size: { zero: "xs", md: "lg", "screen:lg": "2xl" } }, "One"),
      createElement(Heading, { as: "h2", size: "4xl" }, "Heading"),
      createElement(Prose, null, createElement("code", null, "one")),
    );
    const markup = renderToStaticMarkup(createElement("html", null, createElement("head"), body));
    assert.match(markup, /\[font-size:var\(--scraps-text-font-size\)\]/);
    assert.match(markup, /@\[576px\]:\[--scraps-text-font-size:16px\]/);
    assert.match(markup, /min-\[1200px\]:!\[--scraps-text-font-size:24px\]/);
    assert.match(markup, /code:not\(pre_code\)/);
    assert.doesNotMatch(markup, /<style/);
  } finally {
    await rm(outputDirectory, { recursive: true });
  }
});
