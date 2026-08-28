"use client";

import { Folder } from "lucide-react";
import { useState } from "react";

import type { WorkbenchProps } from "@/components/playground/workbench";
import { BreadcrumbList } from "@/components/ui/breadcrumb-list";
import { PlaygroundLinkBehaviorProvider } from "@/components/ui/link-playground-adapter";

type Width = "narrow" | "wide";
interface State {
  editable: boolean;
  project: "api" | "web";
  title: string;
  width: Width;
}
const controlClassName =
  "h-11 rounded-md border border-input bg-background px-3 text-base sm:h-10 sm:text-sm";
function defaultState(): State {
  return { editable: false, project: "web", title: "Issue details", width: "wide" };
}
export function parseBreadcrumbListWorkbench(params: URLSearchParams): State {
  const initial = defaultState();
  return {
    editable: params.get("breadcrumbEditable") === "true",
    project: params.get("breadcrumbProject") === "api" ? "api" : "web",
    title: params.get("breadcrumbTitle") ?? initial.title,
    width: params.get("breadcrumbWidth") === "narrow" ? "narrow" : "wide",
  };
}
export function serializeBreadcrumbListWorkbench(state: State) {
  return new URLSearchParams({
    breadcrumbEditable: String(state.editable),
    breadcrumbProject: state.project,
    breadcrumbTitle: state.title,
    breadcrumbWidth: state.width,
  });
}

export function BreadcrumbListWorkbench({
  children,
  onSearchChange,
  sourceSearch,
}: WorkbenchProps) {
  const [state, setState] = useState(() =>
    parseBreadcrumbListWorkbench(new URLSearchParams(sourceSearch)),
  );
  function update(next: State) {
    setState(next);
    onSearchChange(serializeBreadcrumbListWorkbench(next));
  }
  const items = [
    {
      type: "link" as const,
      label: "Settings",
      to: "/settings",
      leadingGraphic: <Folder className="size-4" />,
    },
    { type: "link" as const, label: "Projects", to: "/projects" },
    {
      type: "select-projects" as const,
      value: state.project,
      options: [
        { value: "web", label: "Web" },
        { value: "api", label: "API" },
      ],
      onChange: (option: { value: string | number }) =>
        update({ ...state, project: option.value === "api" ? "api" : "web" }),
    },
  ];
  return children({
    breadcrumbs: ["Components", "Breadcrumb List"],
    controls: (
      <div className="grid gap-4">
        <div>
          <h2 className="text-sm font-semibold">Breadcrumb List setup</h2>
          <p className="text-xs text-muted-foreground">
            Test parent links, project selection, title actions, and the 512 px collapse.
          </p>
        </div>
        <label className="grid gap-1 text-sm">
          Title
          <input
            aria-label="Breadcrumb title"
            className={controlClassName}
            value={state.title}
            onChange={(event) => update({ ...state, title: event.target.value })}
          />
        </label>
        <label className="grid gap-1 text-sm">
          Container width
          <select
            aria-label="Breadcrumb container width"
            className={controlClassName}
            value={state.width}
            onChange={(event) =>
              update({ ...state, width: event.target.value === "narrow" ? "narrow" : "wide" })
            }
          >
            <option value="wide">Wide (720 px)</option>
            <option value="narrow">Narrow (480 px)</option>
          </select>
        </label>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            aria-label="Editable title"
            checked={state.editable}
            className="size-5 touch-manipulation"
            type="checkbox"
            onChange={(event) => update({ ...state, editable: event.target.checked })}
          />
          Editable title
        </label>
      </div>
    ),
    description:
      "Test the regular Scraps parent breadcrumb collapse, selection, title, pagination, and action composition.",
    preview: (
      <PlaygroundLinkBehaviorProvider>
        <div
          className="rounded-md border border-border bg-background p-6"
          data-testid="breadcrumb-list-preview"
          style={{ maxWidth: "100%", width: state.width === "narrow" ? "480px" : "720px" }}
        >
          <BreadcrumbList items={items} />
          <div className="flex min-w-0 items-center">
            <BreadcrumbList.Title
              item={
                state.editable
                  ? {
                      type: "editable-title",
                      "aria-label": "Edit breadcrumb title",
                      autoSelect: true,
                      onChange: (title) => update({ ...state, title }),
                      value: state.title,
                    }
                  : {
                      type: "page-title",
                      label: state.title,
                      pagination: {
                        previous: { ariaLabel: "Previous issue", to: "/issues/1" },
                        next: { ariaLabel: "Next issue" },
                      },
                      trailingActions: {
                        type: "menu",
                        triggerLabel: "More breadcrumb actions",
                        items: [
                          { key: "archive", label: "Archive" },
                          {
                            key: "more",
                            label: "More",
                            textValue: "More actions",
                            submenu: { position: "auto-end", title: "Advanced" },
                            children: [{ key: "merge", label: "Merge" }],
                          },
                        ],
                      },
                    }
              }
            />
          </div>
        </div>
      </PlaygroundLinkBehaviorProvider>
    ),
    reset: () => {
      const next = defaultState();
      setState(next);
      return serializeBreadcrumbListWorkbench(next);
    },
    serialize: () => serializeBreadcrumbListWorkbench(state),
    title: "Breadcrumb List",
  });
}
