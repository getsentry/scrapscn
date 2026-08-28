"use client";

import { useState } from "react";

import type { WorkbenchProps } from "@/components/playground/workbench";
import { Switch, type SwitchProps } from "@/components/ui/switch";

type SwitchWorkbenchState = {
  checked: boolean;
  disabled: boolean;
  size: NonNullable<SwitchProps["size"]>;
};

const initialState: SwitchWorkbenchState = {
  checked: false,
  disabled: false,
  size: "sm",
};

function parse(params: URLSearchParams): SwitchWorkbenchState {
  return {
    checked: params.get("switchChecked") === "true",
    disabled: params.get("switchDisabled") === "true",
    size: params.get("switchSize") === "lg" ? "lg" : "sm",
  };
}

function serialize(state: SwitchWorkbenchState) {
  return new URLSearchParams({
    switchChecked: String(state.checked),
    switchDisabled: String(state.disabled),
    switchSize: state.size,
  });
}

const fieldClassName = "h-10 rounded-md border border-input bg-background px-3 text-sm";

export function SwitchWorkbench({ children, onSearchChange, sourceSearch }: WorkbenchProps) {
  const [state, setState] = useState(() => parse(new URLSearchParams(sourceSearch)));
  const [submitted, setSubmitted] = useState("Not submitted");
  function update(next: SwitchWorkbenchState) {
    setState(next);
    onSearchChange(serialize(next));
  }
  return children({
    breadcrumbs: ["Components", "Switch"],
    controls: (
      <div className="grid gap-4">
        <div>
          <h2 className="text-sm font-semibold">Switch setup</h2>
          <p className="text-xs text-muted-foreground">Changes stay in the share URL.</p>
        </div>
        <label className="grid gap-1 text-sm">
          Size
          <select
            aria-label="Switch size"
            className={fieldClassName}
            value={state.size}
            onChange={(event) =>
              update({
                ...state,
                size: event.currentTarget.value === "lg" ? "lg" : "sm",
              })
            }
          >
            <option value="sm">Small</option>
            <option value="lg">Large</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            aria-label="Enable switch"
            checked={state.checked}
            type="checkbox"
            onChange={(event) => update({ ...state, checked: event.currentTarget.checked })}
          />
          Checked
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            aria-label="Disable switch"
            checked={state.disabled}
            type="checkbox"
            onChange={(event) => update({ ...state, disabled: event.currentTarget.checked })}
          />
          Disabled
        </label>
      </div>
    ),
    description:
      "Test the regular Scraps native switch, its form behavior, keyboard use, focus treatment, size, disabled state, theme, and share state.",
    preview: (
      <form
        data-testid="switch-preview"
        className="grid max-w-xl gap-4 rounded-md border border-border p-6"
        onReset={(event) => {
          event.preventDefault();
          setState(initialState);
          onSearchChange(serialize(initialState));
          setSubmitted("Reset");
        }}
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(
            new FormData(event.currentTarget).has("notifications")
              ? "Submitted: enabled"
              : "Submitted: disabled",
          );
        }}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <label className="text-sm font-medium" htmlFor="switch-notifications">
              Issue notifications
            </label>
            <p className="text-sm text-muted-foreground">Send an email when a new issue occurs.</p>
          </div>
          <Switch
            checked={state.checked}
            disabled={state.disabled}
            id="switch-notifications"
            name="notifications"
            onChange={(event) => update({ ...state, checked: event.currentTarget.checked })}
            size={state.size}
            value="enabled"
          />
        </div>
        <div className="flex gap-2">
          <button className="rounded-md border border-input px-3 py-2 text-sm" type="submit">
            Submit
          </button>
          <button className="rounded-md border border-input px-3 py-2 text-sm" type="reset">
            Reset
          </button>
        </div>
        <output data-testid="switch-submit-result" className="text-sm text-muted-foreground">
          {submitted}
        </output>
      </form>
    ),
    reset: () => {
      setState(initialState);
      setSubmitted("Not submitted");
      return serialize(initialState);
    },
    serialize: () => serialize(state),
    title: "Switch",
  });
}
