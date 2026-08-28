import {
  computePosition,
  type Middleware,
  type MiddlewareState,
  type Placement,
} from "@floating-ui/dom";
import { Item, Section } from "@react-stately/collections";
import { useListState } from "@react-stately/list";
import { act, useState, type FormEvent, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { BoundaryContextProvider } from "./boundary-context";
import {
  CompactSelect,
  CompositeSelect,
  HighlightText,
  ListBox,
  MenuComponents,
  getDisabledOptions,
  getEscapedKey,
  getHiddenOptions,
  getItemsWithKeys,
  itemIsSectionWithKey,
} from "./compact-select";
import { GridList } from "./compact-select-support";

vi.mock("@floating-ui/dom", async (importActual) => ({
  ...(await importActual<typeof import("@floating-ui/dom")>()),
  autoUpdate: vi.fn(() => () => {}),
  computePosition: vi.fn(async (_reference, _floating, options) => {
    const sizeMiddleware = options?.middleware?.find(
      (middleware: false | Middleware | null | undefined): middleware is Middleware =>
        Boolean(middleware && middleware.name === "size"),
    );
    if (
      sizeMiddleware?.options &&
      typeof sizeMiddleware.options === "object" &&
      "apply" in sizeMiddleware.options &&
      typeof sizeMiddleware.options.apply === "function"
    ) {
      const boundary = sizeMiddleware.options.boundary;
      const boundaryRect = boundary instanceof Element ? boundary.getBoundingClientRect() : null;
      sizeMiddleware.options.apply({
        availableHeight: boundaryRect?.height || 180,
        availableWidth: boundaryRect?.width || 300,
      });
    }
    return {
      middlewareData: {},
      placement: options?.placement ?? "bottom-start",
      strategy: options?.strategy ?? "absolute",
      x: 12,
      y: 24,
    };
  }),
}));

class NoopResizeObserver implements ResizeObserver {
  constructor(private callback: ResizeObserverCallback) {}
  disconnect() {}
  observe(target: Element) {
    this.callback(
      [
        {
          borderBoxSize: [{ blockSize: 240, inlineSize: 300 }],
          contentBoxSize: [{ blockSize: 240, inlineSize: 300 }],
          contentRect: new DOMRect(0, 0, 300, 240),
          devicePixelContentBoxSize: [{ blockSize: 240, inlineSize: 300 }],
          target,
        },
      ],
      this,
    );
  }
  unobserve() {}
}

Object.assign(globalThis, {
  IS_REACT_ACT_ENVIRONMENT: true,
  ResizeObserver: NoopResizeObserver,
});

Object.defineProperty(HTMLElement.prototype, "scrollTo", {
  configurable: true,
  value: vi.fn(),
});

function isMiddleware(value: false | Middleware | null | undefined): value is Middleware {
  return Boolean(value && typeof value === "object" && "name" in value);
}

async function resolveFlipPlacement(
  middleware: Middleware,
  getOverflow: (placement: Placement) => {
    bottom: number;
    left: number;
    right: number;
    top: number;
  } = (placement) =>
    placement.startsWith("bottom")
      ? { bottom: 10, left: -10, right: -10, top: -10 }
      : placement === "top-start"
        ? { bottom: -10, left: -10, right: 10, top: -10 }
        : { bottom: -10, left: -10, right: -10, top: -10 },
) {
  let placement: Placement = "bottom-start";
  let middlewareData: MiddlewareState["middlewareData"] = {};
  const reference = document.createElement("button");
  const floating = document.createElement("div");
  for (let attempt = 0; attempt < 16; attempt += 1) {
    const result = await middleware.fn({
      elements: { floating, reference },
      initialPlacement: "bottom-start",
      middlewareData,
      placement,
      platform: {
        detectOverflow: async (state: MiddlewareState) => getOverflow(state.placement),
        isRTL: async () => false,
      } as unknown as MiddlewareState["platform"],
      rects: {
        floating: { height: 30, width: 40, x: 0, y: 0 },
        reference: { height: 10, width: 20, x: 0, y: 0 },
      },
      strategy: "absolute",
      x: 0,
      y: 0,
    });
    if (!result.reset) return placement;
    if (typeof result.reset !== "boolean" && result.reset.placement) {
      placement = result.reset.placement;
    }
    middlewareData = { ...middlewareData, [middleware.name]: result.data };
  }
  throw new Error("Flip middleware did not resolve a placement");
}

const views: Array<{ host: HTMLDivElement; root: Root }> = [];

async function render(node: ReactNode) {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  views.push({ host, root });
  await act(async () => root.render(node));
  return host;
}

async function click(element: Element | null) {
  expect(element).not.toBeNull();
  await act(async () => {
    element?.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    element?.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    element?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await Promise.resolve();
  });
}

async function pointerClick(element: Element, button = 0) {
  await act(async () => {
    element.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        button,
        cancelable: true,
      }),
    );
    element.dispatchEvent(new MouseEvent("click", { bubbles: true, button, cancelable: true }));
    await Promise.resolve();
  });
}

async function input(element: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  await act(async () => {
    setter?.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
    await Promise.resolve();
  });
}

async function keyDown(element: Element, key: string) {
  await act(async () => {
    element.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key }));
    await Promise.resolve();
  });
}

async function nextAnimationFrame() {
  await act(
    async () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      }),
  );
}

const harnessItems = [
  { key: "one", label: "One" },
  { key: "two", label: "Two" },
];

function CollectionHarness({
  disallowTypeAhead,
  focusEntry,
  grid = false,
  virtualized = true,
}: {
  disallowTypeAhead?: boolean;
  focusEntry?: "first" | "last";
  grid?: boolean;
  virtualized?: boolean;
}) {
  const listState = useListState({
    children: (item: (typeof harnessItems)[number]) => (
      <Item key={item.key} textValue={item.label}>
        {item.label}
      </Item>
    ),
    items: harnessItems,
    selectionMode: "single",
  });
  if (grid) {
    return (
      <GridList
        autoFocus={false}
        disabledBehavior="selection"
        disallowEmptySelection
        isVirtualized
        items={harnessItems}
        keyDownHandler={() => true}
        listState={listState}
        selectionMode="multiple"
        virtualized={virtualized}
      />
    );
  }
  return (
    <ListBox
      disallowTypeAhead={disallowTypeAhead}
      disallowEmptySelection
      listState={listState}
      overlayIsOpen
      selectionMode="multiple"
      virtualized={virtualized}
      UNSTABLE_focusOnEntry={focusEntry}
    />
  );
}

const sectionHarnessItems = [40, 60, 80].map((_, index) => ({
  key: `section-${index}`,
  label: `Section ${index + 1}`,
  options: [{ key: `option-${index}`, label: `Option ${index + 1}` }],
}));

function SectionGridHarness() {
  const listState = useListState({
    children: (section: (typeof sectionHarnessItems)[number]) => (
      <Section items={section.options} key={section.key} title={section.label}>
        {(option) => (
          <Item key={option.key} textValue={option.label}>
            {option.label}
          </Item>
        )}
      </Section>
    ),
    items: sectionHarnessItems,
    selectionMode: "single",
  });
  return (
    <GridList
      isVirtualized
      items={sectionHarnessItems}
      keyDownHandler={() => true}
      listState={listState}
      selectionMode="single"
      virtualized
    />
  );
}

describe("CompactSelect utilities", () => {
  it("preserves key generation, sections, disabled state, search scores, and limits", () => {
    expect(getEscapedKey("environment-123")).toBe("environment-123");
    expect(getEscapedKey("release.version")).toBe("release\\.version");
    expect(getEscapedKey(123)).toBe("\\31 23");

    const items = getItemsWithKeys([
      {
        key: "letters",
        label: "Letters",
        options: [
          { value: "alpha", label: "Alpha" },
          { value: "beta", label: "Beta", disabled: true },
        ],
      },
      { value: "gamma", label: "Gamma" },
    ]);
    expect(itemIsSectionWithKey(items[0]!)).toBe(true);
    expect(getDisabledOptions(items)).toEqual(["beta"]);
    const result = getHiddenOptions(items, "ga", 1);
    expect(result.hidden).toEqual(new Set(["alpha", "beta"]));
    expect(result.scores.get("gamma")).toBeGreaterThan(0);
  });

  it("uses the pinned fzf scoring order for exact and gapped matches", () => {
    const items = getItemsWithKeys([
      { value: "binary", label: "binary_path" },
      { value: "nested", label: "code.file.path" },
      { value: "exact", label: "path" },
      { value: "gapped", label: "a_bc" },
    ]);
    const pathMatches = getHiddenOptions(items, "path");
    expect(pathMatches.scores.get("exact")).toBeGreaterThan(pathMatches.scores.get("binary") ?? 0);
    expect(pathMatches.scores.get("exact")).toBeGreaterThan(pathMatches.scores.get("nested") ?? 0);
    expect(getHiddenOptions(items, "abc").hidden.has("gapped")).toBe(false);
  });

  it("highlights one case-insensitive contiguous match without changing its label", async () => {
    const host = await render(<HighlightText query="TWO" text="Option Two" />);
    const label = host.querySelector('[aria-label="Option Two"]');
    expect(label?.textContent).toBe("Option Two");
    expect(host.querySelector('[data-test-id="sqb-highlighted-match"]')?.textContent).toBe("Two");
  });
});

