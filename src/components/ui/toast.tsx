"use client";

import * as Sentry from "@sentry/react";
import { motion, type Transition } from "framer-motion";
import type { MouseEvent, ReactNode } from "react";

import { t } from "../../lib/scraps-locale";
import { Button } from "./button";

type IndicatorType = "loading" | "error" | "success" | "undo" | "";

type IndicatorOptions = {
  append?: boolean;
  disableDismiss?: boolean;
  duration?: number | null;
  undo?: () => void;
};

type Indicator = {
  clearId?: null | number;
  id: string | number;
  message: ReactNode;
  options: IndicatorOptions;
  type: IndicatorType;
};

interface ToastProps {
  indicator: Indicator;
  onDismiss: (indicator: Indicator, event: MouseEvent) => void;
}

const TOAST_TRANSITION = {
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 70 },
  initial: { opacity: 0, y: 70 },
  transition: {
    damping: 25,
    stiffness: 450,
    type: "spring",
  } satisfies Transition,
};

function CheckmarkIcon() {
  return (
    <svg
      data-test-id="icon-check-mark"
      fill="currentColor"
      height="16px"
      role="img"
      viewBox="0 0 16 16"
      width="16px"
    >
      <path d="M13.72 3.22C14.01 2.93 14.49 2.93 14.78 3.22C15.07 3.51 15.07 3.99 14.78 4.28L6.53 12.53C6.24 12.82 5.76 12.82 5.47 12.53L1.22 8.28C0.93 7.99 0.93 7.51 1.22 7.22C1.51 6.93 1.99 6.93 2.28 7.22L6 10.94L13.72 3.22Z" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg fill="currentColor" height="16px" role="img" viewBox="0 0 16 16" width="16px">
      <path d="M6.81 0.65C7.26 -0.16 8.38 -0.21 8.91 0.5L9.01 0.65L15.66 12.86C16.12 13.69 15.52 14.71 14.57 14.71H1.25C0.3 14.71 -0.3 13.69 0.15 12.86L6.81 0.65ZM1.67 13.21H14.15L7.91 1.77L1.67 13.21ZM7.91 9.71C8.46 9.71 8.91 10.15 8.91 10.71C8.91 11.26 8.46 11.71 7.91 11.71C7.36 11.71 6.91 11.26 6.91 10.71C6.91 10.15 7.36 9.71 7.91 9.71ZM7.91 4.71C8.32 4.71 8.66 5.04 8.66 5.46V7.96C8.66 8.37 8.32 8.71 7.91 8.71C7.5 8.71 7.16 8.37 7.16 7.96V5.46C7.16 5.04 7.5 4.71 7.91 4.71Z" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg fill="currentColor" height="12px" role="img" viewBox="0 0 16 16" width="12px">
      <path d="M8 16C3.58 16 0 12.42 0 8C0 3.58 3.58 0 8 0C10.42 0 12.59 1.07 14.05 2.77L15.57 1.25C15.73 1.09 16 1.2 16 1.42V5.75C16 5.89 15.89 6 15.75 6H11.42C11.2 6 11.09 5.73 11.25 5.57L12.99 3.83C11.79 2.41 10 1.5 8 1.5C4.41 1.5 1.5 4.41 1.5 8C1.5 11.59 4.41 14.5 8 14.5C11.37 14.5 14.13 11.95 14.47 8.67C14.51 8.26 14.88 7.96 15.29 8C15.7 8.05 16 8.41 15.96 8.83C15.55 12.86 12.14 16 8 16Z" />
    </svg>
  );
}

function LoadingIndicator() {
  return (
    <div className="relative m-0" data-test-id="loading-indicator">
      <div className="relative m-0 size-4 animate-[scraps-toast-spin_0.55s_linear_infinite] rounded-full border-[1.2px] border-[#E6E9EC] border-l-[#6c5fc7] dark:bg-[#272433]" />
    </div>
  );
}

function ToastIcon({ type }: { type: IndicatorType }) {
  let icon: ReactNode;

  switch (type) {
    case "loading":
      icon = <LoadingIndicator />;
      break;
    case "success":
      icon = <CheckmarkIcon />;
      break;
    case "error":
      icon = <WarningIcon />;
      break;
    case "undo":
    case "":
      return null;
    default:
      Sentry.captureException(new Error(`Unknown toast type: ${type}`));
      return null;
  }

  const typeClasses =
    type === "success"
      ? "bg-[var(--scraps-toast-success-vibrant)] border-r-[var(--scraps-toast-success-border)] text-[var(--scraps-toast-on-vibrant-dark)]"
      : type === "error"
        ? "bg-[var(--scraps-toast-danger-vibrant)] border-r-[var(--scraps-toast-danger-border)] text-[var(--scraps-toast-on-vibrant-light)]"
        : "bg-[var(--scraps-toast-overlay)] border-r-[var(--scraps-toast-border)]";
  return (
    <div
      className={`relative flex items-center justify-center border-r px-4 py-3 ${typeClasses}`}
      data-slot="toast-icon"
    >
      {icon}
    </div>
  );
}

export function Toast({ indicator, onDismiss }: ToastProps) {
  const typeClasses =
    indicator.type === "success"
      ? "border-[var(--scraps-toast-success-border)]"
      : indicator.type === "error"
        ? "border-[var(--scraps-toast-danger-border)]"
        : "border-[var(--scraps-toast-border)]";
  const innerClasses =
    indicator.type === "success"
      ? "bg-[var(--scraps-toast-success-muted)]"
      : indicator.type === "error"
        ? "bg-[var(--scraps-toast-danger-muted)]"
        : "bg-[var(--scraps-toast-overlay)]";

  return (
    <motion.div
      {...TOAST_TRANSITION}
      className={`ref-toast ref-${indicator.type} overflow-hidden rounded-[8px] border bg-[var(--scraps-toast-primary)] [box-shadow:var(--scraps-theme-shadow-medium)] ${typeClasses}`}
      data-test-id={indicator.type ? `toast-${indicator.type}` : "toast"}
      onClick={
        indicator.options?.disableDismiss ? undefined : (event) => onDismiss(indicator, event)
      }
    >
      <div className={`flex items-stretch ${innerClasses}`} data-slot="toast-inner">
        <ToastIcon type={indicator.type} />
        <div className="p-3">
          <div className="block w-auto overflow-hidden leading-[1.2] text-ellipsis whitespace-nowrap">
            {indicator.message}
          </div>
        </div>
        {typeof indicator.options.undo === "function" ? (
          <div className="flex items-center justify-center px-3">
            <Button
              icon={<RefreshIcon />}
              size="xs"
              variant="secondary"
              onClick={indicator.options.undo}
            >
              {t("Undo")}
            </Button>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}
