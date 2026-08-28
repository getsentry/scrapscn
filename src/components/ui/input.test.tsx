import { act, createRef } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { configureScrapsLocale } from "../../lib/scraps-locale";
import {
  Input,
  InputGroup,
  NumberDragInput,
  NumberInput,
  OTPInput,
  useAutosizeInput,
} from "./input";

beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function render(element: React.ReactElement) {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  act(() => root.render(element));
  return {
    host,
    rerender(next: React.ReactElement) {
      act(() => root.render(next));
    },
    unmount() {
      act(() => root.unmount());
      host.remove();
    },
  };
}

describe("Input", () => {
  it("preserves the native contract while using the canonical form size", () => {
    const ref = createRef<HTMLInputElement>();
    const view = render(
      <Input
        aria-label="Project"
        defaultValue="frontend"
        monospace
        nativeSize={12}
        ref={ref}
        size="xs"
      />,
    );
    const input = view.host.querySelector("input");

    expect(ref.current).toBe(input);
    expect(input?.size).toBe(12);
    expect(input?.dataset.size).toBe("xs");
    expect(input?.className).toContain("h-7");
    expect(input?.className).toContain("rounded-[5px]");
    expect(input?.className).toContain("text-xs/4");
    expect(input?.className).toContain("py-1.5");
    expect(input?.className).toContain("font-[425]");
    view.unmount();
    expect(ref.current).toBeNull();
  });

  it("measures leading and trailing items and applies exact group padding", () => {
    const width = vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(24);
    const observe = vi.fn();
    const disconnect = vi.fn();
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe = observe;
        disconnect = disconnect;
      },
    );

    const view = render(
      <InputGroup>
        <InputGroup.LeadingItems disablePointerEvents>
          <span>find</span>
        </InputGroup.LeadingItems>
        <InputGroup.Input aria-label="Search" size="sm" />
        <InputGroup.TrailingItems>
          <button type="button">clear</button>
        </InputGroup.TrailingItems>
      </InputGroup>,
    );
    const input = view.host.querySelector("input");
    const leading = view.host.querySelector('[data-test-id="input-leading-items"]');
    const trailing = view.host.querySelector('[data-test-id="input-trailing-items"]');

    expect(input?.style.paddingLeft).toBe("calc(42px)");
    expect(input?.style.paddingRight).toBe("calc(42px)");
    expect(leading?.className).toContain("left-[13px]");
    expect(leading?.className).toContain("pointer-events-none");
    expect(trailing?.className).toContain("right-[13px]");
    expect(observe).toHaveBeenCalledTimes(2);

    view.unmount();
    expect(disconnect).toHaveBeenCalledTimes(2);
    width.mockRestore();
  });

  it("keeps consumer padding overrides on grouped inputs", () => {
    vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(20);
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        disconnect() {}
      },
    );
    const view = render(
      <InputGroup>
        <InputGroup.LeadingItems>prefix</InputGroup.LeadingItems>
        <InputGroup.Input aria-label="Custom" style={{ paddingLeft: 3 }} />
      </InputGroup>,
    );

    expect(view.host.querySelector("input")?.style.paddingLeft).toBe("3px");
    view.unmount();
  });
});

describe("OTPInput", () => {
  it("renders the canonical grouping, accessibility label, and disabled slots", () => {
    const onComplete = vi.fn();
    const view = render(<OTPInput disabled format="000-000" onComplete={onComplete} />);

    expect(view.host.querySelector('[aria-label="One-time password"]')).not.toBeNull();
    expect(view.host.querySelectorAll("[data-input-otp-slot]")).toHaveLength(6);
    expect(view.host.textContent).toContain("-");
    expect(view.host.querySelector("[data-input-otp-slot]")?.getAttribute("aria-disabled")).toBe(
      "true",
    );
    view.unmount();
  });
});

