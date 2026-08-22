import type { ComponentType } from "react";

import type { WorkbenchProps } from "@/components/playground/workbench";

import { CheckboxWorkbench } from "./checkbox-workbench";
import { DragHandleWorkbench } from "./drag-handle-workbench";
import { HotkeyWorkbench } from "./hotkey-workbench";
import { ImageWorkbench } from "./image-workbench";
import { BackdropWorkbench } from "./backdrop-workbench";
import { RevealOnHoverWorkbench } from "./reveal-on-hover-workbench";
import { SplitPanelWorkbench } from "./split-panel-workbench";
import { StatusIndicatorWorkbench } from "./status-indicator-workbench";
import { TableWorkbench } from "./table-workbench";

function defineWorkbench<const Id extends string>(definition: {
  Component: ComponentType<WorkbenchProps>;
  id: Id;
  label: string;
  sharePath: string;
}) {
  return Object.freeze(definition);
}

const checkboxWorkbench = defineWorkbench({
  Component: CheckboxWorkbench,
  id: "checkbox",
  label: "Checkbox",
  sharePath: "/templates/checkbox-settings",
});

export const workbenchRegistry = Object.freeze([
  checkboxWorkbench,
  defineWorkbench({ Component: DragHandleWorkbench, id: "drag-handle", label: "Drag Handle", sharePath: "/" }),
  defineWorkbench({ Component: SplitPanelWorkbench, id: "split-panel", label: "Split Panel", sharePath: "/" }),
  defineWorkbench({ Component: TableWorkbench, id: "table", label: "Table", sharePath: "/" }),
  defineWorkbench({ Component: StatusIndicatorWorkbench, id: "status-indicator", label: "Status Indicator", sharePath: "/" }),
  defineWorkbench({ Component: RevealOnHoverWorkbench, id: "reveal-on-hover", label: "Reveal On Hover", sharePath: "/" }),
  defineWorkbench({ Component: HotkeyWorkbench, id: "hotkey", label: "Hotkey", sharePath: "/" }),
  defineWorkbench({ Component: ImageWorkbench, id: "image", label: "Image", sharePath: "/" }),
  defineWorkbench({ Component: BackdropWorkbench, id: "backdrop", label: "Backdrop", sharePath: "/" }),
]);

export type WorkbenchId = (typeof workbenchRegistry)[number]["id"];

export const workbenchOptions = Object.freeze(
  workbenchRegistry.map(({ id, label }) => Object.freeze({ id, label }))
);

export function getWorkbenchDefinition(value: string | null) {
  return workbenchRegistry.find((definition) => definition.id === value) ?? checkboxWorkbench;
}

export function getWorkbenchDefinitionForPath(pathname: string, value: string | null) {
  const matchingDefinitions = workbenchRegistry.filter((definition) => definition.sharePath === pathname);
  return matchingDefinitions.length === 1 ? matchingDefinitions[0] ?? getWorkbenchDefinition(value) : getWorkbenchDefinition(value);
}

export function parseWorkbenchId(value: string | null): WorkbenchId {
  return getWorkbenchDefinition(value).id;
}

export function WorkbenchHost({ id, ...props }: WorkbenchProps & { id: WorkbenchId }) {
  const { Component } = getWorkbenchDefinition(id);
  return <Component {...props} />;
}
