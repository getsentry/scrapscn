"use client";

import { mergeProps } from "@react-aria/utils";

import { useDragSeparator } from "./use-drag-separator";

const dragHandleClasses = [
  "pointer-events-none relative shrink-0 touch-none select-none",
  "before:pointer-events-auto before:absolute before:z-[9999] before:content-['']",
  "after:absolute after:z-[9999] after:bg-transparent after:opacity-80 after:content-[''] after:transition-colors after:duration-[var(--duration-slow)] after:ease-[var(--ease-smooth)]",
  "hover:after:bg-primary [&[data-is-held=true]]:after:bg-primary",
  "data-[orientation=horizontal]:h-auto data-[orientation=horizontal]:w-0 data-[orientation=horizontal]:self-stretch data-[orientation=horizontal]:border-l data-[orientation=horizontal]:border-[var(--scraps-theme-border-primary)]",
  "data-[orientation=horizontal]:before:inset-y-0 data-[orientation=horizontal]:before:left-[calc(50%-12px)] data-[orientation=horizontal]:before:w-6 data-[orientation=horizontal]:before:max-h-[var(--drag-separator-target-length,none)] data-[orientation=horizontal]:before:cursor-[var(--drag-separator-cursor)]",
  "data-[orientation=horizontal]:after:inset-y-0 data-[orientation=horizontal]:after:-left-0.5 data-[orientation=horizontal]:after:w-1",
  "data-[orientation=vertical]:h-0 data-[orientation=vertical]:w-full data-[orientation=vertical]:border-t data-[orientation=vertical]:border-[var(--scraps-theme-border-primary)]",
  "data-[orientation=vertical]:before:inset-x-0 data-[orientation=vertical]:before:top-[calc(50%-12px)] data-[orientation=vertical]:before:h-6 data-[orientation=vertical]:before:max-w-[var(--drag-separator-target-length,none)] data-[orientation=vertical]:before:cursor-[var(--drag-separator-cursor)]",
  "data-[orientation=vertical]:after:inset-x-0 data-[orientation=vertical]:after:-top-0.5 data-[orientation=vertical]:after:h-1",
  "data-[variant=ghost]:border-transparent data-[variant=ghost]:transition-colors data-[variant=ghost]:duration-[var(--duration-slow)] data-[variant=ghost]:ease-[var(--ease-smooth)]",
  "[&[data-variant=ghost]:hover]:border-[var(--scraps-theme-border-primary)] [&[data-variant=ghost]:focus-visible]:border-[var(--scraps-theme-border-primary)] [&[data-variant=ghost][data-is-held=true]]:border-[var(--scraps-theme-border-primary)]",
  "focus-visible:outline-2 focus-visible:outline-[var(--ring)]",
  "motion-reduce:transition-none motion-reduce:after:transition-none",
].join(" ");

type Orientation = "horizontal" | "vertical";

/** Chooses whether a drag handle always shows its line or reveals it on interaction. */
export type DragHandleVariant = "solid" | "ghost";

/** The visible one CSS-pixel separator line. */
export const DRAG_HANDLE_SIZE = 1;

/** The 24 CSS-pixel minimum pointer target for a drag separator. */
export const DRAG_SEPARATOR_TARGET_SIZE = 24;

type DragHandleNameProps =
  | { "aria-label": string; "aria-labelledby"?: never }
  | { "aria-labelledby": string; "aria-label"?: never };

interface DragHandlePropsBase {
  isSizedFirst: boolean;
  max: number;
  min: number;
  onDoubleClick: React.MouseEventHandler<HTMLElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLElement>;
  onMove: (delta: number) => void;
  onMoveEnd?: () => void;
  onMoveStart?: () => void;
  orientation: Orientation;
  value: number;
  variant?: DragHandleVariant;
}

type DragHandleProps = DragHandleNameProps & DragHandlePropsBase;

/** Renders the regular Scraps keyboard and pointer separator for two resizable panes. */
export function DragHandle({
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
  variant = "solid",
  isSizedFirst,
  max,
  min,
  orientation,
  value,
  onDoubleClick,
  onKeyDown,
  onMove,
  onMoveEnd,
  onMoveStart,
}: DragHandleProps) {
  const { cursor, separatorProps } = useDragSeparator({
    isSizedFirst,
    max,
    min,
    onMove,
    onMoveEnd,
    onMoveStart,
    orientation,
    value,
  });

  return (
    <div
      {...mergeProps(separatorProps, { onDoubleClick, onKeyDown })}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
      className={dragHandleClasses}
      data-variant={variant}
      style={
        {
          "--drag-separator-cursor": cursor,
        } as React.CSSProperties
      }
    />
  );
}
