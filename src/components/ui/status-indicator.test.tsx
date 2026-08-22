import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";

import { StatusIndicator } from "./status-indicator";

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

describe("StatusIndicator", () => {
  it("is hidden from the accessibility tree when no aria-label is provided", async () => {
    const container = await render(
      <StatusIndicator data-testid="dot" variant="accent" />
    );

    expect(container.querySelector("[data-testid=dot]")?.getAttribute("aria-hidden")).toBe(
      "true"
    );
  });

  it('has role="img" and aria-label when aria-label is provided', async () => {
    const container = await render(
      <StatusIndicator
        aria-label="Online"
        data-testid="dot"
        variant="accent"
      />
    );
    const dot = container.querySelector('[role="img"][aria-label="Online"]');

    expect(dot).not.toBeNull();
    expect(dot?.hasAttribute("aria-hidden")).toBe(false);
  });

  it("respects an explicit role override alongside aria-label", async () => {
    const container = await render(
      <StatusIndicator
        aria-label="Authentication Method Active"
        data-testid="dot"
        role="status"
        variant="accent"
      />
    );
    const dot = container.querySelector(
      '[role="status"][aria-label="Authentication Method Active"]'
    );

    expect(dot).not.toBeNull();
    expect(dot?.hasAttribute("aria-hidden")).toBe(false);
  });

  it("accepts a finite animation count without passing styling props to the DOM", async () => {
    const container = await render(
      <StatusIndicator
        animationIterationCount={3}
        data-testid="dot"
        variant="accent"
      />
    );
    const dot = container.querySelector<HTMLElement>("[data-testid=dot]");

    expect(dot?.hasAttribute("animationIterationCount")).toBe(false);
    expect(dot?.hasAttribute("variant")).toBe(false);
    expect(dot?.style.getPropertyValue("--status-iterations")).toBe("3");
    expect(dot?.style.getPropertyValue("--status-fill")).toBe("forwards");
  });
});
