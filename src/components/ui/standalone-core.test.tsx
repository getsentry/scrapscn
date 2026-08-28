import { act, useEffect, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FeatureBadge } from "./badge";
import { BoundaryContextProvider, useBoundaryContext } from "./boundary-context";
import { ControlContext } from "./compact-select-support";
import { DateTimeProvider, useClockDisplay, useTimezone } from "./datetime";
import { OverlayTrigger } from "./overlay-trigger";
import { SizeProvider, useSizeContext } from "./size-context";
import { TrackingContextProvider, useClickTracking, type TrackingProps } from "./tracking-context";
import { TranslationContextProvider, useTranslation } from "./translation-context";
import { useIsInsideInteractiveElement } from "./use-is-inside-interactive-element";
import { useScrollLock } from "./use-scroll-lock";

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

function ContextProbe() {
  const { t, tct } = useTranslation();
  return (
    <span>
      {useTimezone()}|{useClockDisplay()}|{t("translated")}|{tct("template", {})}|
      {useBoundaryContext()}|{useSizeContext()}
    </span>
  );
}

describe("standalone regular Scraps APIs", () => {
  it("provides date-time, boundary, size, and translation values", async () => {
    const host = await render(
      <DateTimeProvider value={{ clockDisplay: "24", timezone: "America/Toronto" }}>
        <BoundaryContextProvider value="modal">
          <SizeProvider size="md">
            <TranslationContextProvider value={{ t: () => "traduit", tct: () => "gabarit" }}>
              <ContextProbe />
            </TranslationContextProvider>
          </SizeProvider>
        </BoundaryContextProvider>
      </DateTimeProvider>,
    );
    expect(host.textContent).toBe("America/Toronto|24|traduit|gabarit|modal|md");
  });

  it("applies CompactSelect context to both overlay trigger forms", async () => {
    const host = await render(
      <ControlContext
        value={{ disabled: true, overlayIsOpen: true, search: "", searchable: false, size: "sm" }}
      >
        <OverlayTrigger.Button aria-expanded={false} className="consumer-class" prefix="Scope">
          Projects
        </OverlayTrigger.Button>
        <OverlayTrigger.IconButton aria-label="Projects" icon={<span>Icon</span>} />
      </ControlContext>,
    );
    const buttons = host.querySelectorAll("button");
    expect(buttons).toHaveLength(2);
    for (const button of buttons) {
      expect(button.disabled).toBe(true);
      expect(button.getAttribute("data-size")).toBe("sm");
    }
    expect(buttons[0]?.getAttribute("aria-expanded")).toBe("false");
    expect(buttons[1]?.getAttribute("aria-expanded")).toBe("true");
    expect(buttons[0]?.className).toContain("consumer-class");
    expect(host.textContent).toContain("Projects");
    const prefix = Array.from(buttons[0]?.querySelectorAll("span") ?? []).find(
      (element) => element.textContent === "Scope",
    );
    expect(prefix?.className).toContain("after:content-[':']");
    expect(buttons[0]?.getAttribute("aria-haspopup")).toBe("true");
    expect(buttons[0]?.querySelector("svg")?.getAttribute("class")).toContain("rotate-180");
    expect(host.querySelectorAll("svg")).toHaveLength(1);
  });

  it("connects translated components to TranslationContextProvider", async () => {
    await render(
      <TranslationContextProvider
        value={{
          t: (message) =>
            message === "This feature is in beta and may change" ? "Version bêta" : message,
          tct: (template) => template,
        }}
      >
        <FeatureBadge tooltipProps={{ forceVisible: true }} type="beta" />
      </TranslationContextProvider>,
    );
    expect(document.querySelector('[role="tooltip"]')?.textContent).toBe("Version bêta");
  });

  it("tracks clicks through TrackingContextProvider", async () => {
    const events: TrackingProps[] = [];

    function TrackingProbe() {
      const { handleClick } = useClickTracking<HTMLButtonElement>(
        { analyticsEventName: "clicked", children: "Track", variant: "primary" },
        "button",
      );
      return <button onClick={handleClick}>Track</button>;
    }

    const host = await render(
      <TrackingContextProvider value={() => (event) => events.push(event)}>
        <TrackingProbe />
      </TrackingContextProvider>,
    );
    await act(async () => host.querySelector("button")?.click());
    expect(events).toEqual([
      expect.objectContaining({
        "aria-label": "Track",
        analyticsEventName: "clicked",
        analyticsParams: { variant: "primary" },
        clickType: "button",
      }),
    ]);
  });

  it("detects an interactive ancestor", async () => {
    function InteractiveProbe() {
      const { isInsideInteractiveElement, ref } =
        useIsInsideInteractiveElement<HTMLSpanElement>(undefined);
      return <span data-inside={isInsideInteractiveElement} ref={ref} />;
    }

    const host = await render(
      <button type="button">
        <InteractiveProbe />
      </button>,
    );
    expect(host.querySelector("span")?.getAttribute("data-inside")).toBe("true");
  });

  it("shares and restores a scroll lock for a container", async () => {
    const container = document.createElement("div");
    container.style.overflow = "auto";
    document.body.append(container);
    const heldStates: boolean[] = [];

    function LockProbe() {
      const lock = useScrollLock(container);
      useEffect(() => {
        lock.acquire();
        heldStates.push(lock.held());
        return lock.release;
      }, [lock]);
      return null;
    }

    await render(<LockProbe />);
    expect(container.style.overflow).toBe("hidden");
    expect(heldStates).toEqual([true]);
    await act(async () => roots.pop()?.unmount());
    expect(container.style.overflow).toBe("auto");
  });

  it("keeps a shared container locked until every owner releases it", async () => {
    const container = document.createElement("div");
    container.style.overflow = "scroll";
    document.body.append(container);

    function LockProbe() {
      const lock = useScrollLock(container);
      useEffect(() => {
        lock.acquire();
        return lock.release;
      }, [lock]);
      return null;
    }

    await render(<LockProbe />);
    const firstRoot = roots.at(-1)!;
    await render(<LockProbe />);
    const secondRoot = roots.at(-1)!;
    expect(container.style.overflow).toBe("hidden");

    await act(async () => firstRoot.unmount());
    roots.splice(roots.indexOf(firstRoot), 1);
    expect(container.style.overflow).toBe("hidden");

    await act(async () => secondRoot.unmount());
    roots.splice(roots.indexOf(secondRoot), 1);
    expect(container.style.overflow).toBe("scroll");
  });

  it("restores body geometry and scroll position", async () => {
    const originalInnerWidth = window.innerWidth;
    const originalClientWidth = document.body.clientWidth;
    const originalScrollX = window.scrollX;
    const originalScrollY = window.scrollY;
    Object.defineProperties(window, {
      innerWidth: { configurable: true, value: 1200 },
      scrollX: { configurable: true, value: 100 },
      scrollY: { configurable: true, value: 240 },
    });
    Object.defineProperty(document.body, "clientWidth", { configurable: true, value: 1180 });
    document.body.style.paddingRight = "10px";
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);

    function BodyLockProbe() {
      const lock = useScrollLock(document.body);
      useEffect(() => {
        lock.acquire();
        return lock.release;
      }, [lock]);
      return null;
    }

    await render(<BodyLockProbe />);
    expect(document.body.style.position).toBe("fixed");
    expect(document.body.style.top).toBe("-240px");
    expect(document.body.style.paddingRight).toBe("30px");
    await act(async () => roots.pop()?.unmount());
    expect(document.body.style.position).toBe("");
    expect(document.body.style.paddingRight).toBe("10px");
    await act(async () => new Promise(requestAnimationFrame));
    expect(scrollTo).toHaveBeenCalledWith(100, 240);

    scrollTo.mockRestore();
    Object.defineProperties(window, {
      innerWidth: { configurable: true, value: originalInnerWidth },
      scrollX: { configurable: true, value: originalScrollX },
      scrollY: { configurable: true, value: originalScrollY },
    });
    Object.defineProperty(document.body, "clientWidth", {
      configurable: true,
      value: originalClientWidth,
    });
  });

  it("supports idempotent acquisition, independent containers, and reacquisition", async () => {
    type ScrollLock = ReturnType<typeof useScrollLock>;
    const firstContainer = document.createElement("div");
    const secondContainer = document.createElement("div");
    firstContainer.style.overflow = "auto";
    secondContainer.style.overflow = "scroll";
    document.body.append(firstContainer, secondContainer);
    const controls: ScrollLock[] = [];

    function ControlsProbe({ container }: { container: HTMLElement }) {
      const lock = useScrollLock(container);
      useEffect(() => {
        controls.push(lock);
      }, [lock]);
      return null;
    }

    await render(
      <>
        <ControlsProbe container={firstContainer} />
        <ControlsProbe container={secondContainer} />
      </>,
    );
    const [first, second] = controls;
    await act(async () => {
      first?.acquire();
      first?.acquire();
    });
    expect(firstContainer.style.overflow).toBe("hidden");
    expect(secondContainer.style.overflow).toBe("scroll");
    await act(async () => second?.acquire());
    expect(secondContainer.style.overflow).toBe("hidden");
    await act(async () => first?.release());
    expect(firstContainer.style.overflow).toBe("auto");
    expect(secondContainer.style.overflow).toBe("hidden");
    await act(async () => {
      first?.acquire();
      first?.release();
      second?.release();
    });
    expect(firstContainer.style.overflow).toBe("auto");
    expect(secondContainer.style.overflow).toBe("scroll");
  });
});
