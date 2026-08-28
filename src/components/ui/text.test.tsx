import { act, createRef, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";

import type { HeadingSize } from "./heading";
import type { TextSize } from "./text";
import { Heading, Prose, Text } from "./text-index";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const mounted: Array<{
  container: HTMLDivElement;
  root: ReturnType<typeof createRoot>;
}> = [];

function renderDocument(children: ReactNode): string {
  return renderToStaticMarkup(
    <html>
      <head />
      <body>{children}</body>
    </html>,
  );
}

afterEach(async () => {
  for (const item of mounted.splice(0)) {
    await act(async () => item.root.unmount());
    item.container.remove();
  }
});

describe("Text", () => {
  it("uses semantic elements, filters styling props, and preserves inline styles", () => {
    const markup = renderToStaticMarkup(
      <>
        <Text as="label" htmlFor="field">
          Label
        </Text>
        <Text as="time" dateTime="2026-08-23">
          Today
        </Text>
        <Text
          align="center"
          data-test-id="proof"
          size="lg"
          style={{ color: "red" }}
          variant="accent"
        >
          Message
        </Text>
      </>,
    );

    expect(markup).toContain('for="field"');
    expect(markup).toContain('dateTime="2026-08-23"');
    expect(markup).toContain('data-test-id="proof"');
    expect(markup).toContain('style="color:red"');
    expect(markup).not.toMatch(/\s(?:align|size|variant)=/);
  });

  it("uses literal variable candidates without a runtime style resource", () => {
    const markup = renderDocument(
      <Text
        align={{ zero: "left", "screen:lg": "right" }}
        display={{ md: "none", "screen:xs": "inline" }}
        size={{ zero: "xs", lg: "xl", "screen:lg": "2xl" }}
      >
        Responsive
      </Text>,
    );

    expect(markup).toContain("[display:var(--scraps-text-display)]");
    expect(markup).toContain("@[576px]:[--scraps-text-display:none]");
    expect(markup).toContain("min-[500px]:![--scraps-text-display:inline]");
    expect(markup).toContain("@[640px]:[--scraps-text-font-size:20px]");
    expect(markup).toContain("min-[1200px]:![--scraps-text-font-size:24px]");
    expect(markup).not.toContain("<style");
  });

  it("maps every public size to its generated font-size domain", () => {
    const sizes = [
      ["xs", "11px"],
      ["sm", "12px"],
      ["md", "14px"],
      ["lg", "16px"],
      ["xl", "20px"],
      ["2xl", "24px"],
    ] satisfies ReadonlyArray<readonly [TextSize, string]>;

    for (const [size, value] of sizes) {
      expect(renderToStaticMarkup(<Text size={size}>{size}</Text>)).toContain(
        `[--scraps-text-font-size:${value}]`,
      );
    }
  });

  it("uses exact decoration and word-break properties", () => {
    const markup = renderToStaticMarkup(
      <Text strikethrough underline wordBreak="break-word">
        Decorated
      </Text>,
    );

    expect(markup).toContain("[text-decoration:line-through_underline]");
    expect(markup).toContain("[word-break:break-word]");
    expect(markup).not.toContain("decoration-[line-through");
    expect(markup).not.toContain("break-words");
  });

  it("emits one font family and one canonical weight", () => {
    const markup = renderToStaticMarkup(
      <>
        <Text data-testid="sans">Sans</Text>
        <Text data-testid="regular" bold={false}>
          Regular
        </Text>
        <Text data-testid="mono" monospace>
          Mono
        </Text>
        <Text data-testid="regular-mono" bold={false} monospace>
          Regular mono
        </Text>
        <Text data-testid="bold-mono" bold monospace>
          Bold mono
        </Text>
      </>,
    );

    const classNames = [...markup.matchAll(/class="([^"]+)"/g)].map((match) => match[1]);
    expect(classNames[0]).toContain("font-rubik");
    expect(classNames[0]).not.toContain("Roboto_Mono");
    expect(classNames[0]).not.toMatch(/font-(?:medium|normal|\[425\])/);
    expect(classNames[1]).toContain("font-normal");
    expect(classNames[2]).toContain("Roboto_Mono");
    expect(classNames[2]).not.toMatch(/font-(?:medium|normal|\[425\])/);
    expect(classNames[2]).not.toContain("font-rubik");
    expect(classNames[3]).toContain("Roboto_Mono");
    expect(classNames[3]).toContain("font-[425]");
    expect(classNames[4]).toContain("Roboto_Mono");
    expect(classNames[4]).toContain("font-medium");
    expect(classNames[4]).not.toContain("font-[425]");
  });

  it("passes classes only to render functions", () => {
    const markup = renderToStaticMarkup(
      <Text align="right" data-invalid="blocked" variant="promotion">
        {({ className }) => <a className={className}>Link</a>}
      </Text>,
    );

    expect(markup).toContain("<a");
    expect(markup).not.toContain("<span");
    expect(markup).not.toContain("data-invalid");
    expect(markup).not.toContain("variant=");
  });

  it("assigns polymorphic refs", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    mounted.push({ container, root });
    const ref = createRef<HTMLParagraphElement>();

    await act(async () => {
      root.render(
        <Text as="p" ref={ref}>
          Paragraph
        </Text>,
      );
    });

    expect(ref.current?.tagName).toBe("P");
  });
});

