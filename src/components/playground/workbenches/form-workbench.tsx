"use client";

import { useState } from "react";

import type { WorkbenchProps } from "@/components/playground/workbench";
import { defaultFormOptions, FieldGroup, useScrapsForm } from "@/components/ui/form";

type FormWorkbenchState = {
  disabled: boolean;
  label: string;
  layout: "row" | "stack";
  value: string;
};

function parse(params: URLSearchParams): FormWorkbenchState {
  return {
    disabled: params.get("formDisabled") === "true",
    label: params.get("formLabel") ?? "Project name",
    layout: params.get("formLayout") === "stack" ? "stack" : "row",
    value: params.get("formValue") ?? "Frontend",
  };
}

function serialize(state: FormWorkbenchState) {
  return new URLSearchParams({
    formDisabled: String(state.disabled),
    formLabel: state.label,
    formLayout: state.layout,
    formValue: state.value,
  });
}

export function FormWorkbench({ children, onSearchChange, sourceSearch }: WorkbenchProps) {
  const [state, setState] = useState(() => parse(new URLSearchParams(sourceSearch)));
  const form = useScrapsForm({
    ...defaultFormOptions,
    defaultValues: { name: state.value },
    formId: "scrapscn-form-preview",
    onSubmit: ({ value }) => setState((current) => ({ ...current, value: value.name })),
  });

  function update(next: FormWorkbenchState) {
    setState(next);
    onSearchChange(serialize(next));
  }

  const Layout = state.layout === "stack" ? "Stack" : "Row";
  return children({
    breadcrumbs: ["Components", "Form"],
    controls: (
      <div className="grid gap-4">
        <label className="grid gap-1 text-sm">
          Label
          <input
            aria-label="Form field label"
            className="h-10 rounded-md border border-input bg-background px-3"
            value={state.label}
            onChange={(event) => update({ ...state, label: event.target.value })}
          />
        </label>
        <label className="grid gap-1 text-sm">
          Layout
          <select
            aria-label="Form layout"
            className="h-10 rounded-md border border-input bg-background px-3"
            value={state.layout}
            onChange={(event) =>
              update({ ...state, layout: event.target.value as FormWorkbenchState["layout"] })
            }
          >
            <option value="row">Row</option>
            <option value="stack">Stack</option>
          </select>
        </label>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            aria-label="Form disabled"
            checked={state.disabled}
            className="size-5"
            type="checkbox"
            onChange={(event) => update({ ...state, disabled: event.target.checked })}
          />
          Disabled
        </label>
      </div>
    ),
    description:
      "Exercise the bound TanStack Form field, layout, validation, reset, and submit components provided by regular Scraps Form.",
    preview: (
      <div className="w-full max-w-2xl" data-export="Form" data-testid="form-preview">
        <form.AppForm form={form}>
          <FieldGroup title="Project settings">
            <form.AppField name="name">
              {(field) => {
                const content = (
                  <field.Input
                    disabled={state.disabled}
                    onChange={field.handleChange}
                    value={field.state.value}
                  />
                );
                return Layout === "Stack" ? (
                  <field.Layout.Stack
                    hintText="Used throughout Sentry."
                    label={state.label}
                    required
                  >
                    {content}
                  </field.Layout.Stack>
                ) : (
                  <field.Layout.Row hintText="Used throughout Sentry." label={state.label} required>
                    {content}
                  </field.Layout.Row>
                );
              }}
            </form.AppField>
          </FieldGroup>
          <div className="mt-4 flex justify-end gap-2">
            <form.ResetButton>Reset</form.ResetButton>
            <form.SubmitButton>Save</form.SubmitButton>
          </div>
        </form.AppForm>
      </div>
    ),
    reset: () => {
      const next = parse(new URLSearchParams());
      setState(next);
      form.reset({ name: next.value });
      return serialize(next);
    },
    serialize: () => serialize(state),
    title: "Form",
  });
}
