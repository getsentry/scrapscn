"use client";

import { useResizeObserver } from "@react-aria/utils";
import {
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type Ref,
  type ReactNode,
} from "react";

import { DRAG_HANDLE_SIZE, DragHandle } from "./drag-handle";
import { Flex, Stack, useResponsivePropValue, type Responsive } from "./layout";

const heldFrameClassName = "[&[data-is-held=true]_iframe]:!pointer-events-none";

/** Gives a parent a way to seed the sized pane after its own measurement. */
export interface SplitPanelHandle {
  setSize: (size: number, userEvent?: boolean) => void;
}

interface SplitPanelProps {
  defaultSize: number;
  sized: ReactNode;
  fill?: ReactNode;
  fillMinSize?: number;
  initialSize?: number;
  maxSize?: number;
  minSize?: number;
  onResize?: (newSize: number) => void;
  onResizeEnd?: (payload: {
    direction: "increase" | "decrease";
    endSize: number;
    startSize: number;
  }) => void;
  orientation?: Responsive<"horizontal" | "vertical">;
  placement?: "start" | "end";
  ref?: Ref<SplitPanelHandle>;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

function Pane({ children, size }: { children: ReactNode; size: number | null }) {
  const fills = size === null;
  return (
    <Stack
      flexBasis={fills ? 0 : `${size}px`}
      flexGrow={fills ? 1 : 0}
      flexShrink={fills ? 1 : 0}
      minHeight="0"
      minWidth="0"
    >
      {children}
    </Stack>
  );
}

function useContainerSize(ref: React.RefObject<HTMLDivElement | null>) {
  const [size, setSize] = useState({ height: 0, width: 0 });
  const update = useCallback(() => {
    const element = ref.current;
    setSize({ height: element?.clientHeight ?? 0, width: element?.clientWidth ?? 0 });
  }, [ref]);

  useLayoutEffect(update, [update]);
  useResizeObserver({ onResize: update, ref });
  return size;
}

/** Renders two regular Scraps panes with one resizable pane and a DragHandle divider. */
export function SplitPanel({
  defaultSize,
  fill,
  fillMinSize = 0,
  initialSize = defaultSize,
  maxSize,
  minSize = 0,
  onResize,
  onResizeEnd,
  orientation: orientationProp = "horizontal",
  placement = "start",
  ref,
  sized,
}: SplitPanelProps) {
  const orientation =
    useResponsivePropValue(orientationProp) === "vertical" ? "vertical" : "horizontal";
  const isSizedFirst = placement === "start";
  const direction =
    orientation === "horizontal" ? (isSizedFirst ? "left" : "right") : isSizedFirst ? "down" : "up";
  const hasFill = fill !== undefined && fill !== null;
  const containerRef = useRef<HTMLDivElement>(null);
  const dimensions = useContainerSize(containerRef);
  const availableSize = orientation === "horizontal" ? dimensions.width : dimensions.height;
  const max =
    availableSize > 0
      ? Math.max(
          minSize,
          Math.min(
            maxSize ?? Number.POSITIVE_INFINITY,
            availableSize - fillMinSize - DRAG_HANDLE_SIZE,
          ),
        )
      : (maxSize ?? Number.POSITIVE_INFINITY);
  const [size, setSizeState] = useState(() =>
    clamp(initialSize, minSize, maxSize ?? Number.POSITIVE_INFINITY),
  );
  const dragState = useRef<{ size: number; startSize: number } | null>(null);
  const [isHeld, setIsHeld] = useState(false);
  const visibleSize = clamp(size, minSize, max);
  const onResizeRef = useRef(onResize);

  useLayoutEffect(() => {
    onResizeRef.current = onResize;
  });

  const setSize = useCallback((nextSize: number, userEvent = false) => {
    void userEvent;
    setSizeState(nextSize);
    onResizeRef.current?.(nextSize);
  }, []);

  useLayoutEffect(() => {
    const next = clamp(initialSize, minSize, max);
    // The public contract reseeds its initial drawer size when direction changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSizeState(next);
    onResizeRef.current?.(next);
    // The canonical drawer hook reseeds when its derived direction changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [direction]);

  useImperativeHandle(ref, () => ({ setSize }), [setSize]);

  const reportEnd = useCallback(
    (startSize: number, endSize: number) => {
      if (startSize === endSize) return;
      onResizeEnd?.({
        direction: endSize > startSize ? "increase" : "decrease",
        endSize,
        startSize,
      });
    },
    [onResizeEnd],
  );

  const onDoubleClick = () => {
    const target = clamp(defaultSize, minSize, max);
    setSize(target, true);
    reportEnd(visibleSize, target);
  };
  const onMoveStart = () => {
    dragState.current = { size: visibleSize, startSize: visibleSize };
    setIsHeld(true);
  };
  const onMove = (delta: number) => {
    const state = dragState.current;
    if (!state) return;
    state.size = clamp(state.size + (isSizedFirst ? delta : -delta), minSize, max);
    setSize(Math.round(state.size), true);
  };
  const onMoveEnd = () => {
    const state = dragState.current;
    dragState.current = null;
    setIsHeld(false);
    if (state) reportEnd(state.startSize, Math.round(state.size));
  };
  const onKeyDown: React.KeyboardEventHandler<HTMLElement> = (event) => {
    const target =
      event.key === "Home"
        ? isSizedFirst
          ? minSize
          : max
        : event.key === "End"
          ? isSizedFirst
            ? max
            : minSize
          : null;
    if (target === null || !Number.isFinite(target)) return;
    event.preventDefault();
    setSize(target, true);
    reportEnd(visibleSize, target);
  };

  const panes: ReactNode[] = [
    <Pane key="sized" size={hasFill ? visibleSize : null}>
      {sized}
    </Pane>,
  ];
  if (hasFill) {
    panes.push(
      <DragHandle
        aria-label="Resize panels"
        isSizedFirst={isSizedFirst}
        key="divider"
        max={max}
        min={minSize}
        orientation={orientation}
        value={visibleSize}
        onDoubleClick={onDoubleClick}
        onKeyDown={onKeyDown}
        onMove={onMove}
        onMoveEnd={onMoveEnd}
        onMoveStart={onMoveStart}
      />,
      <Pane key="fill" size={null}>
        {fill}
      </Pane>,
    );
  }

  return (
    <Flex direction={orientation === "horizontal" ? "row" : "column"} position="relative">
      {({ className }) => (
        <div
          className={[className, heldFrameClassName].filter(Boolean).join(" ")}
          data-is-held={isHeld}
          ref={containerRef}
          style={{
            flex: "1",
            height: "100%",
            minHeight: "0",
            minWidth: "0",
            visibility: hasFill && availableSize === 0 ? "hidden" : undefined,
            width: "100%",
          }}
        >
          {isSizedFirst ? panes : panes.toReversed()}
        </div>
      )}
    </Flex>
  );
}
