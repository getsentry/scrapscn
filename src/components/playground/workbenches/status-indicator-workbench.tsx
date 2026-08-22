"use client";

import { useState } from "react";

import type { WorkbenchProps } from "@/components/playground/workbench";
import { StatusIndicator } from "@/components/ui/status-indicator";

const variants = [
  "accent",
  "danger",
  "warning",
  "success",
  "promotion",
  "muted",
] as const;

type StatusVariant = (typeof variants)[number];
type StatusCount = "infinite" | "0" | "1" | "3";
type StatusRole = "default" | "status";

interface StatusIndicatorWorkbenchState {
  count: StatusCount;
  labeled: boolean;
  role: StatusRole;
  variant: StatusVariant;
}

function parseVariant(value: string | null): StatusVariant {
  return variants.find((variant) => variant === value) ?? "accent";
}

function parseCount(value: string | null): StatusCount {
  return value === "0" || value === "1" || value === "3" ? value : "infinite";
}

function parseRole(value: string | null): StatusRole {
  return value === "status" ? "status" : "default";
}

function defaultState(): StatusIndicatorWorkbenchState {
  return {
    count: "infinite",
    labeled: false,
    role: "default",
    variant: "accent",
  };
}

function parseStatusIndicatorWorkbench(
  params: URLSearchParams
): StatusIndicatorWorkbenchState {
  return {
    count: parseCount(params.get("statusCount")),
    labeled: params.get("statusLabeled") === "true",
    role: parseRole(params.get("statusRole")),
    variant: parseVariant(params.get("statusVariant")),
  };
}

function serializeStatusIndicatorWorkbench(
  state: StatusIndicatorWorkbenchState
) {
  return new URLSearchParams({
    statusCount: state.count,
    statusLabeled: String(state.labeled),
    statusRole: state.role,
    statusVariant: state.variant,
  });
}

const selectClassName =
  "h-11 rounded-md border border-input bg-background px-3 text-base sm:h-10 sm:text-sm";

export function StatusIndicatorWorkbench({
  children,
  onSearchChange,
  sourceSearch,
}: WorkbenchProps) {
  const [state, setState] = useState(() =>
    parseStatusIndicatorWorkbench(new URLSearchParams(sourceSearch))
  );

  function update(next: StatusIndicatorWorkbenchState) {
    setState(next);
    onSearchChange(serializeStatusIndicatorWorkbench(next));
  }

  const iterations = state.count === "infinite" ? "infinite" : Number(state.count);
  const controls = (
    <div className="grid gap-4">
      <div>
        <h2 className="text-sm font-semibold">Status Indicator setup</h2>
        <p className="text-xs text-muted-foreground">
          Changes stay in the share URL.
        </p>
      </div>
      <label className="grid gap-1 text-sm">
        Variant
        <select
          aria-label="Status variant"
          className={selectClassName}
          value={state.variant}
          onChange={(event) =>
            update({ ...state, variant: parseVariant(event.target.value) })
          }
        >
          {variants.map((variant) => (
            <option key={variant} value={variant}>{variant}</option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        Animation iterations
        <select
          aria-label="Animation iterations"
          className={selectClassName}
          value={state.count}
          onChange={(event) =>
            update({ ...state, count: parseCount(event.target.value) })
          }
        >
          <option value="infinite">Infinite</option>
          <option value="0">0</option>
          <option value="1">1</option>
          <option value="3">3</option>
        </select>
      </label>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input
          aria-label="Status label"
          checked={state.labeled}
          className="size-5 touch-manipulation"
          type="checkbox"
          onChange={(event) => update({ ...state, labeled: event.target.checked })}
        />
        Add aria-label
      </label>
      <label className="grid gap-1 text-sm">
        Role
        <select
          aria-label="Status role"
          className={selectClassName}
          value={state.role}
          onChange={(event) => update({ ...state, role: parseRole(event.target.value) })}
        >
          <option value="default">Default</option>
          <option value="status">Status</option>
        </select>
      </label>
    </div>
  );
  const preview = (
    <div className="grid min-h-48 place-items-center rounded-md border border-border">
      <div className="flex items-center gap-3">
        <StatusIndicator
          animationIterationCount={iterations}
          aria-label={state.labeled ? "Online" : undefined}
          data-testid="status-indicator-preview"
          role={state.role === "status" ? "status" : undefined}
          variant={state.variant}
        />
        <output className="text-sm" data-testid="status-indicator-state">
          {state.variant}, {state.count} iterations
        </output>
      </div>
    </div>
  );

  return children({
    breadcrumbs: ["Components", "Status Indicator"],
    controls,
    description:
      "Test the exact regular Scraps status color, pulse, iteration count, and accessible semantics.",
    preview,
    reset: () => {
      const next = defaultState();
      setState(next);
      return serializeStatusIndicatorWorkbench(next);
    },
    serialize: () => serializeStatusIndicatorWorkbench(state),
    title: "Status Indicator",
  });
}
