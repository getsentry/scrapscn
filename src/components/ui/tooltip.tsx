"use client";

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from "framer-motion";
import {
  cloneElement,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
  type SyntheticEvent,
} from "react";

import "./rubik.css";

interface TooltipContextProps {
  container: Element | DocumentFragment | null;
}

export const TooltipContext = createContext<TooltipContextProps>({
  container: null,
});

type OverlayStatus = "idle" | "warming" | "open" | "cooling";
type UnderlineColor = "warning" | "danger" | "success" | "muted" | "primary";
type TooltipSide = "top" | "right" | "bottom" | "left";
type TooltipAlign = "start" | "center" | "end";
type TooltipPosition =
  | TooltipSide
  | `${TooltipSide}-${Exclude<TooltipAlign, "center">}`
  | "auto"
  | "auto-start"
  | "auto-end";

interface UseHoverOverlayProps {
  className?: string;
  containerDisplayMode?: CSSProperties["display"];
  delay?: number;
  displayTimeout?: number;
  forceVisible?: boolean | "delayed";
  isHoverable?: boolean;
  offset?: number;
  onBlur?: () => void;
  onHover?: () => void;
  onOverflowChange?: (isOverflowing: boolean) => void;
  position?: TooltipPosition;
  showOnlyOnOverflow?: boolean;
  showUnderline?: boolean;
  skipWrapper?: boolean;
  style?: CSSProperties;
  underlineColor?: UnderlineColor;
}

export interface TooltipProps extends UseHoverOverlayProps {
  title: ReactNode;
  children?: ReactNode;
  disabled?: boolean;
  maxWidth?: number;
  overlayStyle?: CSSProperties;
}

interface DelayGroup {
  coolDownTimer: number | undefined;
  isWarm: boolean;
  openListeners: Set<(origin: symbol) => void>;
}

interface TriggerElementProps {
  "aria-describedby"?: string;
  className?: string;
  onBlur?: (event: React.FocusEvent<HTMLElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLElement>) => void;
  onPointerEnter?: (event: React.PointerEvent<HTMLElement>) => void;
  onPointerLeave?: (event: React.PointerEvent<HTMLElement>) => void;
  style?: CSSProperties;
}

const OPEN_DELAY = 400;
const CLOSE_DELAY = 150;
const SKIP_DELAY_WINDOW = 600;
const COLLISION_PADDING = 12;
const defaultDelayGroup: DelayGroup = {
  coolDownTimer: undefined,
  isWarm: false,
  openListeners: new Set(),
};

function clearTimer(ref: React.RefObject<number | undefined>) {
  if (ref.current === undefined) return;
  window.clearTimeout(ref.current);
  ref.current = undefined;
}

function warmUpGroup(group: DelayGroup, origin: symbol) {
  if (group.coolDownTimer !== undefined) {
    window.clearTimeout(group.coolDownTimer);
    group.coolDownTimer = undefined;
  }
  group.isWarm = true;
  for (const listener of group.openListeners) listener(origin);
}

function startGroupCoolDown(group: DelayGroup) {
  if (group.coolDownTimer !== undefined) window.clearTimeout(group.coolDownTimer);
  group.coolDownTimer = window.setTimeout(() => {
    group.isWarm = false;
    group.coolDownTimer = undefined;
  }, SKIP_DELAY_WINDOW);
}

function isOverflown(element: Element): boolean {
  const tolerance =
    navigator.userAgent.includes("Safari") && !navigator.userAgent.includes("Chrome") ? 2 : 0;
  return (
    element.getAttribute("data-overflowing") === "true" ||
    element.scrollWidth - element.clientWidth > tolerance ||
    Array.from(element.children).some(isOverflown)
  );
}

function underlineStyle(color: UnderlineColor = "muted") {
  const colors: Record<UnderlineColor, string> = {
    danger: "var(--destructive)",
    muted: "var(--muted-foreground)",
    primary: "var(--foreground)",
    success: "var(--success-content)",
    warning: "var(--warning-content)",
  };
  return {
    textDecoration: "underline",
    textDecorationColor: colors[color],
    textDecorationStyle: "dotted",
    textDecorationThickness: "0.75px",
    textUnderlineOffset: "1.25px",
  } satisfies CSSProperties;
}

