import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Alert, AlertLink } from "./alert";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const roots: Root[] = [];

async function render(element: ReactNode) {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  roots.push(root);
  await act(async () => root.render(element));
  return host;
}

afterEach(async () => {
  for (const root of roots.splice(0)) await act(async () => root.unmount());
  document.body.replaceChildren();
});

describe("regular Scraps Alert", () => {
  it("renders every canonical variant with its exact icon and panel contract", async () => {
    for (const variant of ["muted", "info", "warning", "success", "danger"] as const) {
      const host = await render(<Alert variant={variant}>{variant}</Alert>);
      const panel = host.firstElementChild;
      expect(panel?.classList.contains(`ref-${variant}`)).toBe(true);
      expect(panel?.className).toContain("min-h-11");
      expect(panel?.className).toContain("[container-type:inline-size]");
      expect(host.querySelector('[role="img"]')).not.toBeNull();
      expect(panel?.getAttribute("role")).toBeNull();
    }
  });

  it("supports custom and hidden icons plus system geometry", async () => {
    const custom = await render(
      <Alert variant="info" icon={<span data-custom-icon />} system>
        Custom
      </Alert>,
    );
    expect(custom.querySelector("[data-custom-icon]")).not.toBeNull();
    expect(custom.firstElementChild?.className).toContain("rounded-none");

    const hidden = await render(
      <Alert variant="warning" showIcon={false}>
        Hidden
      </Alert>,
    );
    expect(hidden.querySelector('[role="img"]')).toBeNull();
    expect(hidden.firstElementChild?.className).toContain("px-3");
  });

  it("expands from the panel and keeps clicks inside expanded content open", async () => {
    const handleExpandChange = vi.fn();
    const host = await render(
      <Alert
        variant="info"
        expand={<button type="button">Expanded control</button>}
        handleExpandChange={handleExpandChange}
      >
        Message
      </Alert>,
    );

    expect(host.textContent).not.toContain("Expanded control");
    await act(async () => {
      Array.from(host.querySelectorAll("div"))
        .find((node) => node.textContent === "Message")
        ?.click();
    });
    expect(host.textContent).toContain("Expanded control");
    expect(handleExpandChange).toHaveBeenCalledWith(true);

    await act(async () => {
      Array.from(host.querySelectorAll("button"))
        .find((button) => button.textContent === "Expanded control")
        ?.click();
    });
    expect(host.textContent).toContain("Expanded control");
  });

  it("does not expand when a trailing item is clicked", async () => {
    const host = await render(
      <Alert
        variant="danger"
        expand={<div>Expanded details</div>}
        trailingItems={<button type="button">Act</button>}
      >
        Message
      </Alert>,
    );
    await act(async () => host.querySelector("button")?.click());
    expect(host.textContent).not.toContain("Expanded details");
  });

  it("lets a consumer onClick replace panel expansion while icon clicks stay internal", async () => {
    const onClick = vi.fn();
    const host = await render(
      <Alert variant="info" expand="Expanded details" onClick={onClick}>
        Message
      </Alert>,
    );

    await act(async () => {
      Array.from(host.querySelectorAll("div"))
        .find((node) => node.textContent === "Message")
        ?.click();
    });
    expect(onClick).toHaveBeenCalledOnce();
    expect(host.textContent).not.toContain("Expanded details");

    await act(async () => {
      host.querySelector('[role="img"]')?.parentElement?.click();
    });
    expect(onClick).toHaveBeenCalledTimes(2);
    expect(host.textContent).toContain("Expanded details");
  });

  it("renders the canonical external AlertLink behavior and default chevron", async () => {
    const host = await render(
      <AlertLink variant="success" href="https://example.com" openInNewTab>
        Documentation
      </AlertLink>,
    );
    const link = host.querySelector("a");
    expect(link?.getAttribute("href")).toBe("https://example.com");
    expect(link?.getAttribute("target")).toBe("_blank");
    expect(link?.getAttribute("rel")).toBe("noreferrer noopener");
    expect(link?.className).toContain("decoration-[var(--scraps-theme-green200)]");
    expect(link?.querySelector("svg")).not.toBeNull();
  });

  it("forces the canonical zero size for Alert.Button", async () => {
    const host = await render(<Alert.Button variant="danger">Delete</Alert.Button>);
    expect(host.querySelector("button")?.dataset.size).toBe("zero");
  });
});
