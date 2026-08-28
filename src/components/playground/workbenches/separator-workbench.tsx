"use client";

import { useState } from "react";

import type { WorkbenchProps } from "@/components/playground/workbench";
import { Separator } from "@/components/ui/separator";

const borders = ["primary", "secondary", "muted"] as const;
const spacing = ["0", "xs", "sm", "md", "lg"] as const;
type SeparatorBorder = (typeof borders)[number];
type SeparatorOrientation = "horizontal" | "vertical";
type SeparatorSpacing = (typeof spacing)[number];

interface SeparatorWorkbenchState {
  border: SeparatorBorder;
  margin: SeparatorSpacing;
  orientation: SeparatorOrientation;
  padding: SeparatorSpacing;
}

function defaultState(): SeparatorWorkbenchState {
  return { border: "primary", margin: "sm", orientation: "horizontal", padding: "0" };
}

function parseBorder(value: string | null): SeparatorBorder {
  return borders.find((border) => border === value) ?? "primary";
}

function parseOrientation(value: string | null): SeparatorOrientation {
  return value === "vertical" ? "vertical" : "horizontal";
}

function parseSpacing(value: string | null, fallback: SeparatorSpacing): SeparatorSpacing {
  return spacing.find((space) => space === value) ?? fallback;
}

export function parseSeparatorWorkbench(params: URLSearchParams): SeparatorWorkbenchState {
  return {
    border: parseBorder(params.get("separatorBorder")),
    margin: parseSpacing(params.get("separatorMargin"), "sm"),
    orientation: parseOrientation(params.get("separatorOrientation")),
    padding: parseSpacing(params.get("separatorPadding"), "0"),
  };
}

export function serializeSeparatorWorkbench(state: SeparatorWorkbenchState) {
  return new URLSearchParams({
    separatorBorder: state.border,
    separatorMargin: state.margin,
    separatorOrientation: state.orientation,
    separatorPadding: state.padding,
  });
}

export function SeparatorWorkbench({ children, onSearchChange, sourceSearch }: WorkbenchProps) {
  const [state, setState] = useState(() =>
    parseSeparatorWorkbench(new URLSearchParams(sourceSearch)),
  );

  function update(next: SeparatorWorkbenchState) {
    setState(next);
    onSearchChange(serializeSeparatorWorkbench(next));
  }

  const controlClassName =
    "h-11 rounded-md border border-input bg-background px-3 text-base sm:h-10 sm:text-sm";
  const controls = (
    <div className="grid gap-4">
      <div>
        <h2 className="text-sm font-semibold">Separator setup</h2>
        <p className="text-xs text-muted-foreground">Changes stay in the share URL.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          Orientation
          <select
            aria-label="Separator orientation"
            className={controlClassName}
            value={state.orientation}
            onChange={(event) =>
              update({ ...state, orientation: parseOrientation(event.target.value) })
            }
          >
            <option value="horizontal">Horizontal</option>
            <option value="vertical">Vertical</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Border
          <select
            aria-label="Separator border"
            className={controlClassName}
            value={state.border}
            onChange={(event) => update({ ...state, border: parseBorder(event.target.value) })}
          >
            {borders.map((border) => (
              <option key={border} value={border}>
                {border}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Margin
          <select
            aria-label="Separator margin"
            className={controlClassName}
            value={state.margin}
            onChange={(event) =>
              update({ ...state, margin: parseSpacing(event.target.value, "sm") })
            }
          >
            {spacing.map((space) => (
              <option key={space} value={space}>
                {space}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Padding
          <select
            aria-label="Separator padding"
            className={controlClassName}
            value={state.padding}
            onChange={(event) =>
              update({ ...state, padding: parseSpacing(event.target.value, "0") })
            }
          >
            {spacing.map((space) => (
              <option key={space} value={space}>
                {space}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );

  const items = ["Overview", "Issues", "Releases"];
  const preview = (
    <div
      className={
        state.orientation === "horizontal"
          ? "grid max-w-3xl rounded-lg border border-border bg-background p-6"
          : "flex min-h-72 max-w-3xl rounded-lg border border-border bg-background p-6"
      }
      data-testid="separator-workbench-preview"
    >
      {items.map((item, index) => (
        <div className="contents" key={item}>
          <section className="grid min-w-0 flex-1 content-center gap-2 p-3">
            <span className="text-sm font-semibold">{item}</span>
            <span className="text-sm text-muted-foreground">
              {index === 0 ? "Project summary" : `${18 + index * 11} recent events`}
            </span>
          </section>
          {index < items.length - 1 ? (
            <Separator
              border={state.border}
              data-testid="separator-preview-line"
              margin={state.margin}
              orientation={state.orientation}
              padding={state.padding}
            />
          ) : null}
        </div>
      ))}
    </div>
  );

  return children({
    breadcrumbs: ["Components", "Separator"],
    controls,
    description: "Tune directional borders and token spacing inside a composed content group.",
    preview,
    reset: () => {
      const next = defaultState();
      setState(next);
      return serializeSeparatorWorkbench(next);
    },
    serialize: () => serializeSeparatorWorkbench(state),
    title: "Separator",
  });
}
