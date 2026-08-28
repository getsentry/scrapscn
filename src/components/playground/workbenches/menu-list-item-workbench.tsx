"use client";

import { useState } from "react";

import type { WorkbenchProps } from "@/components/playground/workbench";
import { MenuListItem } from "@/components/ui/menu-list-item";

const sizes = ["xs", "sm", "md"] as const;
const priorities = ["default", "primary", "danger"] as const;
type State = {
  details: boolean;
  disabled: boolean;
  focused: boolean;
  leading: boolean;
  overlay: boolean;
  pressed: boolean;
  priority: (typeof priorities)[number];
  selected: boolean;
  size: (typeof sizes)[number];
  tooltip: boolean;
  trailing: boolean;
};
const defaults = (): State => ({
  details: true,
  disabled: false,
  focused: true,
  leading: true,
  overlay: false,
  pressed: false,
  priority: "default",
  selected: false,
  size: "md",
  tooltip: true,
  trailing: true,
});
const parse = (params: URLSearchParams): State => ({
  details: params.get("menuListItemDetails") !== "false",
  disabled: params.get("menuListItemDisabled") === "true",
  focused: params.get("menuListItemFocused") !== "false",
  leading: params.get("menuListItemLeading") !== "false",
  overlay: params.get("menuListItemOverlay") === "true",
  pressed: params.get("menuListItemPressed") === "true",
  priority: priorities.find((value) => value === params.get("menuListItemPriority")) ?? "default",
  selected: params.get("menuListItemSelected") === "true",
  size: sizes.find((value) => value === params.get("menuListItemSize")) ?? "md",
  tooltip: params.get("menuListItemTooltip") !== "false",
  trailing: params.get("menuListItemTrailing") !== "false",
});
const serialize = (state: State) =>
  new URLSearchParams(
    Object.entries(state).map(([key, value]) => [
      `menuListItem${key[0]!.toUpperCase()}${key.slice(1)}`,
      String(value),
    ]),
  );
const fieldClassName =
  "h-11 rounded-md border border-input bg-background px-3 text-base sm:h-10 sm:text-sm";

export function MenuListItemWorkbench({ children, onSearchChange, sourceSearch }: WorkbenchProps) {
  const [state, setState] = useState(() => parse(new URLSearchParams(sourceSearch)));
  const update = (next: State) => {
    setState(next);
    onSearchChange(serialize(next));
  };
  const controls = (
    <div className="grid gap-4">
      <div>
        <h2 className="text-sm font-semibold">Menu item setup</h2>
        <p className="text-xs text-muted-foreground">
          Configure the regular Scraps item state and share its URL.
        </p>
      </div>
      <label className="grid gap-1 text-sm">
        Menu item size
        <select
          aria-label="Menu item size"
          className={fieldClassName}
          value={state.size}
          onChange={(event) =>
            update({
              ...state,
              size: sizes.find((value) => value === event.target.value) ?? "md",
            })
          }
        >
          {sizes.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        Menu item priority
        <select
          aria-label="Menu item priority"
          className={fieldClassName}
          value={state.priority}
          onChange={(event) =>
            update({
              ...state,
              priority: priorities.find((value) => value === event.target.value) ?? "default",
            })
          }
        >
          {priorities.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </label>
      {(
        [
          "focused",
          "pressed",
          "selected",
          "disabled",
          "leading",
          "trailing",
          "details",
          "overlay",
          "tooltip",
        ] as const
      ).map((field) => (
        <label className="flex min-h-11 items-center gap-2 text-sm" key={field}>
          <input
            aria-label={`Menu item ${field}`}
            checked={state[field]}
            className="size-5 touch-manipulation"
            type="checkbox"
            onChange={(event) => update({ ...state, [field]: event.target.checked })}
          />
          {field}
        </label>
      ))}
    </div>
  );
  const preview = (
    <div
      className="w-full max-w-md rounded-md border border-border p-2"
      data-testid="menu-list-item-preview"
    >
      <ul>
        <MenuListItem
          details={
            state.details
              ? ({ isFocused, isSelected }) =>
                  `Details: focused ${isFocused}, selected ${isSelected}`
              : undefined
          }
          disabled={state.disabled}
          isFocused={state.focused}
          isPressed={state.pressed}
          isSelected={state.selected}
          label="Open project settings"
          leadingItems={
            state.leading
              ? ({ isSelected }) => <span aria-hidden="true">{isSelected ? "✓" : "○"}</span>
              : undefined
          }
          priority={state.priority}
          showDetailsInOverlay={state.overlay}
          size={state.size}
          tooltip={state.tooltip ? "Open project settings" : undefined}
          trailingItems={state.trailing ? "⌘," : undefined}
        />
      </ul>
    </div>
  );
  return children({
    breadcrumbs: ["Components", "MenuListItem"],
    controls,
    description:
      "Test regular Scraps menu item slots, visual state, details overlay, tooltip, and share state.",
    preview,
    reset: () => {
      const next = defaults();
      setState(next);
      return serialize(next);
    },
    serialize: () => serialize(state),
    title: "MenuListItem",
  });
}
