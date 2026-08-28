import * as React from "react";

import { cn } from "../../lib/utils";
import { Flex, type FlexProps } from "./layout";

const rootClasses = [
  "[&_[data-reveal-on-hover][data-reveal-on-hover-visible]]:!pointer-events-auto",
  "[&_[data-reveal-on-hover][data-reveal-on-hover-visible]]:!opacity-100",
  "[@media(hover:hover)]:[&_[data-reveal-on-hover]]:pointer-events-none",
  "[@media(hover:hover)]:[&_[data-reveal-on-hover]]:opacity-0",
  "[@media(hover:hover)]:[&_[data-reveal-on-hover]]:transition-opacity",
  "[@media(hover:hover)]:[&_[data-reveal-on-hover]]:duration-[var(--duration-fast,120ms)]",
  "[@media(hover:hover)]:[&_[data-reveal-on-hover]]:ease-[var(--ease-exit,cubic-bezier(0.64,0,0.8,0))]",
  "[@media(hover:hover)]:[&:hover_[data-reveal-on-hover]]:pointer-events-auto",
  "[@media(hover:hover)]:[&:hover_[data-reveal-on-hover]]:opacity-100",
  "[@media(hover:hover)]:[&:focus-within_[data-reveal-on-hover]]:pointer-events-auto",
  "[@media(hover:hover)]:[&:focus-within_[data-reveal-on-hover]]:opacity-100",
  "[@media(hover:hover)]:[&:is(:hover,:focus-within)_[data-reveal-on-hover]]:duration-[var(--duration-moderate,160ms)]",
  "[@media(hover:hover)]:[&:is(:hover,:focus-within)_[data-reveal-on-hover]]:ease-[var(--ease-enter,cubic-bezier(0.24,1,0.32,1))]",
  "motion-reduce:[&_[data-reveal-on-hover]]:!transition-none",
].join(" ");

interface RevealOnHoverRenderProps {
  className: string;
}

type RevealOnHoverProps =
  | (FlexProps & { children: React.ReactNode })
  | { children: (props: RevealOnHoverRenderProps) => React.ReactNode };

function hasRenderChildren(
  props: RevealOnHoverProps,
): props is { children: (props: RevealOnHoverRenderProps) => React.ReactNode } {
  return typeof props.children === "function";
}

function RevealOnHoverRoot(props: RevealOnHoverProps) {
  if (hasRenderChildren(props)) {
    return props.children({ className: rootClasses });
  }

  const { children, className, ...flexProps } = props;
  return (
    <Flex align="center" gap="xs" {...flexProps} className={cn(rootClasses, className)}>
      {children}
    </Flex>
  );
}

function Action({ children, visible }: { children: React.ReactNode; visible?: boolean }) {
  return (
    <span data-reveal-on-hover="" data-reveal-on-hover-visible={visible ? "" : undefined}>
      {children}
    </span>
  );
}

/** Reveals mounted actions on hover or focus without hiding them on touch devices. */
export const RevealOnHover = Object.assign(RevealOnHoverRoot, { Action });
