import { act, createRef, type HTMLAttributes, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

const motionRenderProps = vi.hoisted(
  () =>
    [] as Array<{
      animate: unknown;
      children: ReactNode;
      exit: unknown;
      initial: unknown;
      transition: unknown;
    }>,
);
const reducedMotion = vi.hoisted(() => ({ matches: false }));

vi.mock("framer-motion", async () => {
  const React = await import("react");

  return {
    motion: {
      div: React.forwardRef<
        HTMLDivElement,
        HTMLAttributes<HTMLDivElement> & {
          animate?: unknown;
          exit?: unknown;
          initial?: unknown;
          transition?: unknown;
        }
      >(function MotionDiv({ animate, children, exit, initial, transition, ...props }, ref) {
        motionRenderProps.push({
          animate,
          children,
          exit,
          initial,
          transition,
        });
        return React.createElement("div", { ...props, ref }, children);
      }),
    },
    useReducedMotion: () => reducedMotion.matches,
  };
});

import { useBoundaryContext } from "./boundary-context";
import { SlideOverPanel } from "./slide-over-panel";
import {
  NAVIGATION_DESKTOP_BREAKPOINT,
  NAVIGATION_MOBILE_CONTENT_HEIGHT,
  PRIMARY_HEADER_HEIGHT,
  SlideOverPanelEnvironmentProvider,
  SUPERUSER_MARQUEE_HEIGHT,
} from "./slide-over-panel-environment";

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
  reducedMotion.matches = false;
  motionRenderProps.length = 0;
  for (const mounted of roots.splice(0)) {
    await act(async () => mounted.root.unmount());
    mounted.container.remove();
  }
});

describe("SlideOverPanel", () => {
  it("matches the canonical DOM filtering, label, data prop, class, and ref", async () => {
    const ref = createRef<HTMLDivElement>();
    const container = await render(
      <SlideOverPanel
        ariaLabel="Details"
        className="consumer"
        data-test-id="drawer"
        mode="passive"
        panelWidth="640px"
        position="left"
        ref={ref}
      >
        Panel
      </SlideOverPanel>,
    );
    const panel = container.querySelector<HTMLElement>("[role=complementary]");

    expect(panel?.getAttribute("aria-hidden")).toBe("false");
    expect(panel?.getAttribute("aria-label")).toBe("Details");
    expect(panel?.getAttribute("data-test-id")).toBe("drawer");
    expect(panel?.getAttribute("mode")).toBe("passive");
    expect(panel?.hasAttribute("position")).toBe(false);
    expect(panel?.hasAttribute("panelwidth")).toBe(false);
    expect(panel?.hasAttribute("top")).toBe(false);
    expect(panel?.hasAttribute("data-mode")).toBe(false);
    expect(panel?.hasAttribute("data-position")).toBe(false);
    expect(panel?.classList.contains("consumer")).toBe(true);
    expect(panel?.style.getPropertyValue("--scraps-slide-over-panel-width")).toBe("640px");
    expect(ref.current).toBe(panel);
  });

  it("defers ordinary children on the first render", async () => {
    await render(<SlideOverPanel>Deferred content</SlideOverPanel>);

    expect(motionRenderProps[0]?.children).toBeNull();
    expect(motionRenderProps.at(-1)?.children).not.toBeNull();
  });

  it("passes true then false to the render function while opening", async () => {
    const states: boolean[] = [];
    await render(
      <SlideOverPanel>
        {({ isOpening }) => {
          states.push(isOpening);
          return <span>{String(isOpening)}</span>;
        }}
      </SlideOverPanel>,
    );

    expect(states[0]).toBe(true);
    expect(states.at(-1)).toBe(false);
  });

  it("uses the canonical right animation when position is omitted", async () => {
    await render(<SlideOverPanel>Panel</SlideOverPanel>);

    expect(motionRenderProps[0]?.initial).toEqual({
      opacity: 0,
      transform: "translateX(100%) translateY(0)",
    });
    expect(motionRenderProps[0]?.exit).toEqual({
      opacity: 0,
      transform: "translateX(100%) translateY(0)",
    });
  });

  it("uses the real moderate spring unless reduced motion is requested", async () => {
    await render(<SlideOverPanel>Panel</SlideOverPanel>);
    expect(motionRenderProps[0]?.transition).toEqual({
      damping: 50,
      stiffness: 1000,
      type: "spring",
    });

    const priorRenderCount = motionRenderProps.length;
    reducedMotion.matches = true;
    await render(<SlideOverPanel>Reduced panel</SlideOverPanel>);
    const reducedPanel = motionRenderProps.slice(priorRenderCount).at(-1);
    expect(reducedPanel?.transition).toEqual({ duration: 0 });
  });

  it.each([
    [true, false, "48px"],
    [false, false, "53px"],
    [true, true, "72px"],
    [false, true, "77px"],
  ] as const)(
    "uses the canonical navigation top offset for mobile=%s superuser=%s",
    async (isMobile, showSuperuserWarning, expected) => {
      const container = await render(
        <SlideOverPanelEnvironmentProvider
          isMobile={isMobile}
          showSuperuserWarning={showSuperuserWarning}
        >
          <SlideOverPanel mode="passive">Panel</SlideOverPanel>
        </SlideOverPanelEnvironmentProvider>,
      );
      const panel = container.querySelector<HTMLElement>("[role=complementary]");

      expect(panel?.style.getPropertyValue("--scraps-slide-over-panel-top")).toBe(expected);
    },
  );

  it("keeps the pinned navigation constants", () => {
    expect(NAVIGATION_MOBILE_CONTENT_HEIGHT).toBe(48);
    expect(PRIMARY_HEADER_HEIGHT).toBe(53);
    expect(SUPERUSER_MARQUEE_HEIGHT).toBe(24);
    expect(NAVIGATION_DESKTOP_BREAKPOINT).toBe(992);
  });

  it("provides the panel id through the canonical boundary context", async () => {
    function BoundaryConsumer() {
      return <span data-boundary-id>{useBoundaryContext()}</span>;
    }

    const container = await render(
      <SlideOverPanel>
        <BoundaryConsumer />
      </SlideOverPanel>,
    );
    const panel = container.querySelector<HTMLElement>("[role=complementary]");
    const boundaryId = container.querySelector("[data-boundary-id]")?.textContent;

    expect(boundaryId).toBe(panel?.id);
    expect(document.getElementById(boundaryId ?? "")).toBe(panel);
  });
});
