import { act, createRef } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { EmptyState } from "./empty-state";

describe("EmptyState", () => {
  it.each([
    { action: undefined, description: undefined, illustration: undefined, name: "title only" },
    { action: undefined, description: "Adjust your filters.", illustration: undefined, name: "description" },
    { action: undefined, description: undefined, illustration: <span aria-label="box" role="img">□</span>, name: "illustration" },
    { action: <button type="button">Create</button>, description: undefined, illustration: undefined, name: "action" },
  ])("renders the optional $name region only when it is truthy", ({ action, description, illustration }) => {
    const host = document.createElement("div");
    host.innerHTML = renderToStaticMarkup(
      <EmptyState action={action} description={description} illustration={illustration} title="Nothing here" />
    );
    expect(host.querySelector("h3")?.textContent).toBe("Nothing here");
    expect(host.querySelector("p")?.textContent ?? null).toBe(description ?? null);
    expect(host.querySelector('[role="img"]')?.getAttribute("aria-label") ?? null).toBe(illustration ? "box" : null);
    expect(host.querySelector("button")?.textContent ?? null).toBe(action ? "Create" : null);
  });

  it("keeps the outer container and consumer root prop precedence", async () => {
    const host = document.createElement("div");
    const root = createRoot(host);
    const ref = createRef<HTMLDivElement>();
    await act(async () => {
      root.render(
        <EmptyState
          className="consumer-empty-state"
          data-test-id="consumer-empty-state"
          data-testid="native-empty-state"
          id="empty-state-root"
          ref={ref}
          title="Nothing here"
        />
      );
    });
    const outer = host.querySelector(":scope > div");
    const inner = host.querySelector(":scope > div > div");
    expect(outer?.className).toMatch(/scraps-layout/);
    expect(inner?.getAttribute("data-test-id")).toBe("consumer-empty-state");
    expect(inner?.getAttribute("data-testid")).toBe("native-empty-state");
    expect(inner?.id).toBe("empty-state-root");
    expect(inner?.classList.contains("consumer-empty-state")).toBe(true);
    expect(ref.current).toBe(inner);
    await act(async () => root.unmount());
  });

  it.each([undefined, null, false, ""])(
    "omits optional regions for %s",
    (value) => {
      const host = document.createElement("div");
      host.innerHTML = renderToStaticMarkup(
        <EmptyState
          action={value}
          description={value}
          illustration={value}
          title="Nothing here"
        />
      );
      expect(host.querySelector("p")).toBeNull();
      expect(host.querySelector('[role="img"]')).toBeNull();
      expect(host.querySelector("button")).toBeNull();
      expect(host.querySelector("h3")?.textContent).toBe("Nothing here");
    }
  );

  it("preserves each canonical zero-valued optional node", () => {
    const host = document.createElement("div");
    host.innerHTML = renderToStaticMarkup(
      <EmptyState action={0} description={0} illustration={0} title="Nothing here" />
    );
    const textNodes = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
    const zeroNodes = [];
    while (textNodes.nextNode()) {
      if (textNodes.currentNode.textContent === "0") zeroNodes.push(textNodes.currentNode);
    }
    expect(zeroNodes).toHaveLength(3);
  });

  it("uses the exact responsive content contract", () => {
    const markup = renderToStaticMarkup(
      <EmptyState action={<button type="button">Create</button>} description="Adjust your filters." illustration={<span aria-label="box" role="img">□</span>} title="Nothing here" />
    );
    expect(markup).toContain("max-width: 48ch");
    expect(markup).toContain("text-wrap: balance");
    expect(markup).toContain("container-type: inline-size");
  });
});
