"use client";

import { AnimatePresence } from "framer-motion";
import type { Location } from "history";
import {
  Component,
  createContext,
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
} from "react";

import { t } from "../../lib/scraps-locale";
import { cn } from "../../lib/utils";
import { Backdrop } from "./backdrop";
import { bodyScrollLock } from "./body-scroll-lock";
import { Button } from "./button";
import { MAX_WIDTH_PERCENT, MIN_WIDTH_PERCENT, useDrawerResizing } from "./drawer-resizing";
import { useHotkeys } from "./hotkey";
import { SlideOverPanel } from "./slide-over-panel";
import { TooltipContext } from "./tooltip";

export interface DrawerOptions {
  ariaLabel: string;
  drawerKey?: string;
  drawerMaxWidth?: string;
  drawerWidth?: string;
  mode?: "blocking" | "passive";
  onClose?: () => void;
  onOpen?: () => void;
  resizable?: boolean;
  shouldCloseOnInteractOutside?: (interactedElement: Element) => boolean;
  shouldCloseOnLocationChange?: (nextLocation: Location) => boolean;
}

type DrawerRenderProps = {
  closeDrawer: () => void;
};

type DrawerRenderer = (renderProps: DrawerRenderProps) => ReactNode;

export interface DrawerConfig {
  options: DrawerOptions;
  renderer: DrawerRenderer | null;
}

type StoredDrawerConfig = DrawerConfig & {
  callerId: string;
  revision: number;
};

type DrawerContextValue = {
  activeDrawerId: string | null;
  closeDrawer: () => void;
  openDrawer: (
    renderer: DrawerConfig["renderer"],
    options: DrawerOptions,
    callerId: string,
  ) => void;
  panelRef: React.RefObject<HTMLDivElement | null>;
};

const DrawerContext = createContext<DrawerContextValue>({
  activeDrawerId: null,
  closeDrawer: () => undefined,
  openDrawer: () => undefined,
  panelRef: { current: null },
});

const DrawerContentContext = createContext<Pick<DrawerOptions, "ariaLabel" | "onClose">>({
  ariaLabel: "slide out drawer",
  onClose: () => undefined,
});

function shouldCloseOnInteractOutsideByDefault(element: Element) {
  if (document.getElementById("modal-portal")?.contains(element)) {
    return false;
  }

  const overlay = element.closest("[data-overlay]");
  return !overlay || overlay.hasAttribute("data-drawer-backdrop");
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" fill="currentColor" height="16" viewBox="0 0 16 16" width="16">
      <path d="M12.72 2.22C13.01 1.93 13.49 1.93 13.78 2.22C14.07 2.51 14.07 2.99 13.78 3.28L9.06 8L13.78 12.72C14.07 13.01 14.07 13.49 13.78 13.78C13.49 14.07 13.01 14.07 12.72 13.78L8 9.06L3.28 13.78C2.99 14.07 2.51 14.07 2.22 13.78C1.93 13.49 1.93 13.01 2.22 12.72L6.94 8L2.22 3.28C1.93 2.99 1.93 2.51 2.22 2.22C2.51 1.93 2.99 1.93 3.28 2.22L8 6.94L12.72 2.22Z" />
    </svg>
  );
}

type DrawerPanelProps = Pick<
  DrawerOptions,
  "ariaLabel" | "drawerKey" | "drawerMaxWidth" | "drawerWidth" | "onClose" | "resizable"
> & {
  children: ReactNode;
  mode: NonNullable<DrawerOptions["mode"]>;
  panelForwardRef: Ref<HTMLDivElement>;
};

function assignPanelRef(node: HTMLDivElement | null, panelForwardRef: Ref<HTMLDivElement>) {
  if (typeof panelForwardRef === "function") {
    panelForwardRef(node);
  } else if (panelForwardRef) {
    panelForwardRef.current = node;
  }
}

