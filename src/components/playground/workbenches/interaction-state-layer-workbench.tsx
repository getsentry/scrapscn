"use client";

import { useState } from "react";

import type { WorkbenchProps } from "@/components/playground/workbench";
import InteractionStateLayer from "@/components/ui/interaction-state-layer";

const interactionModes = ["automatic", "hovered", "pressed", "selected"] as const;
type InteractionMode = (typeof interactionModes)[number];

interface InteractionStateLayerWorkbenchState {
  hasSelectedBackground: boolean;
  higherOpacity: boolean;
  mode: InteractionMode;
}

function defaultState(): InteractionStateLayerWorkbenchState {
  return {
    hasSelectedBackground: true,
    higherOpacity: false,
    mode: "automatic",
  };
}

function parseMode(value: string | null): InteractionMode {
  return interactionModes.find((mode) => mode === value) ?? "automatic";
}

export function parseInteractionStateLayerWorkbench(
  params: URLSearchParams,
): InteractionStateLayerWorkbenchState {
  return {
    hasSelectedBackground: params.get("stateLayerSelectedBackground") !== "false",
    higherOpacity: params.get("stateLayerHigherOpacity") === "true",
    mode: parseMode(params.get("stateLayerMode")),
  };
}

export function serializeInteractionStateLayerWorkbench(
  state: InteractionStateLayerWorkbenchState,
) {
  return new URLSearchParams({
    stateLayerHigherOpacity: String(state.higherOpacity),
    stateLayerMode: state.mode,
    stateLayerSelectedBackground: String(state.hasSelectedBackground),
  });
}

function Toggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 items-center gap-2 text-sm">
      <input
        checked={checked}
        className="size-5 touch-manipulation"
        type="checkbox"
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}

export function InteractionStateLayerWorkbench({
  children,
  onSearchChange,
  sourceSearch,
}: WorkbenchProps) {
  const [state, setState] = useState(() =>
    parseInteractionStateLayerWorkbench(new URLSearchParams(sourceSearch)),
  );

  function update(next: InteractionStateLayerWorkbenchState) {
    setState(next);
    onSearchChange(serializeInteractionStateLayerWorkbench(next));
  }

  const controls = (
    <div className="grid gap-4">
      <div>
        <h2 className="text-sm font-semibold">Interaction State Layer setup</h2>
        <p className="text-xs text-muted-foreground">Changes stay in the share URL.</p>
      </div>
      <label className="grid gap-2 text-sm font-medium">
        State
        <select
          aria-label="Interaction state"
          className="h-11 rounded-md border border-input bg-background px-3 text-base sm:h-10 sm:text-sm"
          value={state.mode}
          onChange={(event) => update({ ...state, mode: parseMode(event.target.value) })}
        >
          <option value="automatic">Automatic hover and press</option>
          <option value="hovered">Forced hover</option>
          <option value="pressed">Forced press</option>
          <option value="selected">Selected parent</option>
        </select>
      </label>
      <Toggle
        checked={state.higherOpacity}
        label="Higher opacity"
        onChange={(higherOpacity) => update({ ...state, higherOpacity })}
      />
      <Toggle
        checked={state.hasSelectedBackground}
        label="Selected background"
        onChange={(hasSelectedBackground) => update({ ...state, hasSelectedBackground })}
      />
    </div>
  );

  const layerProps = {
    hasSelectedBackground: state.hasSelectedBackground,
    higherOpacity: state.higherOpacity,
    isHovered: state.mode === "hovered" ? true : state.mode === "pressed" ? false : undefined,
    isPressed: state.mode === "pressed" ? true : state.mode === "hovered" ? false : undefined,
  };
  const preview = (
    <div
      aria-label="Interaction state examples"
      className="grid max-w-4xl gap-4 sm:grid-cols-3"
      data-testid="interaction-state-layer-preview"
      role="listbox"
    >
      {["Unresolved issues", "Assigned to me", "For review"].map((label, index) => (
        <div
          aria-selected={state.mode === "selected" && index === 1}
          className="relative grid min-h-40 touch-manipulation content-between overflow-hidden rounded-lg border border-border bg-background p-5 text-left"
          data-testid={`interaction-target-${index}`}
          key={label}
          role="option"
          tabIndex={0}
        >
          <InteractionStateLayer
            {...layerProps}
            hasSelectedBackground={state.hasSelectedBackground && index === 1}
          />
          <span className="relative text-sm font-semibold">{label}</span>
          <span className="relative text-3xl font-semibold tabular-nums">{12 + index * 7}</span>
          <span className="relative text-xs text-muted-foreground">
            {index === 1 ? "Selected state target" : "Hover or press this card"}
          </span>
        </div>
      ))}
    </div>
  );

  return children({
    breadcrumbs: ["Components", "Interaction State Layer"],
    controls,
    description: "Compare automatic, controlled, selected, and high-opacity interaction feedback.",
    preview,
    reset: () => {
      const next = defaultState();
      setState(next);
      return serializeInteractionStateLayerWorkbench(next);
    },
    serialize: () => serializeInteractionStateLayerWorkbench(state),
    title: "Interaction State Layer",
  });
}
