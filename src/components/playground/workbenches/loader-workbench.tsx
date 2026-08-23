"use client";

import { useState } from "react";

import type { WorkbenchProps } from "@/components/playground/workbench";
import { IndeterminateLoader } from "@/components/ui/loader";

type LoaderVariant = "vibrant" | "monochrome";
type LoaderWidth = "120" | "240" | "400" | "fluid";

interface LoaderState {
  messages: boolean;
  variant: LoaderVariant;
  width: LoaderWidth;
}

function defaults(): LoaderState {
  return { messages: true, variant: "vibrant", width: "240" };
}

function parseState(params: URLSearchParams): LoaderState {
  const width = params.get("loaderWidth");
  return {
    messages: params.get("loaderMessages") !== "false",
    variant: params.get("loaderVariant") === "monochrome" ? "monochrome" : "vibrant",
    width: width === "120" || width === "400" || width === "fluid" ? width : "240",
  };
}

function serialize(state: LoaderState) {
  return new URLSearchParams({
    loaderMessages: String(state.messages),
    loaderVariant: state.variant,
    loaderWidth: state.width,
  });
}
const selectClassName = "h-11 rounded-md border border-input bg-background px-3 text-base sm:h-10 sm:text-sm";

export function LoaderWorkbench({ children, onSearchChange, sourceSearch }: WorkbenchProps) {
  const [state, setState] = useState(() => parseState(new URLSearchParams(sourceSearch)));
  function update(next: LoaderState) { setState(next); onSearchChange(serialize(next)); }
  const width = state.width === "fluid" ? "100%" : `${state.width}px`;
  const controls = (
    <div className="grid gap-4">
      <div><h2 className="text-sm font-semibold">Loader setup</h2><p className="text-xs text-muted-foreground">The URL stores every control.</p></div>
      <label className="grid gap-1 text-sm">Variant<select aria-label="Loader variant" className={selectClassName} value={state.variant} onChange={(event) => update({ ...state, variant: event.target.value === "monochrome" ? "monochrome" : "vibrant" })}><option value="vibrant">Vibrant</option><option value="monochrome">Monochrome</option></select></label>
      <label className="grid gap-1 text-sm">Track width<select aria-label="Loader width" className={selectClassName} value={state.width} onChange={(event) => update({ ...state, width: event.target.value === "120" || event.target.value === "400" || event.target.value === "fluid" ? event.target.value : "240" })}><option value="120">120 px</option><option value="240">240 px</option><option value="400">400 px</option><option value="fluid">Fluid</option></select></label>
      <label className="flex min-h-11 items-center gap-2 text-sm"><input aria-label="Show loader messages" checked={state.messages} className="size-5 touch-manipulation" type="checkbox" onChange={(event) => update({ ...state, messages: event.target.checked })} />Show messages</label>
    </div>
  );
  const preview = (
    <div className="bg-background text-foreground" data-testid="loader-preview" style={{ boxSizing: "border-box", minHeight: 176, padding: 24, width: "100%" }}>
      <div style={{ color: state.variant === "monochrome" ? "#7553ff" : undefined, width }}>
        <IndeterminateLoader messages={state.messages ? ["Loading issues", "Checking your filters", "Preparing results"] : undefined} variant={state.variant} />
      </div>
    </div>
  );
  return children({ breadcrumbs: ["Components", "Loader"], controls, description: "Test the regular Scraps indeterminate squiggle, its message progression, and its width-sensitive timing.", preview, reset: () => { const next = defaults(); setState(next); return serialize(next); }, serialize: () => serialize(state), title: "Loader" });
}
