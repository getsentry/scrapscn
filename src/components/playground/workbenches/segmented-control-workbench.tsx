"use client";

import { useState } from "react";

import type { WorkbenchProps } from "@/components/playground/workbench";
import { SegmentedControl } from "@/components/ui/segmented-control";

const sizes = ["xs", "sm", "md"] as const;
const priorities = ["default", "primary", "secondary"] as const;
const values = ["list", "grid", "chart", "table"] as const;

type Value = (typeof values)[number];
type State = {
  disabled: boolean;
  priority: (typeof priorities)[number];
  size: (typeof sizes)[number];
  value: Value;
};

function defaultState(): State {
  return {
    disabled: false,
    priority: "default",
    size: "md",
    value: "list",
  };
}

function valueFrom(value: string | null): Value {
  return values.find((item) => item === value) ?? "list";
}

export function parseSegmentedControlWorkbench(params: URLSearchParams): State {
  return {
    disabled: params.get("segmentedDisabled") === "true",
    priority: priorities.find((item) => item === params.get("segmentedPriority")) ?? "default",
    size: sizes.find((item) => item === params.get("segmentedSize")) ?? "md",
    value: valueFrom(params.get("segmentedValue")),
  };
}

export function serializeSegmentedControlWorkbench(state: State) {
  return new URLSearchParams({
    segmentedDisabled: String(state.disabled),
    segmentedPriority: state.priority,
    segmentedSize: state.size,
    segmentedValue: state.value,
  });
}

const fieldClassName =
  "h-11 rounded-md border border-input bg-background px-3 text-base sm:h-10 sm:text-sm";

function TableIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 16 16">
      <path d="M2.5 3.5h11v9h-11zM2.5 6.5h11M6.5 3.5v9" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function SegmentedControlWorkbench({
  children,
  onSearchChange,
  sourceSearch,
}: WorkbenchProps) {
  const [state, setState] = useState(() =>
    parseSegmentedControlWorkbench(new URLSearchParams(sourceSearch)),
  );

  function update(next: State) {
    setState(next);
    onSearchChange(serializeSegmentedControlWorkbench(next));
  }

  const controls = (
    <div className="grid gap-4">
      <div>
        <h2 className="text-sm font-semibold">SegmentedControl setup</h2>
        <p className="text-xs text-muted-foreground">Changes stay in the share URL.</p>
      </div>
      <label className="grid gap-1 text-sm">
        Size
        <select
          aria-label="Segmented control size"
          className={fieldClassName}
          value={state.size}
          onChange={(event) =>
            update({
              ...state,
              size: sizes.find((item) => item === event.target.value) ?? "md",
            })
          }
        >
          {sizes.map((size) => (
            <option key={size}>{size}</option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        Priority
        <select
          aria-label="Segmented control priority"
          className={fieldClassName}
          value={state.priority}
          onChange={(event) =>
            update({
              ...state,
              priority: priorities.find((item) => item === event.target.value) ?? "default",
            })
          }
        >
          {priorities.map((priority) => (
            <option key={priority}>{priority}</option>
          ))}
        </select>
      </label>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input
          aria-label="Disable segmented control"
          checked={state.disabled}
          className="size-5 touch-manipulation"
          type="checkbox"
          onChange={(event) => update({ ...state, disabled: event.target.checked })}
        />
        Disabled
      </label>
    </div>
  );

  const preview = (
    <div
      className="grid max-w-md gap-4 rounded-md border border-border p-5"
      data-testid="segmented-control-preview"
    >
      <h2 className="text-sm font-semibold">Display mode</h2>
      <div>
        <SegmentedControl
          aria-label="Display mode"
          priority={state.priority}
          size={state.size}
          value={state.value}
          onChange={(value) => update({ ...state, value })}
        >
          <SegmentedControl.Item key="list" disabled={state.disabled}>
            List
          </SegmentedControl.Item>
          <SegmentedControl.Item key="grid" disabled={state.disabled}>
            Grid
          </SegmentedControl.Item>
          <SegmentedControl.Item key="chart" disabled>
            Chart
          </SegmentedControl.Item>
          <SegmentedControl.Item
            key="table"
            aria-label="Table view"
            disabled={state.disabled}
            icon={<TableIcon />}
            tooltip="Table view"
          />
        </SegmentedControl>
      </div>
      <output className="text-sm text-muted-foreground">Selected: {state.value}</output>
    </div>
  );

  return children({
    breadcrumbs: ["Components", "SegmentedControl"],
    controls,
    description:
      "Test the controlled regular Scraps segmented control, keyboard behavior, exact sizes, priorities, disabled state, and share URL.",
    preview,
    reset: () => {
      const next = defaultState();
      setState(next);
      return serializeSegmentedControlWorkbench(next);
    },
    serialize: () => serializeSegmentedControlWorkbench(state),
    title: "SegmentedControl",
  });
}
