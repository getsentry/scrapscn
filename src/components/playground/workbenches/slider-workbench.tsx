"use client";

import { useEffect, useRef, useState } from "react";

import type { WorkbenchProps } from "@/components/playground/workbench";
import { Slider } from "@/components/ui/slider";

type SliderWorkbenchState = {
  disabled: boolean;
  value: number;
};

const SLIDER_DEFAULT_VALUE = 40;
const SLIDER_MAX = 100;
const SLIDER_MIN = 0;
const SLIDER_STEP = 1;

function normalizeSliderValue(value: number) {
  if (!Number.isFinite(value)) return SLIDER_DEFAULT_VALUE;
  const steppedValue = SLIDER_MIN + Math.round((value - SLIDER_MIN) / SLIDER_STEP) * SLIDER_STEP;
  return Math.min(SLIDER_MAX, Math.max(SLIDER_MIN, steppedValue));
}

function parse(params: URLSearchParams): SliderWorkbenchState {
  const parameter = params.get("sliderValue");
  const value =
    parameter === null || parameter.trim() === ""
      ? SLIDER_DEFAULT_VALUE
      : normalizeSliderValue(Number(parameter));
  return {
    disabled: params.get("sliderDisabled") === "true",
    value,
  };
}

function serialize(state: SliderWorkbenchState) {
  return new URLSearchParams({
    sliderDisabled: String(state.disabled),
    sliderValue: String(state.value),
  });
}

export function SliderWorkbench({ children, onSearchChange, sourceSearch }: WorkbenchProps) {
  const [state, setState] = useState(() => parse(new URLSearchParams(sourceSearch)));
  const [lastCommit, setLastCommit] = useState<number | null>(null);
  const didNormalizeInitialSearch = useRef(false);

  useEffect(() => {
    if (didNormalizeInitialSearch.current) return;
    didNormalizeInitialSearch.current = true;
    const params = new URLSearchParams(sourceSearch);
    const parameter = params.get("sliderValue");
    const initialState = parse(params);
    if (parameter !== null && parameter !== String(initialState.value)) {
      onSearchChange(serialize(initialState));
    }
  }, [onSearchChange, sourceSearch]);

  function update(next: SliderWorkbenchState) {
    setState(next);
    onSearchChange(serialize(next));
  }

  return children({
    breadcrumbs: ["Components", "Slider"],
    controls: (
      <div className="grid gap-4">
        <div>
          <h2 className="text-sm font-semibold">Slider setup</h2>
          <p className="text-xs text-muted-foreground">Changes stay in the share URL.</p>
        </div>
        <label className="grid gap-1 text-sm">
          Value
          <input
            aria-label="Slider value"
            className="h-10 rounded-md border border-input bg-background px-3"
            max={SLIDER_MAX}
            min={SLIDER_MIN}
            onChange={(event) => {
              update({
                ...state,
                value: normalizeSliderValue(Number(event.currentTarget.value)),
              });
            }}
            step={SLIDER_STEP}
            type="number"
            value={state.value}
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            aria-label="Disable slider"
            checked={state.disabled}
            onChange={(event) => update({ ...state, disabled: event.target.checked })}
            type="checkbox"
          />
          Disabled
        </label>
      </div>
    ),
    description:
      "Test the regular Scraps range input, formatted labels, ticks, disabled treatment, theme, keyboard control, and share state.",
    preview: (
      <div className="max-w-xl rounded-md border border-border p-6" data-testid="slider-preview">
        <Slider
          aria-label="Deployment progress"
          disabled={state.disabled}
          formatOptions={{ style: "unit", unit: "percent" }}
          max={SLIDER_MAX}
          min={SLIDER_MIN}
          onChange={(value) => update({ ...state, value })}
          onChangeEnd={setLastCommit}
          step={SLIDER_STEP}
          ticks={{ count: 5, labels: true }}
          value={state.value}
        />
        <output className="mt-4 block text-sm text-muted-foreground">Value: {state.value}</output>
        <output
          className="mt-1 block text-xs text-muted-foreground"
          data-testid="slider-last-commit"
        >
          Last commit: {lastCommit ?? "none"}
        </output>
      </div>
    ),
    reset: () => {
      const next = { disabled: false, value: SLIDER_DEFAULT_VALUE };
      setState(next);
      setLastCommit(null);
      return serialize(next);
    },
    serialize: () => serialize(state),
    title: "Slider",
  });
}
