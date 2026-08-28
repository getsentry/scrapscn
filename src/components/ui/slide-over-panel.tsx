"use client";

import { motion, useReducedMotion, type Transition } from "framer-motion";
import {
  useEffect,
  useId,
  useState,
  useTransition,
  type CSSProperties,
  type ReactNode,
  type Ref,
} from "react";

import { BoundaryContextProvider } from "./boundary-context";
import { useTopOffset } from "./slide-over-panel-environment";

const PANEL_HEIGHT = "50vh";

const OPEN_STYLES = {
  bottom: { transform: "translateX(0) translateY(0)", opacity: 1 },
  right: { transform: "translateX(0) translateY(0)", opacity: 1 },
  left: { transform: "translateX(0) translateY(0)", opacity: 1 },
};

const COLLAPSED_STYLES = {
  bottom: {
    transform: `translateX(0) translateY(${PANEL_HEIGHT})`,
    opacity: 0,
  },
  right: {
    transform: "translateX(100%) translateY(0)",
    opacity: 0,
  },
  left: {
    transform: "translateX(-100%) translateY(0)",
    opacity: 0,
  },
};

const MODERATE_SPRING: Transition = {
  type: "spring",
  stiffness: 1000,
  damping: 50,
};

interface ChildRenderProps {
  isOpening: boolean;
}

type ChildRenderFunction = (renderPropProps: ChildRenderProps) => ReactNode;
type Position = "right" | "bottom" | "left";
type Mode = "blocking" | "passive";

type SlideOverPanelProps = {
  children: ReactNode | ChildRenderFunction;
  ariaLabel?: string;
  className?: string;
  "data-test-id"?: string;
  mode?: Mode;
  panelWidth?: string;
  position?: Position;
  ref?: Ref<HTMLDivElement>;
};

interface PanelStyle extends CSSProperties {
  "--scraps-slide-over-panel-top": string;
  "--scraps-slide-over-panel-width"?: string;
}

const PANEL_CLASSES =
  "box-border overflow-auto overscroll-contain pointer-events-auto z-[9999] bg-[var(--scraps-slide-over-background,#fff)] text-left text-[var(--scraps-slide-over-content,#302e36)] [box-shadow:var(--scraps-slide-over-shadow,var(--scraps-theme-shadow-high))]";

const POSITION_CLASSES: Record<Position | "unspecified", Record<Mode, string>> = {
  bottom: {
    blocking:
      "fixed top-4 right-0 bottom-4 left-4 min-[800px]:sticky min-[800px]:right-0 min-[800px]:bottom-0 min-[800px]:left-0 min-[800px]:h-[50vh] min-[800px]:w-full",
    passive:
      "fixed top-[var(--scraps-slide-over-panel-top)] right-0 bottom-4 left-4 min-[800px]:sticky min-[800px]:right-0 min-[800px]:bottom-0 min-[800px]:left-0 min-[800px]:h-[50vh] min-[800px]:w-full",
  },
  left: {
    blocking:
      "fixed top-[var(--scraps-slide-over-panel-top)] right-4 bottom-4 left-0 min-[800px]:relative min-[800px]:top-0 min-[800px]:right-auto min-[800px]:bottom-0 min-[800px]:left-auto min-[800px]:h-full min-[800px]:min-w-[450px] min-[800px]:w-[var(--scraps-slide-over-panel-width,40vw)]",
    passive:
      "fixed top-[var(--scraps-slide-over-panel-top)] right-4 bottom-4 left-0 min-[800px]:relative min-[800px]:right-auto min-[800px]:bottom-0 min-[800px]:left-auto min-[800px]:h-[calc(100%-var(--scraps-slide-over-panel-top))] min-[800px]:min-w-[450px] min-[800px]:w-[var(--scraps-slide-over-panel-width,40vw)]",
  },
  right: {
    blocking:
      "fixed top-4 right-0 bottom-4 left-4 min-[800px]:fixed min-[800px]:top-0 min-[800px]:right-0 min-[800px]:bottom-0 min-[800px]:left-auto min-[800px]:h-full min-[800px]:w-[var(--scraps-slide-over-panel-width,50vw)]",
    passive:
      "fixed top-[var(--scraps-slide-over-panel-top)] right-0 bottom-4 left-4 min-[800px]:fixed min-[800px]:right-0 min-[800px]:bottom-0 min-[800px]:left-auto min-[800px]:h-[calc(100%-var(--scraps-slide-over-panel-top))] min-[800px]:w-[var(--scraps-slide-over-panel-width,50vw)]",
  },
  unspecified: {
    blocking:
      "fixed top-4 right-0 bottom-4 left-4 min-[800px]:relative min-[800px]:top-0 min-[800px]:right-auto min-[800px]:bottom-0 min-[800px]:left-auto min-[800px]:h-full min-[800px]:min-w-[450px] min-[800px]:w-[var(--scraps-slide-over-panel-width,40vw)]",
    passive:
      "fixed top-[var(--scraps-slide-over-panel-top)] right-0 bottom-4 left-4 min-[800px]:relative min-[800px]:right-auto min-[800px]:bottom-0 min-[800px]:left-auto min-[800px]:h-[calc(100%-var(--scraps-slide-over-panel-top))] min-[800px]:min-w-[450px] min-[800px]:w-[var(--scraps-slide-over-panel-width,40vw)]",
  },
};

export function SlideOverPanel({
  "data-test-id": testId,
  mode = "blocking",
  ariaLabel,
  children,
  className,
  position,
  panelWidth,
  ref,
}: SlideOverPanelProps) {
  const [isTransitioning, startTransition] = useTransition();
  const [isContentVisible, setIsContentVisible] = useState(false);
  const { contentTop } = useTopOffset();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    startTransition(() => {
      setIsContentVisible(true);
    });
  }, []);

  const id = useId();
  const renderFunctionProps: ChildRenderProps = {
    isOpening: isTransitioning || !isContentVisible,
  };
  const openStyle = position ? OPEN_STYLES[position] : OPEN_STYLES.right;
  const collapsedStyle = position ? COLLAPSED_STYLES[position] : COLLAPSED_STYLES.right;
  const panelStyle: PanelStyle = {
    "--scraps-slide-over-panel-top": contentTop,
    ...(panelWidth === undefined ? {} : { "--scraps-slide-over-panel-width": panelWidth }),
  };
  const forwardedMode = { mode };

  return (
    <BoundaryContextProvider value={id}>
      <motion.div
        ref={ref}
        id={id}
        {...forwardedMode}
        initial={collapsedStyle}
        animate={openStyle}
        exit={collapsedStyle}
        transition={reduceMotion ? { duration: 0 } : MODERATE_SPRING}
        role="complementary"
        aria-hidden={false}
        aria-label={ariaLabel ?? "slide out drawer"}
        className={[PANEL_CLASSES, POSITION_CLASSES[position ?? "unspecified"][mode], className]
          .filter(Boolean)
          .join(" ")}
        data-test-id={testId}
        style={panelStyle}
      >
        {typeof children === "function"
          ? children(renderFunctionProps)
          : renderFunctionProps.isOpening
            ? null
            : children}
      </motion.div>
    </BoundaryContextProvider>
  );
}
