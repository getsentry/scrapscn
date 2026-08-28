"use client";

import { useState } from "react";

import type { WorkbenchProps } from "@/components/playground/workbench";
import { Checkbox } from "@/components/ui/checkbox";
import { Container, Stack } from "@/components/ui/layout";
import { COL_WIDTH_UNDEFINED, Table, type TableColumnConfig } from "@/components/ui/table";

type SortColumn = "events" | "issue";
type SortDirection = "asc" | "desc";
type WidthPreset = "auto" | "numeric" | "string";

interface TableWorkbenchState {
  controlled: boolean;
  eventsWidth: number;
  flexibleLastColumn: boolean;
  minimumColumnWidth: number;
  resizableEvents: boolean;
  rowCount: number;
  showStatus: boolean;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  width: number;
  widthPreset: WidthPreset;
}

const issues = [
  { events: 1248, issue: "Checkout failed after payment authorization", owner: "Web Platform" },
  { events: 842, issue: "Database query exceeded the timeout", owner: "Backend" },
  { events: 391, issue: "Source map was not found for release", owner: "Developer Experience" },
  { events: 187, issue: "Authentication token refresh failed", owner: "Identity" },
  { events: 96, issue: "Mobile app stopped during launch", owner: "Mobile" },
];

function defaults(): TableWorkbenchState {
  return {
    controlled: true,
    eventsWidth: 120,
    flexibleLastColumn: true,
    minimumColumnWidth: 90,
    resizableEvents: true,
    rowCount: 5,
    showStatus: false,
    sortColumn: "events",
    sortDirection: "desc",
    width: 220,
    widthPreset: "numeric",
  };
}

function parseNumber(value: string | null, fallback: number, minimum = 0) {
  if (value === null) return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(minimum, Math.round(number)) : fallback;
}

function parseColumnWidth(value: string | null, fallback: number) {
  if (value === String(COL_WIDTH_UNDEFINED)) return COL_WIDTH_UNDEFINED;
  return parseNumber(value, fallback);
}

function parseSortColumn(value: string): SortColumn {
  return value === "issue" ? "issue" : "events";
}

function parseSortDirection(value: string): SortDirection {
  return value === "asc" ? "asc" : "desc";
}

function parseWidthPreset(value: string): WidthPreset {
  return value === "auto" || value === "string" ? value : "numeric";
}

function parseTableWorkbench(params: URLSearchParams): TableWorkbenchState {
  const state = defaults();
  return {
    controlled: params.get("tableControlled") !== "false",
    eventsWidth: parseColumnWidth(params.get("tableEventsWidth"), state.eventsWidth),
    flexibleLastColumn: params.get("tableFlexibleLast") !== "false",
    minimumColumnWidth: parseNumber(params.get("tableMinimum"), state.minimumColumnWidth, 1),
    resizableEvents: params.get("tableResizableEvents") !== "false",
    rowCount: Math.min(5, parseNumber(params.get("tableRows"), state.rowCount)),
    showStatus: params.get("tableStatus") === "true",
    sortColumn: params.get("tableSortColumn") === "issue" ? "issue" : "events",
    sortDirection: params.get("tableSortDirection") === "asc" ? "asc" : "desc",
    width: parseNumber(params.get("tableWidth"), state.width),
    widthPreset:
      params.get("tableWidthPreset") === "auto"
        ? "auto"
        : params.get("tableWidthPreset") === "string"
          ? "string"
          : "numeric",
  };
}

function serializeTableWorkbench(state: TableWorkbenchState) {
  const params = new URLSearchParams();
  params.set("tableControlled", String(state.controlled));
  params.set("tableEventsWidth", String(state.eventsWidth));
  params.set("tableFlexibleLast", String(state.flexibleLastColumn));
  params.set("tableMinimum", String(state.minimumColumnWidth));
  params.set("tableResizableEvents", String(state.resizableEvents));
  params.set("tableRows", String(state.rowCount));
  params.set("tableSortColumn", state.sortColumn);
  params.set("tableSortDirection", state.sortDirection);
  params.set("tableStatus", String(state.showStatus));
  params.set("tableWidth", String(state.width));
  params.set("tableWidthPreset", state.widthPreset);
  return params;
}

