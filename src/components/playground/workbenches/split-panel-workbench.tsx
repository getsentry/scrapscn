"use client";

import { useLayoutEffect, useRef, useState } from "react";

import type { WorkbenchProps } from "@/components/playground/workbench";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Container, Stack } from "@/components/ui/layout";
import { SplitPanel, type SplitPanelHandle } from "@/components/ui/split-panel";

export type SplitPanelMaximum = { kind: "container" } | { kind: "fixed"; value: number };
type SplitPanelOrientation = "horizontal" | "vertical";
type SplitPanelPlacement = "start" | "end";

export type SplitPanelWorkbenchState = {
  defaultSize: number;
  fillMinSize: number;
  hasFill: boolean;
  initialSize: number;
  maximum: SplitPanelMaximum;
  minSize: number;
  orientation: SplitPanelOrientation;
  placement: SplitPanelPlacement;
};

function defaultState(): SplitPanelWorkbenchState {
  return { defaultSize: 200, fillMinSize: 120, hasFill: true, initialSize: 200, maximum: { kind: "container" }, minSize: 100, orientation: "horizontal", placement: "start" };
}

function parseNumber(value: string | null, fallback: number) {
  if (value === null) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : fallback;
}

function parseOrientation(value: string): SplitPanelOrientation {
  return value === "vertical" ? "vertical" : "horizontal";
}

function parsePlacement(value: string): SplitPanelPlacement {
  return value === "end" ? "end" : "start";
}

function parseMaximum(value: string | null): SplitPanelMaximum {
  if (value === null || value === "container") return { kind: "container" };
  const maximum = Number(value);
  return Number.isFinite(maximum) ? { kind: "fixed", value: Math.max(0, Math.round(maximum)) } : { kind: "container" };
}

export function parseSplitPanelWorkbench(params: URLSearchParams): SplitPanelWorkbenchState {
  return {
    defaultSize: parseNumber(params.get("splitPanelDefaultSize"), 200),
    fillMinSize: parseNumber(params.get("splitPanelFillMinSize"), 120),
    hasFill: params.get("splitPanelHasFill") !== "false",
    initialSize: parseNumber(params.get("splitPanelInitialSize"), 200),
    maximum: parseMaximum(params.get("splitPanelMaxSize")),
    minSize: parseNumber(params.get("splitPanelMinSize"), 100),
    orientation: parseOrientation(params.get("splitPanelOrientation") ?? "horizontal"),
    placement: parsePlacement(params.get("splitPanelPlacement") ?? "start"),
  };
}

export function serializeSplitPanelWorkbench(state: SplitPanelWorkbenchState) {
  const params = new URLSearchParams();
  params.set("splitPanelDefaultSize", String(state.defaultSize));
  params.set("splitPanelFillMinSize", String(state.fillMinSize));
  params.set("splitPanelHasFill", String(state.hasFill));
  params.set("splitPanelInitialSize", String(state.initialSize));
  params.set("splitPanelMaxSize", state.maximum.kind === "fixed" ? String(state.maximum.value) : "container");
  params.set("splitPanelMinSize", String(state.minSize));
  params.set("splitPanelOrientation", state.orientation);
  params.set("splitPanelPlacement", state.placement);
  return params;
}

