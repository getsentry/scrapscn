import { act, createRef, type RefObject } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Tooltip, TooltipContext } from "./tooltip";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

class TestResizeObserver implements ResizeObserver {
  static instances = new Set<TestResizeObserver>();
  readonly observedElements = new Set<Element>();

  constructor(private readonly callback: ResizeObserverCallback) {
    TestResizeObserver.instances.add(this);
  }

  disconnect() {
    TestResizeObserver.instances.delete(this);
  }
  observe(element: Element) {
    this.observedElements.add(element);
  }
  unobserve(element: Element) {
    this.observedElements.delete(element);
  }

  static notify() {
    for (const instance of [...TestResizeObserver.instances]) {
      instance.callback(
        [],
        {
          disconnect() {},
          observe() {},
          unobserve() {},
        }
      );
    }
  }
}

async function render(element: React.ReactNode) {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  await act(async () => root.render(element));
  return { host, root };
}

async function rerender(root: Root, element: React.ReactNode) {
  await act(async () => root.render(element));
}

async function hover(element: Element) {
  await act(async () => {
    const pointerOver = new MouseEvent("pointerover", { bubbles: true });
    Object.defineProperty(pointerOver, "pointerType", { value: "mouse" });
    element.dispatchEvent(pointerOver);
    element.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
  });
  await act(async () => {
    await vi.runAllTimersAsync();
  });
}

async function unhover(element: Element) {
  await act(async () => {
    element.dispatchEvent(new MouseEvent("pointerout", { bubbles: true }));
    element.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
  });
}

