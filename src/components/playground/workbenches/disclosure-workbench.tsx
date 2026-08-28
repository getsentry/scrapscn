"use client";

import { useState } from "react";

import type { WorkbenchProps } from "@/components/playground/workbench";
import { Disclosure } from "@/components/ui/disclosure";

const sizes = ["xs", "sm", "md"] as const;
type DisclosureSize = (typeof sizes)[number];
type DisclosureVariant = "default" | "outline";
type DisclosureWorkbenchState = {
  expanded: boolean;
  leading: boolean;
  size: DisclosureSize;
  trailing: boolean;
  variant: DisclosureVariant;
};

function parseSize(value: string | null): DisclosureSize {
  return sizes.find((size) => size === value) ?? "md";
}
function defaults(): DisclosureWorkbenchState {
  return {
    expanded: true,
    leading: false,
    size: "md",
    trailing: false,
    variant: "default",
  };
}
export function parseDisclosureWorkbench(params: URLSearchParams): DisclosureWorkbenchState {
  return {
    expanded: params.get("disclosureExpanded") !== "false",
    leading: params.get("disclosureLeading") === "true",
    size: parseSize(params.get("disclosureSize")),
    trailing: params.get("disclosureTrailing") === "true",
    variant: params.get("disclosureVariant") === "outline" ? "outline" : "default",
  };
}
export function serializeDisclosureWorkbench(state: DisclosureWorkbenchState) {
  return new URLSearchParams({
    disclosureExpanded: String(state.expanded),
    disclosureLeading: String(state.leading),
    disclosureSize: state.size,
    disclosureTrailing: String(state.trailing),
    disclosureVariant: state.variant,
  });
}

const fieldClassName =
  "h-11 rounded-md border border-input bg-background px-3 text-base sm:h-10 sm:text-sm";

export function DisclosureWorkbench({ children, onSearchChange, sourceSearch }: WorkbenchProps) {
  const [state, setState] = useState(() =>
    parseDisclosureWorkbench(new URLSearchParams(sourceSearch)),
  );
  function update(next: DisclosureWorkbenchState) {
    setState(next);
    onSearchChange(serializeDisclosureWorkbench(next));
  }
  const controls = (
    <div className="grid gap-4">
      <div>
        <h2 className="text-sm font-semibold">Disclosure setup</h2>
        <p className="text-xs text-muted-foreground">Changes stay in the share URL.</p>
      </div>
      <label className="grid gap-1 text-sm">
        Size
        <select
          aria-label="Disclosure size"
          className={fieldClassName}
          onChange={(event) => update({ ...state, size: parseSize(event.target.value) })}
          value={state.size}
        >
          {sizes.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        Content treatment
        <select
          aria-label="Disclosure variant"
          className={fieldClassName}
          onChange={(event) =>
            update({
              ...state,
              variant: event.target.value === "outline" ? "outline" : "default",
            })
          }
          value={state.variant}
        >
          <option value="default">Default</option>
          <option value="outline">Outline</option>
        </select>
      </label>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input
          aria-label="Disclosure expanded"
          checked={state.expanded}
          className="size-5"
          type="checkbox"
          onChange={(event) => update({ ...state, expanded: event.target.checked })}
        />
        Expanded
      </label>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input
          aria-label="Disclosure leading items"
          checked={state.leading}
          className="size-5"
          type="checkbox"
          onChange={(event) => update({ ...state, leading: event.target.checked })}
        />
        Leading item
      </label>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input
          aria-label="Disclosure trailing items"
          checked={state.trailing}
          className="size-5"
          type="checkbox"
          onChange={(event) => update({ ...state, trailing: event.target.checked })}
        />
        Trailing item
      </label>
    </div>
  );
  const preview = (
    <div
      className="flex min-h-36 w-full max-w-xl items-center rounded-md border border-border p-6"
      data-testid="disclosure-preview"
    >
      <Disclosure
        expanded={state.expanded}
        size={state.size}
        variant={state.variant}
        onExpandedChange={(expanded) => update({ ...state, expanded })}
        width="100%"
      >
        <Disclosure.Title
          leadingItems={state.leading ? <span aria-hidden="true">●</span> : undefined}
          trailingItems={
            state.trailing ? (
              <span className="text-xs text-muted-foreground">Trailing</span>
            ) : undefined
          }
        >
          Project details
        </Disclosure.Title>
        <Disclosure.Content>
          The content panel uses the same controlled disclosure state that is stored in the URL.
        </Disclosure.Content>
      </Disclosure>
    </div>
  );
  return children({
    breadcrumbs: ["Components", "Disclosure"],
    controls,
    description:
      "Test regular Scraps Disclosure sizes, panel treatment, slots, keyboard behavior, theme, and share state.",
    preview,
    reset: () => {
      const next = defaults();
      setState(next);
      return serializeDisclosureWorkbench(next);
    },
    serialize: () => serializeDisclosureWorkbench(state),
    title: "Disclosure",
  });
}
