"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import type { WorkbenchProps } from "@/components/playground/workbench";
import { Button, ButtonBar, LinkButton } from "@/components/ui/button";
import { PlaygroundLinkBehaviorProvider } from "@/components/ui/link-playground-adapter";

type ButtonKind = "button" | "internal" | "external";
type ButtonSize = "zero" | "xs" | "sm" | "md";
type ButtonVariant = "secondary" | "primary" | "danger" | "warning" | "transparent" | "link";

interface ButtonWorkbenchState {
  busy: boolean;
  disabled: boolean;
  icon: boolean;
  kind: ButtonKind;
  label: string;
  size: ButtonSize;
  variant: ButtonVariant;
}

function defaults(): ButtonWorkbenchState {
  return {
    busy: false,
    disabled: false,
    icon: true,
    kind: "button",
    label: "Save changes",
    size: "md",
    variant: "secondary",
  };
}

function parseKind(value: string | null): ButtonKind {
  return value === "internal" || value === "external" ? value : "button";
}

function parseSize(value: string | null): ButtonSize {
  return value === "zero" || value === "xs" || value === "sm" ? value : "md";
}

function parseVariant(value: string | null): ButtonVariant {
  return value === "primary" ||
    value === "danger" ||
    value === "warning" ||
    value === "transparent" ||
    value === "link"
    ? value
    : "secondary";
}

function parseState(params: URLSearchParams): ButtonWorkbenchState {
  return {
    busy: params.get("buttonBusy") === "true",
    disabled: params.get("buttonDisabled") === "true",
    icon: params.get("buttonIcon") !== "false",
    kind: parseKind(params.get("buttonKind")),
    label: params.get("buttonLabel") ?? "Save changes",
    size: parseSize(params.get("buttonSize")),
    variant: parseVariant(params.get("buttonVariant")),
  };
}

function serialize(state: ButtonWorkbenchState) {
  return new URLSearchParams({
    buttonBusy: String(state.busy),
    buttonDisabled: String(state.disabled),
    buttonIcon: String(state.icon),
    buttonKind: state.kind,
    buttonLabel: state.label,
    buttonSize: state.size,
    buttonVariant: state.variant,
  });
}

const controlClassName =
  "h-11 rounded-md border border-input bg-background px-3 text-base sm:h-10 sm:text-sm";
const booleanControls = ["icon", "disabled", "busy"] satisfies ReadonlyArray<
  keyof Pick<ButtonWorkbenchState, "busy" | "disabled" | "icon">
>;

export function ButtonWorkbench({ children, onSearchChange, sourceSearch }: WorkbenchProps) {
  const [state, setState] = useState(() => parseState(new URLSearchParams(sourceSearch)));

  function update(next: ButtonWorkbenchState) {
    setState(next);
    onSearchChange(serialize(next));
  }

  const icon = state.icon ? <Plus aria-hidden="true" /> : undefined;
  const selectedButton =
    state.kind === "internal" ? (
      <LinkButton
        busy={state.busy}
        disabled={state.disabled}
        icon={icon}
        size={state.size}
        to="/issues/"
        variant={state.variant}
      >
        {state.label}
      </LinkButton>
    ) : state.kind === "external" ? (
      <LinkButton
        busy={state.busy}
        disabled={state.disabled}
        external
        href="https://docs.sentry.io"
        icon={icon}
        size={state.size}
        variant={state.variant}
      >
        {state.label}
      </LinkButton>
    ) : (
      <Button
        busy={state.busy}
        disabled={state.disabled}
        icon={icon}
        size={state.size}
        variant={state.variant}
      >
        {state.label}
      </Button>
    );

  return children({
    breadcrumbs: ["Components", "Button"],
    controls: (
      <div className="grid gap-4">
        <div>
          <h2 className="text-sm font-semibold">Button setup</h2>
          <p className="text-xs text-muted-foreground">
            The URL stores every public presentation control.
          </p>
        </div>
        <label className="grid gap-1 text-sm">
          Kind
          <select
            aria-label="Button kind"
            className={controlClassName}
            onChange={(event) => update({ ...state, kind: parseKind(event.target.value) })}
            value={state.kind}
          >
            <option value="button">Button</option>
            <option value="internal">Internal LinkButton</option>
            <option value="external">External LinkButton</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Variant
          <select
            aria-label="Button variant"
            className={controlClassName}
            onChange={(event) => update({ ...state, variant: parseVariant(event.target.value) })}
            value={state.variant}
          >
            <option value="secondary">Secondary</option>
            <option value="primary">Primary</option>
            <option value="danger">Danger</option>
            <option value="warning">Warning</option>
            <option value="transparent">Transparent</option>
            <option value="link">Link</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Size
          <select
            aria-label="Button size"
            className={controlClassName}
            onChange={(event) => update({ ...state, size: parseSize(event.target.value) })}
            value={state.size}
          >
            <option value="zero">Zero</option>
            <option value="xs">Extra small</option>
            <option value="sm">Small</option>
            <option value="md">Medium</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Label
          <input
            aria-label="Button label"
            className={controlClassName}
            onChange={(event) => update({ ...state, label: event.target.value })}
            value={state.label}
          />
        </label>
        {booleanControls.map((field) => (
          <label className="flex min-h-11 items-center gap-2 text-sm" key={field}>
            <input
              aria-label={`${field[0]?.toUpperCase()}${field.slice(1)} button`}
              checked={state[field]}
              className="size-5 touch-manipulation"
              onChange={(event) => update({ ...state, [field]: event.target.checked })}
              type="checkbox"
            />
            {field[0]?.toUpperCase()}
            {field.slice(1)}
          </label>
        ))}
      </div>
    ),
    description:
      "Compare the regular Scraps Button, LinkButton, and ButtonBar contracts with the Tailwind clone.",
    preview: (
      <PlaygroundLinkBehaviorProvider>
        <div
          className="grid min-h-72 content-center justify-items-start gap-8 rounded-md border border-border bg-background p-8 sm:p-12"
          data-testid="button-preview"
        >
          <div className="grid gap-2">
            <span className="text-xs text-muted-foreground">Selected configuration</span>
            {selectedButton}
          </div>
          <div className="grid gap-2">
            <span className="text-xs text-muted-foreground">ButtonBar composition</span>
            <ButtonBar size="sm">
              <Button>Previous</Button>
              <Button className="active" variant="primary">
                Save
              </Button>
              <Button>Next</Button>
            </ButtonBar>
          </div>
        </div>
      </PlaygroundLinkBehaviorProvider>
    ),
    reset: () => {
      const next = defaults();
      setState(next);
      return serialize(next);
    },
    serialize: () => serialize(state),
    title: "Button",
  });
}