function DrawerPanel({
  children,
  ariaLabel,
  onClose,
  mode,
  drawerKey,
  drawerMaxWidth,
  drawerWidth,
  resizable = true,
  panelForwardRef,
}: DrawerPanelProps) {
  const { enabled, handleResizeStart, panelRef, persistedWidthPercent, resizeHandleRef } =
    useDrawerResizing({
      drawerKey,
      drawerMaxWidth,
      drawerWidth,
      enabled: resizable,
    });
  const [tooltipContainer, setTooltipContainer] = useState<HTMLDivElement | null>(null);

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] max-[800px]:pointer-events-auto max-[800px]:overflow-x-auto">
      <SlideOverPanel
        ariaLabel={ariaLabel}
        className="relative h-full! [width:clamp(var(--drawer-min-width),var(--drawer-width),var(--drawer-max-width))]! border-l border-[var(--scraps-theme-border-primary)] bg-[var(--scraps-slide-over-background)] [box-shadow:20px_0_0_var(--scraps-slide-over-background),var(--scraps-theme-shadow-high)] [--drawer-max-width:85%] [--drawer-min-width:20%] [--drawer-width:50%] data-[resizing]:[scrollbar-width:none] data-[resizing]:overflow-hidden! max-[800px]:inset-0! max-[800px]:h-full! max-[800px]:w-full! max-[800px]:max-w-full! max-[800px]:min-w-full! max-[800px]:overscroll-x-auto max-[800px]:border-0 max-[800px]:shadow-none data-[resizing]:[&_*]:[scrollbar-width:none] data-[resizing]:[&_*::-webkit-scrollbar]:hidden data-[resizing]:[&::-webkit-scrollbar]:hidden"
        mode={mode}
        panelWidth="var(--drawer-width)"
        position="right"
        ref={(node) => {
          panelRef.current = node;
          setTooltipContainer(node);
          assignPanelRef(node, panelForwardRef);
        }}
      >
        {enabled ? (
          <div
            aria-label="Resize drawer"
            className="absolute top-0 bottom-0 -left-0.5 z-[10001] w-2 cursor-ew-resize after:absolute after:top-0 after:bottom-0 after:left-0.5 after:w-1 after:bg-transparent after:opacity-80 after:transition-colors after:duration-100 after:ease-[ease] hover:after:bg-[var(--scraps-theme-blue400)] data-[at-max-width=true]:cursor-e-resize data-[at-min-width=true]:cursor-w-resize data-[resizing]:after:bg-[var(--scraps-theme-blue400)]"
            data-at-max-width={String(Math.abs(persistedWidthPercent - MAX_WIDTH_PERCENT) < 1)}
            data-at-min-width={String(persistedWidthPercent <= MIN_WIDTH_PERCENT)}
            data-slot="drawer-resize-handle"
            onMouseDown={handleResizeStart}
            ref={resizeHandleRef}
          />
        ) : null}
        <TooltipContext.Provider value={{ container: tooltipContainer }}>
          <DrawerContentContext.Provider value={{ ariaLabel, onClose }}>
            {children}
          </DrawerContentContext.Provider>
        </TooltipContext.Provider>
      </SlideOverPanel>
    </div>
  );
}

type DrawerHeaderProps = {
  children?: ReactNode;
  className?: string;
  hideBar?: boolean;
  hideCloseButton?: boolean;
  hideCloseButtonText?: boolean;
  ref?: Ref<HTMLHeadingElement>;
};

export function DrawerHeader({
  children = null,
  className,
  hideBar = false,
  hideCloseButton = false,
  hideCloseButtonText = false,
  ref,
}: DrawerHeaderProps) {
  const { onClose } = useDrawerContentContext();

  return (
    <header
      className={cn(
        "sticky top-0 z-[10000] flex h-[53px] shrink-0 items-center justify-start border-b border-[var(--scraps-theme-border-primary)] bg-background px-3 py-1.5",
        hideBar && "gap-2",
        hideCloseButton && "py-3",
        className,
      )}
      ref={ref}
    >
      {!hideCloseButton ? (
        <Fragment>
          <Button
            aria-label={t("Close Drawer")}
            icon={<CloseIcon />}
            onClick={onClose}
            size="xs"
            variant="transparent"
          >
            {hideCloseButtonText ? null : t("Close")}
          </Button>
          {!hideBar ? (
            <div className="mr-4 ml-2 self-stretch border-r border-[var(--scraps-theme-border-primary)]" />
          ) : null}
        </Fragment>
      ) : null}
      {children}
    </header>
  );
}

export function DrawerBody({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <aside className={cn("px-6 py-4 text-sm", className)} {...props} />;
}

export function useDrawerContentContext() {
  return useContext(DrawerContentContext);
}

function DrawerRendererView({
  closeDrawer,
  renderer,
}: {
  closeDrawer: () => void;
  renderer: DrawerRenderer | null;
}) {
  return renderer?.({ closeDrawer }) ?? null;
}

type DrawerErrorBoundaryProps = {
  children: ReactNode;
  onDismiss: () => void;
};

class DrawerErrorBoundary extends Component<DrawerErrorBoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <DrawerBody role="alert">
        <p>{t("There was a problem rendering the drawer.")}</p>
        <Button onClick={this.props.onDismiss}>{t("Close")}</Button>
      </DrawerBody>
    );
  }
}

type GlobalDrawerProps = {
  children?: ReactNode;
  location?: Location;
};

