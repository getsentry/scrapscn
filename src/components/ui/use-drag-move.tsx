"use client";

import { useMove } from "@react-aria/interactions";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Orientation = "horizontal" | "vertical";

const KEYBOARD_STEP = 10;
const KEYBOARD_STEP_LARGE = 50;

const AXIS_KEYS: Record<Orientation, Set<string>> = {
  horizontal: new Set(["ArrowLeft", "ArrowRight", "Left", "Right"]),
  vertical: new Set(["ArrowUp", "ArrowDown", "Up", "Down"]),
};

interface UseDragMoveOptions {
  onMove: (delta: number) => void;
  orientation: Orientation;
  onMoveEnd?: () => void;
  onMoveStart?: () => void;
}

function setDocumentDragging(cursor: React.CSSProperties["cursor"] | null) {
  document.body.style.pointerEvents = cursor ? "none" : "";
  document.body.style.userSelect = cursor ? "none" : "";
  document.documentElement.style.cursor = cursor ?? "";
}

/** Handles pointer and arrow-key movement along one separator axis. */
export function useDragMove({
  onMove,
  onMoveEnd,
  onMoveStart,
  orientation,
}: UseDragMoveOptions) {
  const [isHeld, setIsHeld] = useState(false);
  const isPointerDragRef = useRef(false);

  const stopDocumentDragging = useCallback(() => {
    if (isPointerDragRef.current) {
      isPointerDragRef.current = false;
      setDocumentDragging(null);
    }
  }, []);

  useEffect(() => stopDocumentDragging, [stopDocumentDragging]);

  const { moveProps } = useMove({
    onMoveStart: (event) => {
      setIsHeld(true);

      if (event.pointerType !== "keyboard") {
        isPointerDragRef.current = true;
        setDocumentDragging(orientation === "horizontal" ? "ew-resize" : "ns-resize");
      }

      onMoveStart?.();
    },
    onMove: (event) => {
      const delta = orientation === "horizontal" ? event.deltaX : event.deltaY;

      if (!delta) return;

      onMove(
        event.pointerType === "keyboard"
          ? Math.sign(delta) * (event.shiftKey ? KEYBOARD_STEP_LARGE : KEYBOARD_STEP)
          : delta
      );
    },
    onMoveEnd: () => {
      setIsHeld(false);
      stopDocumentDragging();
      onMoveEnd?.();
    },
  });

  const axisMoveProps = useMemo(
    () => ({
      ...moveProps,
      onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
        if (AXIS_KEYS[orientation].has(event.key)) {
          moveProps.onKeyDown?.(event);
        }
      },
    }),
    [moveProps, orientation]
  );

  return { isHeld, moveProps: axisMoveProps };
}