describe("CompactSelect", () => {
  beforeAll(() => {
    if (!("PointerEvent" in globalThis)) {
      Object.assign(globalThis, { PointerEvent: MouseEvent });
    }
    if (typeof globalThis.CSS === "undefined") {
      Object.defineProperty(globalThis, "CSS", {
        configurable: true,
        value: {
          escape: (value: string) => value.replace(/([^\w-])/g, "\\$1"),
        },
      });
    } else if (typeof CSS.escape !== "function") {
      Object.defineProperty(CSS, "escape", {
        configurable: true,
        value: (value: string) => value.replace(/([^\w-])/g, "\\$1"),
      });
    }
  });

  afterEach(async () => {
    for (const { host, root } of views.splice(0)) {
      await act(async () => root.unmount());
      host.remove();
    }
    vi.restoreAllMocks();
    await nextAnimationFrame();
  });

  it("updates a controlled single value, closes, and restores the trigger label", async () => {
    const changed = vi.fn();
    function Example() {
      const [value, setValue] = useState<string>();
      return (
        <CompactSelect
          options={[
            { value: "one", label: "Option One" },
            { value: "two", label: "Option Two", details: "Second choice" },
          ]}
          onChange={(option) => {
            changed(option);
            setValue(option.value);
          }}
          value={value}
        />
      );
    }
    const host = await render(<Example />);
    expect(host.querySelector("button")?.textContent).toContain("None");
    await click(host.querySelector("button"));
    const popup = host.querySelector('[data-slot="compact-select-popup"]');
    expect(popup?.querySelector('[role="listbox"]')).not.toBeNull();
    const option = popup?.querySelector('[role="option"][data-test-id="two"]');
    expect(option?.textContent).toContain("Second choice");
    await click(option ?? null);
    expect(changed).toHaveBeenCalledWith(
      expect.objectContaining({ label: "Option Two", value: "two" }),
    );
    expect(host.querySelector('[data-slot="compact-select-popup"]')).toBeNull();
    expect(host.querySelector("button")?.textContent).toContain("Option Two");
  });

  it("does not let deferred open focus override focus already inside the menu", async () => {
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      frames.push(callback);
      return frames.length;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
    const host = await render(
      <CompactSelect
        options={[
          { label: "One", value: "one" },
          { label: "Two", value: "two" },
        ]}
        onChange={() => {}}
        value="one"
      />,
    );
    await click(host.querySelector("button"));
    const second = host.querySelector<HTMLElement>('[role="option"][data-test-id="two"]')!;
    await act(async () => second.focus());
    await act(async () => {
      for (const callback of frames.splice(0)) callback(performance.now());
    });
    expect(document.activeElement).toBe(second);
  });

  it("commits an uncontrolled close before calling onClose on the next frame", async () => {
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      frames.push(callback);
      return frames.length;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
    const popupMountedWhenClosed: boolean[] = [];
    const hostRef: { current: HTMLDivElement | null } = { current: null };
    const host = await render(
      <CompactSelect
        onClose={() =>
          popupMountedWhenClosed.push(
            Boolean(hostRef.current?.querySelector('[data-slot="compact-select-popup"]')),
          )
        }
        options={[{ label: "One", value: "one" }]}
        onChange={() => {}}
        value="one"
      />,
    );
    hostRef.current = host;
    await click(host.querySelector("button"));
    await act(async () => {
      for (const callback of frames.splice(0)) callback(performance.now());
    });

    await click(host.querySelector('[role="option"]'));
    expect(host.querySelector('[data-slot="compact-select-popup"]')).toBeNull();
    expect(popupMountedWhenClosed).toEqual([]);
    await act(async () => {
      for (const callback of frames.splice(0)) callback(performance.now());
    });
    expect(popupMountedWhenClosed).toEqual([false]);
  });

  it("coalesces duplicate close requests from one handler", async () => {
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      frames.push(callback);
      return frames.length;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
    const closed = vi.fn();
    const openChanged = vi.fn();
    const host = await render(
      <CompactSelect
        menuBody={({ closeOverlay }) => (
          <button
            onClick={() => {
              closeOverlay();
              closeOverlay();
            }}
          >
            Close twice
          </button>
        )}
        onClose={closed}
        onOpenChange={openChanged}
        options={[{ label: "One", value: "one" }]}
        onChange={() => {}}
        value="one"
      />,
    );
    await click(host.querySelector("button"));
    openChanged.mockClear();

    await click(
      [...host.querySelectorAll("button")].find((button) => button.textContent === "Close twice")!,
    );
    expect(openChanged).toHaveBeenCalledOnce();
    expect(openChanged).toHaveBeenCalledWith(false);
    expect(closed).not.toHaveBeenCalled();
    await act(async () => {
      for (const callback of frames.splice(0)) callback(performance.now());
    });
    expect(closed).toHaveBeenCalledOnce();
  });

  it("keeps an initially controlled open value when control is removed", async () => {
    function Example() {
      const [controlled, setControlled] = useState(true);
      return (
        <>
          <button onClick={() => setControlled(false)}>Release control</button>
          <CompactSelect
            {...(controlled ? { isOpen: true } : {})}
            options={[{ label: "One", value: "one" }]}
            onChange={() => {}}
            value="one"
          />
        </>
      );
    }
    const host = await render(<Example />);
    expect(host.querySelector('[data-slot="compact-select-popup"]')).not.toBeNull();
    await click(
      [...host.querySelectorAll("button")].find(
        (button) => button.textContent === "Release control",
      )!,
    );
    expect(host.querySelector('[data-slot="compact-select-popup"]')).not.toBeNull();
  });

  it("keeps the last controlled open request when control is removed", async () => {
    const openChanged = vi.fn();
    function Example() {
      const [controlled, setControlled] = useState(true);
      return (
        <>
          <button onClick={() => setControlled(false)}>Release control</button>
          <CompactSelect
            {...(controlled ? { isOpen: false } : {})}
            onOpenChange={openChanged}
            options={[{ label: "One", value: "one" }]}
            onChange={() => {}}
            value="one"
          />
        </>
      );
    }
    const host = await render(<Example />);
    const selectTrigger = [...host.querySelectorAll("button")].find(
      (button) => button.textContent !== "Release control",
    )!;
    await click(selectTrigger);
    expect(openChanged).toHaveBeenCalledWith(true);
    expect(host.querySelector('[data-slot="compact-select-popup"]')).toBeNull();

    await click(
      [...host.querySelectorAll("button")].find(
        (button) => button.textContent === "Release control",
      )!,
    );
    expect(host.querySelector('[data-slot="compact-select-popup"]')).not.toBeNull();
  });

  it("keeps multiple selection open, renders checkboxes and a count, then clears", async () => {
    function Example() {
      const [value, setValue] = useState<string[]>([]);
      return (
        <CompactSelect
          clearable
          menuTitle="Projects"
          multiple
          options={[
            { value: "web", label: "Web" },
            { value: "api", label: "API" },
          ]}
          onChange={(options) => setValue(options.map((option) => option.value))}
          value={value}
        />
      );
    }
    const host = await render(<Example />);
    await click(host.querySelector("button"));
    await click(host.querySelector('[role="option"][data-test-id="web"]'));
    expect(host.querySelector('[data-slot="compact-select-popup"]')).not.toBeNull();
    await click(host.querySelector('[role="option"][data-test-id="api"]'));
    expect(host.querySelector("button")?.textContent).toContain("+1");
    expect(
      host.querySelectorAll('[role="option"] [data-slot="compact-select-selection-checkbox"]'),
    ).toHaveLength(2);
    expect(host.querySelectorAll('[role="option"] input')).toHaveLength(0);
    await click(
      [...host.querySelectorAll("button")].find((button) => button.textContent === "Clear") ?? null,
    );
    expect(host.querySelector('[data-slot="compact-select-popup"]')).not.toBeNull();
    expect(host.querySelector("button")?.textContent).toContain("None");
  });

  it("searches, highlights, excludes disabled options, and selects the only match with Enter", async () => {
    const changed = vi.fn();
    function Example() {
      const [value, setValue] = useState<string>();
      return (
        <CompactSelect
          search={{ highlight: true, placeholder: "Find project…" }}
          options={[
            { value: "web", label: "Web" },
            { value: "api", label: "API" },
            { value: "disabled", label: "Disabled API", disabled: true },
          ]}
          onChange={(option) => {
            changed(option);
            setValue(option.value);
          }}
          value={value}
        />
      );
    }
    const host = await render(<Example />);
    await click(host.querySelector("button"));
    const search = host.querySelector<HTMLInputElement>('[placeholder="Find project…"]')!;
    await input(search, "api");
    expect(host.querySelector('[role="option"][data-test-id="web"]')).toBeNull();
    expect(host.querySelector('[data-test-id="sqb-highlighted-match"]')?.textContent).toBe("API");
    await act(async () => {
      search.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
      await Promise.resolve();
    });
    expect(changed).toHaveBeenCalledWith(expect.objectContaining({ label: "API", value: "api" }));
  });

  it("bounds a searchable empty-query collection before React Aria builds virtual metadata", async () => {
    const host = await render(
      <CompactSelect
        search
        sizeLimit={5}
        options={Array.from({ length: 200 }, (_, index) => ({
          label: `Project ${index + 1}`,
          value: `project-${index + 1}`,
        }))}
        onChange={() => {}}
        value="project-1"
        virtualizeThreshold={0}
      />,
    );
    await click(host.querySelector("button"));
    const options = host.querySelectorAll('[role="option"]');
    expect(options.length).toBeGreaterThan(0);
    expect(options[0]?.getAttribute("aria-posinset")).toBe("1");
    for (const option of options) {
      expect(option.getAttribute("aria-setsize")).toBe("5");
      expect(Number(option.getAttribute("aria-posinset"))).toBeLessThanOrEqual(5);
    }
  });

  it("renders section headings, section toggles, custom triggers, and exact placement data", async () => {
    const host = await render(
      <CompactSelect
        multiple
        menuWidth={280}
        position="bottom-end"
        strategy="fixed"
        trigger={(props, open) => (
          <button {...props} data-custom-trigger="" type="button">
            Projects {open ? "open" : "closed"}
          </button>
        )}
        options={[
          {
            key: "active",
            label: "Active projects",
            showToggleAllButton: true,
            options: [
              { value: "web", label: "Web" },
              { value: "api", label: "API" },
            ],
          },
        ]}
        onChange={() => {}}
        value={new Array<string>()}
      />,
    );
    const trigger = host.querySelector("[data-custom-trigger]");
    expect(trigger?.getAttribute("aria-controls")).toBeNull();
    await click(trigger);
    expect(trigger?.getAttribute("aria-haspopup")).toBe("listbox");
    expect(trigger?.getAttribute("aria-controls")).not.toBeNull();
    expect(host.textContent).toContain("Active projects");
    expect(host.textContent).toContain("Select All");
    const positioner = host.querySelector<HTMLElement>('[data-slot="compact-select-positioner"]');
    const popup = host.querySelector<HTMLElement>('[data-slot="compact-select-popup"]');
    expect(positioner?.dataset.placement).toBe("bottom-end");
    expect(positioner?.style.position).toBe("fixed");
    expect(popup?.style.width).toBe("280px");
    const latestPositionCall = vi.mocked(computePosition).mock.calls.at(-1);
    expect(latestPositionCall?.[1]).toBe(positioner);
    expect(latestPositionCall?.[1]).not.toBe(popup);
    expect(positioner?.style.left).toBe("12px");
    expect(positioner?.style.top).toBe("24px");
    expect(positioner?.style.maxHeight).toBe("180px");
    expect(positioner?.style.maxWidth).toBe("300px");
    expect(popup?.style.maxHeight).toBe("min(32rem, 180px)");
    expect(popup?.style.maxWidth).toBe("min(270px, 100%)");
    await click(trigger);
    expect(trigger?.getAttribute("aria-controls")).toBeNull();
  });

  it("merges HeaderButton classes with its required header styles", async () => {
    const host = await render(
      <MenuComponents.HeaderButton className="consumer-header-action">
        Reset
      </MenuComponents.HeaderButton>,
    );
    const button = host.querySelector("button");
    expect(button?.classList.contains("consumer-header-action")).toBe(true);
    for (const className of ["-mx-1", "-my-2", "px-1", "font-normal"]) {
      expect(button?.classList.contains(className)).toBe(true);
    }
  });

  it("selects only enabled section options with Select All", async () => {
    function Example() {
      const [value, setValue] = useState<string[]>([]);
      return (
        <CompactSelect
          isOptionDisabled={(option) =>
            Boolean(option.disabled || option.value === "callback-disabled")
          }
          multiple
          onChange={(options) => setValue(options.map((option) => option.value))}
          options={[
            {
              key: "projects",
              label: "Projects",
              showToggleAllButton: true,
              options: [
                { label: "Enabled", value: "enabled" },
                {
                  disabled: true,
                  label: "Intrinsic disabled",
                  value: "intrinsic-disabled",
                },
                { label: "Callback disabled", value: "callback-disabled" },
              ],
            },
          ]}
          value={value}
        />
      );
    }
    const host = await render(<Example />);
    await click(host.querySelector("button"));
    const toggle = [...host.querySelectorAll("button")].find(
      (button) => button.textContent === "Select All",
    )!;
    await click(toggle);
    expect(
      host.querySelector('[role="option"][data-test-id="enabled"]')?.getAttribute("aria-selected"),
    ).toBe("true");
    for (const key of ["intrinsic-disabled", "callback-disabled"]) {
      const option = host.querySelector(`[role="option"][data-test-id="${key}"]`);
      expect(option?.getAttribute("aria-disabled")).toBe("true");
      expect(option?.getAttribute("aria-selected")).toBe("false");
    }
    expect(toggle.textContent).toBe("Unselect All");
    await click(toggle);
    expect(
      host.querySelector('[role="option"][data-test-id="enabled"]')?.getAttribute("aria-selected"),
    ).toBe("false");
  });

  it("translates Popper tether options into bounded Floating UI sizing", async () => {
    const tetherOffset = vi.fn(() => ({ altAxis: 5, mainAxis: 7 }));
    const host = await render(
      <CompactSelect
        options={[{ value: "web", label: "Web" }]}
        onChange={() => {}}
        preventOverflowOptions={{ altAxis: true, tether: true, tetherOffset }}
        value="web"
      />,
    );
    await click(host.querySelector("button"));
    const middleware = (vi.mocked(computePosition).mock.calls.at(-1)?.[2]?.middleware ?? []).filter(
      isMiddleware,
    );
    const shiftMiddleware = middleware.find((item) => item.name === "shift");
    expect(shiftMiddleware?.options?.limiter).toBeDefined();
    const offset = shiftMiddleware?.options?.limiter?.options?.offset;
    expect(
      typeof offset === "function"
        ? offset({
            placement: "bottom-start",
            rects: {
              floating: { height: 80, width: 120, x: 0, y: 0 },
              reference: { height: 32, width: 90, x: 0, y: 0 },
            },
          })
        : offset,
    ).toEqual({ crossAxis: 5, mainAxis: 7 });
    expect(tetherOffset).toHaveBeenCalled();
    expect(middleware.some((item) => item.name === "size")).toBe(true);

    const numericHost = await render(
      <CompactSelect
        options={[{ value: "api", label: "API" }]}
        onChange={() => {}}
        preventOverflowOptions={{ tetherOffset: 11 }}
        value="api"
      />,
    );
    await click(numericHost.querySelector("button"));
    const numericShift = (vi.mocked(computePosition).mock.calls.at(-1)?.[2]?.middleware ?? [])
      .filter(isMiddleware)
      .find((item) => item.name === "shift");
    expect(numericShift?.options?.limiter?.options?.offset).toEqual({
      crossAxis: 11,
      mainAxis: 11,
    });

    const numericCallback = vi.fn(() => 13);
    const callbackHost = await render(
      <CompactSelect
        options={[{ value: "worker", label: "Worker" }]}
        onChange={() => {}}
        preventOverflowOptions={{ tetherOffset: numericCallback }}
        value="worker"
      />,
    );
    await click(callbackHost.querySelector("button"));
    const callbackShift = (vi.mocked(computePosition).mock.calls.at(-1)?.[2]?.middleware ?? [])
      .filter(isMiddleware)
      .find((item) => item.name === "shift");
    const callbackOffset = callbackShift?.options?.limiter?.options?.offset;
    expect(
      typeof callbackOffset === "function"
        ? callbackOffset({
            placement: "bottom-start",
            rects: {
              floating: { height: 80, width: 120, x: 0, y: 0 },
              reference: { height: 32, width: 90, x: 0, y: 0 },
            },
          })
        : callbackOffset,
    ).toEqual({ crossAxis: 13, mainAxis: 13 });
    expect(numericCallback).toHaveBeenCalled();
  });

  it("uses the canonical context, main, and main-id overflow boundaries", async () => {
    const setBoundaryRect = (element: HTMLElement, height: number, width: number) => {
      vi.spyOn(element, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, width, height));
    };
    const assertPreventOverflowBoundary = (boundary: HTMLElement) => {
      const middleware = (
        vi.mocked(computePosition).mock.calls.at(-1)?.[2]?.middleware ?? []
      ).filter(isMiddleware);
      expect(middleware.find((item) => item.name === "flip")?.options?.boundary).toBeUndefined();
      for (const name of ["shift", "size"]) {
        expect(middleware.find((item) => item.name === name)?.options?.boundary).toBe(boundary);
      }
    };

    const main = document.createElement("main");
    setBoundaryRect(main, 96, 220);
    document.body.prepend(main);
    const mainHost = await render(
      <CompactSelect
        options={[{ label: "Main", value: "main" }]}
        onChange={() => {}}
        value="main"
      />,
    );
    await click(mainHost.querySelector("button"));
    assertPreventOverflowBoundary(main);
    expect(
      mainHost.querySelector<HTMLElement>('[data-slot="compact-select-positioner"]')?.style
        .maxHeight,
    ).toBe("96px");

    const explicitFlipHost = await render(
      <CompactSelect
        flipOptions={{ boundary: main }}
        options={[{ label: "Explicit flip", value: "explicit-flip" }]}
        onChange={() => {}}
        value="explicit-flip"
      />,
    );
    await click(explicitFlipHost.querySelector("button"));
    const explicitFlip = (vi.mocked(computePosition).mock.calls.at(-1)?.[2]?.middleware ?? [])
      .filter(isMiddleware)
      .find((item) => item.name === "flip");
    expect(explicitFlip?.options?.boundary).toBe(main);
    main.remove();

    const mainId = document.createElement("div");
    mainId.id = "main";
    setBoundaryRect(mainId, 84, 210);
    document.body.prepend(mainId);
    const mainIdHost = await render(
      <CompactSelect
        options={[{ label: "Main id", value: "main-id" }]}
        onChange={() => {}}
        value="main-id"
      />,
    );
    await click(mainIdHost.querySelector("button"));
    assertPreventOverflowBoundary(mainId);
    mainId.remove();

    const contextual = document.createElement("div");
    contextual.id = "compact-boundary";
    setBoundaryRect(contextual, 72, 180);
    document.body.prepend(contextual);
    const contextualHost = await render(
      <BoundaryContextProvider value={contextual.id}>
        <CompactSelect
          options={[{ label: "Context", value: "context" }]}
          onChange={() => {}}
          value="context"
        />
      </BoundaryContextProvider>,
    );
    await click(contextualHost.querySelector("button"));
    assertPreventOverflowBoundary(contextual);
    expect(
      contextualHost.querySelector<HTMLElement>('[data-slot="compact-select-positioner"]')?.style
        .maxHeight,
    ).toBe("72px");
    contextual.remove();
  });

  it("preserves Popper variation resolution for flip and auto placement", async () => {
    const defaultHost = await render(
      <CompactSelect
        options={[{ value: "default", label: "Default" }]}
        onChange={() => {}}
        position="bottom-start"
        value="default"
      />,
    );
    await click(defaultHost.querySelector("button"));
    const defaultFlip = (vi.mocked(computePosition).mock.calls.at(-1)?.[2]?.middleware ?? [])
      .filter(isMiddleware)
      .find((item) => item.name === "flip");
    expect(defaultFlip?.options?.flipAlignment).toBe(false);
    expect(await resolveFlipPlacement(defaultFlip!)).toBe("top-start");

    const fixedHost = await render(
      <CompactSelect
        flipOptions={{ flipVariations: true }}
        options={[{ value: "fixed", label: "Fixed" }]}
        onChange={() => {}}
        position="bottom-start"
        value="fixed"
      />,
    );
    await click(fixedHost.querySelector("button"));
    const fixedFlip = (vi.mocked(computePosition).mock.calls.at(-1)?.[2]?.middleware ?? [])
      .filter(isMiddleware)
      .find((item) => item.name === "flip");
    expect(fixedFlip?.options?.flipAlignment).toBe(true);
    expect(await resolveFlipPlacement(fixedFlip!)).toBe("top-end");

    const autoHost = await render(
      <CompactSelect
        flipOptions={{ flipVariations: true }}
        options={[{ value: "auto", label: "Auto" }]}
        onChange={() => {}}
        position="auto-start"
        value="auto"
      />,
    );
    await click(autoHost.querySelector("button"));
    const automatic = (vi.mocked(computePosition).mock.calls.at(-1)?.[2]?.middleware ?? [])
      .filter(isMiddleware)
      .find((item) => item.name === "autoPlacement");
    expect(automatic?.options?.alignment).toBe("start");
    expect(automatic?.options?.autoAlignment).toBe(true);

    const defaultAutoHost = await render(
      <CompactSelect
        options={[{ value: "automatic-default", label: "Automatic default" }]}
        onChange={() => {}}
        position="auto-end"
        value="automatic-default"
      />,
    );
    await click(defaultAutoHost.querySelector("button"));
    const automaticDefault = (vi.mocked(computePosition).mock.calls.at(-1)?.[2]?.middleware ?? [])
      .filter(isMiddleware)
      .find((item) => item.name === "autoPlacement");
    expect(automaticDefault?.options?.alignment).toBe("end");
    expect(automaticDefault?.options?.autoAlignment).toBe(false);

    const autoAllowedHost = await render(
      <CompactSelect
        flipOptions={{ allowedAutoPlacements: ["auto-end"] }}
        options={[{ value: "auto-allowed", label: "Auto allowed" }]}
        onChange={() => {}}
        position="auto-end"
        value="auto-allowed"
      />,
    );
    await click(autoAllowedHost.querySelector("button"));
    const autoAllowed = (vi.mocked(computePosition).mock.calls.at(-1)?.[2]?.middleware ?? [])
      .filter(isMiddleware)
      .find((item) => item.name === "autoPlacement");
    expect(autoAllowed?.options?.allowedPlacements).toEqual([
      "top-end",
      "bottom-end",
      "right-end",
      "left-end",
    ]);

    const autoFallbackHost = await render(
      <CompactSelect
        flipOptions={{
          allowedAutoPlacements: ["auto-end"],
          fallbackPlacements: ["auto-end"],
        }}
        options={[{ value: "auto-fallback", label: "Auto fallback" }]}
        onChange={() => {}}
        position="bottom-start"
        value="auto-fallback"
      />,
    );
    await click(autoFallbackHost.querySelector("button"));
    const autoFallback = (vi.mocked(computePosition).mock.calls.at(-1)?.[2]?.middleware ?? [])
      .filter(isMiddleware)
      .find((item) => item.name === "flip");
    expect(await resolveFlipPlacement(autoFallback!)).toBe("top-end");

    const constrainedAutoHost = await render(
      <CompactSelect
        flipOptions={{
          allowedAutoPlacements: ["right-end"],
          fallbackPlacements: ["auto-end"],
        }}
        options={[{ value: "auto-constraint", label: "Auto constraint" }]}
        onChange={() => {}}
        position="bottom-start"
        value="auto-constraint"
      />,
    );
    await click(constrainedAutoHost.querySelector("button"));
    const constrainedAuto = (vi.mocked(computePosition).mock.calls.at(-1)?.[2]?.middleware ?? [])
      .filter(isMiddleware)
      .find((item) => item.name === "flip");
    expect(await resolveFlipPlacement(constrainedAuto!)).toBe("right-end");
  });

  it("evaluates both Popper axes for direct and fallback auto placements", async () => {
    const defaultHost = await render(
      <CompactSelect
        options={[{ label: "Default auto", value: "default-auto" }]}
        onChange={() => {}}
        position="auto"
        value="default-auto"
      />,
    );
    await click(defaultHost.querySelector("button"));
    const defaultAuto = (vi.mocked(computePosition).mock.calls.at(-1)?.[2]?.middleware ?? [])
      .filter(isMiddleware)
      .find((item) => item.name === "autoPlacement")!;
    expect(defaultAuto.options).toMatchObject({
      crossAxis: true,
      mainAxis: true,
    });
    expect(
      await resolveFlipPlacement(defaultAuto, (placement) => {
        if (placement === "top") {
          return { bottom: -20, left: -20, right: 12, top: -20 };
        }
        if (placement === "bottom") {
          return { bottom: -10, left: -10, right: -10, top: -10 };
        }
        return { bottom: -10, left: -10, right: -10, top: 20 };
      }),
    ).toBe("bottom");

    const noMainHost = await render(
      <CompactSelect
        flipOptions={{ mainAxis: false }}
        options={[{ label: "No main axis", value: "no-main" }]}
        onChange={() => {}}
        position="auto-start"
        value="no-main"
      />,
    );
    await click(noMainHost.querySelector("button"));
    const noMainAuto = (vi.mocked(computePosition).mock.calls.at(-1)?.[2]?.middleware ?? [])
      .filter(isMiddleware)
      .find((item) => item.name === "autoPlacement")!;
    expect(noMainAuto.options).toMatchObject({
      crossAxis: true,
      mainAxis: false,
    });
    expect(
      await resolveFlipPlacement(noMainAuto, (placement) => {
        if (placement === "top-start") {
          return { bottom: -10, left: -10, right: -10, top: 5 };
        }
        if (placement === "bottom-start") {
          return { bottom: 10, left: -10, right: -10, top: -10 };
        }
        return { bottom: -10, left: 30, right: 20, top: -10 };
      }),
    ).toBe("top-start");

    const noAltHost = await render(
      <CompactSelect
        flipOptions={{ altAxis: false }}
        options={[{ label: "No alt axis", value: "no-alt" }]}
        onChange={() => {}}
        position="auto-end"
        value="no-alt"
      />,
    );
    await click(noAltHost.querySelector("button"));
    const noAltAuto = (vi.mocked(computePosition).mock.calls.at(-1)?.[2]?.middleware ?? [])
      .filter(isMiddleware)
      .find((item) => item.name === "autoPlacement")!;
    expect(noAltAuto.options).toMatchObject({
      crossAxis: false,
      mainAxis: true,
    });
    expect(
      await resolveFlipPlacement(noAltAuto, (placement) =>
        placement === "top-end"
          ? { bottom: -10, left: 16, right: -10, top: -20 }
          : { bottom: 20, left: -10, right: -10, top: 20 },
      ),
    ).toBe("top-end");

    const fallbackHost = await render(
      <CompactSelect
        flipOptions={{
          altAxis: true,
          fallbackPlacements: ["auto-end"],
          mainAxis: false,
        }}
        options={[{ label: "Fallback auto", value: "fallback-auto" }]}
        onChange={() => {}}
        position="bottom-start"
        value="fallback-auto"
      />,
    );
    await click(fallbackHost.querySelector("button"));
    const fallbackAuto = (vi.mocked(computePosition).mock.calls.at(-1)?.[2]?.middleware ?? [])
      .filter(isMiddleware)
      .find((item) => item.name === "flip")!;
    expect(fallbackAuto.options).toMatchObject({
      crossAxis: true,
      mainAxis: false,
    });
    expect(
      await resolveFlipPlacement(fallbackAuto, (placement) => {
        if (placement === "bottom-start") {
          return { bottom: -10, left: -10, right: 10, top: -10 };
        }
        if (placement === "top-end") {
          return { bottom: -10, left: -10, right: -10, top: -20 };
        }
        return { bottom: 20, left: 20, right: 20, top: 20 };
      }),
    ).toBe("top-end");
  });

  it("gives a custom trigger button semantics and does not submit its form", async () => {
    const submitted = vi.fn((event: FormEvent) => event.preventDefault());
    const host = await render(
      <form onSubmit={submitted}>
        <CompactSelect
          options={[{ value: "web", label: "Web" }]}
          onChange={() => {}}
          trigger={(props) => <button {...props}>Project</button>}
          value="web"
        />
      </form>,
    );
    const trigger = host.querySelector("button");
    expect(trigger?.type).toBe("button");
    await click(trigger);
    expect(submitted).not.toHaveBeenCalled();
  });

  it("does not report or dismiss a vetoed outside interaction", async () => {
    const interacted = vi.fn();
    const shouldClose = vi.fn(() => false);
    const host = await render(
      <CompactSelect
        onInteractOutside={interacted}
        options={[{ value: "web", label: "Web" }]}
        onChange={() => {}}
        shouldCloseOnInteractOutside={shouldClose}
        value="web"
      />,
    );
    await click(host.querySelector("button"));
    await act(async () => {
      document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      await Promise.resolve();
    });
    expect(shouldClose).toHaveBeenCalledWith(document.body);
    expect(interacted).not.toHaveBeenCalled();
    expect(host.querySelector('[data-slot="compact-select-popup"]')).not.toBeNull();
  });

  it("does not report a blur dismissal as an outside interaction", async () => {
    const closed = vi.fn();
    const interacted = vi.fn();
    const activated = vi.fn();
    const host = await render(
      <>
        <CompactSelect
          onClose={closed}
          onInteractOutside={interacted}
          options={[{ value: "web", label: "Web" }]}
          onChange={() => {}}
          shouldCloseOnBlur
          value="web"
        />
        <button aria-expanded="false" onClick={activated}>
          Adjacent
        </button>
      </>,
    );
    await click(host.querySelector("button"));
    const option = host.querySelector<HTMLElement>('[role="option"]')!;
    const adjacent = [...host.querySelectorAll("button")].find(
      (button) => button.textContent === "Adjacent",
    )!;
    await act(async () => option.focus());
    await act(async () => adjacent.focus());
    await nextAnimationFrame();
    expect(closed).toHaveBeenCalledOnce();
    expect(interacted).not.toHaveBeenCalled();
    expect(activated).not.toHaveBeenCalled();
  });

  it("clears a canceled outside pointer before an Escape dismissal", async () => {
    const closed = vi.fn();
    const interacted = vi.fn();
    const openChanged = vi.fn();
    const host = await render(
      <CompactSelect
        isOpen
        onClose={closed}
        onInteractOutside={interacted}
        onOpenChange={openChanged}
        options={[{ value: "web", label: "Web" }]}
        onChange={() => {}}
        value="web"
      />,
    );
    await act(async () => {
      document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0 }));
      document.body.dispatchEvent(new PointerEvent("pointercancel", { bubbles: true, button: 0 }));
      await Promise.resolve();
    });
    await keyDown(host.querySelector<HTMLElement>('[data-slot="compact-select-popup"]')!, "Escape");
    await nextAnimationFrame();
    expect(closed).toHaveBeenCalledOnce();
    expect(interacted).not.toHaveBeenCalled();
    expect(openChanged).toHaveBeenLastCalledWith(false);

    await act(async () => {
      document.body.dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0 }));
      await Promise.resolve();
    });
    await nextAnimationFrame();
    expect(closed).toHaveBeenCalledOnce();
    expect(interacted).not.toHaveBeenCalled();
    expect(host.querySelector('[data-slot="compact-select-popup"]')).not.toBeNull();
  });

  it("requires a primary pointer click before dismissing outside", async () => {
    const interacted = vi.fn();
    const shouldClose = vi.fn(() => true);
    const host = await render(
      <CompactSelect
        onInteractOutside={interacted}
        options={[{ value: "web", label: "Web" }]}
        onChange={() => {}}
        shouldCloseOnInteractOutside={shouldClose}
        value="web"
      />,
    );
    await click(host.querySelector("button"));
    await pointerClick(document.body, 2);
    expect(shouldClose).not.toHaveBeenCalled();
    expect(interacted).not.toHaveBeenCalled();
    expect(host.querySelector('[data-slot="compact-select-popup"]')).not.toBeNull();

    await pointerClick(document.body);
    expect(shouldClose).toHaveBeenCalledWith(document.body);
    expect(interacted).toHaveBeenCalledOnce();
    expect(host.querySelector('[data-slot="compact-select-popup"]')).toBeNull();
  });

  it("hands an outside click to another closed overlay trigger once", async () => {
    function Example() {
      const [selected, setSelected] = useState(["one"]);
      const [setupOpen, setSetupOpen] = useState(false);
      return (
        <>
          <CompactSelect
            clearable
            multiple
            options={[{ label: "One", value: "one" }]}
            onChange={(options) => setSelected(options.map((option) => option.value))}
            value={selected}
          />
          <button aria-expanded={setupOpen} onClick={() => setSetupOpen((value) => !value)}>
            Open setup
          </button>
          {setupOpen ? <button>Share</button> : null}
        </>
      );
    }
    const host = await render(<Example />);
    await click(host.querySelector("button"));
    const clear = [...host.querySelectorAll("button")].find(
      (button) => button.textContent === "Clear",
    )!;
    await click(clear);
    expect(host.querySelector('[data-slot="compact-select-popup"]')).not.toBeNull();
    const setup = [...host.querySelectorAll("button")].find(
      (button) => button.textContent === "Open setup",
    )!;
    await pointerClick(setup);
    expect(host.querySelector('[data-slot="compact-select-popup"]')).toBeNull();
    expect(setup.getAttribute("aria-expanded")).toBe("true");
    expect(
      [...host.querySelectorAll("button")].some((button) => button.textContent === "Share"),
    ).toBe(true);
  });

  it("reports controlled close requests once before a delayed commit", async () => {
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      frames.push(callback);
      return frames.length;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
    const flushFrames = async () => {
      await act(async () => {
        for (const callback of frames.splice(0)) callback(performance.now());
      });
    };
    const closed = vi.fn();
    const interacted = vi.fn();
    const openChanged = vi.fn();
    function Example() {
      const [open, setOpen] = useState(true);
      return (
        <CompactSelect
          isOpen={open}
          menuBody={<button onClick={() => setOpen(false)}>Commit close</button>}
          onClose={closed}
          onInteractOutside={interacted}
          onOpenChange={openChanged}
          options={[{ value: "web", label: "Web" }]}
          onChange={() => {}}
          value="web"
        />
      );
    }
    const host = await render(<Example />);
    await flushFrames();
    await keyDown(host.querySelector<HTMLElement>('[data-slot="compact-select-popup"]')!, "Escape");
    expect(openChanged).toHaveBeenLastCalledWith(false);
    expect(closed).not.toHaveBeenCalled();
    await flushFrames();
    expect(closed).toHaveBeenCalledOnce();
    expect(host.querySelector('[data-slot="compact-select-popup"]')).not.toBeNull();

    await pointerClick(document.body);
    expect(openChanged).toHaveBeenCalledTimes(2);
    expect(closed).toHaveBeenCalledOnce();
    await flushFrames();
    expect(closed).toHaveBeenCalledTimes(2);
    expect(interacted).toHaveBeenCalledOnce();
    expect(host.querySelector('[data-slot="compact-select-popup"]')).not.toBeNull();

    await click(
      [...host.querySelectorAll("button")].find((button) => button.textContent === "Commit close")!,
    );
    expect(host.querySelector('[data-slot="compact-select-popup"]')).toBeNull();
    await flushFrames();
    expect(closed).toHaveBeenCalledTimes(2);
  });

  it("does not carry a child outside reason into a parent Escape", async () => {
    const parentInteracted = vi.fn();
    const childInteracted = vi.fn();
    const host = await render(
      <CompactSelect
        menuBody={
          <CompactSelect
            onInteractOutside={childInteracted}
            options={[{ label: "Child option", value: "child" }]}
            onChange={() => {}}
            trigger={(props) => <button {...props}>Child</button>}
            value="child"
          />
        }
        onInteractOutside={parentInteracted}
        options={[{ label: "Parent option", value: "parent" }]}
        onChange={() => {}}
        trigger={(props) => <button {...props}>Parent</button>}
        value="parent"
      />,
    );
    await click(host.querySelector("button"));
    await click(
      [...host.querySelectorAll("button")].find((button) => button.textContent === "Child")!,
    );
    await pointerClick(document.body);
    expect(childInteracted).toHaveBeenCalledOnce();
    expect(parentInteracted).not.toHaveBeenCalled();
    await keyDown(host.querySelector<HTMLElement>('[data-slot="compact-select-popup"]')!, "Escape");
    expect(parentInteracted).not.toHaveBeenCalled();
  });

  it("dismisses only the topmost nested overlay", async () => {
    const parentInteracted = vi.fn();
    const childInteracted = vi.fn();
    const host = await render(
      <CompactSelect
        menuBody={
          <CompactSelect
            onInteractOutside={childInteracted}
            options={[{ label: "Child option", value: "child" }]}
            onChange={() => {}}
            trigger={(props) => <button {...props}>Child</button>}
            value="child"
          />
        }
        onInteractOutside={parentInteracted}
        options={[{ label: "Parent option", value: "parent" }]}
        onChange={() => {}}
        trigger={(props) => <button {...props}>Parent</button>}
        value="parent"
      />,
    );
    await click(host.querySelector("button"));
    const childTrigger = [...host.querySelectorAll("button")].find(
      (button) => button.textContent === "Child",
    )!;
    await click(childTrigger);
    expect(host.querySelectorAll('[data-slot="compact-select-popup"]')).toHaveLength(2);

    await pointerClick(document.body);
    expect(childInteracted).toHaveBeenCalledOnce();
    expect(parentInteracted).not.toHaveBeenCalled();
    expect(host.querySelectorAll('[data-slot="compact-select-popup"]')).toHaveLength(1);

    await click(childTrigger);
    const nestedPopups = host.querySelectorAll<HTMLElement>('[data-slot="compact-select-popup"]');
    expect(nestedPopups).toHaveLength(2);
    await keyDown(nestedPopups[1]!, "Escape");
    expect(host.querySelectorAll('[data-slot="compact-select-popup"]')).toHaveLength(1);
    await keyDown(host.querySelector<HTMLElement>('[data-slot="compact-select-popup"]')!, "Escape");
    expect(host.querySelector('[data-slot="compact-select-popup"]')).toBeNull();
  });

  it("does not dismiss on Escape during IME composition", async () => {
    const host = await render(
      <CompactSelect options={[{ value: "web", label: "Web" }]} onChange={() => {}} value="web" />,
    );
    await click(host.querySelector("button"));
    const popup = host.querySelector<HTMLElement>('[data-slot="compact-select-popup"]')!;
    await act(async () => {
      popup.dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          isComposing: true,
          key: "Escape",
        }),
      );
      await Promise.resolve();
    });
    expect(host.querySelector('[data-slot="compact-select-popup"]')).not.toBeNull();
    await keyDown(popup, "Escape");
    expect(host.querySelector('[data-slot="compact-select-popup"]')).toBeNull();
  });

  it("shows Clear for a controlled value before its option loads", async () => {
    const changed = vi.fn();
    const host = await render(
      <CompactSelect clearable disabled={false} options={[]} onChange={changed} value="pending" />,
    );
    await click(host.querySelector("button"));
    const clear = [...host.querySelectorAll("button")].find(
      (button) => button.textContent === "Clear",
    );
    expect(clear).toBeDefined();
    await click(clear ?? null);
    expect(changed).toHaveBeenCalledWith(undefined);
  });

  it("wraps an ordinary listbox but transfers composite focus at enabled boundaries", async () => {
    const ordinary = await render(
      <CompactSelect
        options={[
          { value: "one", label: "One" },
          { value: "two", label: "Two" },
        ]}
        onChange={() => {}}
        value="one"
      />,
    );
    await click(ordinary.querySelector("button"));
    const ordinaryOptions = ordinary.querySelectorAll<HTMLElement>('[role="option"]');
    await act(async () => ordinaryOptions[1]?.focus());
    await keyDown(ordinaryOptions[1]!, "ArrowDown");
    expect(document.activeElement).toBe(ordinaryOptions[0]);
    await click(ordinary.querySelector("button"));

    const composite = await render(
      <CompositeSelect trigger={(props) => <button {...props}>Filters</button>}>
        <CompositeSelect.Region
          label="First region"
          options={[
            {
              value: "disabled-start",
              label: "Disabled start",
              disabled: true,
            },
            { value: "first-enabled", label: "First enabled" },
            { value: "disabled-end", label: "Disabled end", disabled: true },
          ]}
          onChange={() => {}}
          value="first-enabled"
        />
        <CompositeSelect.Region
          label="Next region"
          options={[
            { value: "next-disabled", label: "Next disabled", disabled: true },
            { value: "next-enabled", label: "Next enabled" },
          ]}
          onChange={() => {}}
          value="next-enabled"
        />
      </CompositeSelect>,
    );
    await click(composite.querySelector("button"));
    const firstEnabled = composite.querySelector<HTMLElement>(
      '[role="option"][data-test-id="first-enabled"]',
    )!;
    const nextEnabled = composite.querySelector<HTMLElement>(
      '[role="option"][data-test-id="next-enabled"]',
    )!;
    await act(async () => firstEnabled.focus());
    await keyDown(firstEnabled, "ArrowDown");
    expect(document.activeElement).toBe(nextEnabled);
    await keyDown(nextEnabled, "ArrowUp");
    expect(document.activeElement).toBe(firstEnabled);
  });

  it("renders one composite empty message only when every region is empty", async () => {
    const host = await render(
      <CompositeSelect trigger={(props) => <button {...props}>Filters</button>}>
        <CompositeSelect.Region label="Empty" options={[]} onChange={() => {}} value={undefined} />
        <CompositeSelect.Region
          options={[{ value: "web", label: "Web" }]}
          onChange={() => {}}
          value="web"
        />
      </CompositeSelect>,
    );
    await click(host.querySelector("button"));
    expect(host.textContent).not.toContain("No options found");

    const emptyHost = await render(
      <CompositeSelect
        emptyMessage="Nothing available"
        trigger={(props) => <button {...props}>Empty filters</button>}
      >
        <CompositeSelect.Region
          label="First empty"
          options={[]}
          onChange={() => {}}
          value={undefined}
        />
        <CompositeSelect.Region
          label="Second empty"
          options={[]}
          onChange={() => {}}
          value={undefined}
        />
      </CompositeSelect>,
    );
    await click(emptyHost.querySelector("button"));
    expect(emptyHost.querySelectorAll("p")).toHaveLength(1);
    expect(emptyHost.textContent).toContain("Nothing available");
  });

  it("renders one composite empty message when search filters every region", async () => {
    const host = await render(
      <CompositeSelect
        emptyMessage="No matching filters"
        search
        trigger={(props) => <button {...props}>Search filters</button>}
      >
        <CompositeSelect.Region
          label="Projects"
          options={[{ value: "web", label: "Web" }]}
          onChange={() => {}}
          value="web"
        />
        <CompositeSelect.Region
          label="Teams"
          options={[{ value: "mobile", label: "Mobile" }]}
          onChange={() => {}}
          value="mobile"
        />
      </CompositeSelect>,
    );
    await click(host.querySelector("button"));
    await input(host.querySelector<HTMLInputElement>('input[placeholder="Search…"]')!, "absent");
    expect(host.querySelectorAll('[role="option"]')).toHaveLength(0);
    expect(
      [...host.querySelectorAll("p")].filter(
        (element) => element.textContent === "No matching filters",
      ),
    ).toHaveLength(1);
  });

  it("forwards selection, focus, and keyboard delegate behavior", async () => {
    const action = vi.fn();
    const focused = vi.fn();
    const focusChanged = vi.fn();
    const getKeyBelow = vi.fn(() => "three");
    const host = await render(
      <CompactSelect
        clearable
        disabledBehavior="selection"
        keyboardDelegate={{ getKeyBelow }}
        onAction={action}
        onChange={() => {}}
        onFocus={focused}
        onFocusChange={focusChanged}
        options={[
          { disabled: true, label: "One", value: "one" },
          { label: "Two", value: "two" },
          { label: "Three", value: "three" },
        ]}
        selectionBehavior="replace"
        value={undefined}
      />,
    );
    await click(host.querySelector("button"));
    const two = host.querySelector<HTMLElement>('[role="option"][data-test-id="two"]')!;
    await act(async () => two.focus());
    expect(focused).toHaveBeenCalled();
    expect(focusChanged).toHaveBeenCalledWith(true);
    await click(host.querySelector('[role="option"][data-test-id="one"]'));
    expect(action).toHaveBeenCalledWith("one");
    await act(async () => two.focus());
    await keyDown(two, "ArrowDown");
    expect(getKeyBelow).toHaveBeenCalledWith("two");
  });

  it("forwards action props and grid virtualization measurement data", async () => {
    const action = vi.fn();
    const listHost = await render(
      <CompactSelect
        clearable
        onAction={action}
        options={[
          { label: "One", value: "one" },
          { label: "Two", value: "two" },
        ]}
        onChange={() => {}}
        value={undefined}
        virtualizeThreshold={0}
      />,
    );
    await click(listHost.querySelector("button"));
    const actionOption = listHost.querySelector<HTMLElement>(
      '[role="option"][data-test-id="two"]',
    )!;
    await click(actionOption);
    expect(action).toHaveBeenCalledWith("two");
    expect(actionOption.getAttribute("aria-posinset")).toBe("2");
    expect(actionOption.getAttribute("aria-setsize")).toBe("2");

    const options = Array.from({ length: 8 }, (_, index) => ({
      details: index % 2 ? "Variable-height details" : undefined,
      label: `Project ${index + 1}`,
      value: `project-${index + 1}`,
    }));
    const host = await render(
      <CompactSelect
        mode="grid"
        onAction={action}
        options={options}
        onChange={() => {}}
        shouldFocusOnHover={false}
        shouldFocusWrap={false}
        value="project-1"
        virtualizeThreshold={0}
      />,
    );
    await click(host.querySelector("button"));
    const firstRow = host.querySelector<HTMLElement>('[role="row"][data-index="0"]');
    expect(firstRow).not.toBeNull();
    expect(host.querySelector('[data-is-virtualized="true"]')).not.toBeNull();
    expect(host.querySelector('[role="grid"]')?.getAttribute("aria-rowcount")).toBe("8");
    expect(firstRow?.getAttribute("aria-rowindex")).toBe("1");
  });

  it("uses virtual list metadata and focuses the collection when no option is rendered", async () => {
    const changed = vi.fn();
    const resizeObserver = globalThis.ResizeObserver;
    class UnmeasuredResizeObserver implements ResizeObserver {
      disconnect() {}
      observe() {}
      unobserve() {}
    }
    Object.assign(globalThis, { ResizeObserver: UnmeasuredResizeObserver });
    try {
      const host = await render(
        <CompactSelect
          search
          options={[
            { label: "One", value: "one" },
            { label: "Two", value: "two" },
          ]}
          onChange={changed}
          value={undefined}
          virtualizeThreshold={1}
        />,
      );
      await click(host.querySelector("button"));
      expect(host.querySelectorAll('[role="option"]')).toHaveLength(0);
      const search = host.querySelector<HTMLInputElement>('[placeholder="Search…"]')!;
      await keyDown(search, "Enter");
      expect(document.activeElement).toBe(host.querySelector('[role="listbox"]'));
      expect(changed).not.toHaveBeenCalled();
    } finally {
      Object.assign(globalThis, { ResizeObserver: resizeObserver });
    }
  });

  it("scrolls virtual flat grids and section children into the rendered window", async () => {
    const resizeObserver = globalThis.ResizeObserver;
    class KeyboardResizeObserver implements ResizeObserver {
      constructor(private callback: ResizeObserverCallback) {}
      disconnect() {}
      observe(target: Element) {
        const blockSize = (target as HTMLElement).dataset.index === undefined ? 80 : 36;
        this.callback(
          [
            {
              borderBoxSize: [{ blockSize, inlineSize: 300 }],
              contentBoxSize: [{ blockSize, inlineSize: 300 }],
              contentRect: new DOMRect(0, 0, 300, blockSize),
              devicePixelContentBoxSize: [{ blockSize, inlineSize: 300 }],
              target,
            },
          ],
          this,
        );
      }
      unobserve() {}
    }
    Object.assign(globalThis, { ResizeObserver: KeyboardResizeObserver });
    vi.spyOn(HTMLElement.prototype, "scrollTo").mockImplementation(function (
      this: HTMLElement,
      options?: ScrollToOptions | number,
      y?: number,
    ) {
      const top = typeof options === "number" ? (y ?? 0) : (options?.top ?? 0);
      queueMicrotask(() => {
        this.scrollTop = top;
        this.dispatchEvent(new Event("scroll"));
      });
    });
    const navigateToEnd = async (
      host: HTMLDivElement,
      itemRole: "option" | "row",
      lastKey: string,
      previousKey: string,
    ) => {
      const first = host.querySelector<HTMLElement>(`[role="${itemRole}"]`)!;
      await act(async () => first.focus());
      await keyDown(first, "End");
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });
      const last = host.querySelector<HTMLElement>(
        `[role="${itemRole}"][data-test-id="${lastKey}"]`,
      );
      expect(last).not.toBeNull();
      expect(document.activeElement).toBe(last);
      await keyDown(last!, "ArrowUp");
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });
      const previous = host.querySelector<HTMLElement>(
        `[role="${itemRole}"][data-test-id="${previousKey}"]`,
      );
      expect(previous).not.toBeNull();
      expect(document.activeElement).toBe(previous);
    };
    try {
      const flatOptions = Array.from({ length: 30 }, (_, index) => ({
        label: `Flat ${index + 1}`,
        value: `flat-${index}`,
      }));
      const flatGrid = await render(
        <CompactSelect
          mode="grid"
          options={flatOptions}
          onChange={() => {}}
          value="flat-0"
          virtualized
        />,
      );
      await click(flatGrid.querySelector("button"));
      await navigateToEnd(flatGrid, "row", "flat-29", "flat-28");

      const sectionOptions = Array.from({ length: 20 }, (_, index) => ({
        key: `section-${index}`,
        label: `Section ${index + 1}`,
        options: [{ label: `Child ${index + 1}`, value: `child-${index}` }],
      }));
      for (const mode of ["list", "grid"] as const) {
        const host = await render(
          <CompactSelect
            mode={mode}
            options={sectionOptions}
            onChange={() => {}}
            value="child-0"
            virtualized
          />,
        );
        await click(host.querySelector("button"));
        await navigateToEnd(host, mode === "grid" ? "row" : "option", "child-19", "child-18");
      }
    } finally {
      Object.assign(globalThis, { ResizeObserver: resizeObserver });
    }
  });

  it("keeps CompactSelect value state authoritative over inherited ListProps", async () => {
    const changed = vi.fn();
    const consumerSelectionChanged = vi.fn();
    const host = await render(
      <CompactSelect
        defaultSelectedKeys={["two"]}
        disabledKeys={["two"]}
        onSelectionChange={consumerSelectionChanged}
        options={[
          { disabled: true, label: "One", value: "one" },
          { label: "Two", value: "two" },
        ]}
        onChange={changed}
        selectedKeys={["two"]}
        selectionMode="none"
        value="one"
      />,
    );
    await click(host.querySelector("button"));
    const one = host.querySelector('[role="option"][data-test-id="one"]');
    const two = host.querySelector('[role="option"][data-test-id="two"]');
    expect(one?.getAttribute("aria-selected")).toBe("true");
    expect(one?.getAttribute("aria-disabled")).toBe("true");
    expect(two?.getAttribute("aria-disabled")).not.toBe("true");
    await click(two);
    expect(changed).toHaveBeenCalledWith(expect.objectContaining({ value: "two" }));
    expect(consumerSelectionChanged).not.toHaveBeenCalled();
  });

  it("derives ordinary and composite empty messages from the filtered collection", async () => {
    const host = await render(
      <CompactSelect
        emptyMessage="Filtered empty"
        filter={() => []}
        options={[{ label: "One", value: "one" }]}
        onChange={() => {}}
        value="one"
      />,
    );
    await click(host.querySelector("button"));
    expect(host.querySelectorAll('[role="option"]')).toHaveLength(0);
    expect(host.textContent).toContain("Filtered empty");

    const composite = await render(
      <CompositeSelect
        emptyMessage="All regions filtered"
        trigger={(props) => <button {...props}>Filters</button>}
      >
        <CompositeSelect.Region
          filter={() => []}
          options={[{ label: "One", value: "one" }]}
          onChange={() => {}}
          value="one"
        />
        <CompositeSelect.Region
          filter={() => []}
          options={[{ label: "Two", value: "two" }]}
          onChange={() => {}}
          value="two"
        />
      </CompositeSelect>,
    );
    await click(composite.querySelector("button"));
    expect(composite.querySelectorAll('[role="option"]')).toHaveLength(0);
    expect(
      [...composite.querySelectorAll("p")].filter(
        (element) => element.textContent === "All regions filtered",
      ),
    ).toHaveLength(1);
  });

  it("measures forced virtual grid sections as virtualizer items", async () => {
    const host = await render(
      <CompactSelect
        mode="grid"
        options={[
          {
            key: "projects",
            label: "Projects",
            options: [
              {
                details: "Variable-height details",
                label: "One",
                value: "one",
              },
              { label: "Two", value: "two" },
            ],
          },
        ]}
        onChange={() => {}}
        value="one"
        virtualized
      />,
    );
    await click(host.querySelector("button"));
    const section = host.querySelector<HTMLElement>('[role="rowgroup"][data-index="0"]');
    expect(section).not.toBeNull();
    expect(section?.closest('[data-is-virtualized="true"]')).not.toBeNull();
  });

  it("includes section separators in virtual totals and start offsets", async () => {
    const resizeObserver = globalThis.ResizeObserver;
    class SectionResizeObserver implements ResizeObserver {
      constructor(private callback: ResizeObserverCallback) {}
      disconnect() {}
      observe(target: Element) {
        const index = Number((target as HTMLElement).dataset.index);
        const blockSize = Number.isNaN(index) ? 60 : ([40, 60, 80][index] ?? 80);
        this.callback(
          [
            {
              borderBoxSize: [{ blockSize, inlineSize: 300 }],
              contentBoxSize: [{ blockSize, inlineSize: 300 }],
              contentRect: new DOMRect(0, 0, 300, blockSize),
              devicePixelContentBoxSize: [{ blockSize, inlineSize: 300 }],
              target,
            },
          ],
          this,
        );
      }
      unobserve() {}
    }
    Object.assign(globalThis, { ResizeObserver: SectionResizeObserver });
    try {
      const host = await render(<SectionGridHarness />);
      const wrapper = host.querySelector<HTMLElement>('[data-is-virtualized="true"]')!;
      expect(wrapper.style.height).toBe("188px");
      for (const section of host.querySelectorAll<HTMLElement>('[role="rowgroup"]')) {
        expect(section.querySelector('[role="separator"]')).not.toBeNull();
      }
      const scrollElement = wrapper.parentElement as HTMLElement;
      await act(async () => {
        scrollElement.scrollTop = 150;
        scrollElement.dispatchEvent(new Event("scroll"));
        await Promise.resolve();
      });
      expect(host.querySelector<HTMLElement>('[role="grid"]')?.style.transform).toBe(
        "translateY(40px)",
      );
    } finally {
      Object.assign(globalThis, { ResizeObserver: resizeObserver });
    }
  });

  it("announces virtual grid rows without counting section nodes", async () => {
    const oneSection = await render(
      <CompactSelect
        mode="grid"
        options={[
          {
            key: "one-section",
            label: "One section",
            options: [
              { label: "One", value: "one" },
              { label: "Two", value: "two" },
            ],
          },
        ]}
        onChange={() => {}}
        value="one"
        virtualized
      />,
    );
    await click(oneSection.querySelector("button"));
    expect(oneSection.querySelector('[role="grid"]')?.getAttribute("aria-rowcount")).toBe("2");
    expect(
      [...oneSection.querySelectorAll('[role="row"]')].map((row) =>
        row.getAttribute("aria-rowindex"),
      ),
    ).toEqual(["1", "2"]);

    const multipleSections = await render(
      <CompactSelect
        mode="grid"
        options={[
          {
            key: "first",
            label: "First",
            options: [
              { label: "One", value: "one" },
              { label: "Two", value: "two" },
            ],
          },
          {
            key: "second",
            label: "Second",
            options: [{ label: "Three", value: "three" }],
          },
        ]}
        onChange={() => {}}
        value="one"
        virtualized
      />,
    );
    await click(multipleSections.querySelector("button"));
    expect(multipleSections.querySelector('[role="grid"]')?.getAttribute("aria-rowcount")).toBe(
      "3",
    );
    expect(
      [...multipleSections.querySelectorAll('[role="row"]')].map((row) =>
        row.getAttribute("aria-rowindex"),
      ),
    ).toEqual(["1", "2", "3"]);
  });

  it("filters collection behavior props from exported list DOM", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const listHost = await render(<CollectionHarness />);
    const listbox = listHost.querySelector('[role="listbox"]');
    expect(listbox?.hasAttribute("selectionmode")).toBe(false);
    expect(listbox?.hasAttribute("disallowemptyselection")).toBe(false);

    const gridHost = await render(<CollectionHarness grid />);
    const grid = gridHost.querySelector('[role="grid"]');
    expect(grid?.hasAttribute("selectionmode")).toBe(false);
    expect(grid?.hasAttribute("disabledbehavior")).toBe(false);
    expect(grid?.hasAttribute("isvirtualized")).toBe(false);
    expect(error.mock.calls.flat().join(" ")).not.toContain("React does not recognize");
  });

  it("restores keyboard collection scroll on the real overflow element", async () => {
    const host = await render(<CollectionHarness virtualized={false} />);
    const listbox = host.querySelector<HTMLElement>('[role="listbox"]')!;
    const scrollElement = listbox.parentElement?.parentElement as HTMLDivElement;
    const outside = document.createElement("button");
    host.append(outside);
    await act(async () => listbox.focus());
    await act(async () => outside.focus());
    await act(async () => {
      scrollElement.scrollTop = 73;
      scrollElement.dispatchEvent(new Event("scroll"));
      await Promise.resolve();
      scrollElement.scrollTop = 0;
    });
    await act(async () => listbox.focus());
    expect(scrollElement.scrollTop).toBe(73);
  });

  it("forwards list typeahead and focus-entry behavior", async () => {
    const typeaheadHost = await render(<CollectionHarness disallowTypeAhead />);
    const first = typeaheadHost.querySelector<HTMLElement>('[role="option"][data-test-id="one"]');
    const typeaheadList = typeaheadHost.querySelector<HTMLElement>('[role="listbox"]')!;
    await act(async () => first?.focus());
    await keyDown(typeaheadList, "t");
    expect(document.activeElement).toBe(first);

    const entryHost = await render(<CollectionHarness focusEntry="last" />);
    const entryList = entryHost.querySelector<HTMLElement>('[role="listbox"]')!;
    await act(async () => {
      document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Tab" }));
      entryList.focus();
      await Promise.resolve();
    });
    expect(document.activeElement).toBe(
      entryHost.querySelector('[role="option"][data-test-id="two"]'),
    );
  });

  it("forwards grid focus lifecycle behavior", async () => {
    const onBlur = vi.fn();
    const onFocus = vi.fn();
    const onFocusChange = vi.fn();
    const host = await render(
      <CompactSelect
        mode="grid"
        onBlur={onBlur}
        onFocus={onFocus}
        onFocusChange={onFocusChange}
        options={[
          { label: "One", value: "one" },
          { label: "Two", value: "two" },
        ]}
        onChange={() => {}}
        value="one"
      />,
    );
    await click(host.querySelector("button"));
    const first = host.querySelector<HTMLElement>('[role="row"][data-test-id="one"]')!;
    const outside = document.createElement("button");
    host.append(outside);
    await act(async () => first.focus());
    expect(onFocus).toHaveBeenCalled();
    expect(onFocusChange).toHaveBeenCalledWith(true);
    await act(async () => outside.focus());
    expect(onBlur).toHaveBeenCalled();
    expect(onFocusChange).toHaveBeenCalledWith(false);
  });

  it("honors grid shouldSelectOnPressUp", async () => {
    const changed = vi.fn();
    const host = await render(
      <CompactSelect
        mode="grid"
        options={[
          { label: "One", value: "one" },
          { label: "Two", value: "two" },
        ]}
        onChange={changed}
        shouldSelectOnPressUp={false}
        value="one"
      />,
    );
    await click(host.querySelector("button"));
    const two = host.querySelector('[role="row"][data-test-id="two"]')!;
    await act(async () => {
      const pointerDown = new PointerEvent("pointerdown", {
        bubbles: true,
        button: 0,
        cancelable: true,
      });
      Object.defineProperties(pointerDown, {
        isPrimary: { value: true },
        pointerId: { value: 1 },
        pointerType: { value: "mouse" },
      });
      two.dispatchEvent(pointerDown);
      await Promise.resolve();
    });
    expect(changed).toHaveBeenCalledWith(expect.objectContaining({ value: "two" }));
  });

  it("keeps pinned menu trigger semantics for a grid popup", async () => {
    const host = await render(
      <CompactSelect
        mode="grid"
        options={[{ label: "One", value: "one" }]}
        onChange={() => {}}
        value="one"
      />,
    );
    expect(host.querySelector("button")?.getAttribute("aria-haspopup")).toBe("menu");
  });

  it("keeps keyboard dismissal when pointer dismissal is disabled", async () => {
    const host = await render(
      <CompactSelect
        isDismissable={false}
        options={[{ value: "web", label: "Web" }]}
        onChange={() => {}}
        value="web"
      />,
    );
    const trigger = host.querySelector<HTMLButtonElement>("button");
    await click(trigger);
    expect(host.querySelector('[data-slot="compact-select-popup"]')).not.toBeNull();
    await act(async () => {
      document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      await Promise.resolve();
    });
    expect(host.querySelector('[data-slot="compact-select-popup"]')).not.toBeNull();
    await keyDown(host.querySelector<HTMLElement>('[data-slot="compact-select-popup"]')!, "Escape");
    expect(host.querySelector('[data-slot="compact-select-popup"]')).toBeNull();
  });

  it("keeps composite regions independent and closes through menu actions", async () => {
    function Example() {
      const [month, setMonth] = useState("jan");
      const [tags, setTags] = useState<string[]>([]);
      return (
        <CompositeSelect
          menuFooter={({ closeOverlay }) => (
            <MenuComponents.CTAButton onClick={closeOverlay}>Done</MenuComponents.CTAButton>
          )}
          trigger={(props) => <button {...props}>Configure</button>}
        >
          <CompositeSelect.Region
            label="Month"
            options={[
              { value: "jan", label: "January" },
              { value: "feb", label: "February" },
            ]}
            onChange={(option) => setMonth(option.value)}
            value={month}
          />
          <CompositeSelect.Region
            label="Tags"
            multiple
            options={[
              { value: "cool", label: "Cool" },
              { value: "useful", label: "Useful" },
            ]}
            onChange={(options) => setTags(options.map((option) => option.value))}
            value={tags}
          />
        </CompositeSelect>
      );
    }
    const host = await render(<Example />);
    await click(host.querySelector("button"));
    expect(host.querySelectorAll('[role="listbox"]')).toHaveLength(2);
    expect(host.textContent).toContain("Month");
    expect(host.textContent).toContain("Tags");
    await click(host.querySelector('[role="option"][data-test-id="feb"]'));
    await click(host.querySelector("button"));
    expect(
      host.querySelector('[role="option"][data-test-id="feb"]')?.getAttribute("aria-selected"),
    ).toBe("true");
  });
});
