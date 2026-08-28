"use client";

import { useState } from "react";

import type { WorkbenchProps } from "@/components/playground/workbench";
import { slot } from "@/components/ui/slot";

const PlaygroundSlot = slot(Object.freeze(["toolbar", "footer"]));
type SlotName = "footer" | "toolbar";

interface SlotWorkbenchState {
  consumer: boolean;
  fallback: boolean;
  outlet: boolean;
  slotName: SlotName;
}

function defaultState(): SlotWorkbenchState {
  return { consumer: true, fallback: true, outlet: true, slotName: "toolbar" };
}

function parseSlotName(value: string | null): SlotName {
  return value === "footer" ? "footer" : "toolbar";
}

export function parseSlotWorkbench(params: URLSearchParams): SlotWorkbenchState {
  return {
    consumer: params.get("slotConsumer") !== "false",
    fallback: params.get("slotFallback") !== "false",
    outlet: params.get("slotOutlet") !== "false",
    slotName: parseSlotName(params.get("slotName")),
  };
}

export function serializeSlotWorkbench(state: SlotWorkbenchState) {
  return new URLSearchParams({
    slotConsumer: String(state.consumer),
    slotFallback: String(state.fallback),
    slotName: state.slotName,
    slotOutlet: String(state.outlet),
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
        checked={checked}
        className="size-5 touch-manipulation"
        type="checkbox"
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}

export function SlotWorkbench({ children, onSearchChange, sourceSearch }: WorkbenchProps) {
  const [state, setState] = useState(() => parseSlotWorkbench(new URLSearchParams(sourceSearch)));

  function update(next: SlotWorkbenchState) {
    setState(next);
    onSearchChange(serializeSlotWorkbench(next));
  }

  const controls = (
    <div className="grid gap-4">
      <div>
        <h2 className="text-sm font-semibold">Slot setup</h2>
        <p className="text-xs text-muted-foreground">Changes stay in the share URL.</p>
      </div>
      <label className="grid gap-2 text-sm font-medium">
        Outlet name
        <select
          aria-label="Slot name"
          className="h-11 rounded-md border border-input bg-background px-3 text-base sm:h-10 sm:text-sm"
          value={state.slotName}
          onChange={(event) => update({ ...state, slotName: parseSlotName(event.target.value) })}
        >
          <option value="toolbar">Toolbar</option>
          <option value="footer">Footer</option>
        </select>
      </label>
      <Toggle
        checked={state.outlet}
        label="Render outlet"
        onChange={(outlet) => update({ ...state, outlet })}
      />
      <Toggle
        checked={state.consumer}
        label="Connect consumer"
        onChange={(consumer) => update({ ...state, consumer })}
      />
      <Toggle
        checked={state.fallback}
        label="Render fallback"
        onChange={(fallback) => update({ ...state, fallback })}
      />
    </div>
  );

  const preview = (
    <PlaygroundSlot.Provider>
      <div
        className="grid max-w-4xl gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]"
        data-testid="slot-workbench-preview"
      >
        <section className="grid content-start gap-3 rounded-lg border border-dashed border-border bg-muted/30 p-5">
          <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Consumer source
          </span>
          <p className="text-sm text-muted-foreground">
            This content is declared here and portaled into the selected outlet.
          </p>
          {state.consumer ? (
            <PlaygroundSlot name={state.slotName}>
              <button
                className="min-h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
                data-testid="slot-workbench-consumer"
                type="button"
              >
                Create project
              </button>
            </PlaygroundSlot>
          ) : (
            <span className="text-sm">Consumer disconnected</span>
          )}
        </section>
        <section className="grid min-h-64 grid-rows-[auto_1fr_auto] overflow-hidden rounded-lg border border-border bg-background">
          <header className="flex min-h-16 items-center justify-between gap-3 border-b border-border px-5">
            <span className="font-semibold">Projects</span>
            {state.outlet && state.slotName === "toolbar" ? (
              <PlaygroundSlot.Outlet name="toolbar">
                {(props, hasConsumers) => (
                  <div {...props} data-testid="slot-workbench-outlet">
                    {state.fallback ? (
                      <PlaygroundSlot.Fallback>
                        <span className="text-sm text-muted-foreground">No toolbar action</span>
                      </PlaygroundSlot.Fallback>
                    ) : null}
                    <output className="sr-only">{hasConsumers ? "consumer" : "fallback"}</output>
                  </div>
                )}
              </PlaygroundSlot.Outlet>
            ) : null}
          </header>
          <div className="grid content-center justify-items-center gap-2 p-6 text-center">
            <span className="text-lg font-semibold">Destination layout</span>
            <span className="max-w-sm text-sm text-muted-foreground">
              Provider state connects the distant consumer and outlet without changing this layout.
            </span>
          </div>
          <footer className="flex min-h-16 items-center justify-end border-t border-border px-5">
            {state.outlet && state.slotName === "footer" ? (
              <PlaygroundSlot.Outlet name="footer">
                {(props) => (
                  <div {...props} data-testid="slot-workbench-outlet">
                    {state.fallback ? (
                      <PlaygroundSlot.Fallback>
                        <span className="text-sm text-muted-foreground">No footer action</span>
                      </PlaygroundSlot.Fallback>
                    ) : null}
                  </div>
                )}
              </PlaygroundSlot.Outlet>
            ) : null}
          </footer>
        </section>
      </div>
    </PlaygroundSlot.Provider>
  );

  return children({
    breadcrumbs: ["Components", "Slot"],
    controls,
    description: "Connect provider, outlet, fallback, and consumer roles across a composed layout.",
    preview,
    reset: () => {
      const next = defaultState();
      setState(next);
      return serializeSlotWorkbench(next);
    },
    serialize: () => serializeSlotWorkbench(state),
    title: "Slot",
  });
}
