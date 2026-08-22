"use client";

import { mergeProps } from "@react-aria/utils";

import { Container } from "./layout";
import styles from "./drag-handle.module.css";
import { useDragSeparator } from "./use-drag-separator";

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
    <Container position="relative" flexShrink={0}>
      {(containerProps) => (
        <div
          {...mergeProps(separatorProps, containerProps, { onDoubleClick, onKeyDown })}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledby}
          className={[styles.dragHandleLine, containerProps.className].filter(Boolean).join(" ")}
          data-variant={variant}
          style={{
            "--drag-separator-cursor": cursor,
          } as React.CSSProperties}
        />
      )}
    </Container>
  );
}
