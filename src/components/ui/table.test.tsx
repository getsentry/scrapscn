import { act, createRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { COL_WIDTH_UNDEFINED, Table, type TableColumnConfig } from "./table";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const roots: Array<{ container: HTMLDivElement; root: Root }> = [];
const columns: TableColumnConfig[] = [{ key: "name", width: 200 }, { key: "count", width: 150 }, { key: "age" }];

async function render(ui: React.ReactNode) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push({ container, root });
  await act(async () => root.render(ui));
  return { container, root };
}

function TestTable({ columns: configured = columns, ...props }: Partial<React.ComponentProps<typeof Table>>) {
  return <Table columns={configured} {...props}><Table.Head><Table.Row>{configured.map((column) => <Table.HeadCell column={column.key} key={column.key}>{column.key}</Table.HeadCell>)}</Table.Row></Table.Head><Table.Body><Table.Row divider>{configured.map((column) => <Table.Cell key={column.key}>{column.key}-value</Table.Cell>)}</Table.Row></Table.Body></Table>;
}

function table(container: ParentNode) {
  const element = container.querySelector<HTMLTableElement>("table");
  if (!element) throw new Error("Missing table");
  return element;
}

function separators(container: ParentNode) {
  return [...container.querySelectorAll<HTMLElement>('[role="separator"]')];
}

function keyboard(element: HTMLElement, key: string, shiftKey = false) {
  element.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key, shiftKey }));
  element.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key, shiftKey }));
}

function pointer(element: EventTarget, type: string, x: number, button = 0) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperties(event, { button: { value: button }, clientX: { value: x }, clientY: { value: 0 }, pageX: { value: x }, pageY: { value: 0 }, pointerId: { value: 1 }, pointerType: { value: "mouse" } });
  element.dispatchEvent(event);
}

async function drag(element: HTMLElement, from: number, to: number, release = true, button = 0) {
  await act(async () => {
    pointer(element, "pointerdown", from, button);
    pointer(window, "pointermove", to, button);
    if (release) pointer(window, "pointerup", to, button);
  });
}

afterEach(async () => {
  for (const mounted of roots.splice(0)) {
    await act(async () => mounted.root.unmount());
    mounted.container.remove();
  }
  vi.restoreAllMocks();
});

