import { act, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => children,
  motion: { div: "div" },
  useReducedMotion: () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
}));

import { IndeterminateLoader } from "./loader";

window.matchMedia = vi.fn().mockReturnValue({ addEventListener: vi.fn(), matches: false, removeEventListener: vi.fn() });

class ResizeObserverMock {
  static instances: ResizeObserverMock[] = [];
  readonly disconnect = vi.fn();
  readonly observe = vi.fn((target: Element, options?: ResizeObserverOptions) => { void target; void options; });
  readonly unobserve = vi.fn((target: Element) => { void target; });
  constructor(readonly callback: ResizeObserverCallback) { ResizeObserverMock.instances.push(this); }
  trigger() {
    const entry: ResizeObserverEntry = {
      borderBoxSize: [], contentBoxSize: [], devicePixelContentBoxSize: [], contentRect: new DOMRectReadOnly(), target: document.createElement("div"),
    };
    this.callback([entry], this);
  }
}

describe("IndeterminateLoader", () => {
  afterEach(() => { vi.useRealTimers(); ResizeObserverMock.instances = []; });

  it("keeps the canonical progressbar defaults, native props, and variants", async () => {
    const host = document.createElement("div");
    const root = createRoot(host);
    await act(async () => root.render(<IndeterminateLoader aria-label="Saving changes" className="consumer" data-testid="loader" id="loader" variant="monochrome" />));
    const track = host.querySelector('[role="progressbar"]');
    expect(track?.getAttribute("aria-label")).toBe("Saving changes");
    expect(track?.id).toBe("loader");
    expect(track?.classList.contains("consumer")).toBe(true);
    expect(track?.className).toMatch(/monochrome/);
    expect(track?.querySelectorAll("span")).toHaveLength(3);
    await act(async () => root.unmount());
  });

  it("keeps native color forwarding and canonical vibrant track precedence", async () => {
    const host = document.createElement("div");
    const root = createRoot(host);
    await act(async () => root.render(
      <IndeterminateLoader color="#123456" style={{ color: "#abcdef", width: 240 }} />
    ));
    const track = host.querySelector<HTMLElement>('[role="progressbar"]');
    expect(track?.getAttribute("color")).toBe("#123456");
    expect(track?.style.getPropertyValue("--loader-track-color")).toBe("#123456");
    expect(track?.style.color).toBe("rgb(171, 205, 239)");
    expect(track?.style.width).toBe("240px");
    await act(async () => root.unmount());
  });

  it("keeps monochrome track and bars on currentColor unless native color replaces only the track", async () => {
    const host = document.createElement("div");
    const root = createRoot(host);
    await act(async () => root.render(
      <IndeterminateLoader style={{ color: "#abcdef" }} variant="monochrome" />
    ));
    let track = host.querySelector<HTMLElement>('[role="progressbar"]');
    expect(track?.style.getPropertyValue("--loader-track-color")).toBe("currentColor");
    expect(track?.style.color).toBe("rgb(171, 205, 239)");

    await act(async () => root.render(
      <IndeterminateLoader color="#123456" style={{ color: "#abcdef" }} variant="monochrome" />
    ));
    track = host.querySelector<HTMLElement>('[role="progressbar"]');
    expect(track?.getAttribute("color")).toBe("#123456");
    expect(track?.style.getPropertyValue("--loader-track-color")).toBe("#123456");
    expect(track?.style.color).toBe("rgb(171, 205, 239)");
    await act(async () => root.unmount());
  });

  it("rounds the visual tile width and interpolates timing from the observed track width", async () => {
    window.ResizeObserver = ResizeObserverMock;
    const host = document.createElement("div");
    const root = createRoot(host);
    await act(async () => root.render(<IndeterminateLoader />));
    const track = host.querySelector('[role="progressbar"]');
    expect(track).not.toBeNull();
    Object.defineProperty(track, "offsetWidth", { configurable: true, value: 128 });
    await act(async () => ResizeObserverMock.instances[0]?.trigger());
    const bars = track?.querySelectorAll("span span");
    const slowBar = bars?.item(0);
    const fastBar = bars?.item(1);
    expect(slowBar?.getAttribute("style")).toContain("2s");
    expect(fastBar?.getAttribute("style")).toContain("0.8s");
    await act(async () => root.unmount());
    expect(ResizeObserverMock.instances[0]?.observe).toHaveBeenCalled();
  });

  it("advances messages once each ten seconds, never wraps, and cleans up timers", async () => {
    vi.useFakeTimers();
    const host = document.createElement("div");
    const root = createRoot(host);
    await act(async () => root.render(<IndeterminateLoader messages={["First", "Second"]} />));
    expect(host.textContent).toContain("First");
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    await act(async () => { await vi.advanceTimersByTimeAsync(10_300); });
    expect(host.textContent).toContain("Second");
    await act(async () => { await vi.advanceTimersByTimeAsync(20_000); });
    expect(host.textContent).toContain("Second");
    await act(async () => root.unmount());
    expect(vi.getTimerCount()).toBe(0);
  });

  it("uses the no-motion path when reduced motion is requested", async () => {
    window.matchMedia = vi.fn().mockReturnValue({ addEventListener: vi.fn(), matches: true, removeEventListener: vi.fn() });
    const host = document.createElement("div");
    const root = createRoot(host);
    await act(async () => root.render(<IndeterminateLoader messages={["First", "Second"]} />));
    expect(host.querySelector('[role="progressbar"]')).not.toBeNull();
    await act(async () => root.unmount());
  });
});
