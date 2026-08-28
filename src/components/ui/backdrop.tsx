"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { HTMLAttributes, MouseEvent, Ref } from "react";

type BackdropLayer = "widgetBuilderDrawer" | "drawer" | "modal";

interface BackdropProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "className" | `on${string}` | "style"
> {
  zIndex: BackdropLayer;
  ref?: Ref<HTMLDivElement>;
  "data-drawer-backdrop"?: string;
  "data-test-id"?: string;
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;
}

const zIndexByLayer: Record<BackdropLayer, string> = {
  widgetBuilderDrawer: "z-[1016]",
  drawer: "z-[9999]",
  modal: "z-[10000]",
};

/** Renders the regular Scraps animated overlay behind drawers and modals. */
export function Backdrop({ onClick, zIndex, ...props }: BackdropProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      id="backdrop"
      data-overlay
      {...props}
      className={`fixed inset-0 bg-[var(--scraps-backdrop-background,#10082845)] ${zIndexByLayer[zIndex]}`}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.24, ease: [0.72, 0, 0.16, 1] }}
      onClick={onClick}
    />
  );
}