describe("Tooltip", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("ResizeObserver", TestResizeObserver);
    TestResizeObserver.instances.clear();
  });

  afterEach(async () => {
    await act(async () => vi.runAllTimersAsync());
    document.body.replaceChildren();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("merges a skipped trigger ref and handlers, then renders the positioned arrow", async () => {
    const triggerRef = createRef<HTMLButtonElement>();
    const onPointerEnter = vi.fn();
    const { root } = await render(
      <Tooltip delay={0} skipWrapper title="Helpful text">
        <button onPointerEnter={onPointerEnter} ref={triggerRef} type="button">
          Trigger
        </button>
      </Tooltip>
    );

    const trigger = triggerRef.current;
    expect(trigger).not.toBeNull();
    await hover(trigger!);

    expect(onPointerEnter).toHaveBeenCalledOnce();
    expect(document.querySelector('[role="tooltip"]')).not.toBeNull();
    expect(document.querySelector('[role="tooltip"] svg')).not.toBeNull();
    expect(
      document.querySelector('[data-tooltip-positioner]')?.hasAttribute("data-side")
    ).toBe(true);

    await act(async () => root.unmount());
  });

  it("detects recursive logical overflow and closes after an observed mutation", async () => {
    const onOverflowChange = vi.fn();
    const { root } = await render(
      <Tooltip
        delay={0}
        onOverflowChange={onOverflowChange}
        showOnlyOnOverflow
        title="Overflow details"
      >
        <span>
          Label <span data-overflowing="true">truncated value</span>
        </span>
      </Tooltip>
    );

    const logicalOverflow = document.querySelector("[data-overflowing]");
    const trigger = logicalOverflow?.parentElement;
    expect(trigger).not.toBeNull();
    await hover(trigger!);
    expect(document.querySelector('[role="tooltip"]')).not.toBeNull();
    expect(onOverflowChange).toHaveBeenLastCalledWith(true);

    logicalOverflow?.setAttribute("data-overflowing", "false");
    await act(async () => {
      await Promise.resolve();
      TestResizeObserver.notify();
    });
    await act(async () => vi.runAllTimersAsync());

    expect(trigger!.getAttribute("aria-describedby")).toBeNull();
    expect(onOverflowChange).toHaveBeenLastCalledWith(false);
    await act(async () => root.unmount());
  });

  it("uses fresh callbacks without refiring the current state on rerender", async () => {
    const firstHover = vi.fn();
    const secondHover = vi.fn();
    const triggerRef: RefObject<HTMLButtonElement | null> = createRef();
    const { root } = await render(
      <Tooltip delay={0} onHover={firstHover} skipWrapper title="Title">
        <button ref={triggerRef} type="button">Trigger</button>
      </Tooltip>
    );

    await rerender(
      root,
      <Tooltip delay={0} onHover={secondHover} skipWrapper title="Title">
        <button ref={triggerRef} type="button">Trigger</button>
      </Tooltip>
    );
    await hover(triggerRef.current!);

    expect(firstHover).not.toHaveBeenCalled();
    expect(secondHover).toHaveBeenCalledOnce();
    await rerender(
      root,
      <Tooltip delay={0} onHover={() => secondHover()} skipWrapper title="Title">
        <button ref={triggerRef} type="button">Trigger</button>
      </Tooltip>
    );
    expect(secondHover).toHaveBeenCalledOnce();
    await act(async () => root.unmount());
  });

  it("warms the shared delay group and lets a sibling open without a second delay", async () => {
    const { root } = await render(
      <div>
        <Tooltip delay={400} displayTimeout={150} title="First details">
          <button type="button">First</button>
        </Tooltip>
        <Tooltip delay={400} displayTimeout={150} title="Second details">
          <button type="button">Second</button>
        </Tooltip>
      </div>
    );

    const first = document.querySelector("button");
    const second = document.querySelectorAll("button")[1];
    expect(first).not.toBeNull();
    expect(second).not.toBeUndefined();
    await act(async () => {
      const event = new MouseEvent("pointerover", { bubbles: true });
      Object.defineProperty(event, "pointerType", { value: "mouse" });
      first!.dispatchEvent(event);
    });
    await act(async () => vi.advanceTimersByTimeAsync(399));
    expect(document.querySelector('[role="tooltip"]')).toBeNull();
    await act(async () => vi.advanceTimersByTimeAsync(1));
    expect(document.querySelector('[role="tooltip"]')?.textContent).toContain("First details");

    await unhover(first!);
    await act(async () => vi.advanceTimersByTimeAsync(150));
    await act(async () => {
      const event = new MouseEvent("pointerover", { bubbles: true });
      Object.defineProperty(event, "pointerType", { value: "mouse" });
      second!.dispatchEvent(event);
    });
    expect(
      [...document.querySelectorAll('[role="tooltip"]')].some((element) =>
        element.textContent?.includes("Second details")
      )
    ).toBe(true);
    await act(async () => root.unmount());
  });

  it("portals to TooltipContext and stops interaction events from reaching an ancestor", async () => {
    const portalHost = document.createElement("div");
    document.body.append(portalHost);
    const onClick = vi.fn();
    const onMouseDown = vi.fn();
    const onPointerDown = vi.fn();
    const { root } = await render(
      <button
        onClick={onClick}
        onMouseDown={onMouseDown}
        onPointerDown={onPointerDown}
        type="button"
      >
        <TooltipContext.Provider value={{ container: portalHost }}>
          <Tooltip forceVisible isHoverable title={<button type="button">Copy</button>}>
            Trigger
          </Tooltip>
        </TooltipContext.Provider>
      </button>
    );

    const copyButton = portalHost.querySelector("button");
    expect(copyButton).not.toBeNull();
    await act(async () => {
      copyButton!.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
      copyButton!.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      copyButton!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(onPointerDown).not.toHaveBeenCalled();
    expect(onMouseDown).not.toHaveBeenCalled();
    expect(onClick).not.toHaveBeenCalled();
    await act(async () => root.unmount());
  });

  it("keeps a hoverable tooltip open while the pointer moves from trigger to popup", async () => {
    const onBlur = vi.fn();
    const { root } = await render(
      <Tooltip delay={0} displayTimeout={150} isHoverable onBlur={onBlur} title="Interactive details">
        <button type="button">Trigger</button>
      </Tooltip>
    );

    const trigger = document.querySelector("button");
    expect(trigger).not.toBeNull();
    await hover(trigger!);
    await unhover(trigger!);
    await act(async () => vi.advanceTimersByTimeAsync(100));
    const positioner = document.querySelector("[data-tooltip-positioner]");
    expect(positioner).not.toBeNull();
    await act(async () => {
      positioner!.dispatchEvent(new MouseEvent("pointerover", { bubbles: true }));
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(onBlur).not.toHaveBeenCalled();
    expect(document.querySelector('[role="tooltip"]')).not.toBeNull();

    await act(async () => {
      positioner!.dispatchEvent(new MouseEvent("pointerout", { bubbles: true }));
      await vi.advanceTimersByTimeAsync(150);
    });
    expect(onBlur).toHaveBeenCalledOnce();
    await act(async () => root.unmount());
  });

  it("applies SerializedStyles to the tooltip at runtime", async () => {
    const { root } = await render(
      <Tooltip
        forceVisible
        overlayStyle={{
          name: "tooltip-override",
          styles: "background-color:rgb(12, 34, 56);color:rgb(240, 241, 242);",
        }}
        title="Styled details"
      >
        Trigger
      </Tooltip>
    );

    const tooltip = document.querySelector<HTMLElement>('[role="tooltip"]');
    expect(tooltip).not.toBeNull();
    expect(getComputedStyle(tooltip!).backgroundColor).toBe("rgb(12, 34, 56)");
    expect(getComputedStyle(tooltip!).color).toBe("rgb(240, 241, 242)");
    await act(async () => root.unmount());
  });

  it.each([
    ["auto", "center"],
    ["auto-start", "start"],
    ["auto-end", "end"],
  ] as const)("selects the available side for %s", async (position, align) => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (
      this: HTMLElement
    ) {
      if (this.getAttribute("data-auto-anchor") === "true") {
        return DOMRect.fromRect({ height: 20, width: 20, x: 20, y: 390 });
      }
      return DOMRect.fromRect();
    });
    vi.stubGlobal("innerWidth", 1000);
    vi.stubGlobal("innerHeight", 800);
    const { root } = await render(
      <Tooltip forceVisible position={position} skipWrapper title="Automatic placement">
        <button data-auto-anchor="true" type="button">Trigger</button>
      </Tooltip>
    );
    await act(async () => Promise.resolve());

    const tooltip = document.querySelector('[role="tooltip"]');
    const positioner = document.querySelector("[data-tooltip-positioner]");
    expect(tooltip).not.toBeNull();
    expect(positioner?.getAttribute("data-requested-side")).toBe("right");
    expect(positioner?.getAttribute("data-requested-align")).toBe(align);
    await act(async () => root.unmount());
  });

  it("ranks automatic sides by the measured popup overflow and updates after content resizes", async () => {
    let popupWidth = 600;
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (
      this: HTMLElement
    ) {
      if (this.getAttribute("data-auto-anchor") === "true") {
        return DOMRect.fromRect({ height: 20, width: 20, x: 300, y: 250 });
      }
      if (this.hasAttribute("data-tooltip")) {
        return DOMRect.fromRect({ height: 50, width: popupWidth });
      }
      return DOMRect.fromRect();
    });
    vi.stubGlobal("innerWidth", 800);
    vi.stubGlobal("innerHeight", 600);
    const tooltip = (title: string) => (
      <Tooltip forceVisible offset={8} position="auto" skipWrapper title={title}>
        <button data-auto-anchor="true" type="button">Trigger</button>
      </Tooltip>
    );
    const { root } = await render(tooltip("A wide tooltip"));
    const popup = document.querySelector<HTMLElement>("[data-tooltip]");
    const requestedSide = () =>
      document
        .querySelector("[data-tooltip-positioner]")
        ?.getAttribute("data-requested-side");

    expect(popup).not.toBeNull();
    expect(requestedSide()).toBe("bottom");
    expect(
      [...TestResizeObserver.instances].some((observer) =>
        observer.observedElements.has(popup!)
      )
    ).toBe(true);

    popupWidth = 100;
    await rerender(root, tooltip("Short"));
    expect(requestedSide()).toBe("right");

    popupWidth = 600;
    await act(async () => TestResizeObserver.notify());
    expect(requestedSide()).toBe("bottom");
    await act(async () => root.unmount());
    expect(TestResizeObserver.instances.size).toBe(0);
  });

  it("recomputes automatic placement after viewport, movement, and trigger-size updates", async () => {
    let anchorRect = DOMRect.fromRect({ height: 20, width: 20, x: 20, y: 390 });
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (
      this: HTMLElement
    ) {
      return this.getAttribute("data-auto-anchor") === "true"
        ? anchorRect
        : DOMRect.fromRect();
    });
    vi.stubGlobal("innerWidth", 1000);
    vi.stubGlobal("innerHeight", 800);
    const { root } = await render(
      <Tooltip forceVisible position="auto" skipWrapper title="Automatic placement">
        <button data-auto-anchor="true" type="button">Trigger</button>
      </Tooltip>
    );
    const requestedSide = () =>
      document
        .querySelector("[data-tooltip-positioner]")
        ?.getAttribute("data-requested-side");
    expect(requestedSide()).toBe("right");

    await act(async () => {
      vi.stubGlobal("innerHeight", 1600);
      window.dispatchEvent(new Event("resize"));
    });
    expect(requestedSide()).toBe("bottom");

    await act(async () => {
      anchorRect = DOMRect.fromRect({ height: 20, width: 20, x: 200, y: 1500 });
      document.dispatchEvent(new Event("scroll"));
    });
    expect(requestedSide()).toBe("top");

    await act(async () => {
      vi.stubGlobal("innerHeight", 800);
      anchorRect = DOMRect.fromRect({ height: 80, width: 80, x: 900, y: 390 });
      TestResizeObserver.notify();
    });
    expect(requestedSide()).toBe("left");
    await act(async () => root.unmount());
  });

  it("makes an exiting positioner inert before its motion completes", async () => {
    const onHover = vi.fn();
    const { root } = await render(
      <Tooltip delay={0} displayTimeout={0} isHoverable onHover={onHover} title="Exiting details">
        <button type="button">Trigger</button>
      </Tooltip>
    );
    const trigger = document.querySelector("button");
    expect(trigger).not.toBeNull();
    await hover(trigger!);
    expect(onHover).toHaveBeenCalledOnce();

    await unhover(trigger!);
    await act(async () => vi.advanceTimersByTimeAsync(0));
    const positioner = document.querySelector<HTMLElement>("[data-tooltip-positioner]");
    expect(positioner).not.toBeNull();
    expect(positioner!.style.pointerEvents).toBe("none");

    await act(async () => {
      const event = new MouseEvent("pointerover", { bubbles: true });
      Object.defineProperty(event, "pointerType", { value: "mouse" });
      positioner!.dispatchEvent(event);
    });
    expect(onHover).toHaveBeenCalledOnce();
    expect(positioner!.style.pointerEvents).toBe("none");
    await act(async () => root.unmount());
  });

  it("uses and cleans up the trigger document realm for automatic placement", async () => {
    const iframe = document.createElement("iframe");
    document.body.append(iframe);
    const ownerWindow = iframe.contentWindow! as Window & typeof globalThis;
    const ownerDocument = iframe.contentDocument!;
    const activeResizeListeners = new Set<EventListenerOrEventListenerObject>();
    const disconnectedResizeObservers = vi.fn();
    const disconnectedIntersectionObservers = vi.fn();

    class RealmResizeObserver {
      disconnect = disconnectedResizeObservers;
      observe() {}
      unobserve() {}
    }
    class RealmIntersectionObserver {
      disconnect = disconnectedIntersectionObservers;
      observe() {}
      takeRecords() {
        return [];
      }
      unobserve() {}
      readonly root = null;
      readonly rootMargin = "0px";
      readonly thresholds = [0, 1];
    }
    Object.defineProperty(ownerWindow, "ResizeObserver", {
      configurable: true,
      value: RealmResizeObserver,
    });
    Object.defineProperty(ownerWindow, "IntersectionObserver", {
      configurable: true,
      value: RealmIntersectionObserver,
    });
    Object.defineProperty(ownerWindow, "innerWidth", {
      configurable: true,
      value: 300,
    });
    Object.defineProperty(ownerWindow, "innerHeight", {
      configurable: true,
      value: 800,
    });
    vi.stubGlobal("innerWidth", 1200);
    vi.stubGlobal("innerHeight", 800);
    vi.spyOn(ownerWindow.HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function (this: HTMLElement) {
        return this.getAttribute("data-auto-anchor") === "true"
          ? DOMRect.fromRect({ height: 20, width: 20, x: 20, y: 390 })
          : DOMRect.fromRect();
      }
    );
    const addEventListener = ownerWindow.addEventListener.bind(ownerWindow);
    const removeEventListener = ownerWindow.removeEventListener.bind(ownerWindow);
    vi.spyOn(ownerWindow, "addEventListener").mockImplementation(
      (type, listener, options) => {
        if (type === "resize") activeResizeListeners.add(listener);
        addEventListener(type, listener, options);
      }
    );
    vi.spyOn(ownerWindow, "removeEventListener").mockImplementation(
      (type, listener, options) => {
        if (type === "resize") activeResizeListeners.delete(listener);
        removeEventListener(type, listener, options);
      }
    );

    const host = ownerDocument.createElement("div");
    ownerDocument.body.append(host);
    const root = createRoot(host);
    await act(async () => {
      root.render(
        <Tooltip forceVisible position="auto" skipWrapper title="Realm placement">
          <button data-auto-anchor="true" type="button">Trigger</button>
        </Tooltip>
      );
    });
    const requestedSide = () =>
      (ownerDocument.querySelector("[data-tooltip-positioner]") ??
        document.querySelector("[data-tooltip-positioner]"))?.getAttribute(
        "data-requested-side"
      );
    expect(requestedSide()).toBe("bottom");

    Object.defineProperty(ownerWindow, "innerWidth", {
      configurable: true,
      value: 1200,
    });
    await act(async () => ownerWindow.dispatchEvent(new Event("resize")));
    expect(requestedSide()).toBe("right");

    Object.defineProperty(ownerWindow, "innerWidth", {
      configurable: true,
      value: 300,
    });
    await act(async () => window.dispatchEvent(new Event("resize")));
    expect(requestedSide()).toBe("right");
    await act(async () => ownerWindow.dispatchEvent(new Event("resize")));
    expect(requestedSide()).toBe("bottom");

    await act(async () => root.unmount());
    expect(disconnectedResizeObservers).toHaveBeenCalled();
    expect(disconnectedIntersectionObservers).toHaveBeenCalled();
    expect(activeResizeListeners.size).toBe(0);
    iframe.remove();
  });

  it("portals into a plain DocumentFragment", async () => {
    const fragment = document.createDocumentFragment();
    const { root } = await render(
      <TooltipContext.Provider value={{ container: fragment }}>
        <Tooltip forceVisible title="Fragment details">Trigger</Tooltip>
      </TooltipContext.Provider>
    );

    expect(fragment.querySelector('[role="tooltip"]')?.textContent ?? "").toContain("Fragment details");
    expect(document.body.querySelector('[role="tooltip"]')).toBeNull();
    await act(async () => root.unmount());
  });
});