export function GlobalDrawer({ children, location }: GlobalDrawerProps) {
  const [currentDrawerConfig, setCurrentDrawerConfig] = useState<StoredDrawerConfig>();
  const currentDrawerConfigRef = useRef(currentDrawerConfig);
  const panelRef = useRef<HTMLDivElement>(null);
  const lockId = useId();
  const revisionRef = useRef(0);
  const sawInitialLocation = useRef(false);
  const isDrawerOpen = currentDrawerConfig !== undefined;

  const closeDrawer = useCallback(() => {
    bodyScrollLock.release(lockId);
    setCurrentDrawerConfig(undefined);
  }, [lockId]);

  const openDrawer = useCallback<DrawerContextValue["openDrawer"]>(
    (renderer, options, callerId) => {
      if (options.mode !== "passive") {
        bodyScrollLock.acquire(lockId);
      } else {
        bodyScrollLock.release(lockId);
      }
      revisionRef.current += 1;
      setCurrentDrawerConfig({
        renderer,
        options,
        callerId,
        revision: revisionRef.current,
      });
      options.onOpen?.();
    },
    [lockId],
  );

  const handleClose = useCallback(() => {
    currentDrawerConfigRef.current?.options.onClose?.();
    closeDrawer();
  }, [closeDrawer]);

  useEffect(() => {
    currentDrawerConfigRef.current = currentDrawerConfig;
  }, [currentDrawerConfig]);

  useLayoutEffect(() => {
    if (!location) return;
    if (!sawInitialLocation.current) {
      sawInitialLocation.current = true;
      return;
    }

    const current = currentDrawerConfigRef.current;
    if (
      current &&
      (current.options.shouldCloseOnLocationChange?.(location) ??
        current.options.mode !== "passive")
    ) {
      closeDrawer();
    }
  }, [closeDrawer, location]);

  useEffect(() => {
    if (!isDrawerOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const current = currentDrawerConfigRef.current;
      const target = event.target;
      if (
        !current ||
        current.options.mode === "passive" ||
        !(target instanceof Element) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }

      const shouldClose = current.options.shouldCloseOnInteractOutside
        ? current.options.shouldCloseOnInteractOutside(target)
        : shouldCloseOnInteractOutsideByDefault(target);
      if (shouldClose) handleClose();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [handleClose, isDrawerOpen]);

  useHotkeys([
    {
      match: "Escape",
      enabled: isDrawerOpen,
      skipPreventDefault: true,
      callback: (event) => {
        if (document.querySelector("#modal-portal [role='dialog']")) return;
        event.preventDefault();
        handleClose();
      },
    },
  ]);

  useEffect(
    () => () => {
      bodyScrollLock.release(lockId);
    },
    [lockId],
  );

  const current = currentDrawerConfig;
  const mode = current?.options.mode ?? "blocking";

  return (
    <DrawerContext.Provider
      value={{
        activeDrawerId: current?.callerId ?? null,
        closeDrawer,
        openDrawer,
        panelRef,
      }}
    >
      <AnimatePresence>
        {isDrawerOpen && mode !== "passive" ? (
          <Backdrop data-drawer-backdrop="" key="backdrop" zIndex="drawer" />
        ) : null}
        {current ? (
          <DrawerPanel
            ariaLabel={current.options.ariaLabel}
            drawerKey={current.options.drawerKey}
            drawerMaxWidth={current.options.drawerMaxWidth}
            drawerWidth={current.options.drawerWidth}
            mode={mode}
            onClose={handleClose}
            panelForwardRef={panelRef}
            resizable={current.options.resizable}
          >
            <DrawerErrorBoundary key={current.revision} onDismiss={handleClose}>
              <DrawerRendererView closeDrawer={handleClose} renderer={current.renderer} />
            </DrawerErrorBoundary>
          </DrawerPanel>
        ) : null}
      </AnimatePresence>
      {children}
    </DrawerContext.Provider>
  );
}

export function useDrawer() {
  const context = useContext(DrawerContext);
  const callerId = useId();
  const openDrawerRef = useRef(context.openDrawer);

  useEffect(() => {
    openDrawerRef.current = context.openDrawer;
  });

  const openDrawer = useCallback(
    (renderer: DrawerConfig["renderer"], options: DrawerOptions) => {
      openDrawerRef.current(renderer, options, callerId);
    },
    [callerId],
  );

  return {
    openDrawer,
    closeDrawer: context.closeDrawer,
    panelRef: context.panelRef,
    isDrawerOpen: context.activeDrawerId === callerId,
    isAnyDrawerOpen: context.activeDrawerId !== null,
  };
}
