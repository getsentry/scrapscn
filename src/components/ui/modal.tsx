"use client";

import { createFocusTrap, type FocusTrap } from "focus-trap";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type HTMLAttributes,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

import { t } from "../../lib/scraps-locale";
import { cn } from "../../lib/utils";
import { Backdrop } from "./backdrop";
import { bodyScrollLock } from "./body-scroll-lock";
import { Button, type ButtonProps } from "./button";
import { ContainerQueryProvider, Surface } from "./layout";
import { TooltipContext } from "./tooltip";

type CloseReason = "close-button" | "backdrop-click" | "escape-key";
type CloseEvents = "all" | "none" | "backdrop-click" | "escape-key";
type ModalOptions = {
  backdrop?: boolean | ComponentProps<typeof Backdrop>;
  closeEvents?: CloseEvents;
  /** Tailwind classes for the element with role="dialog". */
  modalCss?: string;
  onClose?: (reason?: CloseReason) => void;
};
type ModalRenderProps = {
  Body: typeof ModalBody;
  CloseButton: ReturnType<typeof makeCloseButton>;
  Footer: typeof ModalFooter;
  Header: ReturnType<typeof makeClosableHeader>;
  closeModal: () => void;
  modalContainerRef?: RefObject<HTMLDivElement | null>;
};
type Renderer = (props: ModalRenderProps) => ReactNode;

/** The public type namespace preserves Scraps' action-creator import shape. */
export type ModalTypes = { options: ModalOptions; renderProps: ModalRenderProps };

type ModalState = {
  focusTrap?: FocusTrap;
  options: ModalOptions;
  renderer: Renderer | null;
  triggerElement: HTMLElement | null;
};

const initialState: ModalState = {
  options: {},
  renderer: null,
  triggerElement: null,
};
let modalState = initialState;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return modalState;
}

function getServerSnapshot() {
  return initialState;
}

function open(renderer: Renderer, options: ModalOptions = {}) {
  modalState = {
    focusTrap: modalState.focusTrap,
    options,
    renderer,
    triggerElement: document.activeElement instanceof HTMLElement ? document.activeElement : null,
  };
  emit();
}

function close() {
  modalState = {
    focusTrap: modalState.focusTrap,
    options: {},
    renderer: null,
    triggerElement: null,
  };
  emit();
}

function setFocusTrap(focusTrap: FocusTrap) {
  if (modalState.focusTrap === focusTrap) return;
  modalState = { ...modalState, focusTrap };
  emit();
}

type PortalTarget = {
  modalRoot: HTMLDivElement;
  portal: HTMLDivElement;
};

let ownedModalRoot: HTMLDivElement | null = null;

function getPortalTarget(): PortalTarget {
  const existing = document.querySelector<HTMLDivElement>("#modal-portal");
  const portal = existing ?? document.createElement("div");
  if (existing) {
    if (existing.parentElement !== document.body) document.body.append(existing);
    existing.classList.add("[container-type:inline-size]");
  } else {
    portal.id = "modal-portal";
    portal.className = "[container-type:inline-size]";
    document.body.append(portal);
  }

  if (ownedModalRoot?.parentElement !== portal) {
    ownedModalRoot = document.createElement("div");
    ownedModalRoot.dataset.slot = "scrapscn-modal-root";
    ownedModalRoot.tabIndex = -1;
    portal.append(ownedModalRoot);
  }

  return { modalRoot: ownedModalRoot, portal };
}

class BodyAriaIsolation {
  private acquiredBy = new Set<string>();
  private initialValues = new Map<
    HTMLElement,
    {
      ariaHidden: string | null;
      inertAttribute: string | null;
      inertProperty: boolean | undefined;
    }
  >();
  private modalRoot: HTMLElement | null = null;
  private observer: MutationObserver | null = null;
  private portal: HTMLElement | null = null;

