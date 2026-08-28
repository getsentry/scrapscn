"use client";

import { Search } from "lucide-react";
import { useState } from "react";

import type { WorkbenchProps } from "@/components/playground/workbench";
import {
  Input,
  InputGroup,
  NumberDragInput,
  NumberInput,
  useAutosizeInput,
} from "@/components/ui/input";

const modes = ["input", "group", "number", "drag", "autosize"] as const;
const sizes = ["xs", "sm", "md"] as const;

type InputMode = (typeof modes)[number];
type InputSize = (typeof sizes)[number];

interface InputWorkbenchState {
  disabled: boolean;
  label: string;
  mode: InputMode;
  monospace: boolean;
  numberValue: number;
  size: InputSize;
  value: string;
}

function defaultState(): InputWorkbenchState {
  return {
    disabled: false,
    label: "Search issues",
    mode: "group",
    monospace: false,
    numberValue: 5,
    size: "md",
    value: "is:unresolved",
  };
}

function parseMode(value: string | null): InputMode {
  return modes.find((mode) => mode === value) ?? "group";
}

function parseSize(value: string | null): InputSize {
  return sizes.find((size) => size === value) ?? "md";
}

function parseNumber(value: string | null) {
  if (value === null) return 5;
  const number = Number(value);
  return Number.isFinite(number) ? number : 5;
}

export function parseInputWorkbench(params: URLSearchParams): InputWorkbenchState {
  const initial = defaultState();
  return {
    disabled: params.get("inputDisabled") === "true",
    label: params.get("inputLabel") ?? initial.label,
    mode: parseMode(params.get("inputMode")),
    monospace: params.get("inputMonospace") === "true",
    numberValue: parseNumber(params.get("inputNumberValue")),
    size: parseSize(params.get("inputSize")),
    value: params.get("inputValue") ?? initial.value,
  };
}

export function serializeInputWorkbench(state: InputWorkbenchState) {
  return new URLSearchParams({
    inputDisabled: String(state.disabled),
    inputLabel: state.label,
    inputMode: state.mode,
    inputMonospace: String(state.monospace),
    inputNumberValue: String(state.numberValue),
    inputSize: state.size,
    inputValue: state.value,
  });
}

const controlClassName =
  "h-11 rounded-md border border-input bg-background px-3 text-base sm:h-10 sm:text-sm";

export function InputWorkbench({ children, onSearchChange, sourceSearch }: WorkbenchProps) {
  const [state, setState] = useState(() => parseInputWorkbench(new URLSearchParams(sourceSearch)));
  const autosizeRef = useAutosizeInput({
    enabled: state.mode === "autosize",
    value: state.value,
  });

  function update(next: InputWorkbenchState) {
    setState(next);
    onSearchChange(serializeInputWorkbench(next));
  }

  const sharedProps = {
    disabled: state.disabled,
    monospace: state.monospace,
    size: state.size,
  } as const;

  let preview: React.ReactNode;
  if (state.mode === "group") {
    preview = (
      <InputGroup>
        <InputGroup.LeadingItems disablePointerEvents>
          <Search aria-hidden="true" className="size-4" />
        </InputGroup.LeadingItems>
        <InputGroup.Input
          {...sharedProps}
          aria-label={state.label}
          value={state.value}
          onChange={(event) => update({ ...state, value: event.target.value })}
        />
        <InputGroup.TrailingItems disablePointerEvents>
          <span className="text-xs text-muted-foreground">⌘K</span>
        </InputGroup.TrailingItems>
      </InputGroup>
    );
  } else if (state.mode === "number") {
    preview = (
      <NumberInput
        {...sharedProps}
        aria-label={state.label}
        max={10}
        min={0}
        value={state.numberValue}
        onChange={(numberValue) => update({ ...state, numberValue })}
      />
    );
  } else if (state.mode === "drag") {
    preview = (
      <NumberDragInput
        {...sharedProps}
        aria-label={state.label}
        max={10}
        min={0}
        value={state.numberValue}
        onChange={(event) => update({ ...state, numberValue: Number(event.target.value) })}
      />
    );
  } else {
    preview = (
      <Input
        {...sharedProps}
        aria-label={state.label}
        ref={state.mode === "autosize" ? autosizeRef : undefined}
        value={state.value}
        onChange={(event) => update({ ...state, value: event.target.value })}
      />
    );
  }

  return children({
    breadcrumbs: ["Components", "Input"],
    controls: (
      <div className="grid gap-4">
        <div>
          <h2 className="text-sm font-semibold">Input setup</h2>
          <p className="text-xs text-muted-foreground">
            Test every public Input mode. The URL stores the current state.
          </p>
        </div>
        <label className="grid gap-1 text-sm">
          Mode
          <select
            aria-label="Input mode"
            className={controlClassName}
            value={state.mode}
            onChange={(event) => update({ ...state, mode: parseMode(event.target.value) })}
          >
            {modes.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Label
          <input
            aria-label="Input label"
            className={controlClassName}
            value={state.label}
            onChange={(event) => update({ ...state, label: event.target.value })}
          />
        </label>
        <label className="grid gap-1 text-sm">
          Value
          <input
            aria-label="Input value"
            className={controlClassName}
            disabled={state.mode === "number" || state.mode === "drag"}
            value={state.value}
            onChange={(event) => update({ ...state, value: event.target.value })}
          />
        </label>
        <label className="grid gap-1 text-sm">
          Number value
          <input
            aria-label="Input number value"
            className={controlClassName}
            disabled={state.mode !== "number" && state.mode !== "drag"}
            max={10}
            min={0}
            type="number"
            value={state.numberValue}
            onChange={(event) => update({ ...state, numberValue: parseNumber(event.target.value) })}
          />
        </label>
        <label className="grid gap-1 text-sm">
          Size
          <select
            aria-label="Input size"
            className={controlClassName}
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
        {(["monospace", "disabled"] as const).map((field) => (
          <label className="flex min-h-11 items-center gap-2 text-sm" key={field}>
            <input
              aria-label={`${field} Input`}
              checked={state[field]}
              className="size-5 touch-manipulation"
              type="checkbox"
              onChange={(event) => update({ ...state, [field]: event.target.checked })}
            />
            {field[0]?.toUpperCase()}
            {field.slice(1)}
          </label>
        ))}
      </div>
    ),
    description:
      "Test the regular Scraps Input, compound group, numeric controls, autosizing hook, sizes, fonts, and disabled behavior.",
    preview: (
      <div
        className="grid min-h-72 w-full max-w-xl content-center gap-2 rounded-md border border-border bg-background p-8 sm:p-12"
        data-testid="input-preview"
      >
        <label className="text-sm font-semibold">{state.label || "Untitled input"}</label>
        {preview}
        <output className="text-xs text-muted-foreground">
          {state.mode === "number" || state.mode === "drag"
            ? `Value: ${state.numberValue}`
            : `${state.value.length} characters`}
        </output>
      </div>
    ),
    reset: () => {
      const next = defaultState();
      setState(next);
      return serializeInputWorkbench(next);
    },
    serialize: () => serializeInputWorkbench(state),
    title: "Input",
  });
}