export function TableWorkbench({ children, onSearchChange, sourceSearch }: WorkbenchProps) {
  const [state, setState] = useState(() => parseTableWorkbench(new URLSearchParams(sourceSearch)));
  const [lastResize, setLastResize] = useState("None");

  function update(next: TableWorkbenchState) {
    setState(next);
    onSearchChange(serializeTableWorkbench(next));
  }

  const issueWidth =
    state.widthPreset === "auto"
      ? COL_WIDTH_UNDEFINED
      : state.widthPreset === "string"
        ? "minmax(12rem, 2fr)"
        : state.width;
  const columns: TableColumnConfig[] = [
    { key: "issue", width: issueWidth },
    { key: "events", resizable: state.resizableEvents, width: state.eventsWidth },
    { key: "owner" },
  ];
  const rows = [...issues]
    .sort((a, b) => {
      const comparison =
        state.sortColumn === "events" ? a.events - b.events : a.issue.localeCompare(b.issue);
      return state.sortDirection === "asc" ? comparison : -comparison;
    })
    .slice(0, state.rowCount);
  const controlClassName =
    "h-11 rounded-md border border-input bg-background px-3 text-base focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-ring sm:h-10 sm:text-sm";

  const controls = (
    <div className="grid gap-4">
      <div>
        <h2 className="text-sm font-semibold">Table setup</h2>
        <p className="text-xs text-muted-foreground">
          Resize, sort, and share a realistic issue table.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="grid gap-2 text-base font-medium sm:text-sm">
          Width preset
          <select
            aria-label="Width preset"
            className={controlClassName}
            value={state.widthPreset}
            onChange={(event) =>
              update({ ...state, widthPreset: parseWidthPreset(event.target.value) })
            }
          >
            <option value="numeric">Numeric</option>
            <option value="string">String track</option>
            <option value="auto">Auto</option>
          </select>
        </label>
        <label className="grid gap-2 text-base font-medium sm:text-sm">
          Issue width
          <input
            aria-label="Issue width"
            className={controlClassName}
            disabled={state.widthPreset !== "numeric"}
            min={0}
            type="number"
            value={state.width}
            onChange={(event) => update({ ...state, width: parseNumber(event.target.value, 220) })}
          />
        </label>
        <label className="grid gap-2 text-base font-medium sm:text-sm">
          Minimum width
          <input
            aria-label="Minimum column width"
            className={controlClassName}
            min={1}
            type="number"
            value={state.minimumColumnWidth}
            onChange={(event) =>
              update({ ...state, minimumColumnWidth: parseNumber(event.target.value, 90, 1) })
            }
          />
        </label>
        <label className="grid gap-2 text-base font-medium sm:text-sm">
          Rows
          <input
            aria-label="Rows"
            className={controlClassName}
            max={5}
            min={0}
            type="number"
            value={state.rowCount}
            onChange={(event) =>
              update({ ...state, rowCount: Math.min(5, parseNumber(event.target.value, 5)) })
            }
          />
        </label>
        <label className="grid gap-2 text-base font-medium sm:text-sm">
          Sort column
          <select
            aria-label="Sort column"
            className={controlClassName}
            value={state.sortColumn}
            onChange={(event) =>
              update({ ...state, sortColumn: parseSortColumn(event.target.value) })
            }
          >
            <option value="events">Events</option>
            <option value="issue">Issue</option>
          </select>
        </label>
        <label className="grid gap-2 text-base font-medium sm:text-sm">
          Sort direction
          <select
            aria-label="Sort direction"
            className={controlClassName}
            value={state.sortDirection}
            onChange={(event) =>
              update({ ...state, sortDirection: parseSortDirection(event.target.value) })
            }
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </label>
        <label className="flex min-h-11 items-center gap-3 text-base font-medium sm:min-h-10 sm:text-sm">
          <Checkbox
            checked={state.controlled}
            name="table-controlled"
            onChange={(event) => update({ ...state, controlled: event.target.checked })}
          />
          Controlled widths
        </label>
        <label className="flex min-h-11 items-center gap-3 text-base font-medium sm:min-h-10 sm:text-sm">
          <Checkbox
            checked={state.flexibleLastColumn}
            name="table-flexible-last"
            onChange={(event) => update({ ...state, flexibleLastColumn: event.target.checked })}
          />
          Flexible last column
        </label>
        <label className="flex min-h-11 items-center gap-3 text-base font-medium sm:min-h-10 sm:text-sm">
          <Checkbox
            checked={state.resizableEvents}
            name="table-resizable-events"
            onChange={(event) => update({ ...state, resizableEvents: event.target.checked })}
          />
          Resizable Events
        </label>
        <label className="flex min-h-11 items-center gap-3 text-base font-medium sm:min-h-10 sm:text-sm">
          <Checkbox
            checked={state.showStatus}
            name="table-status"
            onChange={(event) => update({ ...state, showStatus: event.target.checked })}
          />
          Show status row
        </label>
      </div>
    </div>
  );

  const preview = (
    <Container background="primary" border="primary" minWidth="0" padding="md" radius="md">
      <Stack gap="sm">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="font-medium">Issue stream</span>
          <output data-testid="table-resize-output">Last resize: {lastResize}</output>
        </div>
        <div
          className="max-h-64 w-full min-w-0 overflow-auto rounded-md border border-[var(--scraps-theme-border-secondary)]"
          data-testid="table-scroll-frame"
        >
          <Table
            key={state.controlled ? "controlled" : "uncontrolled"}
            aria-label="Issue stream"
            className="min-w-[540px] text-sm"
            columns={columns}
            flexibleLastColumn={state.flexibleLastColumn}
            minimumColumnWidth={state.minimumColumnWidth}
            onColumnResize={
              state.controlled
                ? (index, width) => {
                    setLastResize(`${index}:${width}`);
                    if (index === 0)
                      update({
                        ...state,
                        width,
                        widthPreset: width === COL_WIDTH_UNDEFINED ? "auto" : "numeric",
                      });
                    else if (index === 1) update({ ...state, eventsWidth: width });
                  }
                : undefined
            }
          >
            <Table.Head className="bg-background" sticky>
              <Table.Row>
                <Table.HeadCell
                  className="p-3 text-left font-medium"
                  column="issue"
                  sort={state.sortColumn === "issue" ? state.sortDirection : undefined}
                  onSort={() =>
                    update({
                      ...state,
                      sortColumn: "issue",
                      sortDirection:
                        state.sortColumn === "issue" && state.sortDirection === "desc"
                          ? "asc"
                          : "desc",
                    })
                  }
                >
                  Issue
                </Table.HeadCell>
                <Table.HeadCell
                  className="p-3 text-right font-medium"
                  column="events"
                  sort={state.sortColumn === "events" ? state.sortDirection : undefined}
                  onSort={() =>
                    update({
                      ...state,
                      sortColumn: "events",
                      sortDirection:
                        state.sortColumn === "events" && state.sortDirection === "desc"
                          ? "asc"
                          : "desc",
                    })
                  }
                >
                  Events
                </Table.HeadCell>
                <Table.HeadCell className="p-3 text-left font-medium" column="owner">
                  Owner
                </Table.HeadCell>
              </Table.Row>
            </Table.Head>
            {state.showStatus ? (
              <Table.StatusBody className="min-h-24 p-4 text-muted-foreground">
                No matching issues
              </Table.StatusBody>
            ) : (
              <Table.Body>
                {rows.map((row) => (
                  <Table.Row className="min-h-12" divider key={row.issue}>
                    <Table.Cell className="truncate p-3">{row.issue}</Table.Cell>
                    <Table.Cell className="p-3 text-right tabular-nums">
                      {row.events.toLocaleString()}
                    </Table.Cell>
                    <Table.Cell className="p-3">{row.owner}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            )}
          </Table>
        </div>
      </Stack>
    </Container>
  );

  return children({
    breadcrumbs: ["Components", "Table"],
    controls,
    description:
      "Test the exact regular Scraps grid table, column resize, sorting, status, and overflow behavior.",
    preview,
    reset: () => {
      const next = defaults();
      setState(next);
      setLastResize("None");
      return serializeTableWorkbench(next);
    },
    serialize: () => serializeTableWorkbench(state),
    title: "Table",
  });
}
