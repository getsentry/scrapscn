import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Chip } from "./chip";

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

describe("Chip", () => {
  it("renders property, operator, and value with the medium default", async () => {
    const container = await render(<Chip property="browser" operator="is" value="Chrome" />);
    expect(container.textContent).toBe("browserisChrome");
    expect(container.firstElementChild?.className).toContain("h-7");
  });

  it("renders a value-only chip and gives readonly values secondary content", async () => {
    const container = await render(<Chip readonly value="Chrome" />);
    expect(container.textContent).toBe("Chrome");
    expect(container.querySelector("button")).toBeNull();
    expect(container.innerHTML).toContain("--scraps-content-secondary");
  });

  it("forwards root props and uses exact size geometry", async () => {
    const container = await render(
      <Chip className="consumer" data-chip="yes" size="xs" value="Chrome" />,
    );
    const chip = container.firstElementChild as HTMLDivElement;
    expect(chip.dataset.chip).toBe("yes");
    expect(chip.className).toContain("h-5");
    expect(chip.className).toContain("rounded-[3px]");
    expect(chip.className).toContain("consumer");
  });

  it("dismisses with the exact accessible label without bubbling", async () => {
    const onDismiss = vi.fn();
    const onClick = vi.fn();
    const container = await render(
      <Chip
        onClick={onClick}
        onDismiss={onDismiss}
        operator="is"
        property="browser"
        value="Chrome"
      />,
    );
    const button = container.querySelector<HTMLButtonElement>("button")!;
    expect(button.getAttribute("aria-label")).toBe("Remove browser is Chrome");
    button.click();
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
    expect(button.querySelector("path")?.getAttribute("d")).toBe(
      "M12.72 2.22C13.01 1.93 13.49 1.93 13.78 2.22C14.07 2.51 14.07 2.99 13.78 3.28L9.06 8L13.78 12.72C14.07 13.01 14.07 13.49 13.78 13.78C13.49 14.07 13.01 14.07 12.72 13.78L8 9.06L3.28 13.78C2.99 14.07 2.51 14.07 2.22 13.78C1.93 13.49 1.93 13.01 2.22 12.72L6.94 8L2.22 3.28C1.93 2.99 1.93 2.51 2.22 2.22C2.51 1.93 2.99 1.93 3.28 2.22L8 6.94L12.72 2.22Z",
    );
  });
});