function selectAutoSide(
  triggerElement: Element,
  popupElement: Element | null,
  offset: number,
): TooltipSide {
  const triggerRect = triggerElement.getBoundingClientRect();
  const popupRect = popupElement?.getBoundingClientRect();
  const ownerWindow = triggerElement.ownerDocument.defaultView;
  const viewportHeight =
    ownerWindow?.innerHeight ?? triggerElement.ownerDocument.documentElement.clientHeight;
  const viewportWidth =
    ownerWindow?.innerWidth ?? triggerElement.ownerDocument.documentElement.clientWidth;
  const availableSpace: [TooltipSide, number][] = [
    [
      "bottom",
      viewportHeight - triggerRect.bottom - (popupRect?.height ?? 0) - offset - COLLISION_PADDING,
    ],
    ["left", triggerRect.left - (popupRect?.width ?? 0) - offset - COLLISION_PADDING],
    [
      "right",
      viewportWidth - triggerRect.right - (popupRect?.width ?? 0) - offset - COLLISION_PADDING,
    ],
    ["top", triggerRect.top - (popupRect?.height ?? 0) - offset - COLLISION_PADDING],
  ];
  return availableSpace.reduce((best, candidate) => (candidate[1] > best[1] ? candidate : best))[0];
}

function splitPosition(
  position: TooltipPosition,
  autoSide: TooltipSide,
): {
  align: TooltipAlign;
  side: TooltipSide;
} {
  const [requestedSide, requestedAlign] = position.split("-");
  const side: TooltipSide =
    requestedSide === "right" || requestedSide === "bottom" || requestedSide === "left"
      ? requestedSide
      : requestedSide === "auto"
        ? autoSide
        : "top";
  const align: TooltipAlign =
    requestedAlign === "start" || requestedAlign === "end" ? requestedAlign : "center";
  return { align, side };
}

function stopPropagation(event: SyntheticEvent) {
  event.stopPropagation();
}

function getPortalContainer(
  container: Element | DocumentFragment | null,
): HTMLElement | ShadowRoot | undefined {
  return container ? (container as HTMLElement | ShadowRoot) : undefined;
}

function TooltipArrow() {
  return (
    <TooltipPrimitive.Arrow className="group/tooltip-arrow absolute h-2 w-4 origin-center data-[side=bottom]:[transform:rotate(180deg)] data-[side=left]:h-4 data-[side=left]:[transform:rotate(-90deg)] data-[side=right]:h-4 data-[side=right]:[transform:rotate(90deg)] data-[side=top]:[transform:rotate(0deg)] data-[side=top]:[&_[data-non-top]]:hidden data-[side=left]:[&_[data-side-border]]:inline data-[side=right]:[&_[data-side-border]]:inline data-[side=top]:[&_[data-top-only]]:inline">
      <svg aria-hidden="true" className="block h-2 w-4" fill="none" viewBox="0 0 16 8">
        <polygon
          className="hidden fill-[var(--scraps-theme-border-primary,var(--border))] group-data-[side=right]/tooltip-arrow:[transform:translateX(2px)]"
          data-side-border=""
          points="-2,0 16,0 8,5.8 6,5.8"
        />
        <polygon
          className="hidden fill-[var(--scraps-theme-border-primary,var(--border))]"
          data-top-only=""
          points="0,0 16,0 8,7.8"
        />
        <polygon
          className="fill-[var(--scraps-theme-border-primary,var(--border))]"
          data-non-top=""
          points="0,0 16,0 8,5.8"
        />
        <polygon
          className="hidden fill-[var(--background)]"
          data-top-only=""
          points="3,0 13,0 8,4.8"
        />
        <polygon className="fill-[var(--background)]" data-non-top="" points="1.5,0 14.5,0 8,4.8" />
      </svg>
    </TooltipPrimitive.Arrow>
  );
}

const positionerClasses = "pointer-events-auto z-[10003]";

