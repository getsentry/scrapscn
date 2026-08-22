"use client"

import * as React from "react"

import { Container } from "./layout"
import { cn } from "../../lib/utils"

import styles from "./status-indicator.module.css"

type StatusIndicatorVariant = "accent" | "danger" | "warning" | "success" | "promotion" | "muted"
type StatusIndicatorAnimationIterationCount = number | "infinite"

interface StatusIndicatorProps extends React.HTMLAttributes<HTMLSpanElement> {
  animationIterationCount?: StatusIndicatorAnimationIterationCount
  variant: StatusIndicatorVariant
}

const statusIndicatorTokens: Record<StatusIndicatorVariant, { dot: string; pulse: string }> = {
  accent: {
    dot: "var(--scraps-status-accent-dot, #7553ff)",
    pulse: "var(--scraps-status-accent-pulse, #0008f012)",
  },
  danger: {
    dot: "var(--scraps-status-danger-dot, #ff002b)",
    pulse: "var(--scraps-status-danger-pulse, #f828081c)",
  },
  warning: {
    dot: "var(--scraps-status-warning-dot, #ffce00)",
    pulse: "var(--scraps-status-warning-pulse, #e0b01030)",
  },
  success: {
    dot: "var(--scraps-status-success-dot, #00f261)",
    pulse: "var(--scraps-status-success-pulse, #00b8001c)",
  },
  promotion: {
    dot: "var(--scraps-status-promotion-dot, #fc5cb4)",
    pulse: "var(--scraps-status-promotion-pulse, #f000901a)",
  },
  muted: {
    dot: "var(--scraps-status-muted-dot, #c0bec6)",
    pulse: "var(--scraps-status-muted-pulse, #0000200f)",
  },
}

type StatusIndicatorStyle = React.CSSProperties & {
  "--status-dot": string
  "--status-fill": "forwards" | "none"
  "--status-iterations": StatusIndicatorAnimationIterationCount
  "--status-pulse": string
}

/** Renders the regular Scraps status dot with an accessible finite or infinite pulse. */
export function StatusIndicator({
  animationIterationCount = "infinite",
  variant,
  className,
  role,
  "aria-label": ariaLabel,
  ...spanProps
}: StatusIndicatorProps) {
  const tokens = statusIndicatorTokens[variant]
  const fill = animationIterationCount === "infinite" ? "none" : "forwards"
  const style: StatusIndicatorStyle = {
    ...spanProps.style,
    "--status-dot": tokens.dot,
    "--status-fill": fill,
    "--status-iterations": animationIterationCount,
    "--status-pulse": tokens.pulse,
  }

  return (
    <Container flexShrink={0}>
      {({ className: layoutClassName }) => (
        <span
          {...spanProps}
          aria-hidden={!ariaLabel && !role ? true : undefined}
          aria-label={ariaLabel}
          className={cn(layoutClassName, styles.indicator, className)}
          role={role ?? (ariaLabel ? "img" : undefined)}
          style={style}
        />
      )}
    </Container>
  )
}