describe("Table", () => {
  it("renders canonical table semantics", async () => {
    const view = await render(<TestTable />);
    expect(view.container.querySelectorAll('[role="columnheader"]')).toHaveLength(3);
    expect(view.container.querySelectorAll('[role="row"]')).toHaveLength(2);
    expect(view.container.querySelectorAll('[role="cell"]')).toHaveLength(3);
  });

  it.each([
    { configured: columns, expected: "200px 150px minmax(90px, auto)" },
    { configured: [{ key: "a", width: 10 }, { key: "b" }], expected: "90px minmax(90px, auto)" },
    { configured: [{ key: "a", width: "min-content" }, { key: "b" }], expected: "min-content minmax(90px, auto)" },
  ])("resolves canonical column tracks", async ({ configured, expected }) => {
    const view = await render(<TestTable columns={configured} />);
    expect(table(view.container).style.gridTemplateColumns).toBe(expected);
  });

  it("pins the final column and prepends tracks", async () => {
    const view = await render(<TestTable flexibleLastColumn={false} prependColumnWidths={["40px", "min-content"]} />);
    expect(table(view.container).style.gridTemplateColumns).toBe("40px min-content 200px 150px minmax(90px, auto)");
  });

  it("pins a declared final width when flexibility is disabled", async () => {
    const configured = [{ key: "a", width: 200 }, { key: "b", width: 150 }];
    const view = await render(<TestTable columns={configured} flexibleLastColumn={false} />);
    expect(table(view.container).style.gridTemplateColumns).toBe("200px 150px");
  });

  it("uses a caller-defined minimum for automatic and undersized tracks", async () => {
    const view = await render(<TestTable columns={[{ key: "a", width: 20 }, { key: "b" }]} minimumColumnWidth={120} />);
    expect(table(view.container).style.gridTemplateColumns).toBe("120px minmax(120px, auto)");
  });

  it("treats a non-finite comparable width like the pinned implementation", async () => {
    const view = await render(<TestTable columns={[{ key: "a", width: Number.NaN }, { key: "b" }]} />);
    expect(table(view.container).style.gridTemplateColumns).toBe("90px minmax(90px, auto)");
  });

  it("leaves consumer tracks untouched without column metadata", async () => {
    const view = await render(<Table style={{ gridTemplateColumns: "1fr 2fr" }}><Table.StatusBody>No results</Table.StatusBody></Table>);
    expect(table(view.container).style.gridTemplateColumns).toBe("1fr 2fr");
    expect(view.container.querySelector('[role="cell"]')?.textContent).toBe("No results");
  });

  it("shows handles only for resizable non-final columns", async () => {
    const view = await render(<TestTable columns={[{ key: "a" }, { key: "b", resizable: false }, { key: "c" }]} />);
    expect(separators(view.container)).toHaveLength(1);
  });

  it("exposes named keyboard separators with observed CSS geometry", async () => {
    vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(150);
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(45);
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(900);
    const view = await render(<TestTable />);
    const handle = separators(view.container)[0];
    if (!handle) throw new Error("Missing separator");
    expect(handle.getAttribute("aria-orientation")).toBe("vertical");
    expect(handle.getAttribute("aria-labelledby")).toBe(view.container.querySelector("th")?.id);
    expect(handle.getAttribute("aria-valuemin")).toBe("90");
    expect(handle.getAttribute("aria-valuemax")).toBe("900");
    expect(handle.getAttribute("aria-valuenow")).toBe("150");
    const header = view.container.querySelector<HTMLElement>("th");
    expect(header?.style.getPropertyValue("--column-resizer-height")).toBe("45px");
    expect(header?.style.getPropertyValue("--drag-separator-target-length")).toBe("45px");
  });

  it("commits keyboard resize with ten and fifty pixel steps", async () => {
    const onColumnResize = vi.fn();
    const view = await render(<TestTable onColumnResize={onColumnResize} />);
    const handle = separators(view.container)[0];
    if (!handle) throw new Error("Missing separator");
    await act(async () => keyboard(handle, "ArrowRight"));
    await act(async () => keyboard(handle, "ArrowRight", true));
    await act(async () => keyboard(handle, "ArrowDown"));
    expect(onColumnResize.mock.calls).toEqual([[0, 90], [0, 90]]);
  });

  it("writes and commits pointer resize", async () => {
    const onColumnResize = vi.fn();
    const view = await render(<TestTable onColumnResize={onColumnResize} />);
    const handle = separators(view.container)[0];
    if (!handle) throw new Error("Missing separator");
    await drag(handle, 100, 400);
    expect(table(view.container).style.gridTemplateColumns).toBe("300px 150px minmax(90px, auto)");
    expect(onColumnResize).toHaveBeenCalledWith(0, 300);
  });

  it("keeps an in-progress width through an unrelated render", async () => {
    const view = await render(<TestTable aria-label="before" />);
    const handle = separators(view.container)[0];
    if (!handle) throw new Error("Missing separator");
    await drag(handle, 100, 400, false);
    await act(async () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
    expect(table(view.container).style.gridTemplateColumns).toBe("300px 150px minmax(90px, auto)");
    await act(async () => view.root.render(<TestTable columns={[...columns]} aria-label="after" />));
    expect(table(view.container).getAttribute("aria-label")).toBe("after");
    expect(table(view.container).style.gridTemplateColumns).toBe("300px 150px minmax(90px, auto)");
    await act(async () => pointer(window, "pointerup", 400));
  });

  it("does not pin an auto column without axial movement or on right click", async () => {
    const onColumnResize = vi.fn();
    const view = await render(<TestTable onColumnResize={onColumnResize} />);
    const handle = separators(view.container)[0];
    if (!handle) throw new Error("Missing separator");
    await drag(handle, 100, 100);
    await drag(handle, 100, 200, true, 2);
    expect(onColumnResize).not.toHaveBeenCalled();
  });

  it("retains uncontrolled widths and resets to auto on double click", async () => {
    const view = await render(<TestTable />);
    const handle = separators(view.container)[0];
    if (!handle) throw new Error("Missing separator");
    await drag(handle, 100, 400);
    await act(async () => table(view.container).click());
    expect(table(view.container).style.gridTemplateColumns).toBe("300px 150px minmax(90px, auto)");
    await act(async () => handle.dispatchEvent(new MouseEvent("dblclick", { bubbles: true })));
    expect(table(view.container).style.gridTemplateColumns).toBe("minmax(90px, auto) 150px minmax(90px, auto)");
  });

  it("reports the auto sentinel when controlled reset is requested", async () => {
    const onColumnResize = vi.fn();
    const view = await render(<TestTable onColumnResize={onColumnResize} />);
    const handle = separators(view.container)[0];
    if (!handle) throw new Error("Missing separator");
    await act(async () => handle.dispatchEvent(new MouseEvent("dblclick", { bubbles: true })));
    expect(onColumnResize).toHaveBeenCalledWith(0, COL_WIDTH_UNDEFINED);
  });

  it("sorts once and exposes ascending and descending semantics", async () => {
    const onSort = vi.fn();
    const view = await render(<Table columns={[{ key: "duration" }]}><Table.Head><Table.Row><Table.HeadCell column="duration" sort="desc" onSort={onSort}>Duration</Table.HeadCell></Table.Row></Table.Head></Table>);
    const header = view.container.querySelector("th");
    const button = view.container.querySelector("button");
    if (!header || !button) throw new Error("Missing sortable header");
    expect(header.getAttribute("aria-sort")).toBe("descending");
    expect(view.container.querySelector("svg")?.getAttribute("data-direction")).toBe("desc");
    await act(async () => button.click());
    expect(onSort).toHaveBeenCalledOnce();
  });

  it("lets native role and aria-sort props override convenience defaults", async () => {
    const view = await render(<Table columns={[{ key: "duration" }]}><Table.Head role="presentation"><Table.Row role="presentation"><Table.HeadCell aria-sort="other" column="duration" sort="desc">Duration</Table.HeadCell></Table.Row></Table.Head><Table.Body role="presentation"><Table.Row role="presentation"><Table.Cell role="gridcell">Value</Table.Cell></Table.Row></Table.Body></Table>);
    expect(view.container.querySelector("thead")?.getAttribute("role")).toBe("presentation");
    expect(view.container.querySelector("tbody")?.getAttribute("role")).toBe("presentation");
    expect(view.container.querySelector("tr")?.getAttribute("role")).toBe("presentation");
    expect(view.container.querySelector("td")?.getAttribute("role")).toBe("gridcell");
    expect(view.container.querySelector("th")?.getAttribute("aria-sort")).toBe("other");
  });

  it("closes an open overflow tooltip after resize and prevents its click from sorting", async () => {
    const resizeCallbacks: ResizeObserverCallback[] = [];
    class TestResizeObserver implements ResizeObserver {
      constructor(callback: ResizeObserverCallback) { resizeCallbacks.push(callback); }
      disconnect() {}
      observe() {}
      unobserve() {}
    }
    vi.stubGlobal("ResizeObserver", TestResizeObserver);
    const onSort = vi.fn();
    const view = await render(<Table columns={[{ key: "duration" }]}><Table.Head><Table.Row><Table.HeadCell column="duration" onSort={onSort}>Duration</Table.HeadCell></Table.Row></Table.Head></Table>);
    const label = view.container.querySelector<HTMLElement>("button div");
    if (!label) throw new Error("Missing overflow label");
    Object.defineProperty(label, "scrollWidth", { configurable: true, get: () => 100 });
    Object.defineProperty(label, "clientWidth", { configurable: true, get: () => 50 });
    await act(async () => label.dispatchEvent(new MouseEvent("mouseover", { bubbles: true })));
    const popup = document.querySelector<HTMLElement>("[data-table-tooltip]");
    if (!popup) throw new Error("Missing overflow tooltip");
    await act(async () => popup.click());
    expect(onSort).not.toHaveBeenCalled();

    Object.defineProperty(label, "clientWidth", { configurable: true, get: () => 120 });
    const observer = new TestResizeObserver(() => {});
    await act(async () => { for (const callback of [...resizeCallbacks]) callback([], observer); });
    expect(document.querySelector("[data-table-tooltip]")).toBeNull();
  });

  it("renders overlays without forcing a sort button", async () => {
    const view = await render(<Table columns={[{ key: "duration" }]}><Table.Head><Table.Row><Table.HeadCell column="duration" overlays={<span>New</span>}>Duration</Table.HeadCell></Table.Row></Table.Head></Table>);
    expect(view.container.textContent).toContain("NewDuration");
    expect(view.container.querySelector("button")).toBeNull();
  });

  it("omits sort state and indicator when the header is unsorted", async () => {
    const view = await render(<Table columns={[{ key: "duration" }]}><Table.Head><Table.Row><Table.HeadCell column="duration" onSort={() => {}}>Duration</Table.HeadCell></Table.Row></Table.Head></Table>);
    expect(view.container.querySelector("th")?.hasAttribute("aria-sort")).toBe(false);
    expect(view.container.querySelector("svg")).toBeNull();
  });

  it("forwards native table attributes and its React 19 ref", async () => {
    const ref = createRef<HTMLTableElement>();
    const view = await render(<Table ref={ref} aria-label="Native table" data-owner="issues"><Table.StatusBody>Ready</Table.StatusBody></Table>);
    expect(ref.current).toBe(table(view.container));
    expect(ref.current?.getAttribute("aria-label")).toBe("Native table");
    expect(ref.current?.dataset.owner).toBe("issues");
  });
});
