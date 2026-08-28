import { act, createRef, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Backdrop } from "./backdrop";

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

describe("Backdrop", () => {
  it.each([
    ["widgetBuilderDrawer", "1016"],
    ["drawer", "9999"],
    ["modal", "10000"],
  ] as const)("uses the canonical %s layer", async (zIndex, expected) => {
    const container = await render(<Backdrop zIndex={zIndex} />);
    expect(container.querySelector<HTMLElement>("[data-overlay]")?.className).toContain(
      `z-[${expected}]`,
    );
  });

  it("renders the canonical overlay attributes and forwards data props", async () => {
    const container = await render(
      <Backdrop
        data-drawer-backdrop="drawer"
        data-testid="overlay"
        data-test-id="canonical-overlay"
        zIndex="modal"
      />,
    );
    const overlay = container.querySelector("[data-overlay]");

    expect(overlay?.getAttribute("id")).toBe("backdrop");
    expect(overlay?.getAttribute("data-overlay")).toBe("true");
    expect(overlay?.getAttribute("data-drawer-backdrop")).toBe("drawer");
    expect(overlay?.getAttribute("data-test-id")).toBe("canonical-overlay");
    expect(overlay?.getAttribute("data-testid")).toBe("overlay");
  });

  it("lets forwarded native props override canonical attributes", async () => {
    const container = await render(
      <Backdrop data-overlay="custom" id="consumer-backdrop" zIndex="drawer" />,
    );
    const overlay = container.querySelector("[data-overlay]");

    expect(overlay?.getAttribute("id")).toBe("consumer-backdrop");
    expect(overlay?.getAttribute("data-overlay")).toBe("custom");
  });

  it("calls the click handler", async () => {
    const onClick = vi.fn();
    const container = await render(<Backdrop onClick={onClick} zIndex="modal" />);

    container.firstElementChild?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("forwards the canonical div ref", async () => {
    const ref = createRef<HTMLDivElement>();

    await render(<Backdrop ref={ref} zIndex="modal" />);

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current?.dataset.overlay).toBe("true");
  });

  it("uses Tailwind for the fixed geometry and semantic background", async () => {
    const container = await render(<Backdrop zIndex="modal" />);
    const overlay = container.querySelector<HTMLElement>("[data-overlay]");

    expect(overlay?.className).toContain("fixed");
    expect(overlay?.className).toContain("inset-0");
    expect(overlay?.className).toContain("bg-[var(--scraps-backdrop-background,#10082845)]");
  });
});