  private hide(element: HTMLElement) {
    if (element === this.portal || element === this.modalRoot || this.initialValues.has(element))
      return;
    this.initialValues.set(element, {
      ariaHidden: element.getAttribute("aria-hidden"),
      inertAttribute: element.getAttribute("inert"),
      inertProperty: "inert" in element ? element.inert : undefined,
    });
    element.setAttribute("aria-hidden", "true");
    element.setAttribute("inert", "");
    element.inert = true;
  }

  acquire(id: string, portal: HTMLElement, modalRoot: HTMLElement) {
    if (this.acquiredBy.has(id)) return;
    if (this.acquiredBy.size === 0) {
      this.portal = portal;
      this.modalRoot = modalRoot;
      for (const child of document.body.children) {
        if (child instanceof HTMLElement) this.hide(child);
      }
      for (const child of portal.children) {
        if (child instanceof HTMLElement) this.hide(child);
      }
      this.observer = new MutationObserver((records) => {
        for (const record of records) {
          for (const node of record.addedNodes) {
            if (node instanceof HTMLElement) this.hide(node);
          }
        }
      });
      this.observer.observe(document.body, { childList: true });
      this.observer.observe(portal, { childList: true });
    }
    this.acquiredBy.add(id);
  }

  release(id: string) {
    if (!this.acquiredBy.delete(id) || this.acquiredBy.size > 0) return;
    this.observer?.disconnect();
    this.observer = null;
    for (const [element, initialValue] of this.initialValues) {
      if (initialValue.ariaHidden === null) element.removeAttribute("aria-hidden");
      else element.setAttribute("aria-hidden", initialValue.ariaHidden);
      if (initialValue.inertProperty === undefined) Reflect.deleteProperty(element, "inert");
      else element.inert = initialValue.inertProperty;
      if (initialValue.inertAttribute === null) element.removeAttribute("inert");
      else element.setAttribute("inert", initialValue.inertAttribute);
    }
    this.initialValues.clear();
    this.modalRoot = null;
    this.portal = null;
  }
}

const bodyAriaIsolation = new BodyAriaIsolation();

function CloseIcon() {
  return (
    <svg aria-hidden fill="currentColor" height="12" viewBox="0 0 16 16" width="12">
      <path d="M12.72 2.22C13.01 1.93 13.49 1.93 13.78 2.22C14.07 2.51 14.07 2.99 13.78 3.28L9.06 8L13.78 12.72C14.07 13.01 14.07 13.49 13.78 13.78C13.49 14.07 13.01 14.07 12.72 13.78L8 9.06L3.28 13.78C2.99 14.07 2.51 14.07 2.22 13.78C1.93 13.49 1.93 13.01 2.22 12.72L6.94 8L2.22 3.28C1.93 2.99 1.93 2.51 2.22 2.22C2.51 1.93 2.99 1.93 3.28 2.22L8 6.94L12.72 2.22Z" />
    </svg>
  );
}

function CloseButton(props: Omit<ButtonProps, "aria-label">) {
  return (
    <Button
      aria-label={t("Close Modal")}
      icon={<CloseIcon />}
      size="xs"
      variant="transparent"
      {...props}
    />
  );
}

export function ModalBody({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn("text-sm [&_img]:max-w-full [&_p:last-child]:mb-0", className)}
      {...props}
    />
  );
}

export function ModalFooter({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <footer
      className={cn(
        "-mx-6 mt-6 -mb-8 flex justify-end border-t border-[var(--scraps-theme-border-primary)] px-4 py-6 min-[992px]:-mx-8 min-[992px]:px-8",
        className,
      )}
      {...props}
    />
  );
}

