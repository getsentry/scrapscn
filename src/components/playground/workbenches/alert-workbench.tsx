"use client";

import { useState } from "react";

import type { WorkbenchProps } from "@/components/playground/workbench";
import { Alert, AlertLink } from "@/components/ui/alert";

const variants = ["muted", "info", "warning", "success", "danger"] as const;
type AlertVariant = (typeof variants)[number];
type AlertWorkbenchState = {
  expanded: boolean;
  kind: "alert" | "link";
  showIcon: boolean;
  system: boolean;
  trailing: boolean;
  variant: AlertVariant;
};

function defaultState(): AlertWorkbenchState {
  return {
    expanded: false,
    kind: "alert",
    showIcon: true,
    system: false,
    trailing: true,
    variant: "info",
  };
}

function parseVariant(value: string | null): AlertVariant {
  return variants.find((variant) => variant === value) ?? "info";
}

export function parseAlertWorkbench(params: URLSearchParams): AlertWorkbenchState {
  return {
    expanded: params.get("alertExpanded") === "true",
    kind: params.get("alertKind") === "link" ? "link" : "alert",
    showIcon: params.get("alertShowIcon") !== "false",
    system: params.get("alertSystem") === "true",
    trailing: params.get("alertTrailing") !== "false",
    variant: parseVariant(params.get("alertVariant")),
  };
}

export function serializeAlertWorkbench(state: AlertWorkbenchState) {
  return new URLSearchParams({
    alertExpanded: String(state.expanded),
    alertKind: state.kind,
    alertShowIcon: String(state.showIcon),
    alertSystem: String(state.system),
    alertTrailing: String(state.trailing),
    alertVariant: state.variant,
  });
}

const fieldClassName =
  "h-11 rounded-md border border-input bg-background px-3 text-base sm:h-10 sm:text-sm";

export function AlertWorkbench({ children, onSearchChange, sourceSearch }: WorkbenchProps) {
  const [state, setState] = useState(() => parseAlertWorkbench(new URLSearchParams(sourceSearch)));

  function update(next: AlertWorkbenchState) {
    setState(next);
    onSearchChange(serializeAlertWorkbench(next));
  }

  const controls = (
    <div className="grid gap-4">
      <div>
        <h2 className="text-sm font-semibold">Alert setup</h2>
        <p className="text-xs text-muted-foreground">Changes stay in the share URL.</p>
      </div>
      <label className="grid gap-1 text-sm">
        Variant
        <select
          aria-label="Alert variant"
          className={fieldClassName}
          value={state.variant}
          onChange={(event) => update({ ...state, variant: parseVariant(event.target.value) })}
        >
          {variants.map((variant) => (
            <option key={variant} value={variant}>
              {variant}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        Composition
        <select
          aria-label="Alert composition"
          className={fieldClassName}
          value={state.kind}
          onChange={(event) =>
            update({
              ...state,
              expanded: false,
              kind: event.target.value === "link" ? "link" : "alert",
            })
          }
        >
          <option value="alert">Alert</option>
          <option value="link">AlertLink</option>
        </select>
      </label>
      {(
        [
          ["Alert icon", "showIcon"],
          ["System banner", "system"],
          ["Trailing action", "trailing"],
        ] as const
      ).map(([label, key]) => (
        <label key={key} className="flex min-h-11 items-center gap-2 text-sm">
          <input
            aria-label={label}
            checked={state[key]}
            className="size-5"
            type="checkbox"
            onChange={(event) => update({ ...state, [key]: event.target.checked })}
          />
          {label}
        </label>
      ))}
      {state.kind === "alert" ? (
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            aria-label="Alert expanded"
            checked={state.expanded}
            className="size-5"
            type="checkbox"
            onChange={(event) => update({ ...state, expanded: event.target.checked })}
          />
          Expanded
        </label>
      ) : null}
    </div>
  );

  const trailingItems = state.trailing ? (
    <Alert.Button variant="transparent">Review</Alert.Button>
  ) : undefined;
  const preview = (
    <div className="w-full max-w-2xl" data-testid="alert-preview">
      {state.kind === "link" ? (
        <AlertLink
          href="https://docs.sentry.io"
          openInNewTab={false}
          system={state.system}
          trailingItems={trailingItems}
          variant={state.variant}
        >
          Open the Sentry documentation
        </AlertLink>
      ) : (
        <Alert
          key={`${state.expanded}:${state.variant}:${state.showIcon}:${state.system}`}
          defaultExpanded={state.expanded}
          expand={<div>Trace sampling changed from 10% to 25%.</div>}
          handleExpandChange={(expanded) => update({ ...state, expanded })}
          showIcon={state.showIcon}
          system={state.system}
          trailingItems={trailingItems}
          variant={state.variant}
        >
          Project configuration was updated.
        </Alert>
      )}
    </div>
  );

  return children({
    breadcrumbs: ["Components", "Alert"],
    controls,
    description:
      "Test the regular Scraps Alert variants, icon rail, system geometry, responsive actions, expansion, and AlertLink composition.",
    preview,
    reset: () => {
      const next = defaultState();
      setState(next);
      return serializeAlertWorkbench(next);
    },
    serialize: () => serializeAlertWorkbench(state),
    title: "Alert",
  });
}
