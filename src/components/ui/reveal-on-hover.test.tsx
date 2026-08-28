import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RevealOnHover } from "./reveal-on-hover";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const roots: Array<{ container: HTMLDivElement; root: Root }> = [];

async function render(ui: ReactNode) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push({ container, root });
  await act(async () => root.render(ui));
  return { container, root };
}

function getButton(container: HTMLElement, name: string) {
  return [...container.querySelectorAll("button")].find(
    (button) => button.textContent === name || button.getAttribute("aria-label") === name,
  );
}

afterEach(async () => {
  for (const mounted of roots.splice(0)) {
    await act(async () => mounted.root.unmount());
    mounted.container.remove();
  }
});

describe("RevealOnHover", () => {
  it("renders children and action", async () => {
    const { container } = await render(
      <RevealOnHover>
        <span>Label</span>
        <RevealOnHover.Action>
          <button type="button">Copy</button>
        </RevealOnHover.Action>
      </RevealOnHover>,
    );

    expect(container.textContent).toContain("Label");
    expect(getButton(container, "Copy")).toBeTruthy();
  });

  it("wraps action children with a data-reveal-on-hover element", async () => {
    const { container } = await render(
      <RevealOnHover>
        <span>Label</span>
        <RevealOnHover.Action>
          <button type="button">Copy</button>
        </RevealOnHover.Action>
      </RevealOnHover>,
    );

    expect(getButton(container, "Copy")?.closest("[data-reveal-on-hover]")).toBeTruthy();
  });

  it("marks the action as visible when visible is true", async () => {
    const { container } = await render(
      <RevealOnHover>
        <span>Label</span>
        <RevealOnHover.Action visible>
          <button type="button">Copy</button>
        </RevealOnHover.Action>
      </RevealOnHover>,
    );

    expect(
      getButton(container, "Copy")
        ?.closest("[data-reveal-on-hover]")
        ?.getAttribute("data-reveal-on-hover-visible"),
    ).toBe("");
  });

  it("keeps the action mounted when visibility changes", async () => {
    const view = await render(
      <RevealOnHover>
        <span>Label</span>
        <RevealOnHover.Action>
          <button type="button">Copy</button>
        </RevealOnHover.Action>
      </RevealOnHover>,
    );
    const button = getButton(view.container, "Copy");

    await act(async () =>
      view.root.render(
        <RevealOnHover>
          <span>Label</span>
          <RevealOnHover.Action visible>
            <button type="button">Copy</button>
          </RevealOnHover.Action>
        </RevealOnHover>,
      ),
    );

    expect(getButton(view.container, "Copy")).toBe(button);
  });

  it("passes through Flex props to the root element", async () => {
    const { container } = await render(
      <RevealOnHover data-testid="hover-root" gap="md" justify="between">
        <span>Label</span>
        <RevealOnHover.Action>
          <button type="button">Copy</button>
        </RevealOnHover.Action>
      </RevealOnHover>,
    );

    const root = container.querySelector("[data-testid=hover-root]");
    expect(root).not.toBeNull();
    expect(root?.className).toContain("[column-gap:8px]");
    expect(root?.className).toContain("[justify-content:space-between]");
  });

  it("keeps an action button clickable", async () => {
    const onClick = vi.fn();
    const { container } = await render(
      <RevealOnHover>
        <span>Label</span>
        <RevealOnHover.Action>
          <button type="button" onClick={onClick}>
            Copy
          </button>
        </RevealOnHover.Action>
      </RevealOnHover>,
    );

    getButton(container, "Copy")?.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("supports multiple actions", async () => {
    const { container } = await render(
      <RevealOnHover>
        <span>Label</span>
        <RevealOnHover.Action>
          <button type="button">Copy</button>
        </RevealOnHover.Action>
        <RevealOnHover.Action>
          <button aria-label="Delete" type="button">
            Delete issue
          </button>
        </RevealOnHover.Action>
      </RevealOnHover>,
    );

    expect(getButton(container, "Copy")?.closest("[data-reveal-on-hover]")).toBeTruthy();
    expect(getButton(container, "Delete")?.closest("[data-reveal-on-hover]")).toBeTruthy();
  });

  it("keeps an action button keyboard focusable", async () => {
    const { container } = await render(
      <RevealOnHover>
        <span>Label</span>
        <RevealOnHover.Action>
          <button type="button">Copy</button>
        </RevealOnHover.Action>
      </RevealOnHover>,
    );
    const button = getButton(container, "Copy");

    button?.focus();
    expect(document.activeElement).toBe(button);
  });

  it("supports callback children for custom elements", async () => {
    const { container } = await render(
      <RevealOnHover>
        {({ className }) => (
          <div className={className} data-testid="custom-root">
            <span>Grid content</span>
            <RevealOnHover.Action>
              <button type="button">Copy</button>
            </RevealOnHover.Action>
          </div>
        )}
      </RevealOnHover>,
    );

    const root = container.querySelector("[data-testid=custom-root]");
    expect(root).not.toBeNull();
    expect(root?.textContent).toContain("Grid content");
    expect(root?.className).not.toBe("");
    expect(getButton(container, "Copy")?.closest("[data-reveal-on-hover]")).toBeTruthy();
  });

  it("keeps a callback-child action button clickable", async () => {
    const onClick = vi.fn();
    const { container } = await render(
      <RevealOnHover>
        {({ className }) => (
          <div className={className}>
            <span>Content</span>
            <RevealOnHover.Action>
              <button type="button" onClick={onClick}>
                Copy
              </button>
            </RevealOnHover.Action>
          </div>
        )}
      </RevealOnHover>,
    );

    getButton(container, "Copy")?.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
