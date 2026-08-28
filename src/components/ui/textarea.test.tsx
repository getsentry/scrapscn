import { act, createRef } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

import { TextArea } from "./textarea";

function render(element: React.ReactElement) {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  act(() => root.render(element));
  return {
    host,
    unmount() {
      act(() => root.unmount());
      host.remove();
    },
  };
}

describe("TextArea", () => {
  it("defaults to the canonical md three-row control and forwards its ref", () => {
    const ref = createRef<HTMLTextAreaElement>();
    const view = render(<TextArea aria-label="Description" ref={ref} />);
    const textarea = view.host.querySelector("textarea");

    expect(ref.current).toBe(textarea);
    expect(textarea?.rows).toBe(3);
    expect(textarea?.dataset.size).toBe("md");
    expect(textarea?.dataset.autosize).toBe("false");
    expect(textarea?.className).toContain("rounded-[8px]");
    view.unmount();
    expect(ref.current).toBeNull();
  });

  it("supports the exact size, monospace, native, and disabled props", () => {
    const view = render(
      <TextArea
        aria-label="Query"
        defaultValue="is:unresolved"
        disabled
        monospace
        rows={5}
        size="xs"
      />,
    );
    const textarea = view.host.querySelector("textarea");

    expect(textarea?.disabled).toBe(true);
    expect(textarea?.rows).toBe(5);
    expect(textarea?.value).toBe("is:unresolved");
    expect(textarea?.className).toContain("font-mono");
    expect(textarea?.className).toContain("rounded-[5px]");
    view.unmount();
  });

  it("uses rows as minRows, honors maxRows, and observes width when autosizing", () => {
    const observe = vi.fn();
    const disconnect = vi.fn();
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe = observe;
        disconnect = disconnect;
      },
    );

    const view = render(<TextArea autosize aria-label="Notes" maxRows={6} rows={2} />);
    const textarea = view.host.querySelector("textarea");

    expect(textarea?.dataset.autosize).toBe("true");
    expect(textarea?.dataset.size).toBe("md");
    expect(observe).toHaveBeenCalledWith(textarea, { box: "border-box" });
    view.unmount();
    expect(disconnect).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
  });

  it("preserves cleanup returned by an autosize callback ref", () => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        disconnect() {}
      },
    );
    const cleanup = vi.fn();
    const callbackRef = vi.fn(() => cleanup);
    const view = render(<TextArea autosize aria-label="Autosize ref" ref={callbackRef} />);

    expect(callbackRef).toHaveBeenCalledWith(view.host.querySelector("textarea"));
    view.unmount();
    expect(cleanup).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
  });
});
