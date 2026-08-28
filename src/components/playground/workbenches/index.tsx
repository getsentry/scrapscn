import type { ComponentType } from "react";

import type { WorkbenchProps } from "@/components/playground/workbench";

import { AlertWorkbench } from "./alert-workbench";
import { AvatarButtonWorkbench } from "./avatar-button-workbench";
import { AvatarWorkbench } from "./avatar-workbench";
import { BackdropWorkbench } from "./backdrop-workbench";
import { BadgeWorkbench } from "./badge-workbench";
import { BreadcrumbListWorkbench } from "./breadcrumb-list-workbench";
import { ButtonWorkbench } from "./button-workbench";
import { ChatWorkbench } from "./chat-workbench";
import { CheckboxWorkbench } from "./checkbox-workbench";
import { ChipWorkbench } from "./chip-workbench";
import { CodeWorkbench } from "./code-workbench";
import { CompactSelectWorkbench } from "./compact-select-workbench";
import { DisclosureWorkbench } from "./disclosure-workbench";
import { DragHandleWorkbench } from "./drag-handle-workbench";
import { DrawerWorkbench } from "./drawer-workbench";
import { EmptyStateWorkbench } from "./empty-state-workbench";
import { FormWorkbench } from "./form-workbench";
import { HotkeyWorkbench } from "./hotkey-workbench";
import { ImageWorkbench } from "./image-workbench";
import { InfoWorkbench } from "./info-workbench";
import { InputWorkbench } from "./input-workbench";
import { InteractionStateLayerWorkbench } from "./interaction-state-layer-workbench";
import { LayoutWorkbench } from "./layout-workbench";
import { LinkWorkbench } from "./link-workbench";
import { LoaderWorkbench } from "./loader-workbench";
import { MarkdownWorkbench } from "./markdown-workbench";
import { MenuListItemWorkbench } from "./menu-list-item-workbench";
import { ModalWorkbench } from "./modal-workbench";
import { PaginationWorkbench } from "./pagination-workbench";
import { PictureInPictureWorkbench } from "./picture-in-picture-workbench";
import { QuoteWorkbench } from "./quote-workbench";
import { RadioWorkbench } from "./radio-workbench";
import { RevealOnHoverWorkbench } from "./reveal-on-hover-workbench";
import { SegmentedControlWorkbench } from "./segmented-control-workbench";
import { SelectWorkbench } from "./select-workbench";
import { SeparatorWorkbench } from "./separator-workbench";
import { SlideOverPanelWorkbench } from "./slide-over-panel-workbench";
import { SliderWorkbench } from "./slider-workbench";
import { SlotWorkbench } from "./slot-workbench";
import { SplitPanelWorkbench } from "./split-panel-workbench";
import { StatusIndicatorWorkbench } from "./status-indicator-workbench";
import { SwitchWorkbench } from "./switch-workbench";
import { TableWorkbench } from "./table-workbench";
import { TabsWorkbench } from "./tabs-workbench";
import { TextWorkbench } from "./text-workbench";
import { TextAreaWorkbench } from "./textarea-workbench";
import { ToastWorkbench } from "./toast-workbench";
import { TooltipWorkbench } from "./tooltip-workbench";

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
  defineWorkbench({
    Component: SegmentedControlWorkbench,
    id: "segmented-control",
    label: "SegmentedControl",
    sharePath: "/",
  }),
  checkboxWorkbench,
  defineWorkbench({
    Component: SliderWorkbench,
    id: "slider",
    label: "Slider",
    sharePath: "/",
  }),
  defineWorkbench({
    Component: SwitchWorkbench,
    id: "switch",
    label: "Switch",
    sharePath: "/",
  }),
  defineWorkbench({
    Component: CompactSelectWorkbench,
    id: "compact-select",
    label: "CompactSelect",
    sharePath: "/",
  }),
  defineWorkbench({
    Component: ModalWorkbench,
    id: "modal",
    label: "Modal",
    sharePath: "/",
  }),
  defineWorkbench({
    Component: DrawerWorkbench,
    id: "drawer",
    label: "Drawer",
    sharePath: "/",
  }),
  defineWorkbench({
    Component: BreadcrumbListWorkbench,
    id: "breadcrumb-list",
    label: "Breadcrumb List",
    sharePath: "/",
  }),
  defineWorkbench({
    Component: DragHandleWorkbench,
    id: "drag-handle",
    label: "Drag Handle",
    sharePath: "/",
  }),
  defineWorkbench({
    Component: SplitPanelWorkbench,
    id: "split-panel",
    label: "Split Panel",
    sharePath: "/",
  }),
  defineWorkbench({
    Component: TableWorkbench,
    id: "table",
    label: "Table",
    sharePath: "/",
  }),
  defineWorkbench({
    Component: StatusIndicatorWorkbench,
    id: "status-indicator",
    label: "Status Indicator",
    sharePath: "/",
  }),
  defineWorkbench({
    Component: RevealOnHoverWorkbench,
    id: "reveal-on-hover",
    label: "Reveal On Hover",
    sharePath: "/",
  }),
  defineWorkbench({
    Component: HotkeyWorkbench,
    id: "hotkey",
    label: "Hotkey",
    sharePath: "/",
  }),
  defineWorkbench({
    Component: ImageWorkbench,
    id: "image",
    label: "Image",
    sharePath: "/",
  }),
  defineWorkbench({
    Component: BackdropWorkbench,
    id: "backdrop",
    label: "Backdrop",
    sharePath: "/",
  }),
  defineWorkbench({
    Component: CodeWorkbench,
    id: "code",
    label: "Code",
    sharePath: "/",
  }),
  defineWorkbench({
    Component: EmptyStateWorkbench,
    id: "empty-state",
    label: "Empty State",
    sharePath: "/",
  }),
  defineWorkbench({
    Component: LoaderWorkbench,
    id: "loader",
    label: "Loader",
    sharePath: "/templates/loader-status",
  }),
  defineWorkbench({
    Component: SlideOverPanelWorkbench,
    id: "slide-over-panel",
    label: "Slide Over Panel",
    sharePath: "/",
  }),
  defineWorkbench({
    Component: TooltipWorkbench,
    id: "tooltip",
    label: "Tooltip",
    sharePath: "/",
  }),
  defineWorkbench({
    Component: LinkWorkbench,
    id: "link",
    label: "Link",
    sharePath: "/",
  }),
  defineWorkbench({
    Component: ButtonWorkbench,
    id: "button",
    label: "Button",
    sharePath: "/",
  }),
  defineWorkbench({
    Component: ChatWorkbench,
    id: "chat",
    label: "Chat",
    sharePath: "/",
  }),
  defineWorkbench({
    Component: MarkdownWorkbench,
    id: "markdown",
    label: "Markdown",
    sharePath: "/",
  }),
  defineWorkbench({
    Component: AlertWorkbench,
    id: "alert",
    label: "Alert",
    sharePath: "/",
  }),
  defineWorkbench({
    Component: BadgeWorkbench,
    id: "badge",
    label: "Badge",
    sharePath: "/",
  }),
  defineWorkbench({
    Component: SelectWorkbench,
    id: "select",
    label: "Select",
    sharePath: "/",
  }),
  defineWorkbench({
    Component: FormWorkbench,
    id: "form",
    label: "Form",
    sharePath: "/",
  }),
  defineWorkbench({
    Component: TabsWorkbench,
    id: "tabs",
    label: "Tabs",
    sharePath: "/",
  }),
  defineWorkbench({
    Component: AvatarWorkbench,
    id: "avatar",
    label: "Avatar",
    sharePath: "/",
  }),
  defineWorkbench({
    Component: RadioWorkbench,
    id: "radio",
    label: "Radio",
    sharePath: "/",
  }),
  defineWorkbench({
    Component: ChipWorkbench,
    id: "chip",
    label: "Chip",
    sharePath: "/",
  }),
  defineWorkbench({
    Component: InfoWorkbench,
    id: "info",
    label: "Info",
    sharePath: "/",
  }),
  defineWorkbench({
    Component: DisclosureWorkbench,
    id: "disclosure",
    label: "Disclosure",
    sharePath: "/",
  }),
  defineWorkbench({
    Component: PaginationWorkbench,
    id: "pagination",
    label: "Pagination",
    sharePath: "/",
  }),
  defineWorkbench({
    Component: AvatarButtonWorkbench,
    id: "avatar-button",
    label: "AvatarButton",
    sharePath: "/",
  }),
  defineWorkbench({
    Component: ToastWorkbench,
    id: "toast",
    label: "Toast",
    sharePath: "/",
  }),
  defineWorkbench({
    Component: PictureInPictureWorkbench,
    id: "picture-in-picture",
    label: "PictureInPicture",
    sharePath: "/",
  }),
  defineWorkbench({
    Component: MenuListItemWorkbench,
    id: "menu-list-item",
    label: "MenuListItem",
    sharePath: "/",
  }),
  defineWorkbench({
    Component: TextWorkbench,
    id: "text",
    label: "Text",
    sharePath: "/",
  }),
  defineWorkbench({
    Component: TextAreaWorkbench,
    id: "textarea",
    label: "TextArea",
    sharePath: "/",
  }),
  defineWorkbench({
    Component: InputWorkbench,
    id: "input",
    label: "Input",
    sharePath: "/",
  }),
  defineWorkbench({
    Component: InteractionStateLayerWorkbench,
    id: "interaction-state-layer",
    label: "Interaction State Layer",
    sharePath: "/",
  }),
  defineWorkbench({
    Component: LayoutWorkbench,
    id: "layout",
    label: "Layout",
    sharePath: "/",
  }),
  defineWorkbench({
    Component: SeparatorWorkbench,
    id: "separator",
    label: "Separator",
    sharePath: "/",
  }),
  defineWorkbench({
    Component: SlotWorkbench,
    id: "slot",
    label: "Slot",
    sharePath: "/",
  }),
  defineWorkbench({
    Component: QuoteWorkbench,
    id: "quote",
    label: "Quote",
    sharePath: "/",
  }),
]);

export type WorkbenchId = (typeof workbenchRegistry)[number]["id"];

export const workbenchOptions = Object.freeze(
  workbenchRegistry.map(({ id, label }) => Object.freeze({ id, label })),
);

export function getWorkbenchDefinition(value: string | null) {
  return workbenchRegistry.find((definition) => definition.id === value) ?? checkboxWorkbench;
}

export function getWorkbenchDefinitionForPath(pathname: string, value: string | null) {
  const matchingDefinitions = workbenchRegistry.filter(
    (definition) => definition.sharePath === pathname,
  );
  return matchingDefinitions.length === 1
    ? (matchingDefinitions[0] ?? getWorkbenchDefinition(value))
    : getWorkbenchDefinition(value);
}

export function parseWorkbenchId(value: string | null): WorkbenchId {
  return getWorkbenchDefinition(value).id;
}

export function WorkbenchHost({ id, ...props }: WorkbenchProps & { id: WorkbenchId }) {
  const { Component } = getWorkbenchDefinition(id);
  return <Component {...props} />;
}
