import { act, createRef, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Radio } from "./radio";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const roots: Array<{ container: HTMLDivElement; root: Root }> = [];

async function render(ui: ReactNode) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push({ container, root });
  await act(async () => root.render(ui));
  return container;
}

afterEach(async () => {
  for (const mounted of roots.splice(0)) {
    await act(async () => mounted.root.unmount());
    mounted.container.remove();
  }
});

describe("Radio", () => {
  it("renders the canonical native medium default", async () => {
    const container = await render(<Radio aria-label="Option" />);
    const radio = container.querySelector<HTMLInputElement>("input");

    expect(radio?.type).toBe("radio");
    expect(radio?.checked).toBe(false);
    expect(radio?.className).toContain("size-6");
    expect(radio?.className).toContain("after:size-3");
    expect(radio?.hasAttribute("data-slot")).toBe(false);
  });

  it("keeps the fixed radio type when broader native props are spread", async () => {
    const nativeProps: Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> = {
      type: "checkbox",
    };
    const container = await render(<Radio {...nativeProps} aria-label="Fixed type" />);

    expect(container.querySelector<HTMLInputElement>("input")?.type).toBe("radio");
  });

  it.each([
    ["xs", "size-3", "after:size-1.5"],
    ["sm", "size-5", "after:size-2.5"],
    ["md", "size-6", "after:size-3"],
  ] as const)("uses the exact %s geometry", async (size, outer, inner) => {
    const container = await render(<Radio aria-label={size} size={size} />);
    const radio = container.querySelector<HTMLInputElement>("input");

    expect(radio?.className).toContain(outer);
    expect(radio?.className).toContain(inner);
    expect(radio?.getAttribute("size")).toBeNull();
  });

  it("forwards native props, className, style, and ref", async () => {
    const ref = createRef<HTMLInputElement>();
    const container = await render(
      <Radio
        ref={ref}
        aria-label="Forwarded"
        className="consumer-class"
        data-native="preserved"
        name="level"
        style={{ color: "rgb(1, 2, 3)" }}
        value="warning"
      />,
    );
    const radio = container.querySelector<HTMLInputElement>("input");

    expect(ref.current).toBe(radio);
    expect(radio?.name).toBe("level");
    expect(radio?.value).toBe("warning");
    expect(radio?.getAttribute("size")).toBeNull();
    expect(radio?.getAttribute("data-native")).toBe("preserved");
    expect(radio?.classList.contains("consumer-class")).toBe(true);
    expect(radio?.style.color).toBe("rgb(1, 2, 3)");
  });

  it("keeps native checked and disabled behavior", async () => {
    const onChange = vi.fn();
    const container = await render(
      <Radio aria-label="Disabled" checked disabled onChange={onChange} />,
    );
    const radio = container.querySelector<HTMLInputElement>("input")!;

    expect(radio.checked).toBe(true);
    expect(radio.disabled).toBe(true);
    radio.click();
    expect(onChange).not.toHaveBeenCalled();
  });
});
