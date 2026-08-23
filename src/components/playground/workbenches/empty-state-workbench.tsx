"use client";

import { useState } from "react";

import type { WorkbenchProps } from "@/components/playground/workbench";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

type Width = "below-md" | "md";
const defaultTitle = "No issues match your search.";

interface EmptyStateWorkbenchState {
  action: boolean;
  description: boolean;
  illustration: boolean;
  title: string;
  width: Width;
}

function defaultState(): EmptyStateWorkbenchState {
  return { action: true, description: true, illustration: true, title: defaultTitle, width: "md" };
}
function parseState(params: URLSearchParams): EmptyStateWorkbenchState {
  return {
    action: params.get("emptyAction") !== "false",
    description: params.get("emptyDescription") !== "false",
    illustration: params.get("emptyIllustration") !== "false",
    title: params.get("emptyTitle") ?? defaultTitle,
    width: params.get("emptyWidth") === "below-md" ? "below-md" : "md",
  };
}
function serialize(state: EmptyStateWorkbenchState) {
  return new URLSearchParams({
    emptyAction: String(state.action),
    emptyDescription: String(state.description),
    emptyIllustration: String(state.illustration),
    emptyTitle: state.title,
    emptyWidth: state.width,
  });
}
const selectClassName = "h-11 rounded-md border border-input bg-background px-3 text-base sm:h-10 sm:text-sm";

/** Controls every optional regular Scraps EmptyState region in the shareable island. */
export function EmptyStateWorkbench({ children, onSearchChange, sourceSearch }: WorkbenchProps) {
  const [state, setState] = useState(() => parseState(new URLSearchParams(sourceSearch)));
  function update(next: EmptyStateWorkbenchState) {
    setState(next);
    onSearchChange(serialize(next));
  }
  const controls = (
    <div className="grid gap-4">
      <div><h2 className="text-sm font-semibold">Empty State setup</h2><p className="text-xs text-muted-foreground">Changes stay in the share URL.</p></div>
      <label className="grid gap-1 text-sm">Title<input aria-label="Empty state title" className={selectClassName} value={state.title} onChange={(event) => update({ ...state, title: event.target.value })} /></label>
      <label className="grid gap-1 text-sm">Container content width<select aria-label="Empty state container width" className={selectClassName} value={state.width} onChange={(event) => update({ ...state, width: event.target.value === "below-md" ? "below-md" : "md" })}><option value="md">At md (576 px)</option><option value="below-md">Below md (575 px)</option></select></label>
      {([ ["illustration", "Show illustration"], ["description", "Show description"], ["action", "Show action"] ] as const).map(([key, label]) => (
        <label className="flex min-h-11 items-center gap-2 text-sm" key={key}><input aria-label={label} checked={state[key]} className="size-5 touch-manipulation" type="checkbox" onChange={(event) => update({ ...state, [key]: event.target.checked })} />{label}</label>
      ))}
    </div>
  );
  const preview = (
    <div
      className="rounded-md border border-border p-6"
      data-testid="empty-state-preview"
      style={{ boxSizing: "content-box", width: state.width === "below-md" ? "575px" : "576px" }}
    >
      <EmptyState
        action={state.action ? <Button>Keep searching</Button> : undefined}
        description={state.description ? "Try widening your search or adjusting your filters." : undefined}
        illustration={state.illustration ? <div aria-label="Empty box illustration" className="grid size-24 place-items-center rounded-lg border text-4xl" role="img">□</div> : undefined}
        title={state.title}
      />
    </div>
  );
  return children({
    breadcrumbs: ["Components", "Empty State"], controls,
    description: "Test the regular Scraps responsive empty layout, optional regions, and action composition.", preview,
    reset: () => { const next = defaultState(); setState(next); return serialize(next); },
    serialize: () => serialize(state), title: "Empty State",
  });
}