export function SplitPanelWorkbench({ children, onSearchChange, sourceSearch }: WorkbenchProps) {
  const [state, setState] = useState(() => parseSplitPanelWorkbench(new URLSearchParams(sourceSearch)));
  const [resetVersion, setResetVersion] = useState(0);
  const panelRef = useRef<SplitPanelHandle>(null);

  useLayoutEffect(() => {
    if (resetVersion === 0) return;
    panelRef.current?.setSize(defaultState().initialSize, true);
  }, [resetVersion]);

  function update(next: SplitPanelWorkbenchState) {
    setState(next);
    onSearchChange(serializeSplitPanelWorkbench(next));
  }

  const controlClassName = "h-11 rounded-md border border-input bg-background px-3 text-base focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-ring sm:h-10 sm:text-sm";
  const controls = (
    <div className="grid gap-4">
      <div><h2 className="text-sm font-semibold">Split Panel setup</h2><p className="text-xs text-muted-foreground">Changes stay in the share URL.</p></div>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="grid gap-2 text-base font-medium sm:text-sm">Orientation
          <select aria-label="Orientation" className={controlClassName} value={state.orientation} onChange={(event) => update({ ...state, orientation: parseOrientation(event.target.value) })}><option value="horizontal">Horizontal</option><option value="vertical">Vertical</option></select>
        </label>
        <label className="grid gap-2 text-base font-medium sm:text-sm">Placement
          <select aria-label="Placement" className={controlClassName} value={state.placement} onChange={(event) => update({ ...state, placement: parsePlacement(event.target.value) })}><option value="start">Start</option><option value="end">End</option></select>
        </label>
        <label className="flex min-h-11 items-center gap-3 text-base font-medium sm:min-h-10 sm:text-sm"><Checkbox checked={state.hasFill} name="split-panel-fill" onChange={(event) => update({ ...state, hasFill: event.target.checked })} />Include fill pane</label>
        <label className="grid gap-2 text-base font-medium sm:text-sm">Default size<input aria-label="Default size" className={controlClassName} min={0} type="number" value={state.defaultSize} onChange={(event) => update({ ...state, defaultSize: parseNumber(event.target.value, 200) })} /></label>
        <label className="grid gap-2 text-base font-medium sm:text-sm">Initial size<input aria-label="Initial size" className={controlClassName} min={0} type="number" value={state.initialSize} onChange={(event) => { const initialSize = parseNumber(event.target.value, 200); update({ ...state, initialSize }); panelRef.current?.setSize(initialSize, true); }} /></label>
        <label className="grid gap-2 text-base font-medium sm:text-sm">Minimum size<input aria-label="Minimum size" className={controlClassName} min={0} type="number" value={state.minSize} onChange={(event) => update({ ...state, minSize: parseNumber(event.target.value, 100) })} /></label>
        <label className="grid gap-2 text-base font-medium sm:text-sm">Fill minimum<input aria-label="Fill minimum" className={controlClassName} min={0} type="number" value={state.fillMinSize} onChange={(event) => update({ ...state, fillMinSize: parseNumber(event.target.value, 120) })} /></label>
        <label className="grid gap-2 text-base font-medium sm:text-sm">Maximum
          <select aria-label="Maximum" className={controlClassName} value={state.maximum.kind} onChange={(event) => update({ ...state, maximum: event.target.value === "fixed" ? { kind: "fixed", value: 400 } : { kind: "container" } })}><option value="container">Container</option><option value="fixed">Fixed</option></select>
        </label>
        {state.maximum.kind === "fixed" ? <label className="grid gap-2 text-base font-medium sm:text-sm">Maximum size<input aria-label="Maximum size" className={controlClassName} min={0} type="number" value={state.maximum.value} onChange={(event) => update({ ...state, maximum: { kind: "fixed", value: parseNumber(event.target.value, 400) } })} /></label> : null}
      </div>
    </div>
  );

  const preview = (
    <Container background="primary" border="primary" minWidth="0" padding="md" radius="md">
      <Stack gap="sm">
        <div className="flex items-center justify-between gap-3"><span className="text-sm font-medium">Split panel proof</span><Button size="sm" type="button" variant="secondary" onClick={() => panelRef.current?.setSize(state.defaultSize, true)}>Set default size</Button></div>
        <div className="h-[320px] min-w-0 overflow-hidden rounded-md border border-foreground/10" data-testid="split-panel-frame">
          <SplitPanel
            ref={panelRef}
            defaultSize={state.defaultSize}
            fill={state.hasFill ? <div className="size-full p-4 text-sm text-muted-foreground" data-testid="split-panel-fill">Fill pane</div> : undefined}
            fillMinSize={state.fillMinSize}
            initialSize={state.initialSize}
            maxSize={state.maximum.kind === "fixed" ? state.maximum.value : undefined}
            minSize={state.minSize}
            orientation={state.orientation}
            placement={state.placement}
            sized={<div className="size-full bg-muted p-4 text-sm font-medium" data-testid="split-panel-sized">Sized pane</div>}
            onResizeEnd={({ endSize }) => update({ ...state, initialSize: endSize })}
          />
        </div>
      </Stack>
    </Container>
  );

  return children({
    breadcrumbs: ["Components", "Split Panel"],
    controls,
    description: "Resize a regular Scraps Split Panel with pointer, touch, and keyboard input.",
    preview,
    reset: () => { const next = defaultState(); setState(next); setResetVersion((version) => version + 1); return serializeSplitPanelWorkbench(next); },
    serialize: () => serializeSplitPanelWorkbench(state),
    title: "Split Panel",
  });
}
