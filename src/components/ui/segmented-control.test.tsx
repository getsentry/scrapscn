import { act, useState, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { userEvent } from "storybook/test";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SegmentedControl } from "./segmented-control";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const roots: Array<{ container: HTMLDivElement; root: Root }> = [];

async function render(ui: ReactNode) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push({ container, root });
  await act(async () => root.render(ui));

  return {
    container,
    rerender: async (nextUi: ReactNode) => {
      await act(async () => root.render(nextUi));
    },
  };
}

function getRadio(container: ParentNode, name: string) {
  const radio = [...container.querySelectorAll<HTMLInputElement>("input[type=radio]")].find(
    (input) =>
      input.getAttribute("aria-label") === name || input.closest("label")?.textContent === name,
  );

  if (!radio) throw new Error(`Radio not found: ${name}`);
  return radio;
}

afterEach(async () => {
  for (const mounted of roots.splice(0)) {
    await act(async () => mounted.root.unmount());
    mounted.container.remove();
  }
});

describe("SegmentedControl", () => {
  it("forwards group props and follows controlled rerenders", async () => {
    const onChange = vi.fn();
    const first = (
      <>
        <SegmentedControl value="grid" onChange={onChange}>
          <SegmentedControl.Item key="list">List</SegmentedControl.Item>
          <SegmentedControl.Item key="grid">Grid</SegmentedControl.Item>
          <SegmentedControl.Item key="chart">Chart</SegmentedControl.Item>
        </SegmentedControl>
        <button type="button">After group</button>
      </>
    );
    const view = await render(first);
    const group = view.container.querySelector<HTMLElement>("[role=radiogroup]");

    expect(group?.getAttribute("aria-orientation")).toBe("horizontal");
    for (const rawProp of [
      "description",
      "errormessage",
      "isreadonly",
      "isrequired",
      "validationbehavior",
    ]) {
      expect(group?.hasAttribute(rawProp)).toBe(false);
    }
    expect(getRadio(view.container, "Grid").checked).toBe(true);

    await view.rerender(
      <SegmentedControl aria-label="View" value="chart" onChange={onChange}>
        <SegmentedControl.Item key="list">List</SegmentedControl.Item>
        <SegmentedControl.Item key="grid">Grid</SegmentedControl.Item>
        <SegmentedControl.Item key="chart">Chart</SegmentedControl.Item>
      </SegmentedControl>,
    );

    expect(getRadio(view.container, "Grid").checked).toBe(false);
    expect(getRadio(view.container, "Chart").checked).toBe(true);
  });

  it("emits one surface and content declaration for each rendered state", async () => {
    const { container } = await render(
      <SegmentedControl aria-label="View" priority="primary" value="list" onChange={() => {}}>
        <SegmentedControl.Item key="list">List</SegmentedControl.Item>
        <SegmentedControl.Item key="grid" disabled>
          Grid
        </SegmentedControl.Item>
      </SegmentedControl>,
    );
    const selectedRadio = getRadio(container, "List");
    const unselectedRadio = getRadio(container, "Grid");
    const selectedLabel = selectedRadio.closest("label")!;
    const unselectedLabel = unselectedRadio.closest("label")!;
    const selectedClasses = selectedLabel.className;
    const unselectedClasses = unselectedLabel.className;
    const selectedContentClasses =
      selectedLabel.querySelector<HTMLElement>(":scope > span")!.className;
    const unselectedContentClasses =
      unselectedLabel.querySelector<HTMLElement>(":scope > span")!.className;

    expect(selectedLabel.hasAttribute("aria-checked")).toBe(false);
    expect(selectedLabel.getAttribute("data-selected")).toBe("true");
    expect(selectedRadio.checked).toBe(true);
    expect(unselectedLabel.hasAttribute("aria-checked")).toBe(false);
    expect(unselectedLabel.hasAttribute("data-selected")).toBe(false);
    expect(unselectedRadio.checked).toBe(false);

    expect(selectedClasses.match(/\[--segment-chonk:/g)).toHaveLength(1);
    expect(selectedClasses.match(/\[--segment-surface:/g)).toHaveLength(1);
    expect(selectedClasses.match(/\[--segment-content:/g)).toHaveLength(1);
    expect(selectedClasses).toContain("var(--scraps-button-primary-chonk)");
    expect(selectedClasses).toContain("[--segment-surface:#7553ff]");
    expect(selectedClasses).toContain("[--segment-content:#fff]");
    expect(selectedClasses).not.toContain("--scraps-button-secondary-chonk");
    expect(selectedClasses).toContain("h-9");
    expect(selectedClasses).toContain("min-h-9");
    expect(selectedClasses).toContain("text-sm/4");
    expect(selectedClasses).not.toContain("min-h-0");
    expect(selectedClasses).toContain("[transform:translateX(calc(-1px*var(--segment-index)))]");
    expect(selectedClasses).toContain(
      "before:[transform:translateY(calc(-1*var(--segment-lift-base)))]",
    );
    expect(selectedClasses).toContain("after:[transform:translateY(calc(-1*var(--segment-lift)))]");
    expect(selectedClasses).toContain("[&:has(input:focus-visible)_span]:![box-shadow:none]");
    expect(selectedClasses).toContain("var(--scraps-segmented-control-focus)");
    expect(selectedClasses).not.toMatch(/(?:before:|after:)?translate-[xy]-\[/);
    expect(selectedClasses).toContain("hover:[--segment-lift:calc(var(--segment-lift-base)+1px)]");
    expect(selectedClasses).toContain("active:[--segment-lift:0px]");
    expect(selectedClasses).toContain("data-[selected=true]:[--segment-lift:0px]");
    expect(selectedClasses).toContain("aria-[disabled=true]:[--segment-lift:0px]");
    expect(selectedClasses).toContain("after:transition-none");
    expect(selectedClasses).not.toContain("after:transition-transform");
    expect(selectedClasses).not.toContain("after:duration-[120ms]");
    expect(selectedClasses).not.toContain("after:ease-[cubic-bezier");

    for (const className of [
      "relative",
      "z-1",
      "inline-flex",
      "flex-1",
      "items-center",
      "justify-center",
      "[gap:inherit]",
      "overflow-hidden",
      "whitespace-nowrap",
      "transition-none",
    ]) {
      expect(selectedContentClasses).toContain(className);
    }
    expect(selectedContentClasses).not.toContain("transition-transform");
    expect(selectedContentClasses).not.toContain("duration-[120ms]");
    expect(selectedContentClasses).not.toContain("ease-[cubic-bezier");
    expect(selectedContentClasses).not.toMatch(/\bgrid(?:-flow-col)?\b/);
    expect(selectedContentClasses).not.toMatch(/\bgap-(?:1|1\.5)\b/);

    expect(unselectedClasses.match(/\[--segment-chonk:/g)).toHaveLength(1);
    expect(unselectedClasses.match(/\[--segment-surface:/g)).toHaveLength(1);
    expect(unselectedClasses.match(/\[--segment-content:/g)).toHaveLength(1);
    expect(unselectedClasses).toContain("--scraps-button-secondary-chonk");
    expect(unselectedClasses).toContain("--scraps-content-secondary");
    expect(unselectedClasses).not.toContain("--scraps-button-primary-chonk");
    expect(unselectedClasses).toContain("after:transition-transform");
    expect(unselectedClasses).toContain("after:duration-[120ms]");
    expect(unselectedClasses).toContain("after:ease-[cubic-bezier(0.8,-0.4,0.5,1)]");
    expect(unselectedClasses).not.toContain("after:transition-none");
    expect(unselectedContentClasses).toContain("transition-transform");
    expect(unselectedContentClasses).toContain("duration-[120ms]");
    expect(unselectedContentClasses).toContain("ease-[cubic-bezier(0.8,-0.4,0.5,1)]");
    expect(unselectedContentClasses).not.toContain("transition-none");
  });

  it("supports clicks, all arrow keys, wrapping, and disabled-item skips", async () => {
    const onChange = vi.fn();

    function ControlledControl() {
      const [value, setValue] = useState("one");
      return (
        <SegmentedControl
          aria-label="View"
          value={value}
          onChange={(nextValue) => {
            onChange(nextValue);
            setValue(nextValue);
          }}
        >
          <SegmentedControl.Item key="one">One</SegmentedControl.Item>
          <SegmentedControl.Item key="two" disabled>
            Two
          </SegmentedControl.Item>
          <SegmentedControl.Item key="three">Three</SegmentedControl.Item>
          <SegmentedControl.Item key="four">Four</SegmentedControl.Item>
        </SegmentedControl>
      );
    }

    const { container } = await render(<ControlledControl />);
    await userEvent.click(getRadio(container, "Three"));
    expect(getRadio(container, "Three").checked).toBe(true);
    expect(onChange).toHaveBeenLastCalledWith("three");

    await userEvent.keyboard("{ArrowLeft}");
    expect(getRadio(container, "One").checked).toBe(true);
    await userEvent.keyboard("{ArrowRight}");
    expect(getRadio(container, "Three").checked).toBe(true);
    await userEvent.keyboard("{ArrowUp}");
    expect(getRadio(container, "One").checked).toBe(true);
    await userEvent.keyboard("{ArrowDown}");
    expect(getRadio(container, "Three").checked).toBe(true);
    await userEvent.keyboard("{ArrowRight}");
    expect(getRadio(container, "Four").checked).toBe(true);
    await userEvent.keyboard("{ArrowRight}");
    expect(getRadio(container, "One").checked).toBe(true);
    await userEvent.keyboard("{ArrowLeft}");
    expect(getRadio(container, "Four").checked).toBe(true);
  });

  it("does not expose a group-level disabled prop", async () => {
    const onChange = vi.fn();
    const { container } = await render(
      <SegmentedControl aria-label="View" value="list" onChange={onChange}>
        <SegmentedControl.Item key="list">List</SegmentedControl.Item>
        <SegmentedControl.Item key="grid">Grid</SegmentedControl.Item>
      </SegmentedControl>,
    );
    const list = getRadio(container, "List");
    const grid = getRadio(container, "Grid");

    expect(list.disabled).toBe(false);
    expect(grid.disabled).toBe(false);
    await userEvent.click(grid);
    await userEvent.keyboard("{ArrowRight}{ArrowDown}");
    expect(onChange).toHaveBeenCalled();
  });

  it("supports an accessible icon-only item and tooltip overrides", async () => {
    const { container } = await render(
      <SegmentedControl aria-label="View" value="table" onChange={() => {}}>
        <SegmentedControl.Item key="list">List</SegmentedControl.Item>
        <SegmentedControl.Item
          key="table"
          aria-label="Table view"
          icon={<svg aria-hidden="true" data-testid="table-icon" />}
          tooltip="Show table"
          tooltipOptions={{ forceVisible: true, position: "left" }}
        />
      </SegmentedControl>,
    );

    expect(getRadio(container, "Table view").checked).toBe(true);
    expect(container.querySelector("[data-testid=table-icon]")).not.toBeNull();
    const tableClasses = getRadio(container, "Table view").closest("label")!.className;
    expect(tableClasses.match(/\bp-0\b/g)).toHaveLength(1);
    expect(tableClasses).not.toMatch(/\b(?:px|py)-/);
    await act(async () => Promise.resolve());
    expect(document.querySelector('[role="tooltip"]')?.textContent).toContain("Show table");
    expect(document.querySelector("[data-tooltip-positioner]")?.getAttribute("data-side")).toBe(
      "left",
    );
  });
});
