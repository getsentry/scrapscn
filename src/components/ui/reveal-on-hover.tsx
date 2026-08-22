import * as React from "react"

import { Flex, type FlexProps } from "./layout"
import { cn } from "../../lib/utils"

import styles from "./reveal-on-hover.module.css"

interface RevealOnHoverRenderProps { className: string }

type RevealOnHoverProps =
  | (FlexProps & { children: React.ReactNode })
  | { children: (props: RevealOnHoverRenderProps) => React.ReactNode }

function hasRenderChildren(
  props: RevealOnHoverProps
): props is { children: (props: RevealOnHoverRenderProps) => React.ReactNode } {
  return typeof props.children === "function"
}

function RevealOnHoverRoot(props: RevealOnHoverProps) {
  if (hasRenderChildren(props)) {
    return props.children({ className: styles.root })
  }

  const { children, className, ...flexProps } = props
  return (
    <Flex
      align="center"
      gap="xs"
      {...flexProps}
      className={cn(styles.root, className)}
    >
      {children}
    </Flex>
  )
}

function Action({ children, visible }: { children: React.ReactNode; visible?: boolean }) {
  return (
    <span
      data-reveal-on-hover=""
      data-reveal-on-hover-visible={visible ? "" : undefined}
    >
      {children}
    </span>
  )
}

/** Reveals mounted actions on hover or focus without hiding them on touch devices. */
export const RevealOnHover = Object.assign(RevealOnHoverRoot, { Action })
