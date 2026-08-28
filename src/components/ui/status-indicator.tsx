"use client";

import * as React from "react";

import { cn } from "../../lib/utils";

import "./status-indicator.css";

const indicatorClasses = cn(
  "relative size-2 shrink-0",
  "before:absolute before:-top-0.5 before:-left-0.5 before:size-3 before:rounded-[3px] before:bg-[var(--status-pulse)] before:content-['']",
  "before:animate-[gentleSpin_2.2s_cubic-bezier(0.785,0.135,0.15,0.86)_var(--status-iterations)_var(--status-fill)]",
  "after:absolute after:top-0 after:left-0 after:size-2 after:rounded-[4px] after:bg-[var(--status-dot)] after:content-['']",
  "after:animate-[gentlePulse_2.2s_cubic-bezier(0.445,0.05,0.55,0.95)_var(--status-iterations)_var(--status-fill)]",
  "motion-reduce:before:[transform:scale(1.25)_rotate(1turn)] motion-reduce:before:animate-none motion-reduce:before:opacity-0",
  "motion-reduce:after:scale-100 motion-reduce:after:animate-none",
);

type StatusIndicatorVariant = "accent" | "danger" | "warning" | "success" | "promotion" | "muted";
type StatusIndicatorAnimationIterationCount = number | "infinite";

interface StatusIndicatorProps extends React.HTMLAttributes<HTMLSpanElement> {
  animationIterationCount?: StatusIndicatorAnimationIterationCount;
  variant: StatusIndicatorVariant;
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
};

type StatusIndicatorStyle = React.CSSProperties & {
  "--status-dot": string;
  "--status-fill": "forwards" | "none";
  "--status-iterations": StatusIndicatorAnimationIterationCount;
  "--status-pulse": string;
};

/** Renders the regular Scraps status dot with an accessible finite or infinite pulse. */
export function StatusIndicator({
  animationIterationCount = "infinite",
  variant,
  className,
  role,
  "aria-label": ariaLabel,
  ...spanProps
}: StatusIndicatorProps) {
  const tokens = statusIndicatorTokens[variant];
  const fill = animationIterationCount === "infinite" ? "none" : "forwards";
  const style: StatusIndicatorStyle = {
    ...spanProps.style,
    "--status-dot": tokens.dot,
    "--status-fill": fill,
    "--status-iterations": animationIterationCount,
    "--status-pulse": tokens.pulse,
  };

  return (
    <span
      {...spanProps}
      aria-hidden={!ariaLabel && !role ? true : undefined}
      aria-label={ariaLabel}
      className={cn(indicatorClasses, className)}
      role={role ?? (ariaLabel ? "img" : undefined)}
      style={style}
    />
  );
}