describe("numeric inputs", () => {
  it("increments and clamps NumberInput through its accessible controls", () => {
    const view = render(<NumberInput aria-label="Retries" defaultValue={2} max={3} min={0} />);
    const input = view.host.querySelector("input");
    const increase = view.host.querySelector<HTMLButtonElement>(
      'button[aria-label="Increase Retries"]',
    );

    expect(input?.value).toBe("2");
    act(() => increase?.click());
    expect(input?.value).toBe("3");
    expect(increase?.disabled).toBe(true);
    expect(increase?.dataset.shape).toBe("square");
    expect(increase?.className).toContain("min-w-6");
    view.unmount();
  });

  it("routes drag guidance through the configured locale adapter", () => {
    const translateComplex = vi.fn(() => "Translated drag guidance");
    const resetLocale = configureScrapsLocale({
      t: (message) => message,
      tct: translateComplex,
    });
    const view = render(<NumberDragInput aria-label="Threshold" defaultValue={5} />);

    expect(translateComplex).toHaveBeenCalledWith(
      "Drag to adjust threshold[break]You can hold shift to fine tune",
      expect.objectContaining({ break: expect.anything() }),
    );

    view.unmount();
    resetLocale();
  });

  it("uses arrow keys and dispatches native input changes for NumberDragInput", () => {
    const onChange = vi.fn();
    const ref = createRef<HTMLInputElement>();
    const view = render(
      <NumberDragInput
        aria-label="Threshold"
        defaultValue={5}
        max={6}
        min={0}
        onChange={onChange}
        ref={ref}
      />,
    );
    const input = view.host.querySelector("input");

    act(() =>
      input?.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowUp" })),
    );
    expect(input?.value).toBe("6");
    expect(onChange).toHaveBeenCalledOnce();
    expect(ref.current).toBe(input);
    view.unmount();
    expect(ref.current).toBeNull();
  });

  it("locks the pointer, applies drag steps, clamps, and releases its listeners", () => {
    const requestPointerLock = vi.fn();
    const exitPointerLock = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "requestPointerLock", {
      configurable: true,
      value: requestPointerLock,
    });
    Object.defineProperty(document, "exitPointerLock", {
      configurable: true,
      value: exitPointerLock,
    });
    const onChange = vi.fn();
    const view = render(
      <NumberDragInput
        aria-label="Threshold"
        defaultValue={5}
        max={6}
        min={0}
        onChange={onChange}
        step={2}
      />,
    );
    const input = view.host.querySelector("input");
    const handle = view.host.querySelector('[data-test-id="input-trailing-items"] > div');
    const move = new MouseEvent("pointermove", { bubbles: true });
    Object.defineProperty(move, "movementX", { value: 100 });
    Object.defineProperty(move, "movementY", { value: 0 });

    act(() => handle?.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, button: 0 })));
    expect(requestPointerLock).toHaveBeenCalledOnce();
    Object.defineProperty(document, "pointerLockElement", {
      configurable: true,
      value: handle,
    });
    act(() => document.dispatchEvent(move));
    expect(input?.value).toBe("6");
    expect(onChange).toHaveBeenCalledOnce();
    act(() => document.dispatchEvent(new MouseEvent("pointerup", { bubbles: true })));
    expect(exitPointerLock).toHaveBeenCalledOnce();

    view.unmount();
    Reflect.deleteProperty(HTMLElement.prototype, "requestPointerLock");
    Reflect.deleteProperty(document, "exitPointerLock");
    Reflect.deleteProperty(document, "pointerLockElement");
  });

  it("releases pointer lock and drag listeners when unmounted during a drag", () => {
    const requestPointerLock = vi.fn();
    const exitPointerLock = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "requestPointerLock", {
      configurable: true,
      value: requestPointerLock,
    });
    Object.defineProperty(document, "exitPointerLock", {
      configurable: true,
      value: exitPointerLock,
    });
    const removeEventListener = vi.spyOn(document, "removeEventListener");
    const view = render(<NumberDragInput aria-label="Threshold" defaultValue={5} />);
    const handle = view.host.querySelector('[data-test-id="input-trailing-items"] > div');

    act(() => handle?.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, button: 0 })));
    Object.defineProperty(document, "pointerLockElement", {
      configurable: true,
      value: handle,
    });
    view.unmount();

    expect(requestPointerLock).toHaveBeenCalledOnce();
    expect(exitPointerLock).toHaveBeenCalledOnce();
    expect(removeEventListener).toHaveBeenCalledWith("pointermove", expect.any(Function));
    expect(removeEventListener).toHaveBeenCalledWith("pointerup", expect.any(Function));
    Reflect.deleteProperty(HTMLElement.prototype, "requestPointerLock");
    Reflect.deleteProperty(document, "exitPointerLock");
    Reflect.deleteProperty(document, "pointerLockElement");
  });

  it("stops changing values after pointer cancellation", () => {
    Object.defineProperty(HTMLElement.prototype, "requestPointerLock", {
      configurable: true,
      value: vi.fn(),
    });
    const exitPointerLock = vi.fn();
    Object.defineProperty(document, "exitPointerLock", {
      configurable: true,
      value: exitPointerLock,
    });
    const view = render(<NumberDragInput aria-label="Threshold" defaultValue={5} />);
    const input = view.host.querySelector("input");
    const handle = view.host.querySelector('[data-test-id="input-trailing-items"] > div');

    act(() => {
      handle?.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, button: 0 }));
      Object.defineProperty(document, "pointerLockElement", {
        configurable: true,
        value: handle,
      });
      document.dispatchEvent(new Event("pointercancel"));
      const move = new MouseEvent("pointermove", { bubbles: true });
      Object.defineProperty(move, "movementX", { value: 100 });
      Object.defineProperty(move, "movementY", { value: 0 });
      document.dispatchEvent(move);
    });

    expect(input?.value).toBe("5");
    expect(exitPointerLock).toHaveBeenCalledOnce();
    view.unmount();
    Reflect.deleteProperty(HTMLElement.prototype, "requestPointerLock");
    Reflect.deleteProperty(document, "exitPointerLock");
    Reflect.deleteProperty(document, "pointerLockElement");
  });

  it("stops changing values when pointer lock is lost", () => {
    Object.defineProperty(HTMLElement.prototype, "requestPointerLock", {
      configurable: true,
      value: vi.fn(),
    });
    Object.defineProperty(document, "exitPointerLock", {
      configurable: true,
      value: vi.fn(),
    });
    const view = render(<NumberDragInput aria-label="Threshold" defaultValue={5} />);
    const input = view.host.querySelector("input");
    const handle = view.host.querySelector<HTMLElement>(
      '[data-test-id="input-trailing-items"] > div',
    );
    Object.defineProperty(document, "pointerLockElement", {
      configurable: true,
      value: handle,
    });

    act(() => handle?.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, button: 0 })));
    act(() => document.dispatchEvent(new Event("pointerlockchange")));
    Object.defineProperty(document, "pointerLockElement", {
      configurable: true,
      value: null,
    });
    act(() => document.dispatchEvent(new Event("pointerlockchange")));
    const move = new MouseEvent("pointermove", { bubbles: true });
    Object.defineProperty(move, "movementX", { value: 100 });
    Object.defineProperty(move, "movementY", { value: 0 });
    act(() => document.dispatchEvent(move));

    expect(input?.value).toBe("5");
    view.unmount();
    Reflect.deleteProperty(HTMLElement.prototype, "requestPointerLock");
    Reflect.deleteProperty(document, "exitPointerLock");
    Reflect.deleteProperty(document, "pointerLockElement");
  });

  it("removes drag listeners when pointer lock is rejected", async () => {
    Object.defineProperty(HTMLElement.prototype, "requestPointerLock", {
      configurable: true,
      value: vi.fn(() => Promise.reject(new Error("Lock denied"))),
    });
    const exitPointerLock = vi.fn();
    Object.defineProperty(document, "exitPointerLock", {
      configurable: true,
      value: exitPointerLock,
    });
    const view = render(<NumberDragInput aria-label="Threshold" defaultValue={5} />);
    const input = view.host.querySelector("input");
    const handle = view.host.querySelector('[data-test-id="input-trailing-items"] > div');

    act(() => handle?.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, button: 0 })));
    await act(async () => Promise.resolve());
    const move = new MouseEvent("pointermove", { bubbles: true });
    Object.defineProperty(move, "movementX", { value: 100 });
    Object.defineProperty(move, "movementY", { value: 0 });
    act(() => document.dispatchEvent(move));

    expect(input?.value).toBe("5");
    expect(exitPointerLock).not.toHaveBeenCalled();
    view.unmount();
    Reflect.deleteProperty(HTMLElement.prototype, "requestPointerLock");
    Reflect.deleteProperty(document, "exitPointerLock");
  });

  it("releases a pointer lock that resolves after pointer up", async () => {
    let resolveLock = () => {};
    Object.defineProperty(HTMLElement.prototype, "requestPointerLock", {
      configurable: true,
      value: vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveLock = resolve;
          }),
      ),
    });
    const exitPointerLock = vi.fn();
    Object.defineProperty(document, "exitPointerLock", {
      configurable: true,
      value: exitPointerLock,
    });
    const view = render(<NumberDragInput aria-label="Threshold" defaultValue={5} />);
    const handle = view.host.querySelector<HTMLElement>(
      '[data-test-id="input-trailing-items"] > div',
    );

    act(() => {
      handle?.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, button: 0 }));
      document.dispatchEvent(new Event("pointerup"));
    });
    Object.defineProperty(document, "pointerLockElement", {
      configurable: true,
      value: handle,
    });
    await act(async () => {
      resolveLock();
      await Promise.resolve();
    });

    expect(exitPointerLock).toHaveBeenCalledOnce();
    view.unmount();
    Reflect.deleteProperty(HTMLElement.prototype, "requestPointerLock");
    Reflect.deleteProperty(document, "exitPointerLock");
    Reflect.deleteProperty(document, "pointerLockElement");
  });

  it("releases a pointer lock that resolves after unmount", async () => {
    let resolveLock = () => {};
    Object.defineProperty(HTMLElement.prototype, "requestPointerLock", {
      configurable: true,
      value: vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveLock = resolve;
          }),
      ),
    });
    const exitPointerLock = vi.fn();
    Object.defineProperty(document, "exitPointerLock", {
      configurable: true,
      value: exitPointerLock,
    });
    const view = render(<NumberDragInput aria-label="Threshold" defaultValue={5} />);
    const handle = view.host.querySelector<HTMLElement>(
      '[data-test-id="input-trailing-items"] > div',
    );

    act(() => handle?.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, button: 0 })));
    view.unmount();
    Object.defineProperty(document, "pointerLockElement", {
      configurable: true,
      value: handle,
    });
    await act(async () => {
      resolveLock();
      await Promise.resolve();
    });

    expect(exitPointerLock).toHaveBeenCalledOnce();
    Reflect.deleteProperty(HTMLElement.prototype, "requestPointerLock");
    Reflect.deleteProperty(document, "exitPointerLock");
    Reflect.deleteProperty(document, "pointerLockElement");
  });

  it("does not let a stale request release a newer drag on the same handle", async () => {
    const resolveLocks: Array<() => void> = [];
    Object.defineProperty(HTMLElement.prototype, "requestPointerLock", {
      configurable: true,
      value: vi.fn(() => new Promise<void>((resolve) => resolveLocks.push(resolve))),
    });
    const exitPointerLock = vi.fn();
    Object.defineProperty(document, "exitPointerLock", {
      configurable: true,
      value: exitPointerLock,
    });
    const view = render(<NumberDragInput aria-label="Threshold" defaultValue={5} />);
    const handle = view.host.querySelector<HTMLElement>(
      '[data-test-id="input-trailing-items"] > div',
    );

    act(() => {
      handle?.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, button: 0 }));
      document.dispatchEvent(new Event("pointerup"));
      handle?.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, button: 0 }));
    });
    Object.defineProperty(document, "pointerLockElement", {
      configurable: true,
      value: handle,
    });
    await act(async () => {
      resolveLocks[0]?.();
      await Promise.resolve();
    });

    expect(exitPointerLock).not.toHaveBeenCalled();
    act(() => document.dispatchEvent(new Event("pointerup")));
    expect(exitPointerLock).toHaveBeenCalledOnce();
    resolveLocks[1]?.();
    view.unmount();
    Reflect.deleteProperty(HTMLElement.prototype, "requestPointerLock");
    Reflect.deleteProperty(document, "exitPointerLock");
    Reflect.deleteProperty(document, "pointerLockElement");
  });

  it("does not release pointer lock owned by another element", () => {
    Object.defineProperty(HTMLElement.prototype, "requestPointerLock", {
      configurable: true,
      value: vi.fn(),
    });
    const exitPointerLock = vi.fn();
    Object.defineProperty(document, "exitPointerLock", {
      configurable: true,
      value: exitPointerLock,
    });
    const foreignOwner = document.createElement("div");
    const view = render(<NumberDragInput aria-label="Threshold" defaultValue={5} />);
    const input = view.host.querySelector("input");
    const handle = view.host.querySelector<HTMLElement>(
      '[data-test-id="input-trailing-items"] > div',
    );

    act(() => handle?.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, button: 0 })));
    Object.defineProperty(document, "pointerLockElement", {
      configurable: true,
      value: foreignOwner,
    });
    act(() => document.dispatchEvent(new Event("pointerlockchange")));
    const move = new MouseEvent("pointermove", { bubbles: true });
    Object.defineProperty(move, "movementX", { value: 100 });
    Object.defineProperty(move, "movementY", { value: 0 });
    act(() => document.dispatchEvent(move));

    expect(input?.value).toBe("5");
    expect(exitPointerLock).not.toHaveBeenCalled();
    view.unmount();
    Reflect.deleteProperty(HTMLElement.prototype, "requestPointerLock");
    Reflect.deleteProperty(document, "exitPointerLock");
    Reflect.deleteProperty(document, "pointerLockElement");
  });

  it("does not install drag listeners when pointer lock is unavailable", () => {
    Reflect.deleteProperty(HTMLElement.prototype, "requestPointerLock");
    Reflect.deleteProperty(document, "exitPointerLock");
    const addEventListener = vi.spyOn(document, "addEventListener");
    const view = render(<NumberDragInput aria-label="Threshold" defaultValue={5} />);
    const input = view.host.querySelector("input");
    const handle = view.host.querySelector('[data-test-id="input-trailing-items"] > div');

    expect(() =>
      act(() => handle?.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, button: 0 }))),
    ).not.toThrow();
    expect(input?.value).toBe("5");
    expect(addEventListener).not.toHaveBeenCalledWith("pointermove", expect.any(Function));
    view.unmount();
  });

  it("does not adjust read-only or disabled drag inputs", () => {
    const requestPointerLock = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "requestPointerLock", {
      configurable: true,
      value: requestPointerLock,
    });
    const view = render(
      <>
        <NumberDragInput aria-label="Read only" defaultValue={5} readOnly />
        <NumberDragInput aria-label="Disabled" defaultValue={5} disabled />
      </>,
    );
    const inputs = view.host.querySelectorAll("input");
    const handles = view.host.querySelectorAll('[data-test-id="input-trailing-items"] > div');

    act(() => {
      inputs[0]?.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowUp" }));
      handles[0]?.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, button: 0 }));
      handles[1]?.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, button: 0 }));
    });

    expect(inputs[0]?.value).toBe("5");
    expect(inputs[1]?.value).toBe("5");
    expect(requestPointerLock).not.toHaveBeenCalled();
    view.unmount();
    Reflect.deleteProperty(HTMLElement.prototype, "requestPointerLock");
  });
});

describe("useAutosizeInput", () => {
  function AutosizeHarness({ value }: { value: string }) {
    const ref = useAutosizeInput({ value });
    return (
      <input
        aria-label="Autosize"
        ref={ref}
        readOnly
        style={{ borderWidth: 1, paddingLeft: 2, paddingRight: 3 }}
        value={value}
      />
    );
  }

  it("resizes controlled values and removes its sizing element", () => {
    const width = vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(20);
    const view = render(<AutosizeHarness value="one" />);
    const input = view.host.querySelector("input");

    expect(input?.style.width).toBe("28px");
    view.rerender(<AutosizeHarness value="two" />);
    expect(input?.style.width).toBe("28px");
    expect(document.body.querySelectorAll('div[style*="white-space: pre"]')).toHaveLength(1);
    view.unmount();
    expect(document.body.querySelectorAll('div[style*="white-space: pre"]')).toHaveLength(0);
    width.mockRestore();
  });
});
