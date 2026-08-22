import { act, createRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SplitPanel, type SplitPanelHandle } from "./split-panel";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const roots: Array<{ container: HTMLDivElement; root: Root }> = [];

class MutableMediaQueryList extends EventTarget implements MediaQueryList {
  onchange: ((this: MediaQueryList, event: MediaQueryListEvent) => void) | null = null;

  constructor(
    readonly media: string,
    private readonly getViewportWidth: () => number
  ) {
    super();
  }

  get matches() {
    const minimum = /min-width:\s*([\d.]+)px/.exec(this.media)?.[1];
    return minimum === undefined || this.getViewportWidth() >= Number(minimum);
  }

  addListener() {}
  removeListener() {}
}

async function render(ui: React.ReactNode) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push({ container, root });
  await act(async () => root.render(ui));
  return container;
}

function panel(props: Partial<React.ComponentProps<typeof SplitPanel>> = {}) {
  return <SplitPanel defaultSize={200} fill={<div>fill</div>} sized={<div>sized</div>} {...props} />;
}

function separator(container: ParentNode) {
  const element = container.querySelector<HTMLElement>('[role="separator"]');
  if (!element) throw new Error("Missing SplitPanel separator");
  return element;
}

function pointerEvent(type: string, clientX: number) {
  const event = new MouseEvent(type, { bubbles: true, button: 0, cancelable: true, clientX, clientY: 0 });
  Object.defineProperties(event, {
    isPrimary: { value: true },
    pointerId: { value: 1 },
    pointerType: { value: "touch" },
  });
  return event;
}

