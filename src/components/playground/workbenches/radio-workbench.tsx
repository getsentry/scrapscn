"use client";

import { useState } from "react";

import type { WorkbenchProps } from "@/components/playground/workbench";
import { Radio } from "@/components/ui/radio";

const sizes = ["xs", "sm", "md"] as const;
const options = ["error", "warning", "info"] as const;

type RadioSize = (typeof sizes)[number];
type RadioValue = (typeof options)[number];

type RadioWorkbenchState = {
  disabled: boolean;
  label: string;
  selected: RadioValue;
  size: RadioSize;
};

function parseSize(value: string | null): RadioSize {
  return sizes.find((size) => size === value) ?? "md";
}

function parseValue(value: string | null): RadioValue {
  return options.find((option) => option === value) ?? "warning";
}

function defaultState(): RadioWorkbenchState {
  return {
    disabled: false,
    label: "Issue severity",
    selected: "warning",
    size: "md",
  };
}

export function parseRadioWorkbench(params: URLSearchParams): RadioWorkbenchState {
  return {
    disabled: params.get("radioDisabled") === "true",
    label: params.get("radioLabel") ?? "Issue severity",
    selected: parseValue(params.get("radioSelected")),
    size: parseSize(params.get("radioSize")),
  };
}

export function serializeRadioWorkbench(state: RadioWorkbenchState) {
  return new URLSearchParams({
    radioDisabled: String(state.disabled),
    radioLabel: state.label,
    radioSelected: state.selected,
    radioSize: state.size,
  });
}

const fieldClassName =
  "h-11 rounded-md border border-input bg-background px-3 text-base sm:h-10 sm:text-sm";

export function RadioWorkbench({ children, onSearchChange, sourceSearch }: WorkbenchProps) {
  const [state, setState] = useState(() => parseRadioWorkbench(new URLSearchParams(sourceSearch)));

  function update(next: RadioWorkbenchState) {
    setState(next);
    onSearchChange(serializeRadioWorkbench(next));
  }

  const controls = (
    <div className="grid gap-4">
      <div>
        <h2 className="text-sm font-semibold">Radio setup</h2>
        <p className="text-xs text-muted-foreground">Changes stay in the share URL.</p>
      </div>
      <label className="grid gap-1 text-sm">
        Group label
        <input
          aria-label="Radio group label"
          className={fieldClassName}
          value={state.label}
          onChange={(event) => update({ ...state, label: event.target.value })}
        />
      </label>
      <label className="grid gap-1 text-sm">
        Size
        <select
          aria-label="Radio size"
          className={fieldClassName}
          value={state.size}
          onChange={(event) => update({ ...state, size: parseSize(event.target.value) })}
        >
          {sizes.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        Selected option
        <select
          aria-label="Selected radio"
          className={fieldClassName}
          value={state.selected}
          onChange={(event) => update({ ...state, selected: parseValue(event.target.value) })}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input
          aria-label="Disable radio group"
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
    <fieldset
      className="grid max-w-md gap-3 rounded-md border border-border p-5"
      data-testid="radio-preview"
    >
      <legend className="px-1 text-sm font-semibold">
        {state.label || "Untitled radio group"}
      </legend>
      {options.map((option) => (
        <label key={option} className="flex cursor-pointer items-center gap-3 capitalize">
          <Radio
            checked={state.selected === option}
            disabled={state.disabled}
            name="issue-severity"
            size={state.size}
            value={option}
            onChange={(event) => update({ ...state, selected: parseValue(event.target.value) })}
          />
          {option}
        </label>
      ))}
      <output className="text-sm text-muted-foreground">Selected: {state.selected}</output>
    </fieldset>
  );

  return children({
    breadcrumbs: ["Components", "Radio"],
    controls,
    description:
      "Test the exact regular Scraps native radio API, sizes, grouping, disabled state, theme, and keyboard behavior.",
    preview,
    reset: () => {
      const next = defaultState();
      setState(next);
      return serializeRadioWorkbench(next);
    },
    serialize: () => serializeRadioWorkbench(state),
    title: "Radio",
  });
}
