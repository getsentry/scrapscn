"use client";

import { useState } from "react";

import type { WorkbenchProps } from "@/components/playground/workbench";
import { TabList, TabPanels, Tabs } from "@/components/ui/tabs";

const orientations = ["horizontal", "vertical"] as const;
const sizes = ["xs", "sm", "md"] as const;
const variants = ["flat", "floating"] as const;
const values = ["details", "activity", "feedback", "attachments"] as const;

type State = {
  disableOverflow: boolean;
  disabled: boolean;
  orientation: (typeof orientations)[number];
  size: (typeof sizes)[number];
  value: (typeof values)[number];
  variant: (typeof variants)[number];
};

function defaultState(): State {
  return {
    disableOverflow: false,
    disabled: false,
    orientation: "horizontal",
    size: "md",
    value: "details",
    variant: "flat",
  };
}

function oneOf<const Value extends string>(
  candidates: readonly Value[],
  value: string | null,
  fallback: Value,
) {
  return candidates.find((candidate) => candidate === value) ?? fallback;
}

export function parseTabsWorkbench(params: URLSearchParams): State {
  return {
    disableOverflow: params.get("tabsDisableOverflow") === "true",
    disabled: params.get("tabsDisabled") === "true",
    orientation: oneOf(orientations, params.get("tabsOrientation"), "horizontal"),
    size: oneOf(sizes, params.get("tabsSize"), "md"),
    value: oneOf(values, params.get("tabsValue"), "details"),
    variant: oneOf(variants, params.get("tabsVariant"), "flat"),
  };
}

export function serializeTabsWorkbench(state: State) {
  return new URLSearchParams({
    tabsDisableOverflow: String(state.disableOverflow),
    tabsDisabled: String(state.disabled),
    tabsOrientation: state.orientation,
    tabsSize: state.size,
    tabsValue: state.value,
    tabsVariant: state.variant,
  });
}

const fieldClassName =
  "h-11 rounded-md border border-input bg-background px-3 text-base sm:h-10 sm:text-sm";

export function TabsWorkbench({ children, onSearchChange, sourceSearch }: WorkbenchProps) {
  const [state, setState] = useState(() => parseTabsWorkbench(new URLSearchParams(sourceSearch)));

  function update(next: State) {
    setState(next);
    onSearchChange(serializeTabsWorkbench(next));
  }

  const controls = (
    <div className="grid gap-4">
      <div>
        <h2 className="text-sm font-semibold">Tabs setup</h2>
        <p className="text-xs text-muted-foreground">Changes stay in the share URL.</p>
      </div>
      <label className="grid gap-1 text-sm">
        Orientation
        <select
          aria-label="Tabs orientation"
          className={fieldClassName}
          value={state.orientation}
          onChange={(event) =>
            update({
              ...state,
              orientation: oneOf(orientations, event.target.value, "horizontal"),
            })
          }
        >
          {orientations.map((orientation) => (
            <option key={orientation}>{orientation}</option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        Size
        <select
          aria-label="Tabs size"
          className={fieldClassName}
          value={state.size}
          onChange={(event) =>
            update({
              ...state,
              size: oneOf(sizes, event.target.value, "md"),
            })
          }
        >
          {sizes.map((size) => (
            <option key={size}>{size}</option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        Variant
        <select
          aria-label="Tabs variant"
          className={fieldClassName}
          value={state.variant}
          onChange={(event) =>
            update({
              ...state,
              variant: oneOf(variants, event.target.value, "flat"),
            })
          }
        >
          {variants.map((variant) => (
            <option key={variant}>{variant}</option>
          ))}
        </select>
      </label>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input
          aria-label="Disable tabs"
          checked={state.disabled}
          className="size-5 touch-manipulation"
          type="checkbox"
          onChange={(event) => update({ ...state, disabled: event.target.checked })}
        />
        Disabled
      </label>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input
          aria-label="Disable tab overflow"
          checked={state.disableOverflow}
          className="size-5 touch-manipulation"
          type="checkbox"
          onChange={(event) => update({ ...state, disableOverflow: event.target.checked })}
        />
        Disable overflow menu
      </label>
    </div>
  );

  const preview = (
    <div
      className="w-full max-w-lg overflow-hidden rounded-md border border-border p-5"
      data-testid="tabs-preview"
    >
      <Tabs
        disableOverflow={state.disableOverflow}
        disabled={state.disabled}
        orientation={state.orientation}
        size={state.size}
        value={state.value}
        onChange={(value) => update({ ...state, value })}
      >
        <TabList variant={state.variant}>
          <TabList.Item key="details">Details</TabList.Item>
          <TabList.Item key="activity">Activity</TabList.Item>
          <TabList.Item key="feedback" tooltip={{ title: "User feedback" }}>
            User Feedback
          </TabList.Item>
          <TabList.Item key="attachments">Attachments</TabList.Item>
          <TabList.Item key="disabled" disabled>
            Disabled
          </TabList.Item>
          <TabList.Item key="hidden" hidden>
            Hidden
          </TabList.Item>
        </TabList>
        <TabPanels>
          <TabPanels.Item key="details">Project details</TabPanels.Item>
          <TabPanels.Item key="activity">Recent activity</TabPanels.Item>
          <TabPanels.Item key="feedback">User feedback</TabPanels.Item>
          <TabPanels.Item key="attachments">Issue attachments</TabPanels.Item>
          <TabPanels.Item key="disabled">Disabled panel</TabPanels.Item>
          <TabPanels.Item key="hidden">Hidden panel</TabPanels.Item>
        </TabPanels>
      </Tabs>
    </div>
  );

  return children({
    breadcrumbs: ["Components", "Tabs"],
    controls,
    description:
      "Test the regular Scraps compound Tabs API, selection, overflow, orientation, sizes, disabled state, and share URL.",
    preview,
    reset: () => {
      const next = defaultState();
      setState(next);
      return serializeTabsWorkbench(next);
    },
    serialize: () => serializeTabsWorkbench(state),
    title: "Tabs",
  });
}
