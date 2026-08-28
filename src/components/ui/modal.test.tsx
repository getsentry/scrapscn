import { act, useEffect, type ComponentProps, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type MockMotionDivProps = ComponentProps<"div"> & {
  animate?: unknown;
  exit?: { transition?: { duration?: number } };
  initial?: unknown;
  transition?: { duration?: number };
};
const reducedMotionPreference = vi.hoisted(() => ({ current: false }));
vi.mock("framer-motion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("framer-motion")>();
  const react = await import("react");
  const MotionDiv = react.forwardRef<HTMLDivElement, MockMotionDivProps>((props, ref) => {
    const { animate, exit, initial, transition, ...domProps } = props;
    void animate;
    void initial;
    return react.createElement("div", {
      ...domProps,
      "data-exit-duration": exit?.transition?.duration,
      "data-enter-duration": transition?.duration,
      ref,
    });
  });
  return {
    ...actual,
    motion: { div: MotionDiv },
    useReducedMotion: () => reducedMotionPreference.current,
  };
});

import { CompactSelect } from "./compact-select";
import { GlobalModal, useModal, type ModalTypes } from "./modal";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

type ModalApi = ReturnType<typeof useModal>;
type Mounted = { container: HTMLDivElement; root: Root };
const roots: Mounted[] = [];
let currentModal: ModalApi | null = null;

function Controller({ onChange }: { onChange?: (api: ModalApi) => void }) {
  const modal = useModal();
  useEffect(() => {
    currentModal = modal;
    onChange?.(modal);
  }, [modal, onChange]);
  return null;
}

async function render(ui: ReactNode): Promise<Mounted> {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const mounted = { container, root };
  roots.push(mounted);
  await act(async () => root.render(ui));
  return mounted;
}

async function openModal(
  renderer: Parameters<ModalApi["openModal"]>[0],
  options?: ModalTypes["options"],
) {
  await act(async () => currentModal?.openModal(renderer, options));
}

async function click(element: Element | null) {
  expect(element).not.toBeNull();
  await act(async () => (element as HTMLElement).click());
}

async function pressEscape(defaultPrevented = false) {
  const event = new KeyboardEvent("keydown", {
    bubbles: true,
    cancelable: true,
    key: "Escape",
  });
  if (defaultPrevented) event.preventDefault();
  await act(async () => (document.activeElement ?? document).dispatchEvent(event));
}

function BasicModal({ routePathname }: { routePathname?: string }) {
  return (
    <>
      <Controller />
      <GlobalModal routePathname={routePathname} />
    </>
  );
}

beforeEach(() => {
  currentModal = null;
  reducedMotionPreference.current = false;
  if (typeof globalThis.CSS === "undefined") {
    Object.defineProperty(globalThis, "CSS", {
      configurable: true,
      value: { escape: (value: string) => value.replace(/([^\w-])/g, "\\$1") },
    });
  } else if (typeof CSS.escape !== "function") {
    Object.defineProperty(CSS, "escape", {
      configurable: true,
      value: (value: string) => value.replace(/([^\w-])/g, "\\$1"),
    });
  }
  vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
    callback(0);
    return 1;
  });
});

afterEach(async () => {
  await act(async () => currentModal?.closeModal());
  for (const mounted of roots.splice(0)) {
    await act(async () => mounted.root.unmount());
    mounted.container.remove();
  }
  document.getElementById("modal-portal")?.remove();
  document.body.style.cssText = "";
  document.documentElement.style.removeProperty("--scrollbar-size");
  vi.restoreAllMocks();
});

