"use client";

import { AnimatePresence } from "framer-motion";
import { useState } from "react";

import type { WorkbenchProps } from "@/components/playground/workbench";
import { SlideOverPanel } from "@/components/ui/slide-over-panel";
import { SlideOverPanelEnvironmentProvider } from "@/components/ui/slide-over-panel-environment";

type Mode = "blocking" | "passive";
type Position = "unspecified" | "right" | "bottom" | "left";
type TopOffsetViewport = "auto" | "mobile" | "desktop";

interface SlideOverPanelWorkbenchState {
  content: string;
  mode: Mode;
  open: boolean;
  position: Position;
  showSuperuserWarning: boolean;
  topOffsetViewport: TopOffsetViewport;
  width: string;
}

function parseSlideOverPanelWorkbench(params: URLSearchParams): SlideOverPanelWorkbenchState {
  const position = params.get("slidePosition");
  const topOffsetViewport = params.get("slideTopOffsetViewport");

  return {
    content: params.get("slideContent") ?? "Inspect this panel in context.",
    mode: params.get("slideMode") === "passive" ? "passive" : "blocking",
    open: params.get("slideOpen") !== "false",
    position:
      position === "left" || position === "bottom" || position === "unspecified"
        ? position
        : "right",
    showSuperuserWarning: params.get("slideSuperuser") === "true",
    topOffsetViewport:
      topOffsetViewport === "mobile" || topOffsetViewport === "desktop"
        ? topOffsetViewport
        : "auto",
    width: params.get("slideWidth") ?? "50vw",
  };
}

function serializeSlideOverPanelWorkbench(state: SlideOverPanelWorkbenchState) {
  return new URLSearchParams({
    slideContent: state.content,
    slideMode: state.mode,
    slideOpen: String(state.open),
    slidePosition: state.position,
    slideSuperuser: String(state.showSuperuserWarning),
    slideTopOffsetViewport: state.topOffsetViewport,
    slideWidth: state.width,
  });
}

export function SlideOverPanelWorkbench({
  children,
  onSearchChange,
  sourceSearch,
}: WorkbenchProps) {
  const [state, setState] = useState(() =>
    parseSlideOverPanelWorkbench(new URLSearchParams(sourceSearch)),
  );

  function update(next: SlideOverPanelWorkbenchState) {
    setState(next);
    onSearchChange(serializeSlideOverPanelWorkbench(next));
  }

  const controls = (
    <div className="grid gap-4">
      <div>
        <h2 className="text-sm font-semibold">Slide over panel setup</h2>
        <p className="text-xs text-muted-foreground">Every setup value is in the share URL.</p>
      </div>
      <label className="grid gap-1 text-sm">
        Position
        <select
          aria-label="Panel position"
          value={state.position}
          onChange={(event) => {
            const value = event.target.value;
            update({
              ...state,
              position:
                value === "left" || value === "bottom" || value === "unspecified" ? value : "right",
            });
          }}
        >
          <option value="right">right</option>
          <option value="left">left</option>
          <option value="bottom">bottom</option>
          <option value="unspecified">omitted</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        Mode
        <select
          aria-label="Panel mode"
          value={state.mode}
          onChange={(event) =>
            update({
              ...state,
              mode: event.target.value === "passive" ? "passive" : "blocking",
            })
          }
        >
          <option value="blocking">blocking</option>
          <option value="passive">passive</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        Navigation offset viewport
        <select
          aria-label="Panel top offset viewport"
          value={state.topOffsetViewport}
          onChange={(event) => {
            const value = event.target.value;
            update({
              ...state,
              topOffsetViewport: value === "mobile" || value === "desktop" ? value : "auto",
            });
          }}
        >
          <option value="auto">match browser</option>
          <option value="mobile">mobile, 48px</option>
          <option value="desktop">desktop, 53px</option>
        </select>
      </label>
      <label className="flex gap-2 text-sm">
        <input
          aria-label="Show superuser warning"
          checked={state.showSuperuserWarning}
          type="checkbox"
          onChange={(event) => update({ ...state, showSuperuserWarning: event.target.checked })}
        />
        Add the 24px superuser marquee
      </label>
      <label className="grid gap-1 text-sm">
        Width
        <input
          aria-label="Panel width"
          value={state.width}
          onChange={(event) => update({ ...state, width: event.target.value })}
        />
      </label>
      <label className="grid gap-1 text-sm">
        Content
        <textarea
          aria-label="Panel content"
          value={state.content}
          onChange={(event) => update({ ...state, content: event.target.value })}
        />
      </label>
      <label className="flex gap-2 text-sm">
        <input
          aria-label="Panel open"
          checked={state.open}
          type="checkbox"
          onChange={(event) => update({ ...state, open: event.target.checked })}
        />
        Open
      </label>
    </div>
  );

  const forcedMobile =
    state.topOffsetViewport === "auto" ? undefined : state.topOffsetViewport === "mobile";
  const position = state.position === "unspecified" ? undefined : state.position;
  const preview = (
    <div
      className="relative min-h-96 overflow-hidden border bg-background"
      data-testid="slide-over-panel-preview"
    >
      <button type="button" onClick={() => update({ ...state, open: !state.open })}>
        {state.open ? "Close panel" : "Open panel"}
      </button>
      <SlideOverPanelEnvironmentProvider
        isMobile={forcedMobile}
        showSuperuserWarning={state.showSuperuserWarning}
      >
        <AnimatePresence>
          {state.open ? (
            <SlideOverPanel
              data-test-id="slide-over-panel-preview-panel"
              mode={state.mode}
              panelWidth={state.width}
              position={position}
            >
              {({ isOpening }) => (
                <div className="p-6">{isOpening ? "Opening panel" : state.content}</div>
              )}
            </SlideOverPanel>
          ) : null}
        </AnimatePresence>
      </SlideOverPanelEnvironmentProvider>
    </div>
  );

  return children({
    breadcrumbs: ["Components", "Slide Over Panel"],
    controls,
    description:
      "Test the regular Scraps panel geometry, deferred content, and placement transitions.",
    preview,
    reset: () => {
      const next = parseSlideOverPanelWorkbench(new URLSearchParams());
      setState(next);
      return serializeSlideOverPanelWorkbench(next);
    },
    serialize: () => serializeSlideOverPanelWorkbench(state),
    title: "Slide Over Panel",
  });
}
