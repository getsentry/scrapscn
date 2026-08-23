import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { build } from "vite";

test("Text responsive and Prose composition resources survive SSR and dedupe in head", async () => {
  const outputDirectory = await mkdtemp(
    path.join(process.cwd(), "tests/parity/.text-ssr-")
  );
  const outputFile = path.join(outputDirectory, "text.mjs");

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
    const { Heading, Prose, Text } = await import(pathToFileURL(outputFile));
    const responsiveProps = {
      size: { zero: "xs", md: "lg", "screen:lg": "2xl" },
    };
    const markup = renderToStaticMarkup(
      createElement(
        "html",
        null,
        createElement("head"),
        createElement(
          "body",
          null,
          createElement(Text, { ...responsiveProps, key: "one" }, "One"),
          createElement(Text, { ...responsiveProps, key: "two" }, "Two"),
          createElement(Heading, { as: "h2", key: "heading", size: "4xl" }, "Heading"),
          createElement(Prose, { key: "prose-one" }, createElement("code", null, "one")),
          createElement(Prose, { key: "prose-two" }, createElement("kbd", null, "K"))
        )
      )
    );
    const [headMarkup, bodyMarkup = ""] = markup.split("<body>");
    const hrefs = [...headMarkup.matchAll(/data-href="([^"]+)"/g)]
      .flatMap((match) => match[1]?.split(" ") ?? []);

    assert.equal(hrefs.filter((href) => href.startsWith("scraps-text-")).length, 2);
    assert.equal(hrefs.filter((href) => href === "scraps-prose-composition").length, 1);
    assert.doesNotMatch(bodyMarkup, /<style/);
    assert.match(headMarkup, /@container \(min-width: 576px\)/);
    assert.match(headMarkup, /@media \(min-width: 1200px\)/);
    assert.match(headMarkup, /code:not\(pre code\)/);
  } finally {
    await rm(outputDirectory, { recursive: true });
  }
});

