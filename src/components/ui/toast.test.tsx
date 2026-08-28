import { act, type HTMLAttributes, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { configureScrapsLocale, type ScrapsLocaleAdapter } from "../../lib/scraps-locale";

const motionProps = vi.hoisted(() => [] as Array<Record<string, unknown>>);
const sentryMocks = vi.hoisted(() => ({ captureException: vi.fn() }));

vi.mock("@sentry/react", () => sentryMocks);

vi.mock("framer-motion", async () => {
  const React = await import("react");
  return {
    motion: {
      div: React.forwardRef<
        HTMLDivElement,
        HTMLAttributes<HTMLDivElement> & Record<string, unknown>
      >(function MotionDiv({ animate, children, exit, initial, transition, ...props }, ref) {
        motionProps.push({ animate, exit, initial, transition });
        return React.createElement("div", { ...props, ref }, children as ReactNode);
      }),
    },
    useReducedMotion: () => false,
  };
});

import { Toast } from "./toast";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const roots: Root[] = [];
const localeRestores: Array<() => void> = [];

async function render(element: ReactNode) {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  roots.push(root);
  await act(async () => root.render(element));
  return host;
}

async function click(element: Element) {
  await act(async () => element.dispatchEvent(new MouseEvent("click", { bubbles: true })));
}

function indicator(overrides: Record<string, unknown> = {}) {
  return {
    id: "toast",
    message: "Saved",
    options: {},
    type: "success" as const,
    ...overrides,
  };
}

describe("Toast", () => {
  afterEach(async () => {
    for (const root of roots.splice(0)) await act(async () => root.unmount());
    document.body.replaceChildren();
    motionProps.splice(0);
    for (const restore of localeRestores.splice(0).reverse()) restore();
    vi.restoreAllMocks();
  });

  it("keeps the canonical motion, identity class, and closed runtime DOM", async () => {
    const host = await render(<Toast indicator={indicator()} onDismiss={() => undefined} />);
    const toast = host.querySelector('[data-test-id="toast-success"]');
    expect(toast?.className).toContain("ref-toast");
    expect(toast?.className).toContain("ref-success");
    expect(toast?.getAttribute("role")).toBeNull();
    expect(toast?.querySelector('[aria-label="Close"]')).toBeNull();
    expect(motionProps).toContainEqual({
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 70 },
      initial: { opacity: 0, y: 70 },
      transition: { damping: 25, stiffness: 450, type: "spring" },
    });
  });

  it("renders canonical type rails, icons, and default types", async () => {
    const host = await render(
      <div>
        <Toast indicator={indicator({ type: "loading" })} onDismiss={() => undefined} />
        <Toast indicator={indicator({ type: "error" })} onDismiss={() => undefined} />
        <Toast indicator={indicator({ type: "undo" })} onDismiss={() => undefined} />
        <Toast indicator={indicator({ type: "" })} onDismiss={() => undefined} />
      </div>,
    );
    expect(host.querySelector('[data-test-id="loading-indicator"] > div')).not.toBeNull();
    expect(
      host.querySelector('[data-test-id="toast-error"] svg path')?.getAttribute("d"),
    ).toContain("M6.81 0.65");
    expect(
      host.querySelector('[data-test-id="toast-loading"] [data-slot="toast-icon"]'),
    ).not.toBeNull();
    expect(host.querySelector('[data-test-id="toast-undo"] [data-slot="toast-icon"]')).toBeNull();
    expect(host.querySelector('[data-test-id="toast"] [data-slot="toast-icon"]')).toBeNull();
  });

  it("reports an unknown runtime type without inventing an icon", async () => {
    const host = await render(
      <Toast indicator={indicator({ type: "warning" })} onDismiss={() => undefined} />,
    );

    expect(sentryMocks.captureException).toHaveBeenCalledOnce();
    expect(sentryMocks.captureException).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Unknown toast type: warning" }),
    );
    expect(host.querySelector('[data-slot="toast-icon"]')).toBeNull();
  });

  it("calls dismiss with the indicator and honors disableDismiss", async () => {
    const dismiss = vi.fn();
    const value = indicator();
    const host = await render(<Toast indicator={value} onDismiss={dismiss} />);
    await click(host.querySelector('[data-test-id="toast-success"]')!);
    expect(dismiss).toHaveBeenCalledWith(
      value,
      expect.objectContaining({ nativeEvent: expect.any(MouseEvent) }),
    );
    const disabled = await render(
      <Toast indicator={indicator({ options: { disableDismiss: true } })} onDismiss={dismiss} />,
    );
    await click(disabled.querySelector('[data-test-id="toast-success"]')!);
    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it("renders undo for every type and lets its click bubble", async () => {
    const dismiss = vi.fn();
    const undo = vi.fn();
    const host = await render(
      <Toast indicator={indicator({ options: { undo }, type: "success" })} onDismiss={dismiss} />,
    );
    await click(host.querySelector('[data-slot="button"]')!);
    expect(undo).toHaveBeenCalledTimes(1);
    expect(dismiss).toHaveBeenCalledTimes(1);
    expect(host.querySelector('[data-slot="button"] svg path')?.getAttribute("d")).toContain(
      "M8 16C3.58",
    );
  });

  it("delegates the Undo label to the shared host locale adapter", async () => {
    const adapter: ScrapsLocaleAdapter = {
      t: (message) => (message === "Undo" ? "Annuler" : message),
      tct: (message) => message,
    };
    localeRestores.push(configureScrapsLocale(adapter));

    const host = await render(
      <Toast
        indicator={indicator({ options: { undo: () => undefined } })}
        onDismiss={() => undefined}
      />,
    );

    expect(host.querySelector('[data-slot="button"]')?.textContent).toContain("Annuler");
  });

  it("preserves React messages and the canonical text-overflow layout", async () => {
    const host = await render(
      <Toast
        indicator={indicator({ message: <strong>Saved</strong> })}
        onDismiss={() => undefined}
      />,
    );
    const message = host.querySelector("strong")?.parentElement;
    expect(message?.className).toContain("overflow-hidden");
    expect(message?.className).toContain("text-ellipsis");
    expect(message?.className).toContain("whitespace-nowrap");
    expect(message?.className).toContain("leading-[1.2]");
  });
});