afterEach(async () => {
  for (const { container, root } of roots.splice(0)) {
    await act(async () => root.unmount());
    container.remove();
  }
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("SplitPanel", () => {
  it("renders both panes and a divider", async () => {
    const view = await render(panel());
    expect(view.textContent).toContain("sized"); expect(view.textContent).toContain("fill"); expect(separator(view)).toBeTruthy();
  });
  it("renders one pane without fill", async () => {
    const view = await render(panel({ fill: undefined }));
    expect(view.textContent).toContain("sized"); expect(view.querySelector('[role="separator"]')).toBeNull();
  });
  it("floors a seeded size", async () => {
    const view = await render(panel({ initialSize: -50, minSize: 100 })); expect(separator(view).getAttribute("aria-valuenow")).toBe("100");
  });
  it("preserves the sized pane when fill changes", async () => {
    const sized = <div>sized</div>;
    const view = await render(<SplitPanel defaultSize={200} fill={<div>fill</div>} sized={sized} />);
    const before = [...view.querySelectorAll("div")].find(element => element.children.length === 0 && element.textContent === "sized");
    const rendered = roots.at(-1);
    if (!before || !rendered) throw new Error("Missing sized pane");
    await act(async () => rendered.root.render(<SplitPanel defaultSize={200} sized={sized} />));
    const after = [...view.querySelectorAll("div")].find(element => element.children.length === 0 && element.textContent === "sized");
    expect(after).toBe(before);
  });
  it("orders end placement after fill", async () => {
    const view = await render(panel({ placement: "end" })); const text = view.textContent ?? ""; expect(text.indexOf("fill")).toBeLessThan(text.indexOf("sized"));
  });
  it("sets separator semantics", async () => {
    const view = await render(panel({ minSize: 100, maxSize: 600 })); const handle = separator(view); expect(handle.getAttribute("aria-orientation")).toBe("vertical"); expect(handle.getAttribute("aria-valuemin")).toBe("100"); expect(handle.getAttribute("aria-valuemax")).toBe("600"); expect(handle.getAttribute("tabindex")).toBe("0");
  });
  it("supports imperative setSize", async () => {
    const ref = createRef<SplitPanelHandle>(); const view = await render(<SplitPanel ref={ref} defaultSize={200} fill={<div>fill</div>} maxSize={600} minSize={100} sized={<div>sized</div>} />); await act(async () => ref.current?.setSize(350)); expect(separator(view).getAttribute("aria-valuenow")).toBe("350");
  });
  it("keeps the imperative setter stable and calls the latest resize callback", async () => {
    const firstOnResize = vi.fn();
    const secondOnResize = vi.fn();
    const ref = createRef<SplitPanelHandle>();
    const view = await render(<SplitPanel ref={ref} defaultSize={200} fill={<div>fill</div>} maxSize={600} minSize={100} onResize={firstOnResize} sized={<div>sized</div>} />);
    const rendered = roots.at(-1);
    const initialHandle = ref.current;
    if (!rendered || !initialHandle) throw new Error("Missing SplitPanel handle");
    const retainedSetSize = initialHandle.setSize;
    firstOnResize.mockClear();

    await act(async () => rendered.root.render(<SplitPanel ref={ref} defaultSize={200} fill={<div>fill</div>} maxSize={600} minSize={100} onResize={secondOnResize} sized={<div>sized</div>} />));

    expect(ref.current).toBe(initialHandle);
    expect(ref.current?.setSize).toBe(retainedSetSize);
    expect(firstOnResize).not.toHaveBeenCalled();
    expect(secondOnResize).not.toHaveBeenCalled();
    await act(async () => retainedSetSize(350, true));
    expect(firstOnResize).not.toHaveBeenCalled();
    expect(secondOnResize).toHaveBeenCalledOnce();
    expect(secondOnResize).toHaveBeenCalledWith(350);
    expect(separator(view).getAttribute("aria-valuenow")).toBe("350");
  });
  it("derives max from the container", async () => {
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(600); const view = await render(panel({ fillMinSize: 400, minSize: 100 })); expect(separator(view).getAttribute("aria-valuemax")).toBe("199");
  });
  it("does not clamp max below min", async () => {
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(50); const view = await render(panel({ minSize: 100 })); expect(separator(view).getAttribute("aria-valuemax")).toBe("100");
  });
  it("double click restores default", async () => {
    const onResizeEnd = vi.fn(); const view = await render(panel({ initialSize: 400, minSize: 100, onResizeEnd })); await act(async () => separator(view).dispatchEvent(new MouseEvent("dblclick", { bubbles: true }))); expect(separator(view).getAttribute("aria-valuenow")).toBe("200"); expect(onResizeEnd).toHaveBeenCalled();
  });
  it("reports clamped resize start", async () => { const onResizeEnd = vi.fn(); const view = await render(panel({ initialSize: -50, minSize: 100, onResizeEnd })); await act(async () => separator(view).dispatchEvent(new MouseEvent("dblclick", { bubbles: true }))); expect(onResizeEnd).toHaveBeenCalledWith({ direction: "increase", endSize: 200, startSize: 100 }); });
  it("uses arrows from the visible size", async () => { const view = await render(panel({ initialSize: -50, minSize: 100 })); await act(async () => separator(view).dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }))); expect(separator(view).getAttribute("aria-valuenow")).toBe("110"); });
  it("reports a clamped mount resize", async () => { const onResize = vi.fn(); await render(panel({ initialSize: -50, minSize: 100, onResize })); expect(onResize).toHaveBeenCalledWith(100); });
  it("ignores unbounded Home", async () => { const onResizeEnd = vi.fn(); const view = await render(panel({ placement: "end", minSize: 100, onResizeEnd })); await act(async () => separator(view).dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Home" }))); expect(onResizeEnd).not.toHaveBeenCalled(); });
  it("reports keyboard resize end", async () => { const onResizeEnd = vi.fn(); const view = await render(panel({ onResizeEnd })); await act(async () => separator(view).dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }))); expect(onResizeEnd).toHaveBeenCalledWith({ direction: "increase", endSize: 210, startSize: 200 }); });
  it("accepts pointer drag movement", async () => {
    const onResizeEnd = vi.fn();
    const view = await render(panel({ onResizeEnd }));
    const handle = separator(view);
    await act(async () => {
      handle.dispatchEvent(pointerEvent("pointerdown", 200));
      document.dispatchEvent(pointerEvent("pointermove", 150));
      document.dispatchEvent(pointerEvent("pointerup", 150));
    });
    expect(separator(view).getAttribute("aria-valuenow")).toBe("150");
    expect(onResizeEnd).toHaveBeenCalledWith({ direction: "decrease", endSize: 150, startSize: 200 });
  });
  it("inverts arrows for end placement", async () => { const view = await render(panel({ placement: "end" })); await act(async () => separator(view).dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }))); expect(separator(view).getAttribute("aria-valuenow")).toBe("190"); });
  it("does not report a resize end when reset is a no-op", async () => {
    const onResizeEnd = vi.fn();
    const view = await render(panel({ defaultSize: 200, initialSize: 200, onResizeEnd }));
    await act(async () => separator(view).dispatchEvent(new MouseEvent("dblclick", { bubbles: true })));
    expect(onResizeEnd).not.toHaveBeenCalled();
  });
  it("places Home and End at the correct bounds", async () => {
    const start = await render(panel({ maxSize: 400, minSize: 100 }));
    await act(async () => separator(start).dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "End" })));
    expect(separator(start).getAttribute("aria-valuenow")).toBe("400");
    const end = await render(panel({ maxSize: 400, minSize: 100, placement: "end" }));
    await act(async () => separator(end).dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "End" })));
    expect(separator(end).getAttribute("aria-valuenow")).toBe("100");
  });
  it("reseeds the initial size when placement changes the drawer direction", async () => {
    function Harness() {
      const [placement, setPlacement] = useState<"start" | "end">("start");
      return <><button onClick={() => setPlacement("end")}>Flip</button>{panel({ initialSize: 180, placement })}</>;
    }
    const view = await render(<Harness />);
    await act(async () => separator(view).dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" })));
    expect(separator(view).getAttribute("aria-valuenow")).toBe("190");
    const button = view.querySelector("button");
    if (!button) throw new Error("Missing direction control");
    await act(async () => button.click());
    expect(separator(view).getAttribute("aria-valuenow")).toBe("180");
  });
  it("reseeds the initial size when a responsive orientation changes direction", async () => {
    let viewportWidth = 500;
    const queries: MutableMediaQueryList[] = [];
    vi.stubGlobal("matchMedia", (query: string) => {
      const mediaQuery = new MutableMediaQueryList(query, () => viewportWidth);
      queries.push(mediaQuery);
      return mediaQuery;
    });
    const view = await render(panel({
      initialSize: 180,
      maxSize: 400,
      orientation: { zero: "vertical", "screen:lg": "horizontal" },
    }));
    const verticalSeparator = separator(view);
    expect(verticalSeparator.getAttribute("data-orientation")).toBe("vertical");
    await act(async () => verticalSeparator.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" })));
    expect(separator(view).getAttribute("aria-valuenow")).toBe("190");

    viewportWidth = 1200;
    await act(async () => {
      for (const query of queries) query.dispatchEvent(new Event("change"));
    });
    expect(separator(view).getAttribute("data-orientation")).toBe("horizontal");
    expect(separator(view).getAttribute("aria-valuenow")).toBe("180");
  });
});