const popupClasses =
  "relative w-max rounded-[6px] bg-[var(--popover)] px-3 py-2 text-center text-[0.75rem] leading-[1.2] font-normal text-[var(--popover-foreground)] shadow-[0_2px_0_var(--scraps-theme-border-primary,var(--border))] [border:1px_solid_var(--scraps-theme-border-primary,var(--border))] [font-family:var(--font-rubik,'Rubik'),sans-serif] [overflow-wrap:break-word] [transform-origin:var(--transform-origin)] [will-change:transform,opacity] [&>[data-tooltip-section]]:-mx-3 [&>[data-tooltip-section]]:-mt-2 [&>[data-tooltip-section]~[data-tooltip-section]]:mt-0 [&>[data-tooltip-section]:last-child]:-mb-2 motion-reduce:transition-none";

type PositionerProps = ComponentProps<typeof TooltipPrimitive.Positioner>;

function PresenceAwarePositioner({ onPointerEnter, onPointerLeave, ...props }: PositionerProps) {
  const isPresent = useIsPresent();
  return (
    <TooltipPrimitive.Positioner
      {...props}
      onPointerEnter={isPresent ? onPointerEnter : undefined}
      onPointerLeave={isPresent ? onPointerLeave : undefined}
      style={{ pointerEvents: isPresent ? undefined : "none" }}
    />
  );
}

interface TooltipHeaderProps {
  children: ReactNode;
  leadingItems?: ReactNode;
  trailingItems?: ReactNode;
}

function TooltipHeader({ children, leadingItems, trailingItems }: TooltipHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-1 px-3 py-2" data-tooltip-section>
      <div className="flex items-center gap-1">
        {leadingItems}
        <span className="inline-block text-left font-medium text-[var(--scraps-content-primary,#302e36)]">
          {children}
        </span>
      </div>
      {trailingItems !== null && trailingItems !== undefined ? (
        <span className="inline-block text-right font-medium whitespace-nowrap text-[var(--scraps-content-primary,#302e36)]">
          {trailingItems}
        </span>
      ) : null}
    </div>
  );
}

interface TooltipGridProps {
  children: ReactNode;
  columns?: CSSProperties["gridTemplateColumns"];
  gap?: CSSProperties["gap"];
}

function TooltipGrid({ children, columns = "1fr", gap = "2px 8px" }: TooltipGridProps) {
  return (
    <div
      className="grid items-center px-3 py-2"
      data-tooltip-section
      style={{ gap, gridTemplateColumns: columns }}
    >
      {children}
    </div>
  );
}

interface TooltipRowProps {
  children: ReactNode;
  leadingItems?: ReactNode;
  trailingItems?: ReactNode;
}

function TooltipRow({ children, leadingItems, trailingItems }: TooltipRowProps) {
  return (
    <div className="contents">
      {leadingItems}
      {children}
      {trailingItems}
    </div>
  );
}

interface TooltipFooterProps {
  children: ReactNode;
  leadingItems?: ReactNode;
  trailingItems?: ReactNode;
}

function TooltipFooter({ children, leadingItems, trailingItems }: TooltipFooterProps) {
  return (
    <div className="flex items-center justify-between gap-1 px-3 py-2" data-tooltip-section>
      <div className="flex items-center gap-1">
        {leadingItems}
        <span className="inline-block text-left text-[var(--scraps-content-secondary,#6a6772)]">
          {children}
        </span>
      </div>
      {trailingItems !== null && trailingItems !== undefined ? (
        <span className="inline-block text-right whitespace-nowrap text-[var(--scraps-content-secondary,#6a6772)]">
          {trailingItems}
        </span>
      ) : null}
    </div>
  );
}

