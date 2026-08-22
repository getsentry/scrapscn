"use client";

import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import type { WorkbenchProps } from "@/components/playground/workbench";
import { Button } from "@/components/ui/button";
import { Checkbox, type CheckboxProps } from "@/components/ui/checkbox";
import { Container, Stack } from "@/components/ui/layout";
import { slot } from "@/components/ui/slot";

type NotificationId = "issue-status" | "new-issues" | "weekly-reports";
type CheckedState = "false" | "true" | "indeterminate";
type CheckboxSize = NonNullable<CheckboxProps["size"]>;

export type CheckboxWorkbenchState = {
  checked: CheckedState;
  disabled: boolean;
  items: NotificationId[];
  label: string;
  selected: NotificationId[];
  size: CheckboxSize;
};

const defaultLabel = "Alert me about new issues";
const defaultNotificationIds: NotificationId[] = ["new-issues", "issue-status", "weekly-reports"];
const PlaygroundSlot = slot(Object.freeze(["utility"]));
const notificationContent: Record<NotificationId, { description: string; label: string }> = {
  "new-issues": { description: "Send an email when this project creates a new issue.", label: defaultLabel },
  "issue-status": { description: "Send an email when an issue is resolved or regressed.", label: "Issue status changes" },
  "weekly-reports": { description: "Send a summary of project activity every Monday.", label: "Weekly project report" },
};

function defaultState(): CheckboxWorkbenchState {
  return { checked: "false", disabled: false, items: [...defaultNotificationIds], label: defaultLabel, selected: ["issue-status"], size: "sm" };
}

function isNotificationId(value: string): value is NotificationId {
  return Object.hasOwn(notificationContent, value);
}

function parseCheckedState(value: string | null): CheckedState {
  return value === "true" || value === "indeterminate" ? value : "false";
}

function parseCheckboxSize(value: string): CheckboxSize {
  return value === "xs" || value === "md" ? value : "sm";
}

export function parseCheckboxWorkbench(params: URLSearchParams): CheckboxWorkbenchState {
  const parsedItems = params.get("items")?.split(",").filter(isNotificationId) ?? [];
  const selected = params.get("selected");
  return {
    checked: parseCheckedState(params.get("checked")),
    disabled: params.get("disabled") === "true",
    items: parsedItems.length ? [...new Set(parsedItems)] : [...defaultNotificationIds],
    label: params.get("label") ?? defaultLabel,
    selected: selected === null ? ["issue-status"] : selected.split(",").filter(isNotificationId),
    size: parseCheckboxSize(params.get("size") ?? "sm"),
  };
}

export function serializeCheckboxWorkbench(state: CheckboxWorkbenchState) {
  const params = new URLSearchParams();
  params.set("checked", state.checked);
  params.set("disabled", String(state.disabled));
  params.set("items", state.items.join(","));
  params.set("label", state.label);
  params.set("selected", state.selected.join(","));
  params.set("size", state.size);
  return params;
}

function getNotificationLabel(item: NotificationId, label: string) {
  return item === "new-issues" ? label || "Untitled notification" : notificationContent[item].label;
}

