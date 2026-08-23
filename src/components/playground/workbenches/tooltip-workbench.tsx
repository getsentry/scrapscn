"use client";

import { useState } from "react";

import type { WorkbenchProps } from "@/components/playground/workbench";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContext } from "@/components/ui/tooltip";

type Position = "auto" | "top" | "right" | "bottom" | "left";

interface TooltipWorkbenchState {
  forceVisible: boolean;
  isHoverable: boolean;
  overflow: boolean;
  position: Position;
  title: string;
}

function defaults(): TooltipWorkbenchState {
  return {
    forceVisible: false,
    isHoverable: true,
    overflow: false,
    position: "top",
    title: "Open issue details",
  };
}

function parseState(params: URLSearchParams): TooltipWorkbenchState {
  const position = params.get("tooltipPosition");
  return {
    forceVisible: params.get("tooltipVisible") === "true",
    isHoverable: params.get("tooltipHoverable") !== "false",
    overflow: params.get("tooltipOverflow") === "true",
    position:
      position === "auto" || position === "right" || position === "bottom" || position === "left"
        ? position
        : "top",
    title: params.get("tooltipTitle") ?? "Open issue details",
  };
}

function serialize(state: TooltipWorkbenchState) {
  return new URLSearchParams({
    tooltipHoverable: String(state.isHoverable),
    tooltipOverflow: String(state.overflow),
    tooltipPosition: state.position,
    tooltipTitle: state.title,
    tooltipVisible: String(state.forceVisible),
  });
}

const controlClassName =
  "h-11 rounded-md border border-input bg-background px-3 text-base sm:h-10 sm:text-sm";

export function TooltipWorkbench({
  children,
  onSearchChange,
  sourceSearch,
}: WorkbenchProps) {
  const [state, setState] = useState(() =>
    parseState(new URLSearchParams(sourceSearch))
  );
  function update(next: TooltipWorkbenchState) {
    setState(next);
    onSearchChange(serialize(next));
  }

  const controls = (
    <div className="grid gap-4">
      <div>
        <h2 className="text-sm font-semibold">Tooltip setup</h2>
        <p className="text-xs text-muted-foreground">The URL stores every control.</p>
      </div>
      <label className="grid gap-1 text-sm">
        Title
        <input
          aria-label="Tooltip title"
          className={controlClassName}
          onChange={(event) => update({ ...state, title: event.target.value })}
          value={state.title}
        />
      </label>
      <label className="grid gap-1 text-sm">
        Requested position
        <select
          aria-label="Tooltip position"
          className={controlClassName}
          onChange={(event) => {
            const value = event.target.value;
            update({
              ...state,
              position:
                value === "auto" || value === "right" || value === "bottom" || value === "left"
                  ? value
                  : "top",
            });
          }}
          value={state.position}
        >
          <option value="auto">Auto</option>
          <option value="top">Top</option>
          <option value="right">Right</option>
          <option value="bottom">Bottom</option>
          <option value="left">Left</option>
        </select>
      </label>
      {(
        [
          ["forceVisible", "Force visible"],
          ["isHoverable", "Hoverable content"],
          ["overflow", "Overflow-only trigger"],
        ] as const
      ).map(([key, label]) => (
        <label className="flex min-h-11 items-center gap-2 text-sm" key={key}>
          <input
            aria-label={label}
            checked={state[key]}
            className="size-5 touch-manipulation"
            onChange={(event) => update({ ...state, [key]: event.target.checked })}
            type="checkbox"
          />
          {label}
        </label>
      ))}
    </div>
  );

  return children({
    breadcrumbs: ["Components", "Tooltip"],
    controls,
    description:
      "Test the regular Scraps tooltip delay, collision placement, overflow gate, arrow, and interactive content.",
    preview: <TooltipPreview state={state} />,
    reset: () => {
      const next = defaults();
      setState(next);
      return serialize(next);
    },
    serialize: () => serialize(state),
    title: "Tooltip",
  });
}

function TooltipPreview({ state }: { state: TooltipWorkbenchState }) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  return (
    <div
      className="relative flex min-h-72 items-center justify-center overflow-hidden rounded-md border border-border bg-background p-12"
      data-testid="tooltip-preview"
      ref={setContainer}
    >
      <TooltipContext.Provider value={{ container }}>
        <Tooltip
          delay={0}
          forceVisible={state.forceVisible ? true : undefined}
          isHoverable={state.isHoverable}
          position={state.position}
          showOnlyOnOverflow={state.overflow}
          skipWrapper
          title={state.title}
        >
          <Button data-overflowing={state.overflow ? "true" : undefined}>
            Inspect issue
          </Button>
        </Tooltip>
      </TooltipContext.Provider>
    </div>
  );
}
