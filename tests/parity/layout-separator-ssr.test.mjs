import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { build } from "vite";

test("layout and separator styles are present in server HTML and hoisted out of the body", async () => {
  const outputDirectory = await mkdtemp(
    path.join(process.cwd(), "tests/parity/.layout-ssr-")
  );
  const layoutOutputFile = path.join(outputDirectory, "layout.mjs");
  const separatorOutputFile = path.join(outputDirectory, "separator.mjs");

  try {
    await build({
      build: {
        emptyOutDir: true,
        lib: {
          entry: {
            layout: "src/components/ui/layout.tsx",
            separator: "src/components/ui/separator.tsx",
          },
          formats: ["es"],
        },
        minify: false,
        outDir: outputDirectory,
        rollupOptions: {
          external: ["react", "react-dom", "react/jsx-runtime"],
          output: { entryFileNames: "[name].mjs" },
        },
      },
      logLevel: "silent",
    });
    const { Container } = await import(pathToFileURL(layoutOutputFile));
    const { Separator } = await import(pathToFileURL(separatorOutputFile));
    const markup = renderToStaticMarkup(
      createElement(
        "html",
        null,
        createElement("head"),
        createElement(
          "body",
          null,
          createElement(Container, { display: "flex", key: "layout-one" }),
          createElement(Container, { display: "flex", key: "layout-two" }),
          createElement(
            Container,
            { display: "flex", key: "layout-render-function" },
            ({ className }) => createElement("div", { className })
          ),
          createElement(Container, {
            display: { zero: "block", md: "flex" },
            key: "layout-responsive-one",
          }),
          createElement(Container, {
            display: { md: "flex", zero: "block" },
            key: "layout-responsive-two",
          }),
          createElement(Separator, {
            key: "separator-one",
            orientation: "horizontal",
          }),
          createElement(Separator, {
            key: "separator-two",
            orientation: "horizontal",
          }),
          createElement(Separator, {
            key: "separator-responsive-one",
            margin: { zero: "0", md: "sm" },
            orientation: "vertical",
          }),
          createElement(Separator, {
            key: "separator-responsive-two",
            margin: { md: "sm", zero: "0" },
            orientation: "vertical",
          })
        )
      )
    );
    const [headMarkup, bodyMarkup = ""] = markup.split("<body>");
    const hrefs = headMarkup.match(/data-href="([^"]+)"/)?.[1]?.split(" ");

    assert.equal(
      hrefs?.filter((href) => href.startsWith("scraps-layout-")).length,
      2
    );
    assert.equal(
      hrefs?.filter((href) => href.startsWith("scraps-separator-")).length,
      2
    );
    assert.doesNotMatch(bodyMarkup, /<style/);
  } finally {
    await rm(outputDirectory, { recursive: true });
  }
});
