import { act, createRef, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";

import { Checkbox } from "./checkbox";

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

describe("Checkbox", () => {
  it("renders the canonical native default and small visual box", async () => {
    const container = await render(<Checkbox aria-label="Setting" onChange={() => {}} />);
    const input = container.querySelector<HTMLInputElement>("input");
    const wrapper = input?.parentElement;
    const visual = input?.nextElementSibling;

    expect(input?.type).toBe("checkbox");
    expect(input?.checked).toBe(false);
    expect(input?.indeterminate).toBe(false);
    expect(wrapper?.className).toContain("cursor-pointer");
    expect(wrapper?.hasAttribute("data-slot")).toBe(false);
    expect(wrapper?.hasAttribute("data-size")).toBe(false);
    expect(visual?.className).toContain("size-4");
    expect(visual?.className).toContain("rounded-[4px]");
  });

  it("sets the native indeterminate state and exact subtract glyph", async () => {
    const container = await render(
      <Checkbox checked="indeterminate" size="md" aria-label="Mixed" onChange={() => {}} />,
    );
    const input = container.querySelector<HTMLInputElement>("input");
    const visual = input?.nextElementSibling;
    const svg = visual?.querySelector("svg");

    expect(input?.checked).toBe(false);
    expect(input?.indeterminate).toBe(true);
    expect(visual?.className).toContain("size-[22px]");
    expect(svg?.classList.contains("size-[18px]")).toBe(true);
    expect(svg?.getAttribute("stroke-width")).toBe("2.12");
    expect(svg?.querySelector("path")?.getAttribute("d")).toBe("M3 8H13");
  });

  it("forwards the native ref and separates wrapper and input props", async () => {
    const ref = createRef<HTMLInputElement>();
    const container = await render(
      <Checkbox
        ref={ref}
        aria-label="Forwarded"
        className="consumer-wrapper"
        data-native="input-only"
        onChange={() => {}}
        style={{ color: "rgb(1, 2, 3)" }}
      />,
    );
    const input = container.querySelector<HTMLInputElement>("input");
    const wrapper = input?.parentElement;

    expect(ref.current).toBe(input);
    expect(input?.getAttribute("data-native")).toBe("input-only");
    expect(wrapper?.hasAttribute("data-native")).toBe(false);
    expect(wrapper?.classList.contains("consumer-wrapper")).toBe(true);
    expect(input?.classList.contains("consumer-wrapper")).toBe(false);
    expect(wrapper?.style.color).toBe("rgb(1, 2, 3)");
    expect(input?.style.color).toBe("rgb(1, 2, 3)");
  });

  it.each([
    ["disabled", { disabled: true }, false, "cursor-auto"],
    ["read only", { readOnly: true }, false, "cursor-auto"],
    ["aria disabled", { "aria-disabled": true }, true, "cursor-pointer"],
  ] as const)(
    "keeps the canonical %s interaction-layer contract",
    async (_name, props, hasLayer, cursorClass) => {
      const container = await render(<Checkbox {...props} aria-label="State contract" />);
      const input = container.querySelector("input");
      const wrapper = input?.parentElement;

      expect(wrapper?.classList.contains(cursorClass)).toBe(true);
      expect(Boolean(wrapper?.querySelector('[role="presentation"]'))).toBe(hasLayer);
    },
  );
});
