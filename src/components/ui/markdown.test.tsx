import { act, createElement, Fragment, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("framer-motion", async (importOriginal) => ({
  ...(await importOriginal<typeof import("framer-motion")>()),
  useReducedMotion: () => false,
}));

import { Markdown } from "./markdown";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const roots: Root[] = [];

async function render(element: ReactNode) {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  roots.push(root);
  await act(async () => root.render(element));
  return { host, root };
}

afterEach(async () => {
  for (const root of roots.splice(0)) await act(async () => root.unmount());
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe("regular Scraps Markdown", () => {
  it("renders the canonical block and inline token set", async () => {
    const raw = [
      "## Heading 2",
      "",
      "Paragraph with **bold**, *italic*, ~~deleted~~, and `foo()`.",
      "",
      "> quoted text",
      "",
      "- item 1",
      "- item 2",
      "",
      "1. first",
      "2. second",
      "",
      "| A | B |",
      "| --- | ---: |",
      "| 1 | 2 |",
      "",
      "---",
      "",
      "line 1  ",
      "line 2",
    ].join("\n");
    const { host } = await render(<Markdown raw={raw} />);
    expect(host.querySelector("h2")?.textContent).toBe("Heading 2");
    expect(host.querySelector("strong")?.textContent).toBe("bold");
    expect(host.querySelector("em")?.textContent).toBe("italic");
    expect(host.querySelector("code")?.textContent).toBe("foo()");
    expect(host.querySelector("blockquote")?.textContent).toContain("quoted text");
    expect(host.querySelector("ul")?.textContent).toContain("item 1");
    expect(host.querySelector("ol")?.textContent).toContain("first");
    expect(host.querySelector("table")?.textContent).toContain("A");
    expect(host.querySelector("td")?.textContent).toBe("1");
    expect(host.querySelector("td:last-child")?.className).toContain("text-right");
    expect(host.querySelector("hr")).not.toBeNull();
    expect(host.querySelector("br")).not.toBeNull();
  });

  it("renders code blocks and readonly task checkboxes", async () => {
    const { host } = await render(
      <Markdown raw={"- [x] fixed\n- [ ] pending\n\n```js\nconst x = 1;\n```"} />,
    );
    const checkboxes = host.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
    expect(checkboxes).toHaveLength(2);
    expect(checkboxes[0]?.checked).toBe(true);
    expect(checkboxes[0]?.readOnly).toBe(true);
    expect(checkboxes[0]?.getAttribute("aria-label")).toBe("fixed");
    expect(checkboxes[1]?.getAttribute("aria-label")).toBe("pending");
    expect(host.querySelector("pre")?.textContent).toContain("const x = 1;");
  });

  it("allows safe and internal links and rejects unsafe schemes before overrides", async () => {
    const customLink = vi.fn(({ children, href }: { children: ReactNode; href: string }) => (
      <a data-custom-link href={href}>
        {children}
      </a>
    ));
    const { host } = await render(
      <Markdown
        raw={
          "[safe](https://example.com) [mail](mailto:a@example.com) [internal](/issues/1) [bad](javascript:alert(1)) [data](data:text/html,x)"
        }
        components={{ Link: customLink }}
      />,
    );
    expect(Array.from(host.querySelectorAll("a"), (link) => link.textContent)).toEqual([
      "safe",
      "mail",
      "internal",
    ]);
    expect(customLink).toHaveBeenCalledTimes(3);
    expect(host.textContent).toContain("bad");
    expect(host.textContent).toContain("data");
  });

  it("sanitizes raw HTML before default and custom rendering", async () => {
    let customHtml = "";
    const { host } = await render(
      <Markdown
        raw={
          '<script>alert(1)</script><iframe src="x"></iframe><form><input><button>x</button></form><div onclick="bad()">text</div>H<sub>2</sub>O x<sup>2</sup>'
        }
        components={{
          Html: ({ html }) => {
            customHtml += html;
            return <span dangerouslySetInnerHTML={{ __html: html }} />;
          },
        }}
      />,
    );
    expect(customHtml).not.toMatch(/script|iframe|form|input|button|onclick/i);
    expect(host.querySelector("script, iframe, form, input, button")).toBeNull();
    expect(host.querySelector("sub")?.textContent).toBe("2");
    expect(host.querySelector("sup")?.textContent).toBe("2");
  });

  it("strips images unless the consumer supplies Image", async () => {
    const first = await render(<Markdown raw="![alt](https://example.com/a.png)" />);
    expect(first.host.querySelector("img")).toBeNull();
    const second = await render(
      <Markdown
        raw="![alt](https://example.com/a.png)"
        components={{
          Image: ({ alt, src, title }) =>
            createElement("img", { alt: alt ?? "", src, title: title ?? undefined }),
        }}
      />,
    );
    expect(second.host.querySelector("img")?.getAttribute("alt")).toBe("alt");
  });

  it("passes the canonical override props and Default components", async () => {
    const { host } = await render(
      <Markdown
        raw={"# Title\n\nHello PROJ-123 and `code`\n\n```js\nlet x = 1\n```"}
        components={{
          Heading: ({ Default, children, level }) => (
            <Default level={level}>
              <span data-heading>{children}</span>
            </Default>
          ),
          Paragraph: ({ children }) => <div data-paragraph>{children}</div>,
          InlineCode: ({ children }) => <span data-inline-code>{children}</span>,
          CodeBlock: ({ children, lang }) => <pre data-code-lang={lang}>{children}</pre>,
          Text: ({ children }) => <Fragment>{children.replace("PROJ-123", "ISSUE")}</Fragment>,
        }}
      />,
    );
    expect(host.querySelector("h1 [data-heading]")?.textContent).toBe("Title");
    expect(host.querySelector("[data-paragraph]")?.textContent).toContain("ISSUE");
    expect(host.querySelector("[data-inline-code]")?.textContent).toBe("code");
    expect(host.querySelector("[data-code-lang]")?.getAttribute("data-code-lang")).toBe("js");
  });

  it("parses block and inline Scraps tags and suppresses partial tags", async () => {
    const calls: Array<Record<string, unknown>> = [];
    const { host } = await render(
      <Markdown
        raw={
          'Before {% ref type="issue" id="A-1" /%}.\n\n{% artifact type="root" %}{"count":2}{% /artifact %}\n\nPartial {% ref type="issue"'
        }
        components={{
          Tag: ({ attrs, data, level, name }) => {
            calls.push({ attrs, data, level, name });
            return <output>{name}</output>;
          },
        }}
      />,
    );
    expect(calls).toEqual([
      { attrs: { type: "issue", id: "A-1" }, data: undefined, level: "inline", name: "ref" },
      { attrs: { type: "root" }, data: { count: 2 }, level: "block", name: "artifact" },
    ]);
    expect(host.textContent).not.toContain("{% ref");
  });

  it("updates static and streaming content without stale tokens", async () => {
    const { host, root } = await render(<Markdown raw="First" variant="streaming" />);
    expect(host.textContent).toContain("First");
    await act(async () => root.render(<Markdown raw={"First\n\nSecond"} variant="streaming" />));
    expect(host.textContent).toContain("First");
    expect(host.textContent).toContain("Second");
    expect(host.querySelector("[data-streaming=true]")).not.toBeNull();
  });

  it("decodes text appended after a multi-code-unit grapheme", async () => {
    vi.spyOn(window, "requestAnimationFrame").mockImplementation(() => 1);
    const { host, root } = await render(<Markdown raw="😀" variant="streaming" />);

    await act(async () => {
      root.render(<Markdown raw="😀a" variant="streaming" />);
      await Promise.resolve();
    });

    expect(
      Array.from(host.querySelectorAll("[data-scraps-decode]"), (node) => node.textContent),
    ).toContain("a");
  });
});
