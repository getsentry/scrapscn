import type { Location } from "history";
import { act, Fragment, useEffect, type ComponentProps, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type MockMotionDivProps = ComponentProps<"div"> & {
  animate?: unknown;
  exit?: unknown;
  initial?: unknown;
  transition?: unknown;
};

vi.mock("framer-motion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("framer-motion")>();
  const react = await import("react");
  const MotionDiv = react.forwardRef<HTMLDivElement, MockMotionDivProps>(
    ({ animate, exit, initial, transition, ...props }, ref) => {
      void animate;
      void exit;
      void initial;
      void transition;
      return react.createElement("div", { ...props, ref });
    },
  );
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: ReactNode }) => children,
    motion: { div: MotionDiv },
    useReducedMotion: () => false,
  };
});

import { DrawerBody, DrawerHeader, GlobalDrawer, useDrawer, type DrawerOptions } from "./drawer";
import { GlobalModal, useModal } from "./modal";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

type DrawerApi = ReturnType<typeof useDrawer>;
type ModalApi = ReturnType<typeof useModal>;
type Mounted = {
  container: HTMLDivElement;
  rerender: (location?: Location, children?: ReactNode) => Promise<void>;
  root: Root;
};

const mounted: Mounted[] = [];
const mediaListeners = new Set<EventListener>();
let currentDrawer: DrawerApi | null = null;
let currentModal: ModalApi | null = null;
let mobile = false;

function DrawerController() {
  const drawer = useDrawer();
  useEffect(() => {
    currentDrawer = drawer;
  }, [drawer]);
  return null;
}

function ModalController() {
  const modal = useModal();
  useEffect(() => {
    currentModal = modal;
  }, [modal]);
  return null;
}

function CaptureDrawer({ capture }: { capture: (drawer: DrawerApi) => void }) {
  const drawer = useDrawer();
  useEffect(() => capture(drawer), [capture, drawer]);
  return null;
}

function location(key: string): Location {
  return {
    action: "PUSH",
    hash: "",
    key,
    pathname: `/${key}`,
    query: {},
    search: "",
    state: null,
  };
}

function app(locationValue?: Location, children?: ReactNode) {
  return (
    <GlobalDrawer location={locationValue}>
      <DrawerController />
      {children}
    </GlobalDrawer>
  );
}

async function render(children?: ReactNode, initialLocation?: Location) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const result: Mounted = {
    container,
    root,
    rerender: async (nextLocation = initialLocation, nextChildren = children) => {
      await act(async () => root.render(app(nextLocation, nextChildren)));
    },
  };
  mounted.push(result);
  await result.rerender();
  return result;
}

async function renderTree(children: ReactNode) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const result: Mounted = {
    container,
    root,
    rerender: async () => {
      await act(async () => root.render(children));
    },
  };
  mounted.push(result);
  await result.rerender();
  return result;
}

async function open(
  options: DrawerOptions,
  renderer: Parameters<DrawerApi["openDrawer"]>[0] = ({ closeDrawer }) => (
    <Fragment>
      <DrawerHeader>Title</DrawerHeader>
      <DrawerBody>
        Drawer body
        <button onClick={closeDrawer}>Render close</button>
      </DrawerBody>
    </Fragment>
  ),
) {
  await act(async () => currentDrawer?.openDrawer(renderer, options));
}

async function click(element: Element | null) {
  expect(element).not.toBeNull();
  await act(async () => (element as HTMLElement).click());
}

async function pointerDown(target: EventTarget) {
  await act(async () => target.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true })));
}

async function pressEscape(target: EventTarget = document, init: KeyboardEventInit = {}) {
  const event = new KeyboardEvent("keydown", {
    bubbles: true,
    cancelable: true,
    key: "Escape",
    ...init,
  });
  await act(async () => target.dispatchEvent(event));
  return event;
}

function panel() {
  return document.querySelector<HTMLElement>("[role='complementary']");
}

async function setMobile(next: boolean) {
  mobile = next;
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: next ? 800 : 1200,
    writable: true,
  });
  await act(async () => {
    for (const listener of mediaListeners) listener(new Event("change"));
    window.dispatchEvent(new Event("resize"));
  });
}

