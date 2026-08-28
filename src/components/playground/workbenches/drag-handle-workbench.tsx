"use client";

import { ChevronUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { WorkbenchProps } from "@/components/playground/workbench";
import { DRAG_HANDLE_SIZE, DragHandle, type DragHandleVariant } from "@/components/ui/drag-handle";
import { Container, Flex, Stack } from "@/components/ui/layout";

type DragHandleOrientation = "horizontal" | "vertical";
export type DragHandleWorkbenchState = {
  orientation: DragHandleOrientation;
  size: number;
  variant: DragHandleVariant;
};

const defaultSize = 180;
const minimum = 100;
const maximum = 320;
const flexibleMinimum = 64;

function defaultState(): DragHandleWorkbenchState {
  return { orientation: "horizontal", size: defaultSize, variant: "solid" };
}

function parseOrientation(value: string): DragHandleOrientation {
  return value === "vertical" ? "vertical" : "horizontal";
}

function parseVariant(value: string): DragHandleVariant {
  return value === "ghost" ? "ghost" : "solid";
}

function parseSize(value: string | null) {
  if (value === null) return defaultSize;
  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? Math.max(minimum, Math.min(maximum, Math.round(parsed)))
    : defaultSize;
}

function effectiveMaximum(availableLength: number) {
  return Math.max(
    minimum,
    Math.min(maximum, Math.floor(availableLength - flexibleMinimum - DRAG_HANDLE_SIZE)),
  );
}

export function parseDragHandleWorkbench(params: URLSearchParams): DragHandleWorkbenchState {
  return {
    orientation: parseOrientation(params.get("dragHandleOrientation") ?? "horizontal"),
    size: parseSize(params.get("dragHandleSize")),
    variant: parseVariant(params.get("dragHandleVariant") ?? "solid"),
  };
}

export function serializeDragHandleWorkbench(state: DragHandleWorkbenchState) {
  const params = new URLSearchParams();
  params.set("dragHandleOrientation", state.orientation);
  params.set("dragHandleSize", String(state.size));
  params.set("dragHandleVariant", state.variant);
  return params;
}

export function DragHandleWorkbench({ children, onSearchChange, sourceSearch }: WorkbenchProps) {
  const [state, setState] = useState(() =>
    parseDragHandleWorkbench(new URLSearchParams(sourceSearch)),
  );
  const [availableLength, setAvailableLength] = useState<number | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const currentMaximum = availableLength === null ? maximum : effectiveMaximum(availableLength);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const updateAvailableLength = () => {
      const length = state.orientation === "horizontal" ? frame.clientWidth : frame.clientHeight;
      if (length < minimum + flexibleMinimum + DRAG_HANDLE_SIZE) return;
      const nextMaximum = effectiveMaximum(length);
      setAvailableLength(length);
      if (state.size <= nextMaximum) return;
      const next = { ...state, size: nextMaximum };
      setState(next);
      onSearchChange(serializeDragHandleWorkbench(next));
    };
    const observer = new ResizeObserver(updateAvailableLength);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [onSearchChange, state]);

  function update(next: DragHandleWorkbenchState) {
    setState(next);
    onSearchChange(serializeDragHandleWorkbench(next));
  }

  const controls = (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Drag Handle setup</h2>
          <p className="text-xs text-muted-foreground">Changes stay in the share URL.</p>
        </div>
        <ChevronUp aria-hidden="true" className="size-4 text-muted-foreground" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="grid gap-2 text-base font-medium sm:text-sm">
          Orientation
          <select
            className="h-11 touch-manipulation rounded-md border border-input bg-background px-3 text-base focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-ring sm:h-10 sm:text-sm"
            name="drag-handle-orientation"
            value={state.orientation}
            onChange={(event) =>
              update({ ...state, orientation: parseOrientation(event.target.value) })
            }
          >
            <option value="horizontal">Horizontal</option>
            <option value="vertical">Vertical</option>
          </select>
        </label>
        <label className="grid gap-2 text-base font-medium sm:text-sm">
          Variant
          <select
            className="h-11 touch-manipulation rounded-md border border-input bg-background px-3 text-base focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-ring sm:h-10 sm:text-sm"
            name="drag-handle-variant"
            value={state.variant}
            onChange={(event) => update({ ...state, variant: parseVariant(event.target.value) })}
          >
            <option value="solid">Solid</option>
            <option value="ghost">Ghost</option>
          </select>
        </label>
        <label className="grid gap-2 text-base font-medium sm:text-sm">
          Value
          <input
            className="h-11 touch-manipulation rounded-md border border-input bg-background px-3 text-base focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-ring sm:h-10 sm:text-sm"
            max={currentMaximum}
            min={minimum}
            name="drag-handle-value"
            type="number"
            value={state.size}
            onChange={(event) =>
              update({ ...state, size: Math.min(currentMaximum, parseSize(event.target.value)) })
            }
          />
        </label>
      </div>
    </div>
  );

  const preview = (
    <Container background="primary" border="primary" minWidth="0" padding="md" radius="md">
      <Stack gap="sm">
        <span className="text-sm font-medium">Drag handle proof</span>
        <span className="text-sm text-muted-foreground" data-testid="drag-handle-size">
          Sized pane {state.orientation === "horizontal" ? "width" : "height"}: {state.size}px
        </span>
        <Flex
          ref={frameRef}
          border="primary"
          data-testid="drag-handle-frame"
          direction={state.orientation === "horizontal" ? "row" : "column"}
          height={state.orientation === "horizontal" ? "120px" : "420px"}
          minWidth="0"
          overflow="hidden"
          radius="md"
          width="100%"
        >
          <Container
            background="secondary"
            flexBasis={`${state.size}px`}
            flexShrink={0}
            padding="md"
          >
            <span className="text-sm font-medium">Sized pane</span>
          </Container>
          <DragHandle
            aria-label={`Adjust drag pane ${state.orientation === "horizontal" ? "width" : "height"}`}
            isSizedFirst
            max={currentMaximum}
            min={minimum}
            orientation={state.orientation}
            value={state.size}
            variant={state.variant}
            onDoubleClick={() => update({ ...state, size: defaultSize })}
            onMove={(delta) =>
              update({
                ...state,
                size: Math.max(minimum, Math.min(currentMaximum, state.size + delta)),
              })
            }
          />
          <Container
            background="primary"
            data-testid="drag-handle-flexible-pane"
            flexGrow={1}
            minHeight={state.orientation === "vertical" ? `${flexibleMinimum}px` : undefined}
            minWidth={state.orientation === "horizontal" ? `${flexibleMinimum}px` : undefined}
            padding="md"
          >
            <span className="text-sm text-muted-foreground">Flexible pane</span>
          </Container>
        </Flex>
      </Stack>
    </Container>
  );

  return children({
    breadcrumbs: ["Components", "Drag Handle"],
    controls,
    description: "Resize two panes with pointer, touch, or keyboard input.",
    preview,
    reset: () => {
      const next = defaultState();
      setState(next);
      return serializeDragHandleWorkbench(next);
    },
    serialize: () => serializeDragHandleWorkbench(state),
    title: "Drag Handle",
  });
}
