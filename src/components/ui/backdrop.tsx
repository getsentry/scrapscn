"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { HTMLAttributes, MouseEvent, Ref } from "react";

type BackdropLayer = "widgetBuilderDrawer" | "drawer" | "modal";

interface BackdropProps
  extends Omit<
    HTMLAttributes<HTMLDivElement>,
    "className" | `on${string}` | "style"
  > {
  zIndex: BackdropLayer;
  ref?: Ref<HTMLDivElement>;
  "data-drawer-backdrop"?: string;
  "data-test-id"?: string;
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;
}

const zIndexByLayer: Record<BackdropLayer, number> = {
  widgetBuilderDrawer: 1016,
  drawer: 9999,
  modal: 10000,
};

/** Renders the regular Scraps animated overlay behind drawers and modals. */
export function Backdrop({ onClick, zIndex, ...props }: BackdropProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      id="backdrop"
      data-overlay
      {...props}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      initial={{
        background: "var(--scraps-backdrop-background, #10082845)",
        inset: "0",
        opacity: 0,
        position: "fixed",
        zIndex: zIndexByLayer[zIndex],
      }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { duration: 0.24, ease: [0.72, 0, 0.16, 1] }
      }
      onClick={onClick}
    />
  );
}
