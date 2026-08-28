"use client";

import { useState } from "react";

import type { WorkbenchProps } from "@/components/playground/workbench";
import { Pagination, useGetPaginationCaption } from "@/components/ui/pagination";

const sizes = ["zero", "xs", "sm", "md"] as const;
type PaginationSize = (typeof sizes)[number];
type PaginationWorkbenchState = {
  caption: boolean;
  customHandler: boolean;
  disabled: boolean;
  nextResults: boolean;
  previousResults: boolean;
  size: PaginationSize;
};

function defaultState(): PaginationWorkbenchState {
  return {
    caption: true,
    customHandler: true,
    disabled: false,
    nextResults: true,
    previousResults: false,
    size: "sm",
  };
}
function parseSize(value: string | null): PaginationSize {
  return sizes.find((size) => size === value) ?? "sm";
}
export function parsePaginationWorkbench(params: URLSearchParams): PaginationWorkbenchState {
  return {
    caption: params.get("paginationCaption") !== "false",
    customHandler: params.get("paginationCustomHandler") !== "false",
    disabled: params.get("paginationDisabled") === "true",
    nextResults: params.get("paginationNextResults") !== "false",
    previousResults: params.get("paginationPreviousResults") === "true",
    size: parseSize(params.get("paginationSize")),
  };
}
export function serializePaginationWorkbench(state: PaginationWorkbenchState) {
  return new URLSearchParams({
    paginationCaption: String(state.caption),
    paginationCustomHandler: String(state.customHandler),
    paginationDisabled: String(state.disabled),
    paginationNextResults: String(state.nextResults),
    paginationPreviousResults: String(state.previousResults),
    paginationSize: state.size,
  });
}
function pageLinks(state: PaginationWorkbenchState) {
  return `<https://sentry.io/api/0/items/?cursor=0:0:1>; rel="previous"; results="${state.previousResults}"; cursor="0:0:1", <https://sentry.io/api/0/items/?cursor=0:25:0>; rel="next"; results="${state.nextResults}"; cursor="0:25:0"`;
}
const fieldClassName =
  "h-11 rounded-md border border-input bg-background px-3 text-base sm:h-10 sm:text-sm";

export function PaginationWorkbench({ children, onSearchChange, sourceSearch }: WorkbenchProps) {
  const getCaption = useGetPaginationCaption();
  const [state, setState] = useState(() =>
    parsePaginationWorkbench(new URLSearchParams(sourceSearch)),
  );
  const [lastCursor, setLastCursor] = useState("None");
  function update(next: PaginationWorkbenchState) {
    setState(next);
    onSearchChange(serializePaginationWorkbench(next));
  }
  const controls = (
    <div className="grid gap-4">
      <div>
        <h2 className="text-sm font-semibold">Pagination setup</h2>
        <p className="text-xs text-muted-foreground">
          The Link header state and controls remain in the share URL.
        </p>
      </div>
      <label className="grid gap-1 text-sm">
        Size
        <select
          aria-label="Pagination size"
          className={fieldClassName}
          value={state.size}
          onChange={(event) => update({ ...state, size: parseSize(event.target.value) })}
        >
          {sizes.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>
      {(["caption", "customHandler", "disabled", "previousResults", "nextResults"] as const).map(
        (field) => (
          <label className="flex min-h-11 items-center gap-2 text-sm" key={field}>
            <input
              aria-label={
                field === "caption"
                  ? "Show pagination caption"
                  : field === "customHandler"
                    ? "Use custom cursor handler"
                    : field === "disabled"
                      ? "Disable pagination"
                      : field === "previousResults"
                        ? "Previous link has results"
                        : "Next link has results"
              }
              checked={state[field]}
              className="size-5 touch-manipulation"
              type="checkbox"
              onChange={(event) => update({ ...state, [field]: event.target.checked })}
            />
            {field === "caption"
              ? "Show caption"
              : field === "customHandler"
                ? "Use custom cursor handler"
                : field === "disabled"
                  ? "Disable both controls"
                  : field === "previousResults"
                    ? "Previous link has results"
                    : "Next link has results"}
          </label>
        ),
      )}
    </div>
  );
  const preview = (
    <div className="w-full rounded-md border border-border p-6" data-testid="pagination-preview">
      <Pagination
        caption={
          state.caption
            ? getCaption({
                cursor: "0:0:0",
                limit: 25,
                pageLength: 25,
                total: 100,
              })
            : undefined
        }
        disabled={state.disabled}
        pageLinks={pageLinks(state)}
        size={state.size}
        onCursor={
          state.customHandler
            ? (cursor, path, query, delta) =>
                setLastCursor(
                  `${delta}: ${cursor ?? "none"} at ${path} with ${
                    Object.keys(query).length
                  } query keys`,
                )
            : undefined
        }
      />
      <p className="mt-4 text-sm text-muted-foreground">Last cursor event: {lastCursor}</p>
    </div>
  );
  return children({
    breadcrumbs: ["Components", "Pagination"],
    controls,
    description:
      "Test regular Scraps cursor controls, Link header availability, disabled state, and caption geometry.",
    preview,
    reset: () => {
      const next = defaultState();
      setState(next);
      setLastCursor("None");
      return serializePaginationWorkbench(next);
    },
    serialize: () => serializePaginationWorkbench(state),
    title: "Pagination",
  });
}
