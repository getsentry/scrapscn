"use client";

import { AnimatePresence } from "framer-motion";
import { useState } from "react";

import type { WorkbenchProps } from "@/components/playground/workbench";
import { Backdrop } from "@/components/ui/backdrop";

const layers = ["widgetBuilderDrawer", "drawer", "modal"] as const;
type BackdropLayer = (typeof layers)[number];

interface BackdropWorkbenchState {
  layer: BackdropLayer;
  visible: boolean;
}

function parseLayer(value: string | null): BackdropLayer {
  return layers.find((layer) => layer === value) ?? "modal";
}

function defaultState(): BackdropWorkbenchState {
  return { layer: "modal", visible: true };
}

function parseBackdropWorkbench(params: URLSearchParams): BackdropWorkbenchState {
  return {
    layer: parseLayer(params.get("backdropLayer")),
    visible: params.get("backdropVisible") !== "false",
  };
}

function serializeBackdropWorkbench(state: BackdropWorkbenchState) {
  return new URLSearchParams({
    backdropLayer: state.layer,
    backdropVisible: String(state.visible),
  });
}

const selectClassName =
  "h-11 rounded-md border border-input bg-background px-3 text-base sm:h-10 sm:text-sm";

export function BackdropWorkbench({
  children,
  onSearchChange,
  sourceSearch,
}: WorkbenchProps) {
  const [state, setState] = useState(() =>
    parseBackdropWorkbench(new URLSearchParams(sourceSearch))
  );
  const [dismissals, setDismissals] = useState(0);

  function update(next: BackdropWorkbenchState) {
    setState(next);
    onSearchChange(serializeBackdropWorkbench(next));
  }

  function dismissBackdrop() {
    setDismissals((count) => count + 1);
    update({ ...state, visible: false });
  }

  const controls = (
    <div className="grid gap-4">
      <div>
        <h2 className="text-sm font-semibold">Backdrop setup</h2>
        <p className="text-xs text-muted-foreground">Changes stay in the share URL.</p>
      </div>
      <label className="grid gap-1 text-sm">
        Layer
        <select
          aria-label="Backdrop layer"
          className={selectClassName}
          value={state.layer}
          onChange={(event) => update({ ...state, layer: parseLayer(event.target.value) })}
        >
          {layers.map((layer) => (
            <option key={layer} value={layer}>{layer}</option>
          ))}
        </select>
      </label>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input
          aria-label="Backdrop visible"
          checked={state.visible}
          className="size-5 touch-manipulation"
          type="checkbox"
          onChange={(event) => update({ ...state, visible: event.target.checked })}
        />
        Visible
      </label>
    </div>
  );

  const preview = (
    <div
      className="relative isolate grid min-h-72 place-items-center overflow-hidden rounded-md border border-border [transform:translateZ(0)]"
      data-testid="backdrop-preview-frame"
    >
      <button
        className="relative z-[10001] rounded-md bg-background px-4 py-3 text-sm shadow-sm"
        type="button"
        onClick={() =>
          state.visible
            ? dismissBackdrop()
            : update({ ...state, visible: true })
        }
      >
        {state.visible ? "Dismiss backdrop" : "Show backdrop"}
      </button>
      <AnimatePresence>
        {state.visible ? (
          <Backdrop
            data-testid="backdrop-preview"
            key={state.layer}
            zIndex={state.layer}
            onClick={dismissBackdrop}
          />
        ) : null}
      </AnimatePresence>
      <output className="relative z-[10001] text-sm" data-testid="backdrop-dismissals">
        Dismissals: {dismissals}
      </output>
    </div>
  );

  return children({
    breadcrumbs: ["Components", "Backdrop"],
    controls,
    description:
      "Test the exact regular Scraps overlay color, motion, click handling, and z-index layers.",
    preview,
    reset: () => {
      const next = defaultState();
      setState(next);
      setDismissals(0);
      return serializeBackdropWorkbench(next);
    },
    serialize: () => serializeBackdropWorkbench(state),
    title: "Backdrop",
  });
}