export function CheckboxWorkbench({ children, onCollapseSetup, onSearchChange, sourceSearch }: WorkbenchProps) {
  const [state, setState] = useState(() => parseCheckboxWorkbench(new URLSearchParams(sourceSearch)));
  const [submittedState, setSubmittedState] = useState<string | null>(null);

  function update(next: CheckboxWorkbenchState) {
    setState(next);
    onSearchChange(serializeCheckboxWorkbench(next));
  }

  function updateItems(items: NotificationId[]) {
    update({ ...state, items });
  }

  function moveItem(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= state.items.length) return;
    const items = [...state.items];
    [items[index], items[targetIndex]] = [items[targetIndex], items[index]];
    updateItems(items);
  }

  const checkboxValue = state.checked === "indeterminate" ? "indeterminate" : state.checked === "true";
  const controls = (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="grid gap-4">
        <div className="flex items-center justify-between gap-3">
          <div><h2 className="text-sm font-semibold">Checkbox setup</h2><p className="text-xs text-muted-foreground">Changes stay in the share URL.</p></div>
          <ChevronUp aria-hidden="true" className="size-4 text-muted-foreground" />
        </div>
        <label className="grid gap-2 text-base font-medium sm:text-sm">Size
          <select className="h-11 touch-manipulation rounded-md border border-input bg-background px-3 text-base focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-ring sm:h-10 sm:text-sm" name="checkbox-size" value={state.size} onChange={(event) => update({ ...state, size: parseCheckboxSize(event.target.value) })}>
            <option value="xs">Extra small</option><option value="sm">Small</option><option value="md">Medium</option>
          </select>
        </label>
        <label className="grid gap-2 text-base font-medium sm:text-sm">Label
          <input className="h-11 touch-manipulation rounded-md border border-input bg-background px-3 text-base focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-ring sm:h-10 sm:text-sm" name="checkbox-label" value={state.label} onChange={(event) => update({ ...state, label: event.target.value })} />
        </label>
        <label className="grid gap-2 text-base font-medium sm:text-sm">Checked state
          <select className="h-11 touch-manipulation rounded-md border border-input bg-background px-3 text-base focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-ring sm:h-10 sm:text-sm" name="checkbox-state" value={state.checked} onChange={(event) => update({ ...state, checked: parseCheckedState(event.target.value) })}>
            <option value="false">Unchecked</option><option value="true">Checked</option><option value="indeterminate">Indeterminate</option>
          </select>
        </label>
        <label className="flex min-h-11 cursor-pointer touch-manipulation items-center gap-3 text-base font-medium sm:min-h-10 sm:text-sm">
          <Checkbox checked={state.disabled} name="disabled-control" onChange={(event) => update({ ...state, disabled: event.target.checked })} />Disabled
        </label>
      </div>
      <div className="grid content-start gap-2 sm:border-l sm:border-foreground/10 sm:pl-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Template stack</h2>
          <Button aria-label="Add notification" chonk={false} className="size-11 sm:size-10" disabled={state.items.length === defaultNotificationIds.length} size="icon-lg" type="button" variant="ghost" onClick={() => { const item = defaultNotificationIds.find((id) => !state.items.includes(id)); if (item) updateItems([...state.items, item]); }}><Plus aria-hidden="true" className="size-4 shrink-0" /></Button>
        </div>
        <ol className="grid gap-1">
          {state.items.map((item, index) => {
            const itemLabel = getNotificationLabel(item, state.label);
            return (
              <li className="flex min-w-0 items-center gap-1 rounded-md border border-foreground/10 px-2 py-1" key={item}>
                <div className="min-w-0 flex-1 truncate text-sm">{itemLabel}</div>
                <Button aria-label={`Move ${itemLabel} up`} chonk={false} className="size-11 sm:size-10" disabled={index === 0} size="icon-lg" type="button" variant="ghost" onClick={() => moveItem(index, -1)}><ArrowUp aria-hidden="true" className="size-3.5 shrink-0" /></Button>
                <Button aria-label={`Move ${itemLabel} down`} chonk={false} className="size-11 sm:size-10" disabled={index === state.items.length - 1} size="icon-lg" type="button" variant="ghost" onClick={() => moveItem(index, 1)}><ArrowDown aria-hidden="true" className="size-3.5 shrink-0" /></Button>
                <Button aria-label={`Remove ${itemLabel}`} chonk={false} className="size-11 sm:size-10" disabled={state.items.length === 1} size="icon-lg" type="button" variant="ghost" onClick={() => updateItems(state.items.filter((id) => id !== item))}><Trash2 aria-hidden="true" className="size-3.5 shrink-0" /></Button>
              </li>
            );
          })}
        </ol>
        <button className="mt-1 flex min-h-11 touch-manipulation items-center justify-center gap-1.5 rounded-md text-base font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring sm:min-h-10 sm:text-sm" type="button" onClick={onCollapseSetup}><ChevronDown aria-hidden="true" className="size-4" />Collapse setup</button>
      </div>
    </div>
  );

  const preview = (
    <div className="grid max-w-3xl gap-8">
      <Container background="primary" border="primary" data-testid="layout-separator-proof" padding="md" radius="md">
        <Stack direction={{ zero: "column", "screen:lg": "row" }} gap="sm"><span className="text-sm font-medium">Layout and separator proof</span><Stack.Separator data-testid="layout-stack-separator-proof" /><span className="text-sm text-muted-foreground">Responsive Scraps primitives</span></Stack>
      </Container>
      <PlaygroundSlot.Provider>
        <Container background="primary" border="primary" containerType="inline-size" padding="md" radius="md">
          <Stack gap="sm"><span className="text-sm font-medium">Slot portal proof</span><PlaygroundSlot.Outlet name="utility">{(props, hasConsumers) => <div {...props} className="text-sm text-muted-foreground" data-testid="slot-playground-outlet"><PlaygroundSlot.Fallback>No utility content</PlaygroundSlot.Fallback>{hasConsumers ? "Custom utility connected" : "Waiting for utility"}</div>}</PlaygroundSlot.Outlet></Stack>
        </Container>
        <PlaygroundSlot name="utility"><span data-testid="slot-playground-content">Portaled Scraps content</span></PlaygroundSlot>
      </PlaygroundSlot.Provider>
      <form aria-labelledby="email-heading" className="grid" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); const selectedItems = state.items.filter((item) => data.has(item)); const saved = selectedItems.map((item) => getNotificationLabel(item, state.label)).join(", "); setSubmittedState(saved ? `Saved: ${saved}` : "Saved: no email notifications"); }}>
        <div className="grid gap-1 border-b border-foreground/10 pb-4"><h2 className="text-lg font-semibold" id="email-heading">Email notifications</h2><p className="text-pretty text-base text-muted-foreground sm:text-sm">Control the messages sent to project members.</p></div>
        {state.items.map((item) => {
          const content = notificationContent[item];
          const itemLabel = getNotificationLabel(item, state.label);
          const checkboxId = `${item}-checkbox`;
          const descriptionId = `${item}-description`;
          const labelId = `${item}-label`;
          return (
            <div className="flex items-start gap-3 border-b border-foreground/10 py-4" key={item}>
              <span className="flex h-lh items-center text-lg sm:text-sm"><Checkbox aria-describedby={descriptionId} aria-labelledby={labelId} checked={item === "new-issues" ? checkboxValue : state.selected.includes(item)} disabled={state.disabled} id={checkboxId} name={item} size={state.size} value="enabled" onChange={(event) => { if (item === "new-issues") { update({ ...state, checked: event.target.checked ? "true" : "false" }); return; } const selected = event.target.checked ? [...state.selected, item] : state.selected.filter((selectedItem) => selectedItem !== item); update({ ...state, selected }); }} /></span>
              <div className="min-w-0"><label className="cursor-pointer font-medium" htmlFor={checkboxId} id={labelId}>{itemLabel}</label><p className="mt-1 text-base text-muted-foreground sm:text-sm" id={descriptionId}>{content.description}</p></div>
            </div>
          );
        })}
        <div className="flex flex-wrap items-center gap-3 pt-5"><Button chonk={false} type="submit">Save changes</Button>{submittedState ? <output aria-live="polite" className="text-sm text-muted-foreground">{submittedState}</output> : null}</div>
      </form>
    </div>
  );

  return children({
    breadcrumbs: ["Settings", "Projects", "Frontend"],
    controls,
    description: "Choose how your team receives issue updates for this project.",
    preview,
    reset: () => { const next = defaultState(); setState(next); setSubmittedState(null); return serializeCheckboxWorkbench(next); },
    serialize: () => serializeCheckboxWorkbench(state),
    title: "Notification Settings",
  });
}
