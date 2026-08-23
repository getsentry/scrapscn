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
import styles from "./slide-over-panel.module.css";
import { useTopOffset } from "./slide-over-panel-environment";

const RIGHT_SIDE_PANEL_WIDTH = "50vw";
const LEFT_SIDE_PANEL_WIDTH = "40vw";
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
    transform: `translateX(${RIGHT_SIDE_PANEL_WIDTH}) translateY(0)`,
    opacity: 0,
  },
  left: {
    transform: `translateX(-${LEFT_SIDE_PANEL_WIDTH}) translateY(0)`,
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

type SlideOverPanelProps = {
  children: ReactNode | ChildRenderFunction;
  ariaLabel?: string;
  className?: string;
  "data-test-id"?: string;
  mode?: "blocking" | "passive";
  panelWidth?: string;
  position?: Position;
  ref?: Ref<HTMLDivElement>;
};

interface PanelStyle extends CSSProperties {
  "--scraps-slide-over-panel-top": string;
  "--scraps-slide-over-panel-width"?: string;
}

function positionClass(position: Position | undefined) {
  if (position === "bottom") return styles.positionBottom;
  if (position === "right") return styles.positionRight;
  if (position === "left") return styles.positionLeft;
  return styles.positionUnspecified;
}

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
  const collapsedStyle = position
    ? COLLAPSED_STYLES[position]
    : COLLAPSED_STYLES.right;
  const panelStyle: PanelStyle = {
    "--scraps-slide-over-panel-top": contentTop,
    ...(panelWidth === undefined
      ? {}
      : { "--scraps-slide-over-panel-width": panelWidth }),
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
        className={[styles.panel, positionClass(position), className]
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
