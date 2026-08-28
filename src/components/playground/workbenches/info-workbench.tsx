"use client";

import { useState } from "react";

import type { WorkbenchProps } from "@/components/playground/workbench";
import { DisabledTip, InfoText, InfoTip } from "@/components/ui/info";

type InfoWorkbenchState = {
  mode: "regular" | "overflowOnly";
  title: string;
  variant: "muted" | "primary" | "warning";
};

function defaults(): InfoWorkbenchState {
  return {
    mode: "regular",
    title: "The team that owns this issue",
    variant: "muted",
  };
}

function parseState(params: URLSearchParams): InfoWorkbenchState {
  const variant = params.get("infoVariant");
  return {
    mode: params.get("infoMode") === "overflowOnly" ? "overflowOnly" : "regular",
    title: params.get("infoTitle") ?? defaults().title,
    variant: variant === "primary" || variant === "warning" ? variant : "muted",
  };
}

function serialize(state: InfoWorkbenchState) {
  return new URLSearchParams({
    infoMode: state.mode,
    infoTitle: state.title,
    infoVariant: state.variant,
  });
}

const controlClassName =
  "h-11 rounded-md border border-input bg-background px-3 text-base sm:h-10 sm:text-sm";

export function InfoWorkbench({ children, onSearchChange, sourceSearch }: WorkbenchProps) {
  const [state, setState] = useState(() => parseState(new URLSearchParams(sourceSearch)));
  function update(next: InfoWorkbenchState) {
    setState(next);
    onSearchChange(serialize(next));
  }
  const isOverflowOnly = state.mode === "overflowOnly";
  const controls = (
    <div className="grid gap-4">
      <div>
        <h2 className="text-sm font-semibold">Info setup</h2>
        <p className="text-xs text-muted-foreground">
          The URL stores the tooltip and display state.
        </p>
      </div>
      <label className="grid gap-1 text-sm">
        Tooltip text
        <input
          aria-label="Info tooltip text"
          className={controlClassName}
          onChange={(event) => update({ ...state, title: event.target.value })}
          value={state.title}
        />
      </label>
      <label className="grid gap-1 text-sm">
        Mode
        <select
          aria-label="Info mode"
          className={controlClassName}
          onChange={(event) =>
            update({
              ...state,
              mode: event.target.value === "overflowOnly" ? "overflowOnly" : "regular",
            })
          }
          value={state.mode}
        >
          <option value="regular">Regular</option>
          <option value="overflowOnly">Overflow only</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        Underline color
        <select
          aria-label="Info underline color"
          className={controlClassName}
          onChange={(event) =>
            update({
              ...state,
              variant:
                event.target.value === "primary" || event.target.value === "warning"
                  ? event.target.value
                  : "muted",
            })
          }
          value={state.variant}
        >
          <option value="muted">Muted</option>
          <option value="primary">Primary</option>
          <option value="warning">Warning</option>
        </select>
      </label>
    </div>
  );
  const text = "an-extremely-long-project-name";
  const preview = (
    <div
      className="flex min-h-36 flex-col justify-center gap-5 rounded-md border border-border p-6"
      data-testid="info-preview"
    >
      <div className={isOverflowOnly ? "w-32" : undefined}>
        <InfoText
          delay={0}
          mode={isOverflowOnly ? "overflowOnly" : undefined}
          title={state.title}
          variant={state.variant}
        >
          {text}
        </InfoText>
      </div>
      <div className="flex gap-4">
        <InfoTip title={state.title} />
        <DisabledTip title="Disabled by your plan" />
      </div>
    </div>
  );
  return children({
    breadcrumbs: ["Components", "Info"],
    controls,
    description:
      "Test regular and overflow-only InfoText, semantic underline colors, and the tooltip icons.",
    preview,
    reset: () => {
      const next = defaults();
      setState(next);
      return serialize(next);
    },
    serialize: () => serialize(state),
    title: "Info",
  });
}
