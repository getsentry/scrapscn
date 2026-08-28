import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DragHandle } from "./drag-handle";
import { useDragMove } from "./use-drag-move";
import { useDragSeparator } from "./use-drag-separator";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

const mountedRoots: Array<{ container: HTMLDivElement; root: Root }> = [];

async function render(ui: React.ReactNode) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  mountedRoots.push({ container, root });
  await act(async () => root.render(ui));
  return { container, root };
}

function findElement(container: ParentNode, testId: string) {
  const element = container.querySelector<HTMLElement>(`[data-testid="${testId}"]`);
  if (!element) throw new Error(`Missing ${testId}`);
  return element;
}

function dispatchPointer(
  element: EventTarget,
  type: string,
  { clientX, clientY, pointerId = 1 }: { clientX: number; clientY: number; pointerId?: number },
) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperties(event, {
    button: { value: 0 },
    clientX: { value: clientX },
    clientY: { value: clientY },
    pageX: { value: clientX },
    pageY: { value: clientY },
    pointerId: { value: pointerId },
    pointerType: { value: "mouse" },
  });
  element.dispatchEvent(event);
}

afterEach(async () => {
  for (const { container, root } of mountedRoots.splice(0)) {
    await act(async () => root.unmount());
    container.remove();
  }
  document.body.style.pointerEvents = "";
  document.body.style.userSelect = "";
  document.documentElement.style.cursor = "";
  vi.restoreAllMocks();
});

describe("useDragMove", () => {
  it("moves only on the active pointer axis and releases document dragging", async () => {
    const events: string[] = [];
    function TestHandle() {
      const { moveProps } = useDragMove({
        onMove: (delta) => events.push(`move:${delta}`),
        onMoveEnd: () => events.push("end"),
        onMoveStart: () => events.push("start"),
        orientation: "horizontal",
      });
      return <div {...moveProps} data-testid="handle" tabIndex={0} />;
    }
    const view = await render(<TestHandle />);
    const handle = findElement(view.container, "handle");

    await act(async () => {
      dispatchPointer(handle, "pointerdown", { clientX: 100, clientY: 20 });
      dispatchPointer(window, "pointermove", { clientX: 100, clientY: 80 });
      dispatchPointer(window, "pointermove", { clientX: 160, clientY: 80 });
      dispatchPointer(window, "pointerup", { clientX: 160, clientY: 80 });
    });

    expect(events).toEqual(["start", "move:60", "end"]);
    expect(document.body.style.pointerEvents).toBe("");
    expect(document.body.style.userSelect).toBe("");
    expect(document.documentElement.style.cursor).toBe("");
  });

  it("uses ten-pixel arrow steps, fifty-pixel shift steps, and ignores cross-axis keys", async () => {
    const events: string[] = [];
    function TestHandle() {
      const { moveProps } = useDragMove({
        onMove: (delta) => events.push(`move:${delta}`),
        onMoveEnd: () => events.push("end"),
        onMoveStart: () => events.push("start"),
        orientation: "vertical",
      });
      return <div {...moveProps} data-testid="handle" tabIndex={0} />;
    }
    const view = await render(<TestHandle />);
    const handle = findElement(view.container, "handle");

    await act(async () => {
      handle.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));
      handle.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));
      handle.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: "ArrowDown" }));
      handle.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, key: "ArrowUp", shiftKey: true }),
      );
      handle.dispatchEvent(
        new KeyboardEvent("keyup", { bubbles: true, key: "ArrowUp", shiftKey: true }),
      );
    });

    expect(events).toEqual(["start", "move:10", "end", "start", "move:-50", "end"]);
  });

  it("restores document dragging when unmounted during a pointer drag", async () => {
    function TestHandle() {
      const { moveProps } = useDragMove({ onMove: () => {}, orientation: "horizontal" });
      return <div {...moveProps} data-testid="handle" />;
    }
    const view = await render(<TestHandle />);
    await act(async () => {
      dispatchPointer(findElement(view.container, "handle"), "pointerdown", {
        clientX: 0,
        clientY: 0,
      });
      dispatchPointer(window, "pointermove", { clientX: 1, clientY: 0 });
    });
    expect(document.body.style.pointerEvents).toBe("none");
    await act(async () => view.root.unmount());
    expect(document.body.style.pointerEvents).toBe("");
  });
});

