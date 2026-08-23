import { readFileSync } from "node:fs";
import { act, createRef } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Quote } from "./quote";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const quoteCases = [
  {
    caption: null,
    cite: null,
    label: null,
    name: "source absent",
    source: undefined,
  },
  { caption: "–", cite: null, label: null, name: "empty source", source: {} },
  {
    caption: "–",
    cite: "https://example.com/href-only",
    label: null,
    name: "href only",
    source: { href: "https://example.com/href-only" },
  },
  {
    caption: "– Ada",
    cite: null,
    label: null,
    name: "author only",
    source: { author: "Ada" },
  },
  {
    caption: "– , Notes",
    cite: null,
    label: "Notes",
    name: "label only",
    source: { label: "Notes" },
  },
  {
    caption: "– Ada, Notes",
    cite: "https://example.com/full",
    label: "Notes",
    name: "full source",
    source: {
      author: "Ada",
      href: "https://example.com/full",
      label: "Notes",
    },
  },
] as const;

describe("Quote", () => {
  it.each(quoteCases)(
    "keeps the canonical figure and citation semantics for $name",
    ({ caption, cite, label, source }) => {
      const markup = renderToStaticMarkup(
        source === undefined ? (
          <Quote>A quote.</Quote>
        ) : (
          <Quote source={source}>A quote.</Quote>
        )
      );
      const host = document.createElement("div");
      host.innerHTML = markup;
      const figure = host.querySelector("figure");
      const blockquote = figure?.querySelector("blockquote");
      const figcaption = figure?.querySelector("figcaption");

      expect(figure).not.toBeNull();
      expect(figure?.querySelector('hr[aria-orientation="vertical"]')).not.toBeNull();
      expect(blockquote?.textContent).toBe("A quote.");
      expect(blockquote?.getAttribute("cite") ?? null).toBe(cite);
      expect(figcaption?.textContent.trim() ?? null).toBe(caption);
      expect(figcaption?.querySelector("cite")?.textContent ?? null).toBe(label);
    }
  );

  it("uses the exact 16px plus 12px rail geometry", () => {
    const css = readFileSync("src/components/ui/quote.module.css", "utf8");
    expect(css).toContain("padding-left: 16px");
    expect(css).toContain("margin: 0 0 0 12px");
    expect(css).toContain("padding: 0 0 0 28px");
  });

  it("forwards the root element, ref, native props, and consumer overrides", async () => {
    const host = document.createElement("div");
    const root = createRoot(host);
    const ref = createRef<HTMLQuoteElement>();

    await act(async () => {
      root.render(
        <Quote
          as="blockquote"
          className="consumer-quote"
          data-quote="forwarded"
          gap="xl"
          id="quote-root"
          position="absolute"
          ref={ref}
          style={{ gap: "7px", position: "fixed" }}
        >
          A quote.
        </Quote>
      );
    });

    const quote = host.querySelector<HTMLQuoteElement>("blockquote#quote-root");
    expect(ref.current).toBe(quote);
    expect(quote?.id).toBe("quote-root");
    expect(quote?.getAttribute("data-quote")).toBe("forwarded");
    expect(quote?.classList.contains("consumer-quote")).toBe(true);
    expect(quote?.style.gap).toBe("7px");
    expect(quote?.style.position).toBe("fixed");

    await act(async () => root.unmount());
  });
});
