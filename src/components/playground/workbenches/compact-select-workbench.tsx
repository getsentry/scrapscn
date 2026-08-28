"use client";

import { useState } from "react";

import type { WorkbenchProps } from "@/components/playground/workbench";
import {
  CompactSelect,
  type SelectOption,
  type SelectOptionOrSection,
} from "@/components/ui/compact-select";

type SelectValue = "api" | "frontend" | "mobile" | "relay";
type SelectSize = "xs" | "sm" | "md";

interface CompactSelectWorkbenchState {
  clearable: boolean;
  disableApi: boolean;
  multiple: boolean;
  search: boolean;
  sections: boolean;
  selected: SelectValue[];
  size: SelectSize;
}

const flatOptions = [
  { value: "frontend" as const, label: "Frontend", details: "Browser SDK and UI" },
  { value: "mobile" as const, label: "Mobile", details: "iOS and Android SDKs" },
  { value: "api" as const, label: "API", details: "Ingest and public APIs" },
  { value: "relay" as const, label: "Relay", details: "Event processing" },
];

function defaultState(): CompactSelectWorkbenchState {
  return {
    clearable: true,
    disableApi: true,
    multiple: false,
    search: true,
    sections: true,
    selected: ["frontend"],
    size: "md",
  };
}

function parseSize(value: string | null): SelectSize {
  return value === "xs" || value === "sm" ? value : "md";
}

function isSelectValue(value: string): value is SelectValue {
  return value === "api" || value === "frontend" || value === "mobile" || value === "relay";
}

function parseSelected(value: string | null): SelectValue[] {
  if (value === null) return ["frontend"];
  return value.split(",").filter(isSelectValue);
}

export function parseCompactSelectWorkbench(params: URLSearchParams): CompactSelectWorkbenchState {
  return {
    clearable: params.get("compactSelectClearable") !== "false",
    disableApi: params.get("compactSelectDisableApi") !== "false",
    multiple: params.get("compactSelectMultiple") === "true",
    search: params.get("compactSelectSearch") !== "false",
    sections: params.get("compactSelectSections") !== "false",
    selected: parseSelected(params.get("compactSelectSelected")),
    size: parseSize(params.get("compactSelectSize")),
  };
}

export function serializeCompactSelectWorkbench(state: CompactSelectWorkbenchState) {
  return new URLSearchParams({
    compactSelectClearable: String(state.clearable),
    compactSelectDisableApi: String(state.disableApi),
    compactSelectMultiple: String(state.multiple),
    compactSelectSearch: String(state.search),
    compactSelectSections: String(state.sections),
    compactSelectSelected: state.selected.join(","),
    compactSelectSize: state.size,
  });
}

const controlClassName =
  "h-11 rounded-md border border-input bg-background px-3 text-base sm:h-10 sm:text-sm";

export function CompactSelectWorkbench({ children, onSearchChange, sourceSearch }: WorkbenchProps) {
  const [state, setState] = useState(() =>
    parseCompactSelectWorkbench(new URLSearchParams(sourceSearch)),
  );

  function update(next: CompactSelectWorkbenchState) {
    setState(next);
    onSearchChange(serializeCompactSelectWorkbench(next));
  }

  const options: Array<SelectOptionOrSection<SelectValue>> = state.sections
    ? [
        { key: "clients", label: "Clients", options: flatOptions.slice(0, 2) },
        {
          key: "services",
          label: "Services",
          options: flatOptions.slice(2),
          showToggleAllButton: state.multiple,
        },
      ]
    : flatOptions;
  const commonProps = {
    clearable: state.clearable,
    isOptionDisabled: (option: { value: SelectValue }) =>
      state.disableApi && option.value === "api",
    menuTitle: state.multiple ? "Projects" : "Project",
    options,
    search: state.search ? { highlight: true, placeholder: "Search projects…" } : false,
    size: state.size,
  } as const;

  return children({
    breadcrumbs: ["Components", "CompactSelect"],
    controls: (
      <div className="grid gap-4">
        <div>
          <h2 className="text-sm font-semibold">CompactSelect setup</h2>
          <p className="text-xs text-muted-foreground">
            Test selection, search, sections, disabled options, and menu sizing.
          </p>
        </div>
        <label className="grid gap-1 text-sm">
          Size
          <select
            aria-label="CompactSelect size"
            className={controlClassName}
            onChange={(event) => update({ ...state, size: parseSize(event.target.value) })}
            value={state.size}
          >
            <option value="xs">Extra small</option>
            <option value="sm">Small</option>
            <option value="md">Medium</option>
          </select>
        </label>
        {(
          [
            ["multiple", "Multiple selection"],
            ["search", "Search"],
            ["sections", "Sections"],
            ["clearable", "Clearable"],
            ["disableApi", "Disable API option"],
          ] as const
        ).map(([field, label]) => (
          <label className="flex min-h-11 items-center gap-2 text-sm" key={field}>
            <input
              aria-label={label}
              checked={state[field]}
              className="size-5 touch-manipulation"
              onChange={(event) => {
                const next = { ...state, [field]: event.target.checked };
                if (field === "multiple" && !event.target.checked) {
                  next.selected = state.selected.slice(0, 1);
                }
                update(next);
              }}
              type="checkbox"
            />
            {label}
          </label>
        ))}
      </div>
    ),
    description: "Exercise the regular Scraps CompactSelect contract through the Tailwind clone.",
    preview: (
      <div
        className="grid min-h-80 content-center justify-items-start gap-5 rounded-md border border-border bg-background p-8 sm:p-12"
        data-testid="compact-select-preview"
      >
        <div className="grid gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {state.multiple ? "Assigned projects" : "Assigned project"}
          </span>
          {state.multiple ? (
            <CompactSelect
              {...commonProps}
              multiple
              onChange={(selected: Array<SelectOption<SelectValue>>) =>
                update({ ...state, selected: selected.map((option) => option.value) })
              }
              value={state.selected}
            />
          ) : (
            <CompactSelect
              {...commonProps}
              clearable={state.clearable ? true : false}
              onChange={(selected: SelectOption<SelectValue> | undefined) =>
                update({ ...state, selected: selected ? [selected.value] : [] })
              }
              value={state.selected[0]}
            />
          )}
        </div>
        <output className="text-sm text-muted-foreground" data-testid="compact-select-value">
          Selected: {state.selected.length ? state.selected.join(", ") : "none"}
        </output>
      </div>
    ),
    reset: () => {
      const next = defaultState();
      setState(next);
      return serializeCompactSelectWorkbench(next);
    },
    serialize: () => serializeCompactSelectWorkbench(state),
    title: "CompactSelect",
  });
}