const modalHeadingClasses = [
  "[&_h1]:m-0 [&_h1]:text-[20px]/[1.1] [&_h1]:font-medium",
  "[&_h2]:m-0 [&_h2]:text-[20px]/[1.1] [&_h2]:font-medium",
  "[&_h3]:m-0 [&_h3]:text-[20px]/[1.1] [&_h3]:font-medium",
  "[&_h4]:m-0 [&_h4]:text-[20px]/[1.1] [&_h4]:font-medium",
  "[&_h5]:m-0 [&_h5]:text-[20px]/[1.1] [&_h5]:font-medium",
  "[&_h6]:m-0 [&_h6]:text-[20px]/[1.1] [&_h6]:font-medium",
].join(" ");

export function makeClosableHeader(closeModal: () => void) {
  return function ClosableHeader({
    closeButton,
    className,
    children,
    ...props
  }: HTMLAttributes<HTMLElement> & { closeButton?: boolean }) {
    return (
      <header
        className={cn(
          "relative -mt-8 -mr-4 mb-6 -ml-6 flex items-center justify-between gap-2 border-b border-[var(--scraps-theme-border-primary)] px-6 py-6 min-[992px]:-mx-8 min-[992px]:px-8",
          modalHeadingClasses,
          className,
        )}
        {...props}
      >
        {children}
        {closeButton ? <CloseButton onClick={closeModal} /> : null}
      </header>
    );
  };
}

export function makeCloseButton(closeModal: () => void) {
  return function ConnectedCloseButton(props: Omit<ButtonProps, "aria-label">) {
    return <CloseButton onClick={closeModal} {...props} />;
  };
}

type GlobalModalProps = { routePathname?: string };
const enterTransition = { duration: 0.16, ease: [0.24, 1, 0.32, 1] } as const;
const exitTransition = { duration: 0.12, ease: [0.64, 0, 0.8, 0] } as const;
const reducedTransition = { duration: 0 } as const;