describe("useDragSeparator", () => {
  it.each([
    { orientation: "horizontal" as const, isSizedFirst: true, value: 120, expected: "ew-resize" },
    { orientation: "horizontal" as const, isSizedFirst: true, value: 50, expected: "e-resize" },
    { orientation: "horizontal" as const, isSizedFirst: true, value: 200, expected: "w-resize" },
    { orientation: "horizontal" as const, isSizedFirst: false, value: 50, expected: "w-resize" },
    { orientation: "horizontal" as const, isSizedFirst: false, value: 200, expected: "e-resize" },
    { orientation: "vertical" as const, isSizedFirst: true, value: 120, expected: "ns-resize" },
    { orientation: "vertical" as const, isSizedFirst: true, value: 50, expected: "s-resize" },
    { orientation: "vertical" as const, isSizedFirst: true, value: 200, expected: "n-resize" },
    { orientation: "vertical" as const, isSizedFirst: false, value: 50, expected: "n-resize" },
    { orientation: "vertical" as const, isSizedFirst: false, value: 200, expected: "s-resize" },
  ])(
    "uses $expected at the $orientation bound for isSizedFirst=$isSizedFirst",
    async ({ expected, isSizedFirst, orientation, value }) => {
      function TestSeparator() {
        const { cursor, separatorProps } = useDragSeparator({
          isSizedFirst,
          max: 200,
          min: 50,
          onMove: () => {},
          orientation,
          value,
        });
        return <div {...separatorProps} data-cursor={cursor} data-testid="separator" />;
      }
      const view = await render(<TestSeparator />);
      expect(findElement(view.container, "separator").getAttribute("data-cursor")).toBe(expected);
    },
  );

  it("exposes focusable inverted separator semantics and finite values", async () => {
    function TestSeparator({
      isSizedFirst = true,
      max = 200,
      min = 50,
      value = 50,
    }: {
      isSizedFirst?: boolean;
      max?: number;
      min?: number;
      value?: number;
    }) {
      const { cursor, separatorProps } = useDragSeparator({
        isSizedFirst,
        max,
        min,
        onMove: () => {},
        orientation: "horizontal",
        value,
      });
      return (
        <div {...separatorProps} aria-label="Resize" data-cursor={cursor} data-testid="separator" />
      );
    }
    const view = await render(<TestSeparator isSizedFirst={false} />);
    const separator = findElement(view.container, "separator");
    expect(separator.getAttribute("role")).toBe("separator");
    expect(separator.getAttribute("tabindex")).toBe("0");
    expect(separator.getAttribute("aria-orientation")).toBe("vertical");
    expect(separator.getAttribute("aria-valuemin")).toBe("50");
    expect(separator.getAttribute("aria-valuemax")).toBe("200");
    expect(separator.getAttribute("aria-valuenow")).toBe("50");
    expect(separator.getAttribute("data-cursor")).toBe("w-resize");
  });

  it("omits only an unmeasured value and an infinite upper bound", async () => {
    function TestSeparator({ min, value }: { min?: number; value?: number }) {
      const { separatorProps } = useDragSeparator({
        isSizedFirst: true,
        max: Infinity,
        min,
        onMove: () => {},
        orientation: "vertical",
        value,
      });
      return <div {...separatorProps} aria-label="Resize" data-testid="separator" />;
    }
    const view = await render(<TestSeparator min={0} value={0} />);
    const separator = findElement(view.container, "separator");
    expect(separator.getAttribute("aria-valuemin")).toBe("0");
    expect(separator.hasAttribute("aria-valuemax")).toBe(false);
    expect(separator.getAttribute("aria-valuenow")).toBe("0");
    expect(separator.getAttribute("aria-orientation")).toBe("horizontal");

    await act(async () => view.root.render(<TestSeparator />));
    expect(separator.hasAttribute("aria-valuemin")).toBe(false);
    expect(separator.hasAttribute("aria-valuenow")).toBe(false);
  });
});

describe("DragHandle", () => {
  it("merges keyboard and double-click callbacks with drag behavior", async () => {
    const events: string[] = [];
    const view = await render(
      <DragHandle
        aria-label="Resize panes"
        isSizedFirst
        max={200}
        min={50}
        orientation="horizontal"
        value={120}
        onDoubleClick={() => events.push("double")}
        onKeyDown={() => events.push("key")}
        onMove={(delta) => events.push(`move:${delta}`)}
        onMoveEnd={() => events.push("end")}
        onMoveStart={() => events.push("start")}
      />,
    );
    const handle = view.container.querySelector<HTMLElement>("[role=separator]");
    if (!handle) throw new Error("Missing drag handle");

    await act(async () => {
      handle.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));
      handle.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: "ArrowRight" }));
      handle.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    });

    expect(handle.getAttribute("aria-label")).toBe("Resize panes");
    expect(events).toEqual(["start", "move:10", "end", "key", "double"]);
  });
});
