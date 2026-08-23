"use client";

import { useState } from "react";

import type { WorkbenchProps } from "@/components/playground/workbench";
import { ExternalLink, Link } from "@/components/ui/link";
import { PlaygroundLinkBehaviorProvider } from "@/components/ui/link-playground-adapter";

interface LinkWorkbenchState {
  disabled: boolean;
  label: string;
  openInNewTab: boolean;
}

function defaults(): LinkWorkbenchState {
  return {
    disabled: false,
    label: "Open issue details",
    openInNewTab: true,
  };
}

function parseState(params: URLSearchParams): LinkWorkbenchState {
  return {
    disabled: params.get("linkDisabled") === "true",
    label: params.get("linkLabel") ?? "Open issue details",
    openInNewTab: params.get("linkNewTab") !== "false",
  };
}

function serialize(state: LinkWorkbenchState) {
  return new URLSearchParams({
    linkDisabled: String(state.disabled),
    linkLabel: state.label,
    linkNewTab: String(state.openInNewTab),
  });
}

const controlClassName =
  "h-11 rounded-md border border-input bg-background px-3 text-base sm:h-10 sm:text-sm";

export function LinkWorkbench({
  children,
  onSearchChange,
  sourceSearch,
}: WorkbenchProps) {
  const [state, setState] = useState(() =>
    parseState(new URLSearchParams(sourceSearch))
  );

  function update(next: LinkWorkbenchState) {
    setState(next);
    onSearchChange(serialize(next));
  }

  return children({
    breadcrumbs: ["Components", "Link"],
    controls: (
      <div className="grid gap-4">
        <div>
          <h2 className="text-sm font-semibold">Link setup</h2>
          <p className="text-xs text-muted-foreground">The URL stores every control.</p>
        </div>
        <label className="grid gap-1 text-sm">
          Label
          <input
            aria-label="Link label"
            className={controlClassName}
            onChange={event => update({ ...state, label: event.target.value })}
            value={state.label}
          />
        </label>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            aria-label="Disabled link"
            checked={state.disabled}
            className="size-5 touch-manipulation"
            onChange={event => update({ ...state, disabled: event.target.checked })}
            type="checkbox"
          />
          Disabled router link
        </label>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            aria-label="Open external link in new tab"
            checked={state.openInNewTab}
            className="size-5 touch-manipulation"
            onChange={event => update({ ...state, openInNewTab: event.target.checked })}
            type="checkbox"
          />
          Open external link in new tab
        </label>
      </div>
    ),
    description:
      "Test the regular Scraps router link, disabled state, tracking seam, and external-link target behavior.",
    preview: (
      <PlaygroundLinkBehaviorProvider>
        <div
          className="flex min-h-72 flex-col items-start justify-center gap-5 rounded-md border border-border bg-background p-12"
          data-testid="link-preview"
        >
          <Link
            aria-label={state.label}
            disabled={state.disabled}
            preventScrollReset
            reloadDocument={false}
            state={{ source: "playground" }}
            to="/issues/"
          >
            {state.label}
          </Link>
          <ExternalLink
            href="https://docs.sentry.io"
            openInNewTab={state.openInNewTab}
          >
            Read the docs
          </ExternalLink>
        </div>
      </PlaygroundLinkBehaviorProvider>
    ),
    reset: () => {
      const next = defaults();
      setState(next);
      return serialize(next);
    },
    serialize: () => serialize(state),
    title: "Link",
  });
}