beforeEach(() => {
  currentDrawer = null;
  currentModal = null;
  mobile = false;
  mediaListeners.clear();
  localStorage.clear();
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: 1200,
    writable: true,
  });
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn(() => ({
      addEventListener: (_type: string, listener: EventListener) => mediaListeners.add(listener),
      dispatchEvent: () => true,
      matches: mobile,
      media: "(max-width: 800px)",
      onchange: null,
      removeEventListener: (_type: string, listener: EventListener) =>
        mediaListeners.delete(listener),
    })),
  });
  vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
    callback(0);
    return 1;
  });
});

afterEach(async () => {
  await act(async () => {
    currentDrawer?.closeDrawer();
    currentModal?.closeModal();
  });
  for (const item of mounted.splice(0)) {
    await act(async () => item.root.unmount());
    item.container.remove();
  }
  document.getElementById("modal-portal")?.remove();
  document.body.style.cssText = "";
  document.documentElement.style.removeProperty("--scrollbar-size");
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("GlobalDrawer", () => {
  it("opens an accessible complementary panel and locks body scroll", async () => {
    await render();
    await open({ ariaLabel: "Project details" }, () => <DrawerBody>Details</DrawerBody>);

    expect(panel()?.getAttribute("aria-label")).toBe("Project details");
    expect(panel()?.textContent).toContain("Details");
    expect(document.body.style.position).toBe("fixed");
    expect(document.body.style.width).toBe("100%");
    expect(document.querySelector("[data-drawer-backdrop]")).not.toBeNull();
    expect(document.querySelector("[aria-label='Close Drawer']")).toBeNull();
  });

  it("calls onOpen and closes through the header with onClose", async () => {
    const onClose = vi.fn();
    const onOpen = vi.fn();
    await render();
    await open({ ariaLabel: "Drawer", onClose, onOpen });

    expect(onOpen).toHaveBeenCalledOnce();
    await click(document.querySelector("[aria-label='Close Drawer']"));
    expect(onClose).toHaveBeenCalledOnce();
    expect(panel()).toBeNull();
  });

  it("passes a callback-closing render prop that invokes onClose", async () => {
    const onClose = vi.fn();
    await render();
    await open({ ariaLabel: "Drawer", onClose });

    await click(document.querySelector("button:not([aria-label])"));
    expect(onClose).toHaveBeenCalledOnce();
    expect(panel()).toBeNull();
  });

  it("does not invoke onClose for the imperative context close", async () => {
    const onClose = vi.fn();
    await render();
    await open({ ariaLabel: "Drawer", onClose });

    await act(async () => currentDrawer?.closeDrawer());
    expect(onClose).not.toHaveBeenCalled();
    expect(panel()).toBeNull();
  });

  it("closes a blocking drawer on an ordinary outside pointer", async () => {
    const onClose = vi.fn();
    await render(<button data-outside="">Outside</button>);
    await open({ ariaLabel: "Drawer", onClose });

    await pointerDown(document.querySelector("[data-outside]")!);
    expect(onClose).toHaveBeenCalledOnce();
    expect(panel()).toBeNull();
  });

  it("keeps passive drawers interactive outside and closes them on Escape", async () => {
    const onClose = vi.fn();
    await render(<button data-outside="">Outside</button>);
    await open({ ariaLabel: "Drawer", mode: "passive", onClose });

    expect(document.body.style.position).toBe("");
    expect(document.querySelector("[data-drawer-backdrop]")).toBeNull();
    await pointerDown(document.querySelector("[data-outside]")!);
    expect(panel()).not.toBeNull();
    const event = await pressEscape();
    expect(event.defaultPrevented).toBe(true);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("ignores Escape from inputs and during IME composition", async () => {
    await render(<input data-hotkey-input="" />);
    await open({ ariaLabel: "Drawer" });

    await pressEscape(document.querySelector("[data-hotkey-input]")!);
    expect(panel()).not.toBeNull();
    await pressEscape(document, { isComposing: true });
    expect(panel()).not.toBeNull();
    await pressEscape();
    expect(panel()).toBeNull();
  });

  it("ignores the modal portal and unrelated overlays by default", async () => {
    const modalPortal = document.createElement("div");
    const modalContent = document.createElement("button");
    modalPortal.id = "modal-portal";
    modalPortal.append(modalContent);
    document.body.append(modalPortal);
    const overlay = document.createElement("div");
    overlay.dataset.overlay = "";
    document.body.append(overlay);
    await render();
    await open({ ariaLabel: "Drawer" });

    await pointerDown(modalContent);
    expect(panel()).not.toBeNull();
    await pointerDown(overlay);
    expect(panel()).not.toBeNull();
    await pointerDown(document.querySelector("[data-drawer-backdrop]")!);
    expect(panel()).toBeNull();
    overlay.remove();
  });

  it("lets a custom outside predicate replace the default policy", async () => {
    const shouldClose = vi.fn((element: Element) => element.matches("[data-close-drawer]"));
    const keep = document.createElement("button");
    const close = document.createElement("button");
    close.dataset.closeDrawer = "";
    document.body.append(keep, close);
    await render();
    await open({
      ariaLabel: "Drawer",
      shouldCloseOnInteractOutside: shouldClose,
    });

    await pointerDown(keep);
    expect(panel()).not.toBeNull();
    await pointerDown(close);
    expect(panel()).toBeNull();
    expect(shouldClose).toHaveBeenCalledTimes(2);
    keep.remove();
    close.remove();
  });

  it("does not close on the first location render", async () => {
    await render(undefined, location("initial"));
    await open({ ariaLabel: "Drawer" });
    expect(panel()).not.toBeNull();
  });

  it("closes blocking drawers on later locations without onClose", async () => {
    const onClose = vi.fn();
    const mountedDrawer = await render(undefined, location("initial"));
    await open({ ariaLabel: "Drawer", onClose });

    await mountedDrawer.rerender(location("next"));
    expect(panel()).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("keeps passive drawers on route changes by default", async () => {
    const mountedDrawer = await render(undefined, location("initial"));
    await open({ ariaLabel: "Drawer", mode: "passive" });

    await mountedDrawer.rerender(location("next"));
    expect(panel()).not.toBeNull();
  });

  it("uses the custom route predicate for both modes", async () => {
    const mountedDrawer = await render(undefined, location("initial"));
    await open({
      ariaLabel: "Drawer",
      mode: "passive",
      shouldCloseOnLocationChange: (next) => next.pathname === "/close",
    });

    await mountedDrawer.rerender(location("keep"));
    expect(panel()).not.toBeNull();
    await mountedDrawer.rerender(location("close"));
    expect(panel()).toBeNull();

    await open({
      ariaLabel: "Drawer",
      shouldCloseOnLocationChange: () => false,
    });
    await mountedDrawer.rerender(location("another"));
    expect(panel()).not.toBeNull();
  });

  it("replaces drawers without onClose and calls onOpen for each open", async () => {
    const firstClose = vi.fn();
    const firstOpen = vi.fn();
    const secondOpen = vi.fn();
    await render();
    await open({
      ariaLabel: "First",
      onClose: firstClose,
      onOpen: firstOpen,
    });
    await open({ ariaLabel: "Second", onOpen: secondOpen }, () => (
      <DrawerBody>Second content</DrawerBody>
    ));

    expect(firstClose).not.toHaveBeenCalled();
    expect(firstOpen).toHaveBeenCalledOnce();
    expect(secondOpen).toHaveBeenCalledOnce();
    expect(panel()?.getAttribute("aria-label")).toBe("Second");
  });

  it("releases an acquired lock when a blocking drawer becomes passive", async () => {
    await render();
    await open({ ariaLabel: "Blocking" });
    await open({ ariaLabel: "Passive", mode: "passive" }, () => (
      <DrawerBody>Passive replacement</DrawerBody>
    ));

    expect(document.body.style.position).toBe("");
    expect(document.querySelector("[data-drawer-backdrop]")).toBeNull();
    await act(async () => currentDrawer?.closeDrawer());
    expect(document.body.style.position).toBe("");
  });

  it("scopes isDrawerOpen to each useDrawer call", async () => {
    function Scoped({ label }: { label: string }) {
      const drawer = useDrawer();
      return (
        <Fragment>
          <button
            data-open={label}
            onClick={() =>
              drawer.openDrawer(() => <DrawerBody>{label}</DrawerBody>, {
                ariaLabel: label,
              })
            }
          >
            Open {label}
          </button>
          <span data-mine={label}>{drawer.isDrawerOpen ? "mine" : "not mine"}</span>
          <span data-any={label}>{drawer.isAnyDrawerOpen ? "any" : "none"}</span>
        </Fragment>
      );
    }
    await render(
      <Fragment>
        <Scoped label="a" />
        <Scoped label="b" />
      </Fragment>,
    );

    await click(document.querySelector("[data-open='a']"));
    expect(document.querySelector("[data-mine='a']")?.textContent).toBe("mine");
    expect(document.querySelector("[data-mine='b']")?.textContent).toBe("not mine");
    expect(document.querySelector("[data-any='b']")?.textContent).toBe("any");
  });

  it("keeps the shared body lock until both Drawer and Modal release it", async () => {
    await render(
      <Fragment>
        <ModalController />
        <GlobalModal />
      </Fragment>,
    );
    await open({ ariaLabel: "Drawer" });
    await act(async () => currentModal?.openModal(({ Body }) => <Body>Modal content</Body>));

    expect(document.body.style.position).toBe("fixed");
    await act(async () => currentDrawer?.closeDrawer());
    expect(document.body.style.position).toBe("fixed");
    await act(async () => currentModal?.closeModal());
    expect(document.body.style.position).toBe("");
  });

  it("closes a modal above the drawer before closing the drawer on Escape", async () => {
    await render(
      <Fragment>
        <ModalController />
        <GlobalModal />
      </Fragment>,
    );
    await open({ ariaLabel: "Drawer" });
    await act(async () => currentModal?.openModal(({ Body }) => <Body>Modal content</Body>));

    expect(document.querySelector("[role='dialog']")).not.toBeNull();
    await pressEscape();
    expect(document.querySelector("[role='dialog']")).toBeNull();
    expect(panel()).not.toBeNull();
    expect(document.body.style.position).toBe("fixed");

    const drawerEscape = await pressEscape();
    expect(drawerEscape.defaultPrevented).toBe(true);
    expect(panel()).toBeNull();
    expect(document.body.style.position).toBe("");
  });

  it("matches canonical header, body, layer, and width semantics", async () => {
    await render();
    await open({ ariaLabel: "Drawer", drawerKey: "geometry" });

    const header = document.querySelector("header");
    const body = document.querySelector("aside");
    const drawerPanel = panel();
    expect(header?.className).toContain("h-[53px]");
    expect(header?.className).toContain("z-[10000]");
    expect(header?.className).toContain("px-3");
    expect(header?.className).toContain("py-1.5");
    expect(body?.className).toContain("px-6");
    expect(body?.className).toContain("py-4");
    expect(drawerPanel?.parentElement?.className).toContain("z-[9999]");
    expect(drawerPanel?.className).toContain("[width:clamp(");
    expect(drawerPanel?.className).toContain("data-[resizing]:overflow-hidden!");
    expect(drawerPanel?.className).toContain("data-[resizing]:[scrollbar-width:none]");
    expect(drawerPanel?.className).toContain("data-[resizing]:[&::-webkit-scrollbar]:hidden");
    expect(drawerPanel?.className).toContain("data-[resizing]:[&_*]:[scrollbar-width:none]");
    expect(drawerPanel?.className).toContain("data-[resizing]:[&_*::-webkit-scrollbar]:hidden");
    expect(drawerPanel?.style.getPropertyValue("--drawer-min-width")).toBe("20%");
    expect(drawerPanel?.style.getPropertyValue("--drawer-max-width")).toBe("85%");
    expect(document.querySelector("[data-slot='drawer-resize-handle']")?.className).toContain(
      "z-[10001]",
    );
    expect(document.querySelector("[data-slot='drawer-resize-handle']")?.className).toContain(
      "after:ease-[ease]",
    );
  });

  it("applies a custom maximum width beneath the default percentage ceiling", async () => {
    await render();
    await open({ ariaLabel: "Drawer", drawerKey: "max-width", drawerMaxWidth: "720px" });

    expect(panel()?.style.getPropertyValue("--drawer-max-width")).toBe("min(85%, 720px)");
  });

  it("uses saved width first and clamps saved, percent, and pixel widths", async () => {
    localStorage.setItem("drawer-width:saved", "93");
    await render();
    await open({
      ariaLabel: "Drawer",
      drawerKey: "saved",
      drawerWidth: "25%",
    });
    expect(panel()?.style.getPropertyValue("--drawer-width")).toBe("85%");

    await open({ ariaLabel: "Drawer", drawerKey: "percent", drawerWidth: "5%" });
    expect(panel()?.style.getPropertyValue("--drawer-width")).toBe("20%");

    await open({ ariaLabel: "Drawer", drawerKey: "pixels", drawerWidth: "600px" });
    expect(panel()?.style.getPropertyValue("--drawer-width")).toBe("50%");

    await open({ ariaLabel: "Drawer", drawerKey: "invalid", drawerWidth: "wide" });
    expect(panel()?.style.getPropertyValue("--drawer-width")).toBe("50%");
  });

  it("falls back when reading local storage throws", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Storage is unavailable", "SecurityError");
    });

    await render();
    await open({
      ariaLabel: "Unavailable storage",
      drawerKey: "unavailable",
      drawerWidth: "35%",
    });

    expect(panel()?.getAttribute("aria-label")).toBe("Unavailable storage");
    expect(panel()?.style.getPropertyValue("--drawer-width")).toBe("35%");
  });

  it("rejects malformed persisted numeric values", async () => {
    localStorage.setItem("drawer-width:malformed", "80broken");

    await render();
    await open({
      ariaLabel: "Malformed storage",
      drawerKey: "malformed",
      drawerWidth: "35%",
    });

    expect(panel()?.style.getPropertyValue("--drawer-width")).toBe("35%");
  });

  it("sets an exact fixed custom width when resizing is disabled", async () => {
    await render();
    await open({
      ariaLabel: "Drawer",
      drawerKey: "fixed",
      drawerWidth: "520px",
      resizable: false,
    });

    expect(panel()?.style.getPropertyValue("--drawer-width")).toBe("520px");
    expect(panel()?.style.getPropertyValue("--drawer-min-width")).toBe("520px");
    expect(panel()?.style.getPropertyValue("--drawer-max-width")).toBe("520px");
    expect(document.querySelector("[data-slot='drawer-resize-handle']")).toBeNull();

    await open({
      ariaLabel: "Invalid fixed drawer",
      drawerKey: "invalid-fixed",
      drawerWidth: "wide",
      resizable: false,
    });
    expect(panel()?.style.getPropertyValue("--drawer-width")).toBe("50%");
    expect(panel()?.style.getPropertyValue("--drawer-min-width")).toBe("20%");
    expect(panel()?.style.getPropertyValue("--drawer-max-width")).toBe("85%");
  });

  it("resizes, clamps, and persists the width", async () => {
    await render();
    await open({ ariaLabel: "Drawer", drawerKey: "drag" });
    const handle = document.querySelector("[data-slot='drawer-resize-handle']");

    await act(async () => {
      handle?.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, clientX: 600 }));
      document.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: 60 }));
      document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    });

    expect(panel()?.style.getPropertyValue("--drawer-width")).toBe("85%");
    expect(localStorage.getItem("drawer-width:drag")).toBe("85");
    expect(handle?.hasAttribute("data-resizing")).toBe(false);
  });

  it("settles and cleans up a drag when writing local storage throws", async () => {
    const removeSpy = vi.spyOn(document, "removeEventListener");
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Storage is full", "QuotaExceededError");
    });
    await render();
    await open({ ariaLabel: "Write failure", drawerKey: "write-failure" });
    const handle = document.querySelector("[data-slot='drawer-resize-handle']");

    await act(async () => {
      handle?.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, clientX: 600 }));
      document.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: 240 }));
      document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    });

    expect(panel()?.style.getPropertyValue("--drawer-width")).toBe("80%");
    expect(panel()?.hasAttribute("data-resizing")).toBe(false);
    expect(handle?.hasAttribute("data-resizing")).toBe(false);
    expect(removeSpy.mock.calls.some(([type]) => type === "mousemove")).toBe(true);
    expect(removeSpy.mock.calls.some(([type]) => type === "mouseup")).toBe(true);

    document.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: 960 }));
    expect(panel()?.style.getPropertyValue("--drawer-width")).toBe("80%");
  });

  it("synchronizes persisted width across mounted drawer providers", async () => {
    let firstDrawer: DrawerApi | null = null;
    let secondDrawer: DrawerApi | null = null;

    const captureFirst = (drawer: DrawerApi) => {
      firstDrawer = drawer;
    };
    const captureSecond = (drawer: DrawerApi) => {
      secondDrawer = drawer;
    };
    await renderTree(
      <Fragment>
        <GlobalDrawer>
          <CaptureDrawer capture={captureFirst} />
        </GlobalDrawer>
        <GlobalDrawer>
          <CaptureDrawer capture={captureSecond} />
        </GlobalDrawer>
      </Fragment>,
    );
    await act(async () => {
      firstDrawer?.openDrawer(() => <DrawerBody>First</DrawerBody>, {
        ariaLabel: "First drawer",
        drawerKey: "shared",
      });
      secondDrawer?.openDrawer(() => <DrawerBody>Second</DrawerBody>, {
        ariaLabel: "Second drawer",
        drawerKey: "shared",
      });
    });

    const firstPanel = document.querySelector<HTMLElement>("[aria-label='First drawer']");
    const secondPanel = document.querySelector<HTMLElement>("[aria-label='Second drawer']");
    const firstHandle = firstPanel?.querySelector("[data-slot='drawer-resize-handle']");
    await act(async () => {
      firstHandle?.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, clientX: 600 }));
      document.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: 240 }));
      document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    });

    expect(firstPanel?.style.getPropertyValue("--drawer-width")).toBe("80%");
    expect(secondPanel?.style.getPropertyValue("--drawer-width")).toBe("80%");
  });

  it("refreshes a drawer key after another provider updates it", async () => {
    let firstDrawer: DrawerApi | null = null;
    let secondDrawer: DrawerApi | null = null;
    const captureFirst = (drawer: DrawerApi) => {
      firstDrawer = drawer;
    };
    const captureSecond = (drawer: DrawerApi) => {
      secondDrawer = drawer;
    };
    await renderTree(
      <Fragment>
        <GlobalDrawer>
          <CaptureDrawer capture={captureFirst} />
        </GlobalDrawer>
        <GlobalDrawer>
          <CaptureDrawer capture={captureSecond} />
        </GlobalDrawer>
      </Fragment>,
    );
    await act(async () => {
      firstDrawer?.openDrawer(() => <DrawerBody>First A</DrawerBody>, {
        ariaLabel: "First drawer",
        drawerKey: "reuse-a",
      });
      secondDrawer?.openDrawer(() => <DrawerBody>Second A</DrawerBody>, {
        ariaLabel: "Second drawer",
        drawerKey: "reuse-a",
      });
    });
    await act(async () => {
      firstDrawer?.openDrawer(() => <DrawerBody>First B</DrawerBody>, {
        ariaLabel: "First drawer",
        drawerKey: "reuse-b",
        drawerWidth: "35%",
      });
    });

    const firstPanel = document.querySelector<HTMLElement>("[aria-label='First drawer']");
    const secondPanel = document.querySelector<HTMLElement>("[aria-label='Second drawer']");
    const secondHandle = secondPanel?.querySelector("[data-slot='drawer-resize-handle']");
    await act(async () => {
      secondHandle?.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, clientX: 600 }));
      document.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: 240 }));
      document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    });
    expect(firstPanel?.style.getPropertyValue("--drawer-width")).toBe("35%");

    await act(async () => {
      firstDrawer?.openDrawer(() => <DrawerBody>First A again</DrawerBody>, {
        ariaLabel: "First drawer",
        drawerKey: "reuse-a",
      });
    });
    expect(firstPanel?.style.getPropertyValue("--drawer-width")).toBe("80%");
  });

  it("cleans up an active drag when its width identity changes", async () => {
    const removeSpy = vi.spyOn(document, "removeEventListener");
    await render();
    await open({
      ariaLabel: "Identity drawer",
      drawerKey: "identity-a",
      drawerWidth: "25%",
    });
    const handle = document.querySelector("[data-slot='drawer-resize-handle']");
    await act(async () =>
      handle?.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, clientX: 600 })),
    );

    await open({
      ariaLabel: "Identity drawer",
      drawerKey: "identity-b",
      drawerWidth: "35%",
    });
    expect(panel()?.style.getPropertyValue("--drawer-width")).toBe("35%");
    expect(panel()?.hasAttribute("data-resizing")).toBe(false);
    expect(handle?.hasAttribute("data-resizing")).toBe(false);
    expect(removeSpy.mock.calls.some(([type]) => type === "mousemove")).toBe(true);
    expect(removeSpy.mock.calls.some(([type]) => type === "mouseup")).toBe(true);

    document.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: 60 }));
    expect(panel()?.style.getPropertyValue("--drawer-width")).toBe("35%");
  });

  it("cleans up an active drag when resizing is disabled", async () => {
    const removeSpy = vi.spyOn(document, "removeEventListener");
    await render();
    await open({ ariaLabel: "Resizable drawer", drawerKey: "disable-drag" });
    const handle = document.querySelector("[data-slot='drawer-resize-handle']");
    await act(async () =>
      handle?.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, clientX: 600 })),
    );

    await open({
      ariaLabel: "Resizable drawer",
      drawerKey: "disable-drag",
      resizable: false,
    });
    expect(panel()?.hasAttribute("data-resizing")).toBe(false);
    expect(handle?.hasAttribute("data-resizing")).toBe(false);
    expect(removeSpy.mock.calls.some(([type]) => type === "mousemove")).toBe(true);
    expect(removeSpy.mock.calls.some(([type]) => type === "mouseup")).toBe(true);

    document.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: 60 }));
    document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    expect(panel()?.style.getPropertyValue("--drawer-width")).toBe("50%");
    expect(localStorage.getItem("drawer-width:disable-drag")).toBeNull();
  });

  it("cleans up an active drag when the viewport becomes mobile", async () => {
    const removeSpy = vi.spyOn(document, "removeEventListener");
    await render();
    await open({ ariaLabel: "Responsive drag", drawerKey: "mobile-drag" });
    const handle = document.querySelector("[data-slot='drawer-resize-handle']");
    await act(async () =>
      handle?.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, clientX: 600 })),
    );

    await setMobile(true);
    expect(panel()?.hasAttribute("data-resizing")).toBe(false);
    expect(handle?.hasAttribute("data-resizing")).toBe(false);
    expect(removeSpy.mock.calls.some(([type]) => type === "mousemove")).toBe(true);
    expect(removeSpy.mock.calls.some(([type]) => type === "mouseup")).toBe(true);
    expect(panel()?.style.getPropertyValue("--drawer-width")).toBe("100%");
    expect(panel()?.style.getPropertyValue("--drawer-min-width")).toBe("100%");
    expect(panel()?.style.getPropertyValue("--drawer-max-width")).toBe("100%");

    document.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: 60 }));
    document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    expect(panel()?.style.getPropertyValue("--drawer-width")).toBe("100%");
    expect(localStorage.getItem("drawer-width:mobile-drag")).toBeNull();
  });

  it("removes active drag listeners when the drawer unmounts", async () => {
    const removeSpy = vi.spyOn(document, "removeEventListener");
    await render();
    await open({ ariaLabel: "Drawer", drawerKey: "cleanup" });
    const handle = document.querySelector("[data-slot='drawer-resize-handle']");
    await act(async () =>
      handle?.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, clientX: 600 })),
    );

    await act(async () => currentDrawer?.closeDrawer());
    expect(removeSpy.mock.calls.some(([type]) => type === "mousemove")).toBe(true);
    expect(removeSpy.mock.calls.some(([type]) => type === "mouseup")).toBe(true);
  });

  it("switches reactively to full width at the 800px boundary", async () => {
    await render();
    await open({ ariaLabel: "Drawer", drawerKey: "responsive" });
    expect(document.querySelector("[data-slot='drawer-resize-handle']")).not.toBeNull();

    await setMobile(true);
    expect(panel()?.style.getPropertyValue("--drawer-width")).toBe("100%");
    expect(panel()?.style.getPropertyValue("--drawer-min-width")).toBe("100%");
    expect(panel()?.style.getPropertyValue("--drawer-max-width")).toBe("100%");
    expect(document.querySelector("[data-slot='drawer-resize-handle']")).toBeNull();

    await setMobile(false);
    expect(panel()?.style.getPropertyValue("--drawer-width")).toBe("50%");
    expect(document.querySelector("[data-slot='drawer-resize-handle']")).not.toBeNull();
  });

  it("shows a dismissible error state and recovers on the next open", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    await render();
    await open({ ariaLabel: "Broken drawer" }, () => {
      throw new Error("drawer render failure");
    });

    expect(document.querySelector("[role='alert']")?.textContent).toContain(
      "There was a problem rendering the drawer.",
    );
    await open({ ariaLabel: "Recovered drawer" }, () => <DrawerBody>Recovered</DrawerBody>);
    expect(panel()?.textContent).toContain("Recovered");
    expect(document.querySelector("[role='alert']")).toBeNull();
  });
});
