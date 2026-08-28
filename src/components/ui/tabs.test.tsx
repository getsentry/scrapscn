import { act, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TabList, TabPanels, Tabs } from "./tabs";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
Object.defineProperty(HTMLElement.prototype, "scrollTo", {
  configurable: true,
  value: vi.fn(),
});
const roots: ReturnType<typeof createRoot>[] = [];

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
}

async function render(node: ReactNode) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  await act(async () => root.render(node));
  return container;
}

afterEach(async () => {
  await act(async () => roots.splice(0).forEach((root) => root.unmount()));
  document.body.replaceChildren();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Tabs", () => {
  it("renders the canonical list/item/panels API and changes selection", async () => {
    const onChange = vi.fn();
    const container = await render(
      <Tabs defaultValue="first" onChange={onChange}>
        <TabList>
          <TabList.Item key="first">First</TabList.Item>
          <TabList.Item key="second">Second</TabList.Item>
        </TabList>
        <TabPanels>
          <TabPanels.Item key="first">First panel</TabPanels.Item>
          <TabPanels.Item key="second">Second panel</TabPanels.Item>
        </TabPanels>
      </Tabs>,
    );
    const tabs = container.querySelectorAll<HTMLElement>('[role="tab"]');
    expect(tabs).toHaveLength(2);
    expect(tabs[0]?.getAttribute("aria-selected")).toBe("true");
    expect(container.querySelector('[role="tabpanel"]')?.textContent).toBe("First panel");
    await act(async () => tabs[1]?.click());
    expect(onChange).toHaveBeenCalledWith("second");
    expect(container.querySelector('[role="tabpanel"]')?.textContent).toBe("Second panel");
  });

  it("supports vertical, floating, disabled, and hidden tabs", async () => {
    const container = await render(
      <Tabs defaultValue={1} orientation="vertical" size="xs">
        <TabList variant="floating">
          <TabList.Item key={1}>Visible</TabList.Item>
          <TabList.Item disabled key={2}>
            Disabled
          </TabList.Item>
          <TabList.Item hidden key={3}>
            Hidden
          </TabList.Item>
        </TabList>
        <TabPanels>
          <TabPanels.Item key={1}>Visible panel</TabPanels.Item>
          <TabPanels.Item key={2}>Disabled panel</TabPanels.Item>
          <TabPanels.Item key={3}>Hidden panel</TabPanels.Item>
        </TabPanels>
      </Tabs>,
    );
    expect(container.firstElementChild?.getAttribute("data-orientation")).toBe("vertical");
    expect(container.querySelector('[data-variant="floating"]')).not.toBeNull();
    expect(container.querySelector('[aria-disabled="true"]')).not.toBeNull();
    expect(
      [...container.querySelectorAll<HTMLElement>('[role="tab"]')].find(
        (tab) => tab.textContent === "Hidden",
      )?.hidden,
    ).toBe(true);
  });

  it("moves a contiguous suffix into the overflow menu and selects it", async () => {
    const frames: FrameRequestCallback[] = [];
    class TestResizeObserver implements ResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        void callback;
      }
      disconnect() {}
      observe() {}
      unobserve() {}
    }
    vi.stubGlobal("ResizeObserver", TestResizeObserver);
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      frames.push(callback);
      return frames.length;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(
      function (this: HTMLElement) {
        return this.querySelector(":scope > [role='tablist']") ? 260 : 0;
      },
    );
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function (this: HTMLElement) {
        const width = this.getAttribute("role") === "tab" ? 100 : 0;
        return {
          bottom: 0,
          height: 0,
          left: 0,
          right: width,
          toJSON: () => ({}),
          top: 0,
          width,
          x: 0,
          y: 0,
        };
      },
    );

    function OverflowHarness() {
      const [disableOverflow, setDisableOverflow] = useState(false);
      return (
        <MemoryRouter initialEntries={["/details"]}>
          <button type="button" onClick={() => setDisableOverflow(true)}>
            Disable overflow
          </button>
          <LocationProbe />
          <Tabs defaultValue="details" disableOverflow={disableOverflow}>
            <TabList>
              <TabList.Item key="details">Details</TabList.Item>
              <TabList.Item key="activity">Activity</TabList.Item>
              <TabList.Item key="feedback">User Feedback</TabList.Item>
              <TabList.Item key="attachments" to="/attachments">
                Attachments
              </TabList.Item>
            </TabList>
            <TabPanels>
              <TabPanels.Item key="details">Details panel</TabPanels.Item>
              <TabPanels.Item key="activity">Activity panel</TabPanels.Item>
              <TabPanels.Item key="feedback">Feedback panel</TabPanels.Item>
              <TabPanels.Item key="attachments">Attachments panel</TabPanels.Item>
            </TabPanels>
          </Tabs>
        </MemoryRouter>
      );
    }

    const container = await render(<OverflowHarness />);
    await act(async () => frames.splice(0).forEach((callback) => callback(0)));

    const trigger = [...container.querySelectorAll<HTMLButtonElement>("button")].find(
      (button) => button.getAttribute("aria-label") === "More tabs",
    );
    expect(trigger).toBeDefined();
    await act(async () => trigger?.click());
    const options = [...document.querySelectorAll<HTMLElement>('[role="option"]')];
    expect(options.map((option) => option.textContent)).toEqual(["User Feedback", "Attachments"]);
    await act(async () => options[1]?.click());
    expect(container.querySelector('[role="tabpanel"]')?.textContent).toBe("Attachments panel");
    expect(container.querySelector('[data-testid="location"]')?.textContent).toBe("/attachments");

    await act(async () => {
      [...container.querySelectorAll<HTMLButtonElement>("button")]
        .find((button) => button.textContent === "Disable overflow")
        ?.click();
    });
    expect(
      [...container.querySelectorAll<HTMLButtonElement>("button")].find(
        (button) => button.getAttribute("aria-label") === "More tabs",
      ),
    ).toBeUndefined();
    expect(
      [...container.querySelectorAll<HTMLElement>('[role="tab"]')].every(
        (tab) => !tab.classList.contains("hidden"),
      ),
    ).toBe(true);
  });

  it("navigates a link tab selected with the keyboard", async () => {
    vi.stubGlobal("CSS", { escape: (value: string) => value });
    const container = await render(
      <MemoryRouter initialEntries={["/first"]}>
        <LocationProbe />
        <Tabs defaultValue="first">
          <TabList>
            <TabList.Item key="first">First</TabList.Item>
            <TabList.Item key="second" to="/second">
              Second
            </TabList.Item>
          </TabList>
          <TabPanels>
            <TabPanels.Item key="first">First panel</TabPanels.Item>
            <TabPanels.Item key="second">Second panel</TabPanels.Item>
          </TabPanels>
        </Tabs>
      </MemoryRouter>,
    );
    const tabs = container.querySelectorAll<HTMLElement>('[role="tab"]');
    tabs[0]?.focus();
    await act(async () => {
      tabs[0]?.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));
      tabs[0]?.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: "ArrowRight" }));
    });
    expect(document.activeElement).toBe(tabs[1]);
    await act(async () => {
      tabs[1]?.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
      tabs[1]?.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: "Enter" }));
    });
    expect(container.querySelector('[data-testid="location"]')?.textContent).toBe("/second");
  });

  it("navigates a touch-selected link tab once", async () => {
    vi.stubGlobal("CSS", { escape: (value: string) => value });
    const container = await render(
      <MemoryRouter initialEntries={["/first"]}>
        <Tabs defaultValue="first">
          <TabList>
            <TabList.Item key="first">First</TabList.Item>
            <TabList.Item key="second" to="/second">
              Second
            </TabList.Item>
          </TabList>
          <TabPanels>
            <TabPanels.Item key="first">First panel</TabPanels.Item>
            <TabPanels.Item key="second">Second panel</TabPanels.Item>
          </TabPanels>
        </Tabs>
      </MemoryRouter>,
    );
    const secondTab = container.querySelectorAll<HTMLElement>('[role="tab"]')[1];
    const link = secondTab?.querySelector<HTMLAnchorElement>("a");
    const clicks = vi.fn();
    link?.addEventListener("click", clicks);
    const pointerDown = new MouseEvent("pointerdown", { bubbles: true });
    Object.defineProperty(pointerDown, "pointerType", { value: "touch" });

    await act(async () => {
      link?.dispatchEvent(pointerDown);
      link?.click();
    });

    expect(clicks).toHaveBeenCalledTimes(1);
    expect(secondTab?.getAttribute("aria-selected")).toBe("true");
  });
});
