"use client";

import { useState } from "react";

import type { WorkbenchProps } from "@/components/playground/workbench";
import { RevealOnHover } from "@/components/ui/reveal-on-hover";

interface RevealOnHoverWorkbenchState {
  actions: boolean;
  custom: boolean;
  interactive: boolean;
  visible: boolean;
}

function defaultState(): RevealOnHoverWorkbenchState {
  return {
    actions: true,
    custom: false,
    interactive: true,
    visible: false,
  };
}

function parseRevealOnHoverWorkbench(params: URLSearchParams): RevealOnHoverWorkbenchState {
  return {
    actions: params.get("revealActions") !== "false",
    custom: params.get("revealCustom") === "true",
    interactive: params.get("revealInteractive") !== "false",
    visible: params.get("revealVisible") === "true",
  };
}

function serializeRevealOnHoverWorkbench(state: RevealOnHoverWorkbenchState) {
  return new URLSearchParams({
    revealActions: String(state.actions),
    revealCustom: String(state.custom),
    revealInteractive: String(state.interactive),
    revealVisible: String(state.visible),
  });
}

function Toggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 items-center gap-2 text-sm">
      <input
        aria-label={label}
        checked={checked}
        className="size-5 touch-manipulation"
        type="checkbox"
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}

export function RevealOnHoverWorkbench({ children, onSearchChange, sourceSearch }: WorkbenchProps) {
  const [state, setState] = useState(() =>
    parseRevealOnHoverWorkbench(new URLSearchParams(sourceSearch)),
  );
  const [clicks, setClicks] = useState(0);

  function update(next: RevealOnHoverWorkbenchState) {
    setState(next);
    onSearchChange(serializeRevealOnHoverWorkbench(next));
  }

  const controls = (
    <div className="grid gap-2">
      <div className="mb-2">
        <h2 className="text-sm font-semibold">Reveal On Hover setup</h2>
        <p className="text-xs text-muted-foreground">Changes stay in the share URL.</p>
      </div>
      <Toggle
        checked={state.visible}
        label="Visible"
        onChange={(visible) => update({ ...state, visible })}
      />
      <Toggle
        checked={state.custom}
        label="Custom root"
        onChange={(custom) => update({ ...state, custom })}
      />
      <Toggle
        checked={state.actions}
        label="Actions"
        onChange={(actions) => update({ ...state, actions })}
      />
      <Toggle
        checked={state.interactive}
        label="Interactive proof"
        onChange={(interactive) => update({ ...state, interactive })}
      />
    </div>
  );
  const action = state.actions ? (
    <RevealOnHover.Action visible={state.visible}>
      <button
        aria-label="Reveal action"
        className="min-h-11 touch-manipulation rounded-md border border-border px-3 text-sm"
        type="button"
        onClick={() => setClicks((value) => value + 1)}
      >
        Copy
      </button>
    </RevealOnHover.Action>
  ) : null;
  const preview = (
    <div className="grid gap-4 rounded-md border border-border p-4">
      {state.custom ? (
        <RevealOnHover>
          {({ className }) => (
            <article
              className={`${className} grid grid-cols-[1fr_auto] items-center gap-4`}
              data-testid="reveal-custom-root"
            >
              <span>Custom issue row</span>
              {action}
            </article>
          )}
        </RevealOnHover>
      ) : (
        <RevealOnHover data-testid="reveal-flex-root" justify="between" width="100%">
          <span>Issue row</span>
          {action}
        </RevealOnHover>
      )}
      {state.interactive ? <output data-testid="reveal-clicks">Clicks: {clicks}</output> : null}
    </div>
  );

  return children({
    breadcrumbs: ["Components", "Reveal On Hover"],
    controls,
    description:
      "Test the exact regular Scraps hover, keyboard focus, touch, visible override, and custom-root behavior.",
    preview,
    reset: () => {
      const next = defaultState();
      setState(next);
      setClicks(0);
      return serializeRevealOnHoverWorkbench(next);
    },
    serialize: () => serializeRevealOnHoverWorkbench(state),
    title: "Reveal On Hover",
  });
}
