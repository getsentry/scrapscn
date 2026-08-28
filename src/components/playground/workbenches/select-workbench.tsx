"use client";

import { useMemo, useState } from "react";

import type { WorkbenchProps } from "@/components/playground/workbench";
import { Select, type SelectValue } from "@/components/ui/select";

const sizes = ["xs", "sm", "md"] as const;
type Size = (typeof sizes)[number];

type State = {
  async: boolean;
  clearable: boolean;
  created: string[];
  creatable: boolean;
  multiple: boolean;
  searchable: boolean;
  selected: string[];
  size: Size;
};

const projectOptions: Array<SelectValue<string>> = [
  { label: "Frontend", textValue: "browser web", value: "frontend" },
  { label: "Mobile", textValue: "ios android", value: "mobile" },
  { label: "API", disabled: true, value: "api" },
  { label: "Relay", value: "relay" },
];

function defaults(): State {
  return {
    async: false,
    clearable: true,
    created: [],
    creatable: false,
    multiple: false,
    searchable: true,
    selected: ["frontend"],
    size: "md",
  };
}

function isProject(value: string) {
  return projectOptions.some((option) => option.value === value);
}

function parseCreated(value: string | null) {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function parseSelected(value: string | null, created: string[]) {
  if (!value) return ["frontend"];
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (item): item is string =>
          typeof item === "string" && (isProject(item) || created.includes(item)),
      );
    }
  } catch {
    return value.split(",").filter((item) => isProject(item) || created.includes(item));
  }
  return [];
}

function parseState(params: URLSearchParams): State {
  const size = params.get("selectSize");
  const created = parseCreated(params.get("selectCreated"));
  return {
    async: params.get("selectAsync") === "true",
    clearable: params.get("selectClearable") !== "false",
    created,
    creatable: params.get("selectCreatable") === "true",
    multiple: params.get("selectMultiple") === "true",
    searchable: params.get("selectSearchable") !== "false",
    selected: parseSelected(params.get("selectSelected"), created),
    size: size === "xs" || size === "sm" ? size : "md",
  };
}

function serialize(state: State) {
  return new URLSearchParams({
    selectAsync: String(state.async),
    selectClearable: String(state.clearable),
    selectCreated: JSON.stringify(state.created),
    selectCreatable: String(state.creatable),
    selectMultiple: String(state.multiple),
    selectSearchable: String(state.searchable),
    selectSelected: JSON.stringify(state.selected),
    selectSize: state.size,
  });
}

const fieldClassName =
  "h-11 rounded-md border border-input bg-background px-3 text-base sm:h-10 sm:text-sm";

export function SelectWorkbench({ children, onSearchChange, sourceSearch }: WorkbenchProps) {
  const [state, setState] = useState(() => parseState(new URLSearchParams(sourceSearch)));
  const allOptions = useMemo(
    () => [...projectOptions, ...state.created.map((value) => ({ label: value, value }))],
    [state.created],
  );
  const selectedOptions = useMemo(
    () => allOptions.filter((option) => state.selected.includes(option.value)),
    [allOptions, state.selected],
  );
  function update(next: State) {
    setState(next);
    onSearchChange(serialize(next));
  }
  function select(next: ReadonlyArray<SelectValue<string>>) {
    const created = [
      ...new Set([
        ...state.created,
        ...next.filter((option) => !isProject(option.value)).map((option) => option.value),
      ]),
    ];
    update({ ...state, created, selected: next.map((option) => option.value) });
  }
  const common = {
    "aria-label": "Project selector",
    async: state.async,
    creatable: state.creatable,
    defaultOptions: state.async ? allOptions : undefined,
    inFieldLabel: "Project",
    loadOptions: async (query: string) =>
      allOptions.filter((option) =>
        option.label?.toString().toLocaleLowerCase().includes(query.toLocaleLowerCase()),
      ),
    name: "project",
    options: state.async ? undefined : [{ label: "Projects", options: allOptions }],
    searchable: state.searchable,
    size: state.size,
  } as const;

  return children({
    breadcrumbs: ["Components", "Select"],
    controls: (
      <div className="grid gap-4">
        <div>
          <h2 className="text-sm font-semibold">Select setup</h2>
          <p className="text-xs text-muted-foreground">
            Test regular, async, creatable, grouped, searchable, and multiple modes.
          </p>
        </div>
        <label className="grid gap-1 text-sm">
          Size
          <select
            aria-label="Select size"
            className={fieldClassName}
            onChange={(event) => update({ ...state, size: event.target.value as Size })}
            value={state.size}
          >
            {sizes.map((size) => (
              <option key={size}>{size}</option>
            ))}
          </select>
        </label>
        {(["multiple", "searchable", "clearable", "async", "creatable"] as const).map((field) => (
          <label className="flex min-h-11 items-center gap-2 text-sm" key={field}>
            <input
              aria-label={`Select ${field}`}
              checked={state[field]}
              className="size-5"
              onChange={(event) => update({ ...state, [field]: event.target.checked })}
              type="checkbox"
            />
            {field}
          </label>
        ))}
      </div>
    ),
    description:
      "Exercise the react-select v4-compatible regular Scraps Select state, form, keyboard, async, creatable, and slot behavior.",
    preview: (
      <div
        className="grid min-h-72 place-items-center rounded-md border border-border p-8"
        data-testid="select-preview"
      >
        <div className="w-full max-w-sm" data-export="Select">
          {state.multiple ? (
            <Select
              {...common}
              clearable={state.clearable}
              multiple
              onChange={select}
              value={selectedOptions}
            />
          ) : state.clearable ? (
            <Select
              {...common}
              clearable
              onChange={(next) => select(next ? [next] : [])}
              value={selectedOptions[0] ?? null}
            />
          ) : (
            <Select
              {...common}
              onChange={(next) => select([next])}
              value={selectedOptions[0] ?? null}
            />
          )}
        </div>
      </div>
    ),
    reset: () => {
      const next = defaults();
      setState(next);
      return serialize(next);
    },
    serialize: () => serialize(state),
    title: "Select",
  });
}