describe("Heading", () => {
  it("maps heading sizes and keeps inherit properties", () => {
    const markup = renderDocument(
      <>
        <Heading as="h1">H1</Heading>
        <Heading as="h6">H6</Heading>
        <Heading as="h2" size="4xl">
          4xl
        </Heading>
        <Heading as="h3" variant="inherit">
          Inherited
        </Heading>
      </>,
    );

    expect(markup).toContain("[--scraps-text-font-size:24px]");
    expect(markup).toContain("[--scraps-text-font-size:11px]");
    expect(markup).toContain("[--scraps-text-font-size:40px]");
    expect(markup).toContain("[--scraps-text-font-size:inherit]");
    expect(markup).toContain("[--scraps-text-line-height:inherit]");
  });

  it("maps every public size and the inherit variant", () => {
    const sizes = [
      ["xs", "11px"],
      ["sm", "12px"],
      ["md", "14px"],
      ["lg", "16px"],
      ["xl", "20px"],
      ["2xl", "24px"],
      ["3xl", "32px"],
      ["4xl", "40px"],
    ] satisfies ReadonlyArray<readonly [HeadingSize, string]>;

    for (const [size, value] of sizes) {
      expect(
        renderToStaticMarkup(
          <Heading as="h2" size={size}>
            {size}
          </Heading>,
        ),
      ).toContain(`[--scraps-text-font-size:${value}]`);
    }

    expect(
      renderToStaticMarkup(
        <Heading as="h2" variant="inherit">
          inherit
        </Heading>,
      ),
    ).toContain("[--scraps-text-font-size:inherit]");
  });

  it("keeps Text-only cursor and width rules out of Heading", () => {
    const headingMarkup = renderToStaticMarkup(
      <Heading as="h2" cursor="pointer" ellipsis>
        Heading
      </Heading>,
    );
    const textMarkup = renderToStaticMarkup(
      <Text cursor="pointer" ellipsis>
        Text
      </Text>,
    );

    expect(headingMarkup).toContain("overflow-hidden text-ellipsis");
    expect(headingMarkup).not.toContain("w-full");
    expect(headingMarkup).not.toContain("cursor-pointer");
    expect(textMarkup).toContain("w-full overflow-hidden text-ellipsis");
    expect(textMarkup).toContain("cursor-pointer");
  });

  it("uses exact dotted decoration and word-break properties", () => {
    const markup = renderToStaticMarkup(
      <Heading as="h2" strikethrough underline="dotted" wordBreak="break-word">
        Decorated heading
      </Heading>,
    );

    expect(markup).toContain("[text-decoration:line-through_underline_dotted]");
    expect(markup).toContain("[word-break:break-word]");
  });

  it("sets normal word-break without resetting overflow-wrap", () => {
    const markup = renderToStaticMarkup(
      <>
        <Text wordBreak="normal">Text</Text>
        <Heading as="h2" wordBreak="normal">
          Heading
        </Heading>
      </>,
    );

    expect(markup.match(/\[word-break:normal\]/g)).toHaveLength(2);
    expect(markup).not.toContain("break-normal");
  });

  it("uses one family and the heading weight for monospace and inherit", () => {
    const markup = renderToStaticMarkup(
      <>
        <Heading as="h2" monospace>
          Mono heading
        </Heading>
        <Heading as="h2" variant="inherit">
          Inherit heading
        </Heading>
      </>,
    );
    const classNames = [...markup.matchAll(/class="([^"]+)"/g)].map((match) => match[1]);

    expect(classNames[0]).toContain("Roboto_Mono");
    expect(classNames[0]).toContain("font-medium");
    expect(classNames[0]).not.toContain("font-[425]");
    expect(classNames[0]).not.toContain("font-rubik");
    expect(classNames[1]).toContain("[font-weight:inherit]");
    expect(classNames[1]).not.toContain("font-medium");
  });
});

describe("Prose", () => {
  it("has complete block spacing, inline code, and keycap recipes", () => {
    const markup = renderDocument(
      <Prose>
        <p>
          Use <code>captureException</code> and <kbd>⌘K</kbd>.
        </p>
        <pre>
          <code>block</code>
        </pre>
      </Prose>,
    );
    const selectors = [
      "[&_h1]:mb-6",
      "[&_ul:not([role=listbox],[role=grid],[role=menu])]:mb-6",
      "[&_ul:not([role=listbox],[role=grid],[role=menu]):last-child]:mb-0",
      "[&_[class^=highlight-]:last-child]:mb-0",
      "[&_kbd]:border-b-2",
      "[&_kbd]:[font-size:12px]",
    ];

    for (const selector of selectors) {
      expect(markup).toContain(selector.replaceAll("&", "&amp;"));
    }
    expect(markup).not.toContain("code:not(pre_code)]:font-[425]");
    expect(markup).not.toContain("code:not(pre_code)]:text-[length:inherit]");
    expect(markup).not.toContain("[&_kbd]:text-xs");
    expect(markup).not.toContain("<style");
  });
});