export function GlobalModal({ routePathname }: GlobalModalProps) {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [portalTarget, setPortalTarget] = useState<PortalTarget | null>(null);
  const portalRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const trapRef = useRef<FocusTrap | null>(null);
  const isolationId = useId();
  const hasSeenPathname = useRef(false);
  const pathnameRef = useRef<string | undefined>(undefined);
  const visible = typeof state.renderer === "function";
  const reduceMotion = useReducedMotion();

  const closeModal = useCallback(
    (reason?: CloseReason) => {
      state.options.onClose?.(reason);
      close();
    },
    [state.options],
  );

  const handleEscapeClose = useCallback(
    (event: KeyboardEvent) => {
      const closeEvents = state.options.closeEvents ?? "all";
      if (
        event.key !== "Escape" ||
        event.defaultPrevented ||
        closeEvents === "none" ||
        closeEvents === "backdrop-click"
      )
        return;
      closeModal("escape-key");
    },
    [closeModal, state.options.closeEvents],
  );

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      const nextPortalTarget = getPortalTarget();
      portalRef.current = nextPortalTarget.portal;
      setPortalTarget(nextPortalTarget);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!portalTarget) return;
    const focusTrap = createFocusTrap(portalTarget.modalRoot, {
      allowOutsideClick: true,
      delayInitialFocus: false,
      escapeDeactivates: false,
      fallbackFocus: () => dialogRef.current ?? portalTarget.modalRoot,
      preventScroll: true,
    });
    trapRef.current = focusTrap;
    setFocusTrap(focusTrap);
    return () => {
      focusTrap.deactivate({ returnFocus: false });
      if (trapRef.current === focusTrap) trapRef.current = null;
    };
  }, [portalTarget]);

  useEffect(() => {
    if (routePathname === undefined) return;
    if (!hasSeenPathname.current) {
      hasSeenPathname.current = true;
      pathnameRef.current = routePathname;
      return;
    }
    if (pathnameRef.current !== routePathname) close();
    pathnameRef.current = routePathname;
  }, [routePathname]);

  useEffect(() => {
    if (!visible || !portalTarget) return;
    bodyScrollLock.acquire(isolationId);
    bodyAriaIsolation.acquire(isolationId, portalTarget.portal, portalTarget.modalRoot);
    trapRef.current?.activate();
    document.addEventListener("keydown", handleEscapeClose);
    return () => {
      bodyScrollLock.release(isolationId);
      bodyAriaIsolation.release(isolationId);
      trapRef.current?.deactivate({ returnFocus: false });
      document.removeEventListener("keydown", handleEscapeClose);
      state.triggerElement?.focus();
    };
  }, [handleEscapeClose, isolationId, portalTarget, state.triggerElement, visible]);

  if (!portalTarget) return null;
  const closeEvents = state.options.closeEvents ?? "all";
  const backdrop = state.options.backdrop ?? true;
  const backdropProps: ComponentProps<typeof Backdrop> =
    typeof backdrop === "object"
      ? Object.assign({ zIndex: "modal" as const }, backdrop)
      : { zIndex: "modal" };
  const allowBackdropClickClose = closeEvents === "all" || closeEvents === "backdrop-click";
  const clickClose = (event: React.MouseEvent) => {
    if (containerRef.current === event.target && allowBackdropClickClose)
      closeModal("backdrop-click");
  };
  // The canonical render-prop contract exposes this live DOM ref before commit.
  // eslint-disable-next-line react-hooks/refs
  const renderedChild = state.renderer?.({
    Body: ModalBody,
    CloseButton: makeCloseButton(() => closeModal("close-button")),
    Footer: ModalFooter,
    Header: makeClosableHeader(() => closeModal("close-button")),
    closeModal: () => closeModal(),
    modalContainerRef: containerRef,
  });
  const motionEnter = reduceMotion ? reducedTransition : enterTransition;
  const motionExit = reduceMotion ? reducedTransition : exitTransition;

  return createPortal(
    <ContainerQueryProvider elementRef={portalRef}>
      <AnimatePresence>
        {backdrop && visible ? <Backdrop key="backdrop" {...backdropProps} /> : null}
      </AnimatePresence>
      <div
        className="fixed inset-0 [right:var(--scrollbar-size,0)] z-[10000] flex items-start justify-center overflow-y-auto"
        data-test-id="modal-backdrop"
        onClick={backdrop ? clickClose : undefined}
        ref={containerRef}
        style={{ pointerEvents: visible ? "auto" : "none" }}
      >
        <TooltipContext.Provider value={{ container: portalTarget.modalRoot }}>
          <AnimatePresence>
            {visible ? (
              <motion.div
                animate={{ opacity: 1, scale: 1 }}
                aria-label={t("Modal")}
                aria-modal
                className={cn(
                  "mt-16 w-[640px] max-w-full px-3 py-4 min-[992px]:mt-[50px] min-[992px]:px-4 min-[992px]:py-8",
                  state.options.modalCss,
                )}
                exit={{ opacity: 0, scale: 0.99, transition: motionExit }}
                initial={{ opacity: 0, scale: 0.98 }}
                ref={dialogRef}
                role="dialog"
                tabIndex={-1}
                transition={motionEnter}
              >
                <Surface
                  className="relative px-6 py-8 text-[var(--scraps-content-primary)] min-[992px]:p-8"
                  elevation="high"
                  role="document"
                  variant="overlay"
                >
                  {renderedChild}
                </Surface>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </TooltipContext.Provider>
      </div>
    </ContainerQueryProvider>,
    portalTarget.modalRoot,
  );
}

interface UseModalReturn {
  closeModal: () => void;
  focusTrap?: FocusTrap;
  isOpen: boolean;
  openModal: (renderer: Renderer, options?: ModalOptions) => void;
  visible: boolean;
}

export function useModal(): UseModalReturn {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    closeModal: useCallback(() => close(), []),
    focusTrap: state.focusTrap,
    isOpen: typeof state.renderer === "function",
    openModal: useCallback(
      (renderer: Renderer, options?: ModalOptions) => open(renderer, options),
      [],
    ),
    visible: typeof state.renderer === "function",
  };
}