describe("GlobalModal", () => {
  it("creates the portal after mount and reuses an existing portal", async () => {
    expect(renderToString(<GlobalModal />)).toBe("");
    expect(document.getElementById("modal-portal")).toBeNull();

    const existingPortal = document.createElement("div");
    existingPortal.id = "modal-portal";
    existingPortal.className = "host-portal";
    document.body.append(existingPortal);
    await render(<BasicModal />);

    expect(document.getElementById("modal-portal")).toBe(existingPortal);
    expect(existingPortal.classList.contains("host-portal")).toBe(true);
    expect(existingPortal.classList.contains("[container-type:inline-size]")).toBe(true);
    expect(existingPortal.hasAttribute("tabindex")).toBe(false);
  });

  it("isolates preserved host content in a nested existing portal", async () => {
    const appRoot = document.createElement("div");
    const portalHost = document.createElement("section");
    const existingPortal = document.createElement("div");
    const preservedContent = document.createElement("button");
    existingPortal.id = "modal-portal";
    existingPortal.className = "host-portal";
    preservedContent.textContent = "Preserved portal content";
    preservedContent.className = "host-content";
    preservedContent.setAttribute("aria-hidden", "false");
    const preservedInert = preservedContent.inert;
    existingPortal.append(preservedContent);
    portalHost.append(existingPortal);
    appRoot.append(portalHost);
    document.body.append(appRoot);

    await render(<BasicModal />);
    await openModal(() => <div>Text-only dialog</div>);

    const dialog = document.querySelector<HTMLElement>("[role='dialog']");
    const modalRoot = existingPortal.querySelector<HTMLElement>(
      "[data-slot='scrapscn-modal-root']",
    );
    expect(existingPortal.parentElement).toBe(document.body);
    expect(existingPortal.classList.contains("host-portal")).toBe(true);
    expect(existingPortal.contains(preservedContent)).toBe(true);
    expect(preservedContent.classList.contains("host-content")).toBe(true);
    expect(modalRoot?.parentElement).toBe(existingPortal);
    expect(modalRoot?.contains(dialog ?? null)).toBe(true);
    expect(appRoot.getAttribute("aria-hidden")).toBe("true");
    expect(existingPortal.hasAttribute("aria-hidden")).toBe(false);
    expect(existingPortal.hasAttribute("inert")).toBe(false);
    expect(preservedContent.getAttribute("aria-hidden")).toBe("true");
    expect(preservedContent.hasAttribute("inert")).toBe(true);
    expect(preservedContent.inert).toBe(true);
    expect(modalRoot?.hasAttribute("aria-hidden")).toBe(false);
    expect(modalRoot?.hasAttribute("inert")).toBe(false);
    expect(dialog?.hasAttribute("aria-hidden")).toBe(false);
    expect(dialog?.getAttribute("aria-label")).toBe("Modal");
    expect(document.activeElement).toBe(dialog);

    const dynamicPortalContent = document.createElement("button");
    dynamicPortalContent.textContent = "Late portal content";
    const dynamicInert = dynamicPortalContent.inert;
    await act(async () => existingPortal.append(dynamicPortalContent));
    expect(dynamicPortalContent.getAttribute("aria-hidden")).toBe("true");
    expect(dynamicPortalContent.hasAttribute("inert")).toBe(true);
    expect(dynamicPortalContent.inert).toBe(true);

    await act(async () => {
      dialog?.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Tab" }),
      );
    });
    expect(modalRoot?.contains(document.activeElement)).toBe(true);
    expect(document.activeElement).not.toBe(preservedContent);

    await act(async () => currentModal?.closeModal());
    expect(appRoot.hasAttribute("aria-hidden")).toBe(false);
    expect(appRoot.hasAttribute("inert")).toBe(false);
    expect(preservedContent.getAttribute("aria-hidden")).toBe("false");
    expect(preservedContent.hasAttribute("inert")).toBe(false);
    expect(preservedContent.inert).toBe(preservedInert);
    expect(dynamicPortalContent.hasAttribute("aria-hidden")).toBe(false);
    expect(dynamicPortalContent.hasAttribute("inert")).toBe(false);
    expect(dynamicPortalContent.inert).toBe(dynamicInert);
    expect(existingPortal.classList.contains("host-portal")).toBe(true);
    expect(existingPortal.contains(preservedContent)).toBe(true);
    appRoot.remove();
  });

  it("publishes the created focus trap and retains it after close", async () => {
    await render(<BasicModal />);
    const createdTrap = currentModal?.focusTrap;
    expect(createdTrap).toBeDefined();

    await openModal(() => <div>Content</div>);
    expect(currentModal?.focusTrap).toBe(createdTrap);
    expect(createdTrap?.active).toBe(true);

    await act(async () => currentModal?.closeModal());
    expect(currentModal?.focusTrap).toBe(createdTrap);
    expect(createdTrap?.active).toBe(false);
  });

  it("names and focuses a text-only dialog instead of its aria-hidden opener", async () => {
    const mounted = await render(<BasicModal />);
    const opener = document.createElement("button");
    opener.textContent = "Open";
    mounted.container.append(opener);
    opener.focus();

    await openModal(() => <div>Text-only content</div>);

    const dialog = document.querySelector<HTMLElement>("[role='dialog']");
    expect(dialog?.getAttribute("aria-label")).toBe("Modal");
    expect(dialog?.tabIndex).toBe(-1);
    expect(document.activeElement).toBe(dialog);
    expect(document.activeElement).not.toBe(opener);
    expect(mounted.container.getAttribute("aria-hidden")).toBe("true");
  });

  it("passes zero-duration enter and exit transitions under reduced motion", async () => {
    reducedMotionPreference.current = true;
    await render(<BasicModal />);
    await openModal(() => <div>Content</div>);

    const dialog = document.querySelector<HTMLElement>("[role='dialog']");
    expect(dialog?.dataset.enterDuration).toBe("0");
    expect(dialog?.dataset.exitDuration).toBe("0");
  });

  it("passes the stable, actual modal container ref to renderers", async () => {
    await render(<BasicModal />);
    const refs: NonNullable<ModalTypes["renderProps"]["modalContainerRef"]>[] = [];
    await openModal(({ modalContainerRef }) => {
      if (modalContainerRef) refs.push(modalContainerRef);
      return <div>Content</div>;
    });

    expect(refs.length).toBeGreaterThan(0);
    expect(new Set(refs).size).toBe(1);
    expect(refs[0]?.current).toBe(document.querySelector("[data-test-id='modal-backdrop']"));
  });

  it("calls the option close callback for every renderer close", async () => {
    const calls: string[] = [];
    await render(<BasicModal />);
    const cases: Array<{
      action: () => Promise<void>;
      expectedReason: string;
      render: Parameters<ModalApi["openModal"]>[0];
    }> = [
      {
        action: () => click(document.querySelector("[aria-label='Close Modal']")),
        expectedReason: "close-button",
        render: ({ Header }) => <Header closeButton>Title</Header>,
      },
      {
        action: () => click(document.querySelector("[data-test-id='modal-backdrop']")),
        expectedReason: "backdrop-click",
        render: () => <div>Backdrop</div>,
      },
      {
        action: () => pressEscape(),
        expectedReason: "escape-key",
        render: () => <div>Escape</div>,
      },
      {
        action: () => click(document.querySelector("[data-renderer-close]")),
        expectedReason: "undefined",
        render: ({ closeModal }) => (
          <button data-renderer-close onClick={closeModal}>
            Close
          </button>
        ),
      },
    ];

    for (const closeCase of cases) {
      await openModal(closeCase.render, {
        onClose: (reason) => calls.push(`option:${String(reason)}`),
      });
      await closeCase.action();
      expect(calls.splice(0)).toEqual([`option:${closeCase.expectedReason}`]);
    }
  });

  it("keeps imperative hook close separate from the option callback", async () => {
    const optionClose = vi.fn();
    await render(<BasicModal />);
    await openModal(() => <div>Content</div>, { onClose: optionClose });

    await act(async () => currentModal?.closeModal());

    expect(optionClose).not.toHaveBeenCalled();
  });

  it.each([
    { backdrop: true, escape: true, mode: "all" as const },
    { backdrop: false, escape: false, mode: "none" as const },
    { backdrop: true, escape: false, mode: "backdrop-click" as const },
    { backdrop: false, escape: true, mode: "escape-key" as const },
  ])("honors $mode close events", async ({ backdrop, escape, mode }) => {
    const closed = vi.fn();
    await render(<BasicModal />);
    await openModal(() => <div>Content</div>, { closeEvents: mode, onClose: closed });

    await pressEscape();
    expect(closed.mock.calls.some(([reason]) => reason === "escape-key")).toBe(escape);
    if (escape) {
      await openModal(() => <div>Content</div>, { closeEvents: mode, onClose: closed });
    }
    await click(document.querySelector("[data-test-id='modal-backdrop']"));
    expect(closed.mock.calls.some(([reason]) => reason === "backdrop-click")).toBe(backdrop);
  });

  it("ignores prevented Escape and clicks that originate inside the dialog", async () => {
    const closed = vi.fn();
    await render(<BasicModal />);
    await openModal(() => <button data-inside>Inside</button>, { onClose: closed });

    await pressEscape(true);
    await click(document.querySelector("[data-inside]"));

    expect(closed).not.toHaveBeenCalled();
    expect(document.querySelector("[role='dialog']")).not.toBeNull();
  });

  it("supports no backdrop and custom backdrop props with a z-index override", async () => {
    await render(<BasicModal />);
    await openModal(() => <div>Content</div>, { backdrop: false });
    expect(document.querySelector("#backdrop")).toBeNull();
    await act(async () => currentModal?.closeModal());

    await openModal(() => <div>Content</div>, {
      backdrop: { "data-test-id": "custom-backdrop", zIndex: "drawer" },
    });
    const backdrop = document.querySelector("[data-test-id='custom-backdrop']");
    expect(backdrop?.className).toContain("z-[9999]");
  });

  it("locks body scroll and restores all body and root state exactly", async () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1000 });
    Object.defineProperty(document.body, "clientWidth", { configurable: true, value: 980 });
    Object.defineProperty(window, "scrollX", { configurable: true, value: 17 });
    Object.defineProperty(window, "scrollY", { configurable: true, value: 91 });
    document.body.style.cssText =
      "position:relative;top:3px;left:4px;right:5px;width:88%;padding-right:6px";
    document.documentElement.style.setProperty("--scrollbar-size", "7px", "important");
    const previouslyHidden = document.createElement("aside");
    previouslyHidden.setAttribute("aria-hidden", "false");
    document.body.append(previouslyHidden);
    const mounted = await render(<BasicModal />);

    await openModal(() => <div>Content</div>);

    expect(document.body.style.position).toBe("fixed");
    expect(document.body.style.top).toBe("-91px");
    expect(document.body.style.left).toBe("0px");
    expect(document.body.style.right).toBe("0px");
    expect(document.body.style.width).toBe("100%");
    expect(document.body.style.paddingRight).toBe("26px");
    expect(document.documentElement.style.getPropertyValue("--scrollbar-size")).toBe("20px");
    expect(mounted.container.getAttribute("aria-hidden")).toBe("true");
    expect(previouslyHidden.getAttribute("aria-hidden")).toBe("true");
    expect(document.getElementById("modal-portal")?.hasAttribute("aria-hidden")).toBe(false);

    await act(async () => currentModal?.closeModal());

    expect(document.body.style.cssText).toContain("position: relative");
    expect(document.body.style.top).toBe("3px");
    expect(document.body.style.left).toBe("4px");
    expect(document.body.style.right).toBe("5px");
    expect(document.body.style.width).toBe("88%");
    expect(document.body.style.paddingRight).toBe("6px");
    expect(document.documentElement.style.getPropertyValue("--scrollbar-size")).toBe("7px");
    expect(mounted.container.hasAttribute("aria-hidden")).toBe(false);
    expect(previouslyHidden.getAttribute("aria-hidden")).toBe("false");
    expect(window.scrollTo).toHaveBeenCalledWith(17, 91);
    previouslyHidden.remove();
  });

  it("hides body roots added while open and restores their missing state", async () => {
    await render(<BasicModal />);
    await openModal(() => <div>Content</div>);
    const lateRoot = document.createElement("div");
    document.body.append(lateRoot);
    await act(async () => undefined);
    expect(lateRoot.getAttribute("aria-hidden")).toBe("true");

    await act(async () => currentModal?.closeModal());
    expect(lateRoot.hasAttribute("aria-hidden")).toBe(false);
    lateRoot.remove();
  });

  it("releases scroll and body isolation when GlobalModal unmounts while open", async () => {
    document.body.style.position = "relative";
    const mounted = await render(<BasicModal />);
    await openModal(() => <div>Content</div>);
    expect(document.body.style.position).toBe("fixed");
    expect(mounted.container.getAttribute("aria-hidden")).toBe("true");

    await act(async () => mounted.root.unmount());
    roots.splice(roots.indexOf(mounted), 1);

    expect(document.body.style.position).toBe("relative");
    expect(mounted.container.hasAttribute("aria-hidden")).toBe(false);
    expect(currentModal?.focusTrap?.active).toBe(false);
    mounted.container.remove();
  });

  it("restores focus to the element active when the modal opened", async () => {
    const mounted = await render(<BasicModal />);
    const trigger = document.createElement("button");
    trigger.textContent = "Open";
    mounted.container.append(trigger);
    trigger.focus();
    await openModal(() => <input aria-label="Modal input" autoFocus />);
    expect(document.activeElement?.getAttribute("aria-label")).toBe("Modal input");

    await pressEscape();

    expect(document.activeElement).toBe(trigger);
  });

  it("ignores the first defined pathname and closes later changes without callbacks", async () => {
    const optionClose = vi.fn();
    const mounted = await render(<BasicModal />);
    await openModal(() => <div>Content</div>, { onClose: optionClose });

    await act(async () => mounted.root.render(<BasicModal routePathname="/first" />));
    expect(document.querySelector("[role='dialog']")).not.toBeNull();
    await act(async () => mounted.root.render(<BasicModal routePathname="/second" />));

    expect(currentModal?.isOpen).toBe(false);
    expect(optionClose).not.toHaveBeenCalled();
  });

  it("replaces the current renderer and options without closing the first", async () => {
    const firstClose = vi.fn();
    const secondClose = vi.fn();
    await render(<BasicModal />);
    await openModal(() => <div>First</div>, { onClose: firstClose });
    await openModal(() => <div>Second</div>, { onClose: secondClose });

    expect(document.querySelector("[role='dialog']")?.textContent).toBe("Second");
    expect(firstClose).not.toHaveBeenCalled();
    await pressEscape();
    expect(secondClose).toHaveBeenCalledWith("escape-key");
  });

  it("closes a nested CompactSelect on the first Escape and the modal on the second", async () => {
    await render(<BasicModal />);
    await openModal(() => (
      <CompactSelect
        aria-label="Modal select"
        onChange={() => undefined}
        options={[
          { label: "Option One", value: "one" },
          { label: "Option Two", value: "two" },
        ]}
        value="one"
      />
    ));
    await click(document.querySelector("button[aria-haspopup='listbox']"));
    expect(document.querySelector("[role='option']")).not.toBeNull();

    await pressEscape();
    expect(document.querySelector("[role='option']")).toBeNull();
    expect(document.querySelector("[role='dialog']")).not.toBeNull();

    await pressEscape();
    expect(currentModal?.isOpen).toBe(false);
  });

  it("uses canonical geometry, heading, footer, surface, and close icon", async () => {
    await render(<BasicModal />);
    await openModal(({ Header, Body, Footer }) => (
      <>
        <Header closeButton>
          <h4>Title</h4>
        </Header>
        <Body>Body</Body>
        <Footer>Footer</Footer>
      </>
    ));

    const dialog = document.querySelector("[role='dialog']");
    const documentNode = document.querySelector<HTMLElement>("[role='document']");
    const header = document.querySelector("header");
    const footer = document.querySelector("footer");
    const icon = document.querySelector("[aria-label='Close Modal'] svg");
    expect(dialog?.className).toContain("mt-16");
    expect(dialog?.className).toContain("px-3");
    expect(dialog?.className).toContain("min-[992px]:py-8");
    expect(documentNode?.className).toContain("px-6");
    expect(documentNode?.className).toContain("min-[992px]:p-8");
    expect(documentNode?.className).toContain("[background:var(--popover)]");
    expect(documentNode?.className).toContain("[border-top-left-radius:6px]");
    expect(documentNode?.className).toContain("[box-shadow:var(--scraps-theme-shadow-high,");
    expect(header?.className).toContain("-mr-4");
    expect(header?.className).toContain("mb-6");
    expect(header?.className).toContain("py-6");
    expect(header?.className).toContain("min-[992px]:-mx-8");
    expect(header?.className).toContain("border-[var(--scraps-theme-border-primary)]");
    expect(footer?.className).toContain("-mb-8");
    expect(footer?.className).toContain("mt-6");
    expect(footer?.className).toContain("px-4");
    expect(footer?.className).toContain("py-6");
    expect(footer?.className).toContain("border-[var(--scraps-theme-border-primary)]");
    expect(icon?.getAttribute("width")).toBe("12");
    expect(icon?.querySelector("path")?.getAttribute("d")).toContain("M12.72 2.22");
  });
});
