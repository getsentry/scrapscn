import { act, createElement, createRef, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";

import { Heading, Prose, Text } from "./text-index";
import styles from "./text.module.css";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const mounted: Array<{ container: HTMLDivElement; root: ReturnType<typeof createRoot> }> = [];

function renderDocument(children: ReactNode): string {
  return renderToStaticMarkup(
    <html>
      {createElement("head")}
      <body>{children}</body>
    </html>
  );
}

afterEach(async () => {
  for (const item of mounted.splice(0)) {
    await act(async () => item.root.unmount());
    item.container.remove();
  }
});

describe("Text", () => {
  it("uses a span by default and preserves semantic native attributes", () => {
    const markup = renderToStaticMarkup(
      <>
        <Text>Default</Text>
        <Text as="label" htmlFor="field">Label</Text>
        <Text as="time" dateTime="2026-08-23">Today</Text>
      </>
    );

    expect(markup).toContain("<span");
    expect(markup).toContain('for="field"');
    expect(markup).toContain('dateTime="2026-08-23"');
  });

  it("filters style props while forwarding DOM props and consumer overrides", () => {
    const markup = renderToStaticMarkup(
      <Text
        align="center"
        className="consumer-class"
        data-test-id="proof"
        density="comfortable"
        size="lg"
        style={{ color: "red" }}
        variant="accent"
      >
        Message
      </Text>
    );

    expect(markup).toContain('data-test-id="proof"');
    expect(markup).toContain('style="color:red"');
    expect(markup).toMatch(/class="[^"]*consumer-class"/);
    expect(markup).not.toMatch(/\s(?:align|density|size|variant)=/);
  });

  it("emits no color class for inherit and keeps consumer color overrides", () => {
    const markup = renderToStaticMarkup(
      <>
        <Text className="consumer-color" variant="inherit">Class color</Text>
        <Text style={{ color: "rgb(1, 2, 3)" }} variant="inherit">Style color</Text>
      </>
    );

    expect(markup).toContain("consumer-color");
    expect(markup).toContain("color:rgb(1, 2, 3)");
    for (const colorClass of [
      styles.primary,
      styles.secondary,
      styles.accent,
      styles.promotion,
      styles.danger,
      styles.warning,
      styles.success,
    ]) {
      expect(markup).not.toContain(colorClass);
    }
  });

  it("keeps the default-span and explicit-span ellipsis displays distinct", () => {
    const markup = renderDocument(
      <>
        <Text ellipsis>Default span</Text>
        <Text as="span" ellipsis>Explicit span</Text>
      </>
    );

    expect(markup).toContain("display: block;");
    expect(markup).toContain("display: inline-block;");
  });

  it("seeds responsive display and keeps container rules before viewport rules", () => {
    const markup = renderDocument(
      <Text
        align="center"
        display={{ md: "none", "screen:xs": "inline" }}
        size={{ zero: "xs", lg: "xl", "screen:lg": "2xl" }}
      >
        Responsive
      </Text>
    );

    expect(markup).toContain("display: block;");
    expect(markup).toContain("@container (min-width: 576px)");
    expect(markup).toContain("@media (min-width: 500px)");
    expect(markup.indexOf("@container")).toBeLessThan(markup.indexOf("@media"));
    expect(markup).toContain("font-size: 11px;");
    expect(markup).toContain("font-size: 20px;");
    expect(markup).toContain("font-size: 24px;");
  });

  it("combines underline, strike, tabular, and fraction styles", () => {
    const markup = renderToStaticMarkup(
      <Text fraction strikethrough tabular underline>1/2</Text>
    );

    expect(markup).toContain(styles.strikeUnderline);
    expect(markup).toContain(styles.tabularFraction);
  });

  it("passes only the generated class to a render function", () => {
    const markup = renderToStaticMarkup(
      <Text align="right" data-invalid="blocked" variant="promotion">
        {({ className }) => <a className={className}>Link</a>}
      </Text>
    );

    expect(markup).toContain("<a");
    expect(markup).not.toContain("<span");
    expect(markup).not.toContain("data-invalid");
    expect(markup).not.toContain("variant=");
  });

  it("assigns a polymorphic React 19 ref without forwardRef", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    mounted.push({ container, root });
    const ref = createRef<HTMLParagraphElement>();

    await act(async () => root.render(<Text as="p" ref={ref}>Paragraph</Text>));

    expect(ref.current?.tagName).toBe("P");
  });
});

describe("Heading", () => {
  it("maps semantic tags to exact default sizes and supports 3xl and 4xl", () => {
    const markup = renderDocument(
      <>
        <Heading as="h1">H1</Heading>
        <Heading as="h6">H6</Heading>
        <Heading as="h2" size="3xl">3xl</Heading>
        <Heading as="h2" size="4xl">4xl</Heading>
      </>
    );

    expect(markup).toContain("font-size: 24px;");
    expect(markup).toContain("font-size: 11px;");
    expect(markup).toContain("font-size: 32px;");
    expect(markup).toContain("font-size: 40px;");
  });

  it("inherits size, line height, and weight but emits no color declaration", () => {
    const markup = renderDocument(
      <Heading as="h3" variant="inherit">Inherited</Heading>
    );

    expect(markup).toContain("font-size: inherit;");
    expect(markup).toContain("line-height: inherit;");
    expect(markup).toContain(styles.headingInherit);
    expect(markup).not.toContain(styles.primary);
  });

  it("filters Heading props and supports its no-wrapper render form", () => {
    const markup = renderToStaticMarkup(
      <Heading align="center" size="xl" variant="danger">
        {({ className }) => <h2 className={className} data-testid="heading">Title</h2>}
      </Heading>
    );

    expect(markup).toContain("<h2");
    expect(markup).toContain('data-testid="heading"');
    expect(markup).not.toMatch(/\s(?:align|size|variant)=/);
  });
});

describe("Prose", () => {
  it("uses article by default and emits exact raw code and kbd recipes", () => {
    const markup = renderDocument(
      <Prose>
        <p>Use <code>captureException</code> and <kbd>⌘K</kbd>.</p>
        <pre><code>block</code></pre>
      </Prose>
    );

    expect(markup).toContain("<article");
    expect(markup).toContain("code:not(pre code)");
    expect(markup).toContain("font-size-adjust:ex-height 0.57");
    expect(markup).toContain("height:1.67em");
    expect(markup).toContain("border-bottom:2px solid var(--scraps-hotkey-border-primary)");
    expect(markup).toContain('data-href="scraps-prose-composition"');
  });

  it("forwards a polymorphic React 19 ref", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    mounted.push({ container, root });
    const ref = createRef<HTMLElement>();

    await act(async () => root.render(<Prose as="section" ref={ref}>Body</Prose>));

    expect(ref.current?.tagName).toBe("SECTION");
  });
});
