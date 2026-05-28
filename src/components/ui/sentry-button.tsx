"use client";

import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

const variants = {
  primary: {
    surface: "bg-primary",
    chonk: "bg-chonk-accent shadow-[0_2px_0_0] shadow-chonk-accent",
    text: "text-primary-foreground",
    border: "border-primary",
  },
  secondary: {
    surface: "bg-background",
    chonk: "bg-chonk-neutral shadow-[0_2px_0_0] shadow-chonk-neutral",
    text: "text-foreground",
    border: "border-chonk-neutral",
  },
  danger: {
    surface: "bg-destructive",
    chonk: "bg-chonk-danger shadow-[0_2px_0_0] shadow-chonk-danger",
    text: "text-destructive-foreground",
    border: "border-destructive",
  },
  warning: {
    surface: "bg-warning",
    chonk: "bg-chonk-warning shadow-[0_2px_0_0] shadow-chonk-warning",
    text: "text-warning-foreground",
    border: "border-warning",
  },
} as const;

type SentryButtonVariant = keyof typeof variants;

interface SentryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: SentryButtonVariant;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "h-8 px-3 text-xs rounded-md",
  md: "h-9 px-4 text-sm rounded-lg",
  lg: "h-10 px-5 text-sm rounded-lg",
};

const SentryButton = forwardRef<HTMLButtonElement, SentryButtonProps>(
  ({ className, variant = "secondary", size = "md", children, ...props }, ref) => {
    const v = variants[variant];
    const s = sizes[size];

    return (
      <button
        ref={ref}
        className={cn(
          "sentry-chonk group relative inline-flex items-center justify-center font-medium whitespace-nowrap select-none",
          "disabled:opacity-60 disabled:cursor-not-allowed",
          v.text,
          s,
          className
        )}
        {...props}
      >
        {/* Chonk shadow layer */}
        <span
          className={cn(
            "absolute inset-0 rounded-[inherit]",
            v.chonk
          )}
        />
        {/* Surface layer */}
        <span
          className={cn(
            "absolute inset-0 rounded-[inherit] border -translate-y-0.5",
            "transition-transform duration-[160ms] [transition-timing-function:cubic-bezier(0.8,-0.4,0.5,1)]",
            "group-hover:-translate-y-1",
            "group-active:translate-y-0",
            "group-disabled:translate-y-0",
            v.surface,
            v.border
          )}
        />
        {/* Content */}
        <span
          className={cn(
            "relative z-10 flex items-center justify-center gap-1.5 -translate-y-0.5",
            "transition-transform duration-[160ms] [transition-timing-function:cubic-bezier(0.8,-0.4,0.5,1)]",
            "group-hover:-translate-y-1",
            "group-active:translate-y-0",
            "group-disabled:translate-y-0"
          )}
        >
          {children}
        </span>
      </button>
    );
  }
);
SentryButton.displayName = "SentryButton";

export { SentryButton, type SentryButtonProps };
