import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Disclosure } from "./disclosure";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const roots: Array<{
  element: HTMLDivElement;
  root: ReturnType<typeof createRoot>;
}> = [];

async function render(element: React.ReactNode) {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  roots.push({ element: host, root });
  await act(async () => root.render(element));
  return host;
}

async function click(element: Element) {
  await act(async () => element.dispatchEvent(new MouseEvent("click", { bubbles: true })));
}

describe("Disclosure", () => {
  afterEach(async () => {
    for (const { element, root } of roots.splice(0)) {
      await act(async () => root.unmount());
      element.remove();
    }
    vi.restoreAllMocks();
  });

  it("renders collapsed by default and forwards a root ref", async () => {
    const ref = vi.fn();
    const host = await render(
      <Disclosure ref={ref}>
        <Disclosure.Title>Details</Disclosure.Title>
        <Disclosure.Content>Content</Disclosure.Content>
      </Disclosure>,
    );
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLDivElement));
    expect(host.querySelector("[role=group]")?.textContent).toBe("Content");
    expect(host.querySelector("button")?.getAttribute("aria-expanded")).toBe("false");
  });

  it("honors controlled and uncontrolled expansion", async () => {
    const controlled = await render(
      <Disclosure expanded={false}>
        <Disclosure.Title>Controlled</Disclosure.Title>
        <Disclosure.Content>Content</Disclosure.Content>
      </Disclosure>,
    );
    expect(controlled.querySelector("[role=group]")?.getAttribute("hidden")).toBe("until-found");
    const uncontrolled = await render(
      <Disclosure defaultExpanded={false}>
        <Disclosure.Title>Uncontrolled</Disclosure.Title>
        <Disclosure.Content>Content</Disclosure.Content>
      </Disclosure>,
    );
    expect(uncontrolled.querySelector("[role=group]")?.getAttribute("hidden")).toBe("until-found");
  });

  it("toggles from click and keyboard press and reports the next state", async () => {
    const onExpandedChange = vi.fn();
    const host = await render(
      <Disclosure onExpandedChange={onExpandedChange}>
        <Disclosure.Title>Toggle</Disclosure.Title>
        <Disclosure.Content>Content</Disclosure.Content>
      </Disclosure>,
    );
    const button = host.querySelector("button")!;
    await click(button);
    expect(onExpandedChange).toHaveBeenLastCalledWith(true);
    await act(async () =>
      button.dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          code: "Enter",
          key: "Enter",
        }),
      ),
    );
    expect(onExpandedChange).toHaveBeenLastCalledWith(false);
  });

  it("keeps slots, outline panel geometry, and title row spacing", async () => {
    const host = await render(
      <Disclosure defaultExpanded variant="outline" size="sm">
        <Disclosure.Title leadingItems={<span>Leading</span>} trailingItems={<span>Trailing</span>}>
          Title
        </Disclosure.Title>
        <Disclosure.Content>Content</Disclosure.Content>
      </Disclosure>,
    );
    const button = host.querySelector("button")!;
    const panel = host.querySelector("[role=group]")!;
    expect(host.textContent).toContain("Leading");
    expect(host.textContent).toContain("Trailing");
    expect(button.disabled).toBe(false);
    expect(button.parentElement?.className).toContain("pl-1");
    expect(panel.className).toContain("[border-top-left-radius:8px]");
    expect(panel.className).toContain("[padding-top:8px]");
    await click(button);
    expect(panel.getAttribute("aria-hidden")).toBe("true");
  });

  it("uses the canonical chevron path and orientation", async () => {
    const host = await render(
      <Disclosure defaultExpanded={false}>
        <Disclosure.Title>Title</Disclosure.Title>
        <Disclosure.Content>Content</Disclosure.Content>
      </Disclosure>,
    );
    const icon = host.querySelector("svg")!;
    expect(icon.className.baseVal).toContain("rotate-90");
    expect(icon.querySelector("path")?.getAttribute("d")).toContain("M8 5C8.21 5");
    await click(host.querySelector("button")!);
    expect(icon.className.baseVal).toContain("rotate-180");
  });
});
