"use client";

import { useState } from "react";

import type { WorkbenchProps } from "@/components/playground/workbench";
import { Chip } from "@/components/ui/chip";

const sizes = ["xs", "sm", "md"] as const;

type ChipSize = (typeof sizes)[number];

type ChipWorkbenchState = {
  dismissable: boolean;
  operator: string;
  property: string;
  readonly: boolean;
  size: ChipSize;
  value: string;
};

function parseSize(value: string | null): ChipSize {
  return sizes.find((size) => size === value) ?? "md";
}

function defaultState(): ChipWorkbenchState {
  return {
    dismissable: true,
    operator: "is",
    property: "browser",
    readonly: false,
    size: "md",
    value: "Chrome",
  };
}

export function parseChipWorkbench(params: URLSearchParams): ChipWorkbenchState {
  const defaults = defaultState();
  return {
    dismissable: params.get("chipDismissable") !== "false",
    operator: params.get("chipOperator") ?? defaults.operator,
    property: params.get("chipProperty") ?? defaults.property,
    readonly: params.get("chipReadonly") === "true",
    size: parseSize(params.get("chipSize")),
    value: params.get("chipValue") ?? defaults.value,
  };
}

export function serializeChipWorkbench(state: ChipWorkbenchState) {
  return new URLSearchParams({
    chipDismissable: String(state.dismissable),
    chipOperator: state.operator,
    chipProperty: state.property,
    chipReadonly: String(state.readonly),
    chipSize: state.size,
    chipValue: state.value,
  });
}

const fieldClassName =
  "h-11 rounded-md border border-input bg-background px-3 text-base sm:h-10 sm:text-sm";

export function ChipWorkbench({ children, onSearchChange, sourceSearch }: WorkbenchProps) {
  const [state, setState] = useState(() => parseChipWorkbench(new URLSearchParams(sourceSearch)));
  const [dismissed, setDismissed] = useState(false);

  function update(next: ChipWorkbenchState) {
    setDismissed(false);
    setState(next);
    onSearchChange(serializeChipWorkbench(next));
  }

  const controls = (
    <div className="grid gap-4">
      <div>
        <h2 className="text-sm font-semibold">Chip setup</h2>
        <p className="text-xs text-muted-foreground">Changes stay in the share URL.</p>
      </div>
      {(["Property", "Operator", "Value"] as const).map((label) => {
        const key = label.toLowerCase() as "property" | "operator" | "value";
        return (
          <label className="grid gap-1 text-sm" key={key}>
            {label}
            <input
              aria-label={`Chip ${key}`}
              className={fieldClassName}
              value={state[key]}
              onChange={(event) => update({ ...state, [key]: event.target.value })}
            />
          </label>
        );
      })}
      <label className="grid gap-1 text-sm">
        Size
        <select
          aria-label="Chip size"
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
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input
          aria-label="Readonly chip"
          checked={state.readonly}
          className="size-5"
          type="checkbox"
          onChange={(event) => update({ ...state, readonly: event.target.checked })}
        />
        Readonly
      </label>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input
          aria-label="Dismissable chip"
          checked={state.dismissable}
          className="size-5"
          type="checkbox"
          onChange={(event) => update({ ...state, dismissable: event.target.checked })}
        />
        Dismissable
      </label>
    </div>
  );

  const preview = (
    <div
      className="flex min-h-36 items-center rounded-md border border-border p-6"
      data-testid="chip-preview"
    >
      {dismissed ? (
        <output className="text-sm text-muted-foreground">Chip removed</output>
      ) : state.readonly ? (
        <Chip
          readonly
          operator={state.operator || undefined}
          property={state.property || undefined}
          size={state.size}
          value={state.value}
        />
      ) : (
        <Chip
          onDismiss={state.dismissable ? () => setDismissed(true) : undefined}
          operator={state.operator || undefined}
          property={state.property || undefined}
          size={state.size}
          value={state.value}
        />
      )}
    </div>
  );

  return children({
    breadcrumbs: ["Components", "Chip"],
    controls,
    description:
      "Test regular Scraps Chip query text, sizes, readonly content, dismiss behavior, theme, and share state.",
    preview,
    reset: () => {
      const next = defaultState();
      setDismissed(false);
      setState(next);
      return serializeChipWorkbench(next);
    },
    serialize: () => serializeChipWorkbench(state),
    title: "Chip",
  });
}
