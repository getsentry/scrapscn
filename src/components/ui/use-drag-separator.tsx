"use client";

import { mergeProps } from "@react-aria/utils";

import { useDragMove } from "./use-drag-move";

type Orientation = "horizontal" | "vertical";

interface UseDragSeparatorOptions {
  isSizedFirst: boolean;
  onMove: (delta: number) => void;
  orientation: Orientation;
  max?: number;
  min?: number;
  onMoveEnd?: () => void;
  onMoveStart?: () => void;
  value?: number;
}

function getDragSeparatorCursor(
  orientation: Orientation,
  atMin: boolean,
  atMax: boolean,
  isSizedFirst: boolean,
): React.CSSProperties["cursor"] {
  if (orientation === "horizontal") {
    if (atMin) return isSizedFirst ? "e-resize" : "w-resize";
    if (atMax) return isSizedFirst ? "w-resize" : "e-resize";
    return "ew-resize";
  }
  if (atMin) return isSizedFirst ? "s-resize" : "n-resize";
  if (atMax) return isSizedFirst ? "n-resize" : "s-resize";
  return "ns-resize";
}

/** Adds separator semantics, bounds, and cursor feedback to drag movement. */
export function useDragSeparator({
  isSizedFirst,
  max,
  min,
  onMove,
  onMoveEnd,
  onMoveStart,
  orientation,
  value,
}: UseDragSeparatorOptions) {
  const { isHeld, moveProps } = useDragMove({
    onMove,
    onMoveEnd,
    onMoveStart,
    orientation,
  });
  const hasMax = max !== undefined && Number.isFinite(max);
  const cursor = getDragSeparatorCursor(
    orientation,
    min !== undefined && value !== undefined && value <= min,
    hasMax && value !== undefined && value >= max,
    isSizedFirst,
  );
  return {
    cursor,
    separatorProps: mergeProps(moveProps, {
      "aria-orientation": orientation === "horizontal" ? "vertical" : "horizontal",
      "aria-valuemax": hasMax ? max : undefined,
      "aria-valuemin": min,
      "aria-valuenow": value,
      "data-is-held": isHeld,
      "data-orientation": orientation,
      role: "separator",
      tabIndex: 0,
    }),
  };
}
