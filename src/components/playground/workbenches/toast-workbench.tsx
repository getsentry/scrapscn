"use client";

import { useState } from "react";

import type { WorkbenchProps } from "@/components/playground/workbench";
import { Toast } from "@/components/ui/toast";

const types = ["", "loading", "success", "error", "undo"] as const;
type ToastType = (typeof types)[number];
type ToastWorkbenchState = {
  disableDismiss: boolean;
  message: string;
  type: ToastType;
  undo: boolean;
};

function defaults(): ToastWorkbenchState {
  return {
    disableDismiss: false,
    message: "Project settings saved",
    type: "success",
    undo: false,
  };
}

function parse(params: URLSearchParams): ToastWorkbenchState {
  return {
    disableDismiss: params.get("toastDisableDismiss") === "true",
    message: params.get("toastMessage") ?? "Project settings saved",
    type: types.find((type) => type === params.get("toastType")) ?? "success",
    undo: params.get("toastUndo") === "true",
  };
}

function serialize(state: ToastWorkbenchState) {
  return new URLSearchParams({
    toastDisableDismiss: String(state.disableDismiss),
    toastMessage: state.message,
    toastType: state.type,
    toastUndo: String(state.undo),
  });
}

const fieldClassName =
  "h-11 rounded-md border border-input bg-background px-3 text-base sm:h-10 sm:text-sm";

export function ToastWorkbench({ children, onSearchChange, sourceSearch }: WorkbenchProps) {
  const [state, setState] = useState(() => parse(new URLSearchParams(sourceSearch)));
  const [dismisses, setDismisses] = useState(0);
  const [undos, setUndos] = useState(0);
  function update(next: ToastWorkbenchState) {
    setState(next);
    onSearchChange(serialize(next));
  }
  const controls = (
    <div className="grid gap-4">
      <div>
        <h2 className="text-sm font-semibold">Toast setup</h2>
        <p className="text-xs text-muted-foreground">
          Configure type, message, undo, and dismiss behavior.
        </p>
      </div>
      <label className="grid gap-1 text-sm">
        Toast type
        <select
          aria-label="Toast type"
          className={fieldClassName}
          value={state.type}
          onChange={(event) =>
            update({
              ...state,
              type: types.find((type) => type === event.target.value) ?? "success",
            })
          }
        >
          {types.map((type) => (
            <option key={type} value={type}>
              {type || "default"}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        Toast message
        <input
          aria-label="Toast message"
          className={fieldClassName}
          value={state.message}
          onChange={(event) => update({ ...state, message: event.target.value })}
        />
      </label>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input
          aria-label="Toast undo"
          checked={state.undo}
          className="size-5 touch-manipulation"
          type="checkbox"
          onChange={(event) => update({ ...state, undo: event.target.checked })}
        />
        Show undo action
      </label>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input
          aria-label="Toast disable dismiss"
          checked={state.disableDismiss}
          className="size-5 touch-manipulation"
          type="checkbox"
          onChange={(event) => update({ ...state, disableDismiss: event.target.checked })}
        />
        Disable dismiss
      </label>
    </div>
  );
  const preview = (
    <div className="w-full max-w-md" data-testid="toast-preview">
      <Toast
        indicator={{
          id: "workbench",
          message: state.message || " ",
          options: {
            disableDismiss: state.disableDismiss,
            undo: state.undo ? () => setUndos((count) => count + 1) : undefined,
          },
          type: state.type,
        }}
        onDismiss={() => setDismisses((count) => count + 1)}
      />
      <p className="mt-4 text-sm text-muted-foreground">Dismisses: {dismisses}</p>
      <p className="text-sm text-muted-foreground">Undos: {undos}</p>
    </div>
  );
  return children({
    breadcrumbs: ["Components", "Toast"],
    controls,
    description: "Test regular Scraps toast type, icon, undo, and dismiss behavior.",
    preview,
    reset: () => {
      const next = defaults();
      setState(next);
      setDismisses(0);
      setUndos(0);
      return serialize(next);
    },
    serialize: () => serialize(state),
    title: "Toast",
  });
}
