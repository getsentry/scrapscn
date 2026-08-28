"use client";

import { useState } from "react";

import type { WorkbenchProps } from "@/components/playground/workbench";
import { TextArea } from "@/components/ui/textarea";

type TextAreaSize = "xs" | "sm" | "md";

interface TextAreaWorkbenchState {
  autosize: boolean;
  disabled: boolean;
  label: string;
  maxRows: number;
  monospace: boolean;
  rows: number;
  size: TextAreaSize;
  value: string;
}

function defaults(): TextAreaWorkbenchState {
  return {
    autosize: true,
    disabled: false,
    label: "Issue description",
    maxRows: 6,
    monospace: false,
    rows: 3,
    size: "md",
    value: "The checkout request fails after the customer confirms payment.",
  };
}

function boundedNumber(value: string | null, fallback: number) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 && number <= 12 ? number : fallback;
}

function parseSize(value: string | null): TextAreaSize {
  return value === "xs" || value === "sm" ? value : "md";
}

export function parseTextAreaWorkbench(params: URLSearchParams): TextAreaWorkbenchState {
  const initial = defaults();
  return {
    autosize: params.get("textAreaAutosize") !== "false",
    disabled: params.get("textAreaDisabled") === "true",
    label: params.get("textAreaLabel") ?? initial.label,
    maxRows: boundedNumber(params.get("textAreaMaxRows"), initial.maxRows),
    monospace: params.get("textAreaMonospace") === "true",
    rows: boundedNumber(params.get("textAreaRows"), initial.rows),
    size: parseSize(params.get("textAreaSize")),
    value: params.get("textAreaValue") ?? initial.value,
  };
}

export function serializeTextAreaWorkbench(state: TextAreaWorkbenchState) {
  return new URLSearchParams({
    textAreaAutosize: String(state.autosize),
    textAreaDisabled: String(state.disabled),
    textAreaLabel: state.label,
    textAreaMaxRows: String(state.maxRows),
    textAreaMonospace: String(state.monospace),
    textAreaRows: String(state.rows),
    textAreaSize: state.size,
    textAreaValue: state.value,
  });
}

const controlClassName =
  "h-11 rounded-md border border-input bg-background px-3 text-base sm:h-10 sm:text-sm";

export function TextAreaWorkbench({ children, onSearchChange, sourceSearch }: WorkbenchProps) {
  const [state, setState] = useState(() =>
    parseTextAreaWorkbench(new URLSearchParams(sourceSearch)),
  );

  function update(next: TextAreaWorkbenchState) {
    setState(next);
    onSearchChange(serializeTextAreaWorkbench(next));
  }

  return children({
    breadcrumbs: ["Components", "TextArea"],
    controls: (
      <div className="grid gap-4">
        <div>
          <h2 className="text-sm font-semibold">TextArea setup</h2>
          <p className="text-xs text-muted-foreground">The URL stores every review control.</p>
        </div>
        <label className="grid gap-1 text-sm">
          Label
          <input
            aria-label="TextArea label"
            className={controlClassName}
            value={state.label}
            onChange={(event) => update({ ...state, label: event.target.value })}
          />
        </label>
        <label className="grid gap-1 text-sm">
          Value
          <textarea
            aria-label="TextArea value"
            className="min-h-24 rounded-md border border-input bg-background p-3 text-sm"
            value={state.value}
            onChange={(event) => update({ ...state, value: event.target.value })}
          />
        </label>
        <label className="grid gap-1 text-sm">
          Size
          <select
            aria-label="TextArea size"
            className={controlClassName}
            value={state.size}
            onChange={(event) => update({ ...state, size: parseSize(event.target.value) })}
          >
            <option value="xs">Extra small</option>
            <option value="sm">Small</option>
            <option value="md">Medium</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Rows
          <input
            aria-label="TextArea rows"
            className={controlClassName}
            max={12}
            min={1}
            type="number"
            value={state.rows}
            onChange={(event) =>
              update({ ...state, rows: boundedNumber(event.target.value, state.rows) })
            }
          />
        </label>
        <label className="grid gap-1 text-sm">
          Maximum rows
          <input
            aria-label="TextArea maximum rows"
            className={controlClassName}
            disabled={!state.autosize}
            max={12}
            min={1}
            type="number"
            value={state.maxRows}
            onChange={(event) =>
              update({ ...state, maxRows: boundedNumber(event.target.value, state.maxRows) })
            }
          />
        </label>
        {(["autosize", "monospace", "disabled"] as const).map((field) => (
          <label className="flex min-h-11 items-center gap-2 text-sm" key={field}>
            <input
              aria-label={`${field} TextArea`}
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
      "Test the regular Scraps TextArea size, autosize, font, disabled state, theme, and native editing behavior.",
    preview: (
      <div
        className="grid min-h-72 w-full max-w-2xl content-center gap-2 rounded-md border border-border bg-background p-8 sm:p-12"
        data-testid="textarea-preview"
      >
        <label className="text-sm font-semibold" htmlFor="textarea-preview-control">
          {state.label || "Untitled field"}
        </label>
        <TextArea
          autosize={state.autosize}
          disabled={state.disabled}
          id="textarea-preview-control"
          maxRows={state.maxRows}
          monospace={state.monospace}
          rows={state.rows}
          size={state.size}
          value={state.value}
          onChange={(event) => update({ ...state, value: event.target.value })}
        />
        <span className="text-xs text-muted-foreground">{state.value.length} characters</span>
      </div>
    ),
    reset: () => {
      const next = defaults();
      setState(next);
      return serializeTextAreaWorkbench(next);
    },
    serialize: () => serializeTextAreaWorkbench(state),
    title: "TextArea",
  });
}