function TooltipComponent({
  children,
  overlayStyle,
  title,
  disabled = false,
  maxWidth,
  isHoverable = true,
  className,
  style,
  delay,
  displayTimeout,
  showUnderline,
  underlineColor,
  showOnlyOnOverflow,
  onOverflowChange,
  skipWrapper,
  forceVisible,
  offset = 8,
  position = "top",
  containerDisplayMode = "inline-block",
  onHover,
  onBlur,
}: TooltipProps) {
  const describeById = useId();
  const { container } = useContext(TooltipContext);
  const reducedMotion = useReducedMotion();
  const selfTokenRef = useRef(Symbol("tooltip"));
  const [status, setStatus] = useState<OverlayStatus>("idle");
  const statusRef = useRef<OverlayStatus>("idle");
  const [snapClosed, setSnapClosed] = useState(false);
  const mayBeAnimatingOutRef = useRef(false);
  const [triggerElement, setTriggerElement] = useState<HTMLElement | null>(null);
  const [popupElement, setPopupElement] = useState<HTMLElement | null>(null);
  const [autoSide, setAutoSide] = useState<TooltipSide>("top");
  const [isOverflowing, setIsOverflowing] = useState(false);
  const isOverflowingRef = useRef(false);
  const openTimerRef = useRef<number | undefined>(undefined);
  const hideTimerRef = useRef<number | undefined>(undefined);
  const onHoverRef = useRef(onHover);
  const onBlurRef = useRef(onBlur);
  const onOverflowChangeRef = useRef(onOverflowChange);

  const commitStatus = useCallback((next: OverlayStatus) => {
    statusRef.current = next;
    setStatus(next);
    if (next === "open" || next === "warming") setSnapClosed(false);
    if (next === "open") mayBeAnimatingOutRef.current = true;
  }, []);

  const isOpen =
    forceVisible === true ||
    (forceVisible !== false && (status === "open" || status === "cooling"));

  useLayoutEffect(() => {
    onHoverRef.current = onHover;
    onBlurRef.current = onBlur;
    onOverflowChangeRef.current = onOverflowChange;
  });

  const previousIsOpenRef = useRef(isOpen);
  useEffect(() => {
    if (previousIsOpenRef.current === isOpen) return;
    previousIsOpenRef.current = isOpen;
    if (isOpen) onHoverRef.current?.();
    else onBlurRef.current?.();
  }, [isOpen]);

  useEffect(() => {
    if (forceVisible !== undefined && forceVisible !== false) return;
    const listener = (origin: symbol) => {
      if (origin === selfTokenRef.current || !mayBeAnimatingOutRef.current) return;
      clearTimer(openTimerRef);
      clearTimer(hideTimerRef);
      if (statusRef.current !== "idle") commitStatus("idle");
      mayBeAnimatingOutRef.current = false;
      setSnapClosed(true);
    };
    defaultDelayGroup.openListeners.add(listener);
    return () => {
      defaultDelayGroup.openListeners.delete(listener);
    };
  }, [commitStatus, forceVisible]);

  useEffect(
    () => () => {
      clearTimer(openTimerRef);
      clearTimer(hideTimerRef);
      if (statusRef.current === "open" || statusRef.current === "cooling") {
        startGroupCoolDown(defaultDelayGroup);
      }
      mayBeAnimatingOutRef.current = false;
    },
    [],
  );

  const reset = useCallback(() => {
    clearTimer(openTimerRef);
    clearTimer(hideTimerRef);
    const wasVisible = statusRef.current === "open" || statusRef.current === "cooling";
    commitStatus("idle");
    if (wasVisible) startGroupCoolDown(defaultDelayGroup);
  }, [commitStatus]);

  const updateOverflow = useCallback(
    (element: HTMLElement | null) => {
      const next = element ? isOverflown(element) : false;
      if (next === isOverflowingRef.current) return;
      isOverflowingRef.current = next;
      setIsOverflowing(next);
      onOverflowChangeRef.current?.(next);
      if (showOnlyOnOverflow && !next) reset();
    },
    [reset, showOnlyOnOverflow],
  );

  const setTriggerElementRef = useCallback(
    (element: HTMLElement | null) => {
      setTriggerElement(element);
      if (element && position.startsWith("auto")) {
        setAutoSide(selectAutoSide(element, null, offset));
      }
      updateOverflow(showOnlyOnOverflow ? element : null);
      if (!showOnlyOnOverflow || !element) return;

      const resizeObserver = new ResizeObserver(() => updateOverflow(element));
      resizeObserver.observe(element);
      const mutationObserver = new MutationObserver(() => updateOverflow(element));
      mutationObserver.observe(element, {
        attributeFilter: ["data-overflowing"],
        attributes: true,
        characterData: true,
        childList: true,
        subtree: true,
      });
      return () => {
        resizeObserver.disconnect();
        mutationObserver.disconnect();
        setTriggerElement(null);
        updateOverflow(null);
      };
    },
    [offset, position, showOnlyOnOverflow, updateOverflow],
  );

  useLayoutEffect(() => {
    if (!triggerElement || !position.startsWith("auto")) return;
    const ownerDocument = triggerElement.ownerDocument;
    const ownerWindow = ownerDocument.defaultView;
    const updateAutoSide = () => setAutoSide(selectAutoSide(triggerElement, popupElement, offset));
    const ResizeObserverConstructor =
      ownerWindow?.ResizeObserver ??
      (typeof ResizeObserver === "undefined" ? null : ResizeObserver);
    const triggerResizeObserver = ResizeObserverConstructor
      ? new ResizeObserverConstructor(updateAutoSide)
      : null;
    triggerResizeObserver?.observe(triggerElement);
    const popupWindow = popupElement?.ownerDocument.defaultView;
    const PopupResizeObserverConstructor =
      popupWindow?.ResizeObserver ??
      (typeof ResizeObserver === "undefined" ? null : ResizeObserver);
    const popupResizeObserver =
      popupElement && PopupResizeObserverConstructor
        ? new PopupResizeObserverConstructor(updateAutoSide)
        : null;
    popupResizeObserver?.observe(popupElement!);
    const IntersectionObserverConstructor =
      ownerWindow?.IntersectionObserver ??
      (typeof IntersectionObserver === "undefined" ? null : IntersectionObserver);
    const intersectionObserver =
      IntersectionObserverConstructor === null
        ? null
        : new IntersectionObserverConstructor(updateAutoSide, {
            threshold: [0, 1],
          });
    intersectionObserver?.observe(triggerElement);
    ownerWindow?.addEventListener("resize", updateAutoSide);
    ownerDocument.addEventListener("scroll", updateAutoSide, true);
    updateAutoSide();
    return () => {
      triggerResizeObserver?.disconnect();
      popupResizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      ownerWindow?.removeEventListener("resize", updateAutoSide);
      ownerDocument.removeEventListener("scroll", updateAutoSide, true);
    };
  }, [maxWidth, offset, popupElement, position, title, triggerElement]);

  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- The canonical disabled reset must finish before the next paint.
    if (disabled && isOpen) reset();
  }, [disabled, isOpen, reset]);

  const handleMouseEnter = useCallback(() => {
    if (showOnlyOnOverflow && triggerElement && !isOverflown(triggerElement)) return;
    clearTimer(openTimerRef);
    clearTimer(hideTimerRef);
    if (statusRef.current === "open" || statusRef.current === "cooling") {
      commitStatus("open");
      warmUpGroup(defaultDelayGroup, selfTokenRef.current);
      return;
    }
    if (delay === 0 || defaultDelayGroup.isWarm) {
      commitStatus("open");
      warmUpGroup(defaultDelayGroup, selfTokenRef.current);
      return;
    }
    commitStatus("warming");
    openTimerRef.current = window.setTimeout(() => {
      commitStatus("open");
      warmUpGroup(defaultDelayGroup, selfTokenRef.current);
    }, delay ?? OPEN_DELAY);
  }, [commitStatus, delay, showOnlyOnOverflow, triggerElement]);

  const handleMouseLeave = useCallback(() => {
    clearTimer(openTimerRef);
    clearTimer(hideTimerRef);
    if (statusRef.current !== "open" && statusRef.current !== "cooling") {
      commitStatus("idle");
      return;
    }
    if (!isHoverable && displayTimeout === undefined) {
      commitStatus("idle");
      startGroupCoolDown(defaultDelayGroup);
      return;
    }
    commitStatus("cooling");
    hideTimerRef.current = window.setTimeout(() => {
      commitStatus("idle");
      startGroupCoolDown(defaultDelayGroup);
    }, displayTimeout ?? CLOSE_DELAY);
  }, [commitStatus, displayTimeout, isHoverable]);

  const previousForceVisibleRef = useRef<boolean | "delayed" | undefined>(undefined);
  useEffect(() => {
    const wasDelayed = previousForceVisibleRef.current === "delayed";
    if (forceVisible === "delayed" && !wasDelayed) handleMouseEnter();
    else if (forceVisible !== "delayed" && wasDelayed) handleMouseLeave();
    previousForceVisibleRef.current = forceVisible;
  }, [forceVisible, handleMouseEnter, handleMouseLeave]);

  const shouldInteract =
    !showOnlyOnOverflow || isOverflowing || forceVisible === true || forceVisible === "delayed";
  let trigger: ReactElement<TriggerElementProps>;
  if (
    isValidElement<TriggerElementProps>(children) &&
    (skipWrapper || typeof children.type === "string")
  ) {
    const mergedStyle = showUnderline
      ? { ...children.props.style, ...underlineStyle(underlineColor) }
      : children.props.style;
    trigger = cloneElement(children, { style: mergedStyle });
  } else {
    trigger = (
      <span
        className={className}
        style={{
          ...(showUnderline ? underlineStyle(underlineColor) : {}),
          ...(containerDisplayMode ? { display: containerDisplayMode } : {}),
          maxWidth: "100%",
          ...style,
        }}
      >
        {children}
      </span>
    );
  }

  if (disabled || !title) return children;

  const { align, side } = splitPosition(position, autoSide);
  const popup = snapClosed ? null : (
    <AnimatePresence initial={false}>
      {isOpen ? (
        <PresenceAwarePositioner
          align={align}
          className={positionerClasses}
          collisionPadding={COLLISION_PADDING}
          data-requested-align={align}
          data-requested-side={side}
          data-tooltip-positioner
          key="tooltip-positioner"
          onClick={stopPropagation}
          onMouseDown={stopPropagation}
          onPointerEnter={isHoverable ? handleMouseEnter : undefined}
          onPointerLeave={isHoverable ? handleMouseLeave : undefined}
          onPointerDown={stopPropagation}
          render={<motion.div />}
          side={side}
          sideOffset={offset}
        >
          <TooltipPrimitive.Popup
            className={popupClasses}
            data-tooltip
            id={describeById}
            ref={setPopupElement}
            render={
              <motion.div
                animate={reducedMotion ? undefined : { opacity: 1, scale: 1 }}
                exit={
                  reducedMotion
                    ? undefined
                    : {
                        opacity: 0,
                        scale: 0.95,
                        transition: { type: "spring", delay: 0.1 },
                      }
                }
                initial={reducedMotion ? false : { opacity: 0 }}
                transition={reducedMotion ? { duration: 0 } : { type: "spring", duration: 0.2 }}
              />
            }
            role="tooltip"
            style={{ maxWidth: maxWidth ?? 225, ...overlayStyle }}
          >
            <TooltipArrow />
            {title}
          </TooltipPrimitive.Popup>
        </PresenceAwarePositioner>
      ) : null}
    </AnimatePresence>
  );

  return (
    <TooltipPrimitive.Root disableHoverablePopup={!isHoverable} open={isOpen}>
      <TooltipPrimitive.Trigger
        aria-describedby={shouldInteract ? describeById : undefined}
        onBlur={handleMouseLeave}
        onFocus={handleMouseEnter}
        onPointerEnter={handleMouseEnter}
        onPointerLeave={handleMouseLeave}
        ref={setTriggerElementRef}
        render={trigger}
      />
      <TooltipPrimitive.Portal container={getPortalContainer(container)} keepMounted>
        {popup}
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}

export const Tooltip = Object.assign(TooltipComponent, {
  Footer: TooltipFooter,
  Grid: TooltipGrid,
  Header: TooltipHeader,
  Row: TooltipRow,
});
