import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { build } from "vite";

test("layout and separator server HTML carries Tailwind classes and custom properties without style resources", async () => {
  const outputDirectory = await mkdtemp(path.join(process.cwd(), "tests/parity/.layout-ssr-"));
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
            ({ className }) => createElement("div", { className }),
          ),
          createElement(Container, {
            display: { zero: "block", md: "flex" },
            key: "layout-responsive-one",
          }),
          createElement(Container, {
            display: { md: "flex", zero: "block" },
            key: "layout-responsive-two",
          }),
          createElement(
            Container,
            {
              display: { zero: "block", "screen:2xs": "inline-flex" },
              key: "layout-responsive-render-function",
            },
            ({ className }) => createElement("section", { className }),
          ),
          createElement(Container, {
            cursor: "url(data:image/svg+xml,%3Csvg%3E%3C/svg%3E), auto",
            key: "layout-benign-arbitrary",
          }),
          createElement(Container, {
            key: "layout-malicious-arbitrary",
            width: "auto;background-image:url(https://example.com/track)",
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
          }),
          createElement(Separator, {
            border: { md: "danger" },
            key: "separator-first-defined-border",
            orientation: "horizontal",
          }),
        ),
      ),
    );
    assert.doesNotMatch(markup, /<style/);
    assert.match(markup, /\[display:flex\]/);
    assert.match(
      markup,
      /@\[576px\]:\[--scraps-layout-display:var\(--scraps-layout-container-md-display\)\]/,
    );
    assert.match(markup, /\[display:inline-flex\]/);
    assert.match(markup, /data:image\/svg\+xml/);
    assert.doesNotMatch(markup, /background-image|example\.com\/track/);
    assert.match(markup, /\[border-bottom:1px_solid_var\(--scraps-theme-border-primary\)\]/);
    assert.match(markup, /\[border-bottom:1px_solid_var\(--scraps-theme-border-danger\)\]/);
    assert.doesNotMatch(markup, /!\[border-(?:bottom|left):var\(/);
  } finally {
    await rm(outputDirectory, { recursive: true });
  }
});
