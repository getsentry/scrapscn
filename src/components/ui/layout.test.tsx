import { act } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { renderToStaticMarkup, renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Container, Flex, getBorder, Grid, rc, Stack, Surface } from "./layout";
import { isValidLayoutDomProp, LAYOUT_THEME } from "./layout-style-engine";
import { Separator } from "./separator";

describe("Layout DOM properties", () => {
  it("applies render-function classes to an intrinsic element and keeps consumer style", () => {
    let callbackClassName = "";
    const markup = renderToStaticMarkup(
      <Container display="flex">
        {({ className }) => {
          callbackClassName = className;
          return (
            <section className={`${className} consumer-render-class`} style={{ display: "grid" }} />
          );
        }}
      </Container>,
    );
    const classAttribute = markup.match(/class="([^"]+)"/)?.[1];

    expect(classAttribute).toBe(`${callbackClassName} consumer-render-class`);
    expect(markup).toContain("[display:flex]");
    expect(markup).toContain("display:grid");
  });

  it("uses finite literal classes through a Fragment", () => {
    const markup = renderToStaticMarkup(
      <Container display="flex">
        {({ className }) => (
          <>
            <section className={className} />
          </>
        )}
      </Container>,
    );

    expect(markup).toContain("[display:flex]");
  });

  it("passes finite classes to className-only custom components", () => {
    function ClassNameOnly({ className }: { className: string }) {
      return <section className={className} />;
    }

    const markup = renderToStaticMarkup(
      <Container display="flex">
        {({ className }) => <ClassNameOnly className={className} />}
      </Container>,
    );

    expect(markup).toContain("[display:flex]");
  });

  it("keeps arbitrary CSS values on owned elements without style resources", () => {
    const markup = renderToStaticMarkup(
      <Container cursor="url(data:image/svg+xml,%3Csvg%3E%3C/svg%3E), auto" />,
    );

    expect(markup).toContain("--scraps-layout-base-cursor");
    expect(markup).toContain("data:image/svg+xml");
    expect(markup).not.toContain("<style");
  });

  it("rejects CSS declaration escapes from raw and resolved values", () => {
    const malicious = "auto;background-image:url(https://example.com/track)";
    const markup = renderToStaticMarkup(<Container width={malicious} />);

    expect(rc("width", malicious, LAYOUT_THEME)).toBeUndefined();
    expect(rc("width", "auto", LAYOUT_THEME, () => malicious)).toBeUndefined();
    expect(rc("cursor", "url(data:image/svg+xml,%3Csvg%3E%3C/svg%3E), auto", LAYOUT_THEME)).toBe(
      "cursor: url(data:image/svg+xml,%3Csvg%3E%3C/svg%3E), auto;",
    );
    expect(markup).not.toContain("background-image");
    expect(markup).not.toContain("track");
  });

  it("rejects CSS property injection and accepts safe property identifiers", () => {
    expect(rc("width; color", "red", LAYOUT_THEME)).toBeUndefined();
    expect(rc("@media (min-width: 1px)", { zero: "red" }, LAYOUT_THEME)).toBeUndefined();
    expect(rc("width} body", { zero: "1px", md: "2px" }, LAYOUT_THEME)).toBeUndefined();
    expect(rc("--layout-probe", "4px", LAYOUT_THEME)).toBe("--layout-probe: 4px;");
    expect(rc("-webkit-line-clamp", 2, LAYOUT_THEME)).toBe("-webkit-line-clamp: 2;");
  });

  it("deduplicates overlapping Flex, Grid, and Surface class tokens", () => {
    const renderedClassNames: string[] = [];
    const capture = (className: string) => {
      renderedClassNames.push(className);
      return <section className={className} />;
    };

    const markup = renderToStaticMarkup(
      <>
        <Flex display="inline-flex">{({ className }) => capture(className)}</Flex>
        <Grid display="inline-grid">{({ className }) => capture(className)}</Grid>
        <Surface variant="overlay">{({ className }) => capture(className)}</Surface>
      </>,
    );

    expect(markup).toContain("[display:inline-flex]");
    expect(markup).toContain("[display:inline-grid]");
    for (const className of renderedClassNames) {
      const tokens = className.split(/\s+/);
      expect(new Set(tokens).size).toBe(tokens.length);
    }
  });

  it("lets finite longhands replace overlapping shorthand classes", () => {
    const markup = renderToStaticMarkup(
      <Container
        border="primary"
        borderTop="danger"
        margin="xl"
        marginLeft="0"
        padding="xl"
        paddingTop="sm"
      />,
    );

    expect(markup).toContain("[padding-top:6px]");
    expect(markup).toContain("[padding-right:16px]");
    expect(markup).not.toContain("[padding-top:16px]");
    expect(markup).toContain("[margin-left:0]");
    expect(markup).toContain("[margin-right:16px]");
    expect(markup).not.toContain("[margin-left:16px]");
    expect(markup).toContain("[border-top:1px_solid_var(--scraps-theme-border-danger)]");
    expect(markup).toContain("[border-right:1px_solid_var(--scraps-theme-border-primary)]");
    expect(markup).not.toContain("[border-top:1px_solid_var(--scraps-theme-border-primary)]");
  });

  it("merges responsive longhands with canonical later-declaration precedence", () => {
    const markup = renderToStaticMarkup(
      <Container
        border={{ zero: "primary", md: "secondary" }}
        borderTop={{ zero: "danger", md: "accent" }}
        margin={{ zero: "xl", md: "lg" }}
        marginLeft={{ zero: "0", md: "sm" }}
        padding={{ zero: "xl", md: "lg" }}
        paddingTop={{ zero: "sm", md: "xs" }}
      />,
    );

    expect(markup).toContain("--scraps-layout-base-padding-top:6px");
    expect(markup).toContain("--scraps-layout-container-md-padding-top:4px");
    expect(markup).toContain("--scraps-layout-container-md-padding-right:12px");
    expect(markup).not.toContain("--scraps-layout-base-padding-top:16px");
    expect(markup).not.toContain("--scraps-layout-container-md-padding-top:12px");
    expect(markup).toContain("--scraps-layout-base-margin-left:0");
    expect(markup).toContain("--scraps-layout-container-md-margin-left:6px");
    expect(markup).not.toContain("--scraps-layout-base-margin-left:16px");
    expect(markup).not.toContain("--scraps-layout-container-md-margin-left:12px");
    expect(markup).toContain(
      "--scraps-layout-base-border-top:1px solid var(--scraps-theme-border-danger)",
    );
    expect(markup).toContain(
      "--scraps-layout-container-md-border-top:1px solid var(--scraps-theme-border-accent)",
    );
    expect(markup).not.toContain(
      "--scraps-layout-base-border-top:1px solid var(--scraps-theme-border-primary)",
    );
    expect(markup).not.toContain(
      "--scraps-layout-container-md-border-top:1px solid var(--scraps-theme-border-secondary)",
    );
  });

  it("resolves render-function classes against the deterministic server breakpoints", () => {
    const markup = renderToStaticMarkup(
      <Container
        border={{ zero: "primary", "screen:lg": "secondary" }}
        borderTop={{ md: "danger" }}
        margin={{ zero: "xl", "screen:lg": "2xl" }}
        marginLeft={{ md: "sm" }}
        padding={{ zero: "xl", "screen:lg": "2xl" }}
        paddingTop={{ md: "xs" }}
        radius={{ zero: "lg", md: "sm", "screen:lg": "xl" }}
      >
        {({ className }) => <section className={className} />}
      </Container>,
    );

    expect(markup).toContain("[padding-top:4px]");
    expect(markup).toContain("[margin-left:6px]");
    expect(markup).toContain("[border-top:1px_solid_var(--scraps-theme-border-danger)]");
    expect(markup).toContain("[border-top-left-radius:8px]");
    expect(markup).not.toContain("@[576px]");
    expect(markup).not.toContain("min-[1200px]");
    expect(markup).not.toContain("style=");
  });

  it("lets each later declaration replace the earlier physical property", () => {
    const markup = renderToStaticMarkup(
      <Container padding={{ zero: "xl", "screen:2xs": "2xl" }} paddingTop={{ md: "xs" }}>
        <Container
          data-testid="nested-layer"
          padding={{ zero: "xl", "screen:2xs": "2xl" }}
          paddingTop={{ md: "sm" }}
        />
      </Container>,
    );

    expect(markup).toContain("[padding-top:4px]");
    expect(markup).toContain("[padding-top:6px]");
    expect(markup).not.toContain("--scraps-layout-layer");
  });

  it("promotes first-defined responsive values for every layout primitive", () => {
    const markup = renderToStaticMarkup(
      <>
        <Container display={{ md: "flex" }} />
        <Flex display={{ md: "inline-flex" }} flex={{ md: 1 }} />
        <Grid display={{ md: "inline-grid" }} />
        <Stack direction={{ md: "row" }} />
      </>,
    );

    expect(markup).toContain("[display:flex]");
    expect(markup).toContain("[display:inline-flex]");
    expect(markup).toContain("[display:inline-grid]");
    expect(markup).toContain("[flex-direction:row]");
    expect(markup).toContain("--scraps-layout-base-flex:1");
  });

  it("promotes Separator's first directional border value over its reset", () => {
    const markup = renderToStaticMarkup(
      <Separator border={{ md: "danger" }} orientation="horizontal" />,
    );

    expect(markup).toContain("[border-bottom:1px_solid_var(--scraps-theme-border-danger)]");
    expect(markup).not.toContain("[border-bottom:none]");
    expect(rc("border-bottom", { md: "danger" }, LAYOUT_THEME, getBorder)).toBe(
      "border-bottom: 1px solid var(--scraps-theme-border-danger);",
    );
  });

  it("keeps every finite Grid resolver literal in render-function classes", () => {
    let className = "";
    const markup = renderToStaticMarkup(
      <Grid align="start" alignContent="end" justify="start" margin="0">
        {(props) => {
          className = props.className;
          return <section className={props.className} />;
        }}
      </Grid>,
    );

    expect(className).toContain("[margin-top:0]");
    expect(className).toContain("[align-items:start]");
    expect(className).toContain("[align-content:end]");
    expect(className).toContain("[justify-content:start]");
    expect(markup).not.toContain("--scraps-layout-base-margin");
    expect(markup).not.toContain("--scraps-layout-base-align");
    expect(markup).not.toContain("--scraps-layout-base-justify");
  });

  it("keeps responsive owned-element styles below inline style precedence", () => {
    const markup = renderToStaticMarkup(
      <Flex display={{ zero: "flex", "screen:2xs": "inline-flex" }} style={{ display: "grid" }} />,
    );

    expect(markup).toContain(
      "min-[0px]:![--scraps-layout-display:var(--scraps-layout-screen-2xs-display)]",
    );
    expect(markup).toContain("[display:var(--scraps-layout-display)]");
    expect(markup).not.toContain("min-[0px]:![display:inline-flex]");
    expect(markup).toContain("display:grid");
  });

  it("keeps arbitrary responsive owned values in CSS query variables", () => {
    const markup = renderToStaticMarkup(
      <Container width={{ zero: "calc(100% - 1px)", md: "50%" }} />,
    );

    expect(markup).toContain("--scraps-layout-base-width:calc(100% - 1px)");
    expect(markup).toContain("--scraps-layout-container-md-width:50%");
    expect(markup).toContain(
      "@[576px]:[--scraps-layout-width:var(--scraps-layout-container-md-width)]",
    );
    expect(markup).toContain("[width:var(--scraps-layout-width)]");
  });

  it("keeps responsive render-function styles below child inline style precedence", () => {
    const markup = renderToStaticMarkup(
      <Flex direction={{ zero: "column", "screen:2xs": "row" }}>
        {({ className }) => <section className={className} style={{ flexDirection: "column" }} />}
      </Flex>,
    );

    expect(markup).toContain("[flex-direction:row]");
    expect(markup).not.toContain("--scraps-layout-flex-direction");
    expect(markup).toContain("flex-direction:column");
  });

  it("expands finite gap pairs to physical row and column declarations", () => {
    const markup = renderToStaticMarkup(<Grid gap="xs lg" />);

    expect(markup).toContain("[row-gap:4px]");
    expect(markup).toContain("[column-gap:12px]");
    expect(markup).not.toContain("[gap:");
  });

  it("hydrates the no-wrapper render form from the same server snapshot", async () => {
    const mediaQueries: Array<{
      listeners: Set<() => void>;
      matches: boolean;
      media: string;
    }> = [];
    const originalMatchMedia = window.matchMedia;
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: (media: string) => {
        const query = { listeners: new Set<() => void>(), matches: false, media };
        mediaQueries.push(query);
        return {
          get matches() {
            return query.matches;
          },
          media,
          onchange: null,
          addEventListener: (_type: string, listener: () => void) => query.listeners.add(listener),
          removeEventListener: (_type: string, listener: () => void) =>
            query.listeners.delete(listener),
          addListener: (listener: () => void) => query.listeners.add(listener),
          removeListener: (listener: () => void) => query.listeners.delete(listener),
          dispatchEvent: () => true,
        } as unknown as MediaQueryList;
      },
    });
    const element = (
      <Flex
        direction={{
          zero: "column",
          "screen:2xs": "row",
          "screen:lg": "column-reverse",
        }}
      >
        {({ className }) => <section className={className} data-testid="hydrated-layout" />}
      </Flex>
    );
    const host = document.createElement("div");
    host.innerHTML = renderToString(element);
    const recoverableErrors: unknown[] = [];
    let root: ReturnType<typeof hydrateRoot> | undefined;

    await act(async () => {
      root = hydrateRoot(host, element, {
        onRecoverableError: (error) => recoverableErrors.push(error),
      });
    });

    expect(recoverableErrors).toEqual([]);
    expect(host.children).toHaveLength(1);
    expect(host.firstElementChild?.tagName).toBe("SECTION");
    expect(host.firstElementChild?.className).toContain("[flex-direction:row]");

    await act(async () => {
      for (const query of mediaQueries) {
        if (query.media.includes("1200px")) query.matches = true;
        for (const listener of query.listeners) listener();
      }
    });
    expect(host.firstElementChild?.className).toContain("[flex-direction:column-reverse]");

    await act(async () => root?.unmount());
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: originalMatchMedia,
    });
  });

  it("rebinds a query observer when the polymorphic host changes", async () => {
    class TestResizeObserver implements ResizeObserver {
      static instances: TestResizeObserver[] = [];
      readonly callback: ResizeObserverCallback;
      disconnectCount = 0;
      observedElement: Element | undefined;

      constructor(callback: ResizeObserverCallback) {
        this.callback = callback;
        TestResizeObserver.instances.push(this);
      }

      disconnect() {
        this.disconnectCount += 1;
      }

      observe(target: Element) {
        this.observedElement = target;
      }

      unobserve() {}

      takeRecords(): ResizeObserverEntry[] {
        return [];
      }

      emit(inlineSize: number) {
        if (!this.observedElement) return;
        this.callback(
          [
            {
              contentBoxSize: [{ inlineSize }],
              target: this.observedElement,
            } as unknown as ResizeObserverEntry,
          ],
          this,
        );
      }
    }

    function QueryFixture({ host }: { host: "div" | "section" }) {
      return (
        <Container as={host} containerType="inline-size">
          <Container padding={{ zero: "2xl", md: "xs" }}>
            {({ className }) => <span className={className} data-testid="query-child" />}
          </Container>
        </Container>
      );
    }

    const originalResizeObserver = globalThis.ResizeObserver;
    Object.defineProperty(globalThis, "ResizeObserver", {
      configurable: true,
      value: TestResizeObserver,
    });
    const host = document.createElement("div");
    const root = createRoot(host);
    try {
      await act(async () => root.render(<QueryFixture host="div" />));
      const firstObserver = TestResizeObserver.instances[0];
      expect(firstObserver?.observedElement?.tagName).toBe("DIV");
      await act(async () => firstObserver?.emit(600));
      expect(TestResizeObserver.instances).toHaveLength(1);
      expect(host.querySelector("[data-testid=query-child]")?.className).toContain(
        "[padding-top:4px]",
      );

      await act(async () => root.render(<QueryFixture host="section" />));
      const secondObserver = TestResizeObserver.instances[1];
      expect(firstObserver?.disconnectCount).toBe(1);
      expect(secondObserver?.observedElement?.tagName).toBe("SECTION");
      await act(async () => secondObserver?.emit(400));
      expect(TestResizeObserver.instances).toHaveLength(2);
      expect(host.querySelector("[data-testid=query-child]")?.className).toContain(
        "[padding-top:24px]",
      );

      await act(async () => firstObserver?.emit(800));
      expect(host.querySelector("[data-testid=query-child]")?.className).toContain(
        "[padding-top:24px]",
      );
      expect(secondObserver?.disconnectCount).toBe(0);
    } finally {
      await act(async () => root.unmount());
      Object.defineProperty(globalThis, "ResizeObserver", {
        configurable: true,
        value: originalResizeObserver,
      });
    }
  });

  it("maps all Surface variants to literal backgrounds and overlay decoration", () => {
    const markup = renderToStaticMarkup(
      <>
        <Surface variant="primary" />
        <Surface variant="secondary" />
        <Surface variant="tertiary" />
        <Surface elevation="high" variant="overlay" />
      </>,
    );

    expect(markup).toContain("[background:var(--background)]");
    expect(markup).toContain("[background:var(--card)]");
    expect(markup).toContain("[background:var(--secondary)]");
    expect(markup).toContain("[background:var(--popover)]");
    expect(markup).toContain("[border-top-left-radius:6px]");
    expect(markup).toContain("[border-top:1px_solid_var(--scraps-theme-border-primary)]");
    expect(markup).toContain("[border-right:1px_solid_var(--scraps-theme-border-primary)]");
    expect(markup).toContain("[box-shadow:var(--scraps-theme-shadow-high,");
  });

  it("wraps a non-element render-function result without an unsafe cast", () => {
    expect(
      renderToStaticMarkup(<Container display="block">{() => "Rendered text"}</Container>),
    ).toBe("Rendered text");
  });

  it("accepts React 19 HTML properties and rejects component-only properties", () => {
    for (const name of [
      "autoSave",
      "about",
      "defaultChecked",
      "defaultValue",
      "exportparts",
      "part",
      "popoverTarget",
      "popoverTargetAction",
    ]) {
      expect(isValidLayoutDomProp(name)).toBe(true);
    }
    expect(isValidLayoutDomProp("invalidCamelCase")).toBe(false);
    expect(isValidLayoutDomProp("unknownlowercase")).toBe(false);
    expect(isValidLayoutDomProp("rev")).toBe(false);
  });

  it("forwards React HTML properties after removing layout properties", () => {
    const markup = renderToStaticMarkup(
      <>
        <Container
          autoSave="off"
          about="https://example.com/project"
          className="consumer"
          data-testid="container"
          exportparts="source: container"
          padding="md"
          part="layout"
        >
          Content
        </Container>
        <Flex exportparts="source: flex" part="layout" />
        <Grid exportparts="source: grid" part="layout" />
        <Stack exportparts="source: stack" part="layout" />
      </>,
    );

    expect(markup).toContain('autoSave="off"');
    expect(markup).toContain('about="https://example.com/project"');
    expect(markup).toContain('data-testid="container"');
    expect(markup).toContain("consumer");
    expect(markup.match(/part="layout"/g)).toHaveLength(4);
    expect(markup).toContain('exportparts="source: container"');
    expect(markup).toContain('exportparts="source: flex"');
    expect(markup).toContain('exportparts="source: grid"');
    expect(markup).toContain('exportparts="source: stack"');
    expect(markup).not.toContain('padding="md"');
  });

  it("forwards Separator DOM properties after destructuring separator properties", () => {
    const markup = renderToStaticMarkup(
      <Separator
        autoSave="off"
        data-testid="separator"
        exportparts="source: separator"
        margin="md"
        orientation="horizontal"
        part="separator"
      />,
    );

    expect(markup).toContain('autoSave="off"');
    expect(markup).toContain('data-testid="separator"');
    expect(markup).toContain('exportparts="source: separator"');
    expect(markup).toContain('part="separator"');
    expect(markup).not.toContain('margin="md"');
  });
});
