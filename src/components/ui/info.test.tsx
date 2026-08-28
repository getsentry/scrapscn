import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DisabledTip, InfoText, InfoTip } from "./info";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

class TestResizeObserver {
  constructor(private readonly callback: ResizeObserverCallback) {}
  disconnect() {}
  observe() {
    this.callback([], { disconnect() {}, observe() {}, unobserve() {} });
  }
  unobserve() {}
}

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

async function hover(element: Element) {
  await act(async () => {
    element.dispatchEvent(new MouseEvent("pointerover", { bubbles: true }));
    element.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    await vi.runAllTimersAsync();
  });
}

describe("Info", () => {
  let clientWidthDescriptor: PropertyDescriptor | undefined;
  let scrollWidthDescriptor: PropertyDescriptor | undefined;

  afterEach(async () => {
    for (const { element, root } of roots.splice(0)) {
      await act(async () => root.unmount());
      element.remove();
    }
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
    if (clientWidthDescriptor)
      Object.defineProperty(HTMLElement.prototype, "clientWidth", clientWidthDescriptor);
    else Reflect.deleteProperty(HTMLElement.prototype, "clientWidth");
    if (scrollWidthDescriptor)
      Object.defineProperty(HTMLElement.prototype, "scrollWidth", scrollWidthDescriptor);
    else Reflect.deleteProperty(HTMLElement.prototype, "scrollWidth");
    clientWidthDescriptor = undefined;
    scrollWidthDescriptor = undefined;
    document.body.replaceChildren();
  });

  function mockOverflow(scrollWidth: number, clientWidth: number) {
    clientWidthDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientWidth");
    scrollWidthDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollWidth");
    Object.defineProperties(HTMLElement.prototype, {
      clientWidth: { configurable: true, value: clientWidth },
      scrollWidth: { configurable: true, value: scrollWidth },
    });
  }

  it("keeps regular InfoText focusable and underlined", async () => {
    const host = await render(
      <InfoText className="consumer-class" title="Details">
        Issue owner
      </InfoText>,
    );
    const text = host.querySelector("span")!;
    expect(text.tabIndex).toBe(0);
    expect(text.className).toContain("consumer-class");
    expect(text.style.textDecoration).toContain("underline");
  });

  it("renders plain Text when the title is empty", async () => {
    const host = await render(<InfoText title={null}>Issue owner</InfoText>);
    const text = host.querySelector("span")!;
    expect(text.getAttribute("tabindex")).toBeNull();
    expect(text.getAttribute("aria-describedby")).toBeNull();
    expect(text.style.textDecoration).toBe("");
  });

  it("only enables overflow InfoText when it overflows", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("ResizeObserver", TestResizeObserver);
    mockOverflow(100, 50);
    const host = await render(
      <InfoText mode="overflowOnly" title="Details">
        Issue owner
      </InfoText>,
    );
    const text = host.querySelector("span")!;
    expect(text.tabIndex).toBe(0);
    expect(text.className).toContain("overflow-hidden");
    expect(text.style.textDecoration).toBe("");
    await hover(text);
    expect(document.querySelector('[role="tooltip"]')?.textContent).toContain("Details");
  });

  it("does not make overflow-only InfoText interactive without overflow", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("ResizeObserver", TestResizeObserver);
    mockOverflow(50, 100);
    const host = await render(
      <InfoText mode="overflowOnly" title="Details">
        Issue owner
      </InfoText>,
    );
    const text = host.querySelector("span")!;
    expect(text.getAttribute("tabindex")).toBeNull();
    expect(text.getAttribute("aria-describedby")).toBeNull();
    await hover(text);
    expect(document.querySelector('[role="tooltip"]')).toBeNull();
  });

  it("keeps regular ellipsis InfoText focusable", async () => {
    const host = await render(
      <InfoText ellipsis title="Details">
        Issue owner
      </InfoText>,
    );
    const text = host.querySelector("span")!;
    expect(text.tabIndex).toBe(0);
    expect(text.className).toContain("overflow-hidden");
  });

  it("renders exact question and locked icon paths with canonical labels", async () => {
    const host = await render(
      <>
        <InfoTip title="More details" />
        <DisabledTip size="xs" title="Locked" />
      </>,
    );
    const icons = host.querySelectorAll("svg");
    expect(host.querySelector('[aria-label="More information"]')).not.toBeNull();
    expect(host.querySelector('[aria-label="Disabled"]')).not.toBeNull();
    expect(icons[0]?.getAttribute("aria-hidden")).toBe("true");
    expect(icons[1]?.getAttribute("aria-hidden")).toBe("true");
    expect(icons[0]?.querySelector("path")?.getAttribute("d")).toContain("M8 0C12.42");
    expect(icons[1]?.getAttribute("width")).toBe("12px");
    expect(icons[1]?.querySelector("path")?.getAttribute("d")).toContain("M8 0C10.49");
  });
});
