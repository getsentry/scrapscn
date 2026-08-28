"use client";

import { useState } from "react";

import type { WorkbenchProps } from "@/components/playground/workbench";
import { Hotkey, Kbd, useHotkeys } from "@/components/ui/hotkey";

const values = ["mod+k", "mod+/", "mod+shift+1", "escape"] as const;
type HotkeyValue = (typeof values)[number];
type HotkeyVariant = "debossed" | "embossed";

interface HotkeyWorkbenchState {
  enabled: boolean;
  includeInputs: boolean;
  skipPreventDefault: boolean;
  value: HotkeyValue;
  variant: HotkeyVariant;
}

function parseValue(value: string | null): HotkeyValue {
  return values.find((candidate) => candidate === value) ?? "mod+k";
}

function parseVariant(value: string | null): HotkeyVariant {
  return value === "debossed" ? "debossed" : "embossed";
}

function defaultState(): HotkeyWorkbenchState {
  return {
    enabled: true,
    includeInputs: false,
    skipPreventDefault: false,
    value: "mod+k",
    variant: "embossed",
  };
}

function parseHotkeyWorkbench(params: URLSearchParams): HotkeyWorkbenchState {
  return {
    enabled: params.get("hotkeyEnabled") !== "false",
    includeInputs: params.get("hotkeyIncludeInputs") === "true",
    skipPreventDefault: params.get("hotkeySkipPreventDefault") === "true",
    value: parseValue(params.get("hotkeyValue")),
    variant: parseVariant(params.get("hotkeyVariant")),
  };
}

function serializeHotkeyWorkbench(state: HotkeyWorkbenchState) {
  return new URLSearchParams({
    hotkeyEnabled: String(state.enabled),
    hotkeyIncludeInputs: String(state.includeInputs),
    hotkeySkipPreventDefault: String(state.skipPreventDefault),
    hotkeyValue: state.value,
    hotkeyVariant: state.variant,
  });
}

const selectClassName =
  "h-11 rounded-md border border-input bg-background px-3 text-base sm:h-10 sm:text-sm";

export function HotkeyWorkbench({ children, onSearchChange, sourceSearch }: WorkbenchProps) {
  const [state, setState] = useState(() => parseHotkeyWorkbench(new URLSearchParams(sourceSearch)));
  const [matches, setMatches] = useState(0);
  const [lastPrevented, setLastPrevented] = useState<boolean | null>(null);

  useHotkeys([
    {
      callback: (event) => {
        setMatches((count) => count + 1);
        setLastPrevented(event.defaultPrevented);
      },
      enabled: state.enabled,
      includeInputs: state.includeInputs,
      match: state.value,
      skipPreventDefault: state.skipPreventDefault,
    },
  ]);

  function update(next: HotkeyWorkbenchState) {
    setState(next);
    onSearchChange(serializeHotkeyWorkbench(next));
  }

  const controls = (
    <div className="grid gap-4">
      <div>
        <h2 className="text-sm font-semibold">Hotkey setup</h2>
        <p className="text-xs text-muted-foreground">Changes stay in the share URL.</p>
      </div>
      <label className="grid gap-1 text-sm">
        Shortcut
        <select
          aria-label="Hotkey shortcut"
          className={selectClassName}
          value={state.value}
          onChange={(event) => update({ ...state, value: parseValue(event.target.value) })}
        >
          {values.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        Variant
        <select
          aria-label="Hotkey variant"
          className={selectClassName}
          value={state.variant}
          onChange={(event) => update({ ...state, variant: parseVariant(event.target.value) })}
        >
          <option value="embossed">Embossed</option>
          <option value="debossed">Debossed</option>
        </select>
      </label>
      {(
        [
          ["Hotkey enabled", "enabled"],
          ["Include text inputs", "includeInputs"],
          ["Skip prevent default", "skipPreventDefault"],
        ] as const
      ).map(([label, key]) => (
        <label className="flex min-h-11 items-center gap-2 text-sm" key={key}>
          <input
            aria-label={label}
            checked={state[key]}
            className="size-5 touch-manipulation"
            type="checkbox"
            onChange={(event) => update({ ...state, [key]: event.target.checked })}
          />
          {label}
        </label>
      ))}
    </div>
  );

  const preview = (
    <div className="grid min-h-52 gap-5 rounded-md border border-border bg-background p-6">
      <div className="flex flex-wrap items-center gap-3">
        <span>Registered shortcut</span>
        <span data-testid="hotkey-display">
          <Hotkey value={state.value} variant={state.variant} />
        </span>
        <span>Standalone</span>
        <Kbd variant={state.variant}>Esc</Kbd>
      </div>
      <label className="grid max-w-sm gap-1 text-sm">
        Text input target
        <input
          aria-label="Hotkey target input"
          className="h-11 rounded-md border border-input bg-background px-3"
          placeholder="Focus, then press the shortcut"
        />
      </label>
      <div className="flex flex-wrap gap-4 text-sm">
        <output data-testid="hotkey-match-count">Matches: {matches}</output>
        <output data-testid="hotkey-prevented-state">
          Prevented: {lastPrevented === null ? "not tested" : String(lastPrevented)}
        </output>
      </div>
    </div>
  );

  return children({
    breadcrumbs: ["Components", "Hotkey"],
    controls,
    description:
      "Test the exact regular Scraps key caps, platform glyphs, listener matching, input rules, and default prevention.",
    preview,
    reset: () => {
      const next = defaultState();
      setState(next);
      setMatches(0);
      setLastPrevented(null);
      return serializeHotkeyWorkbench(next);
    },
    serialize: () => serializeHotkeyWorkbench(state),
    title: "Hotkey",
  });
}
