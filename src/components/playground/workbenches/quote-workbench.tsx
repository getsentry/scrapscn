"use client";

import { useState } from "react";

import type { WorkbenchProps } from "@/components/playground/workbench";
import { Quote } from "@/components/ui/quote";

interface QuoteWorkbenchState {
  author: string;
  body: string;
  href: string;
  label: string;
  showSource: boolean;
}

function defaultState(): QuoteWorkbenchState {
  return {
    author: "Developer",
    body: "It is not a bug; it is an undocumented feature.",
    href: "https://example.com/source",
    label: "in complete denial",
    showSource: true,
  };
}

function parseQuoteWorkbench(params: URLSearchParams): QuoteWorkbenchState {
  const defaults = defaultState();
  return {
    author: params.get("quoteAuthor") ?? defaults.author,
    body: params.get("quoteBody") ?? defaults.body,
    href: params.get("quoteHref") ?? defaults.href,
    label: params.get("quoteLabel") ?? defaults.label,
    showSource: params.get("quoteSource") !== "false",
  };
}

function serializeQuoteWorkbench(state: QuoteWorkbenchState): URLSearchParams {
  return new URLSearchParams({
    quoteAuthor: state.author,
    quoteBody: state.body,
    quoteHref: state.href,
    quoteLabel: state.label,
    quoteSource: String(state.showSource),
  });
}

const controlClassName =
  "h-11 rounded-md border border-input bg-background px-3 text-base sm:h-10 sm:text-sm";

export function QuoteWorkbench({ children, onSearchChange, sourceSearch }: WorkbenchProps) {
  const [state, setState] = useState(() => parseQuoteWorkbench(new URLSearchParams(sourceSearch)));
  function update(next: QuoteWorkbenchState) {
    setState(next);
    onSearchChange(serializeQuoteWorkbench(next));
  }
  const controls = (
    <div className="grid gap-4">
      <div>
        <h2 className="text-sm font-semibold">Quote setup</h2>
        <p className="text-xs text-muted-foreground">Changes remain in the share URL.</p>
      </div>
      {(["body", "author", "label", "href"] as const).map((field) => (
        <label className="grid gap-1 text-sm" key={field}>
          {field === "href" ? "Citation URL" : field[0].toUpperCase() + field.slice(1)}
          <input
            aria-label={field === "href" ? "Citation URL" : field[0].toUpperCase() + field.slice(1)}
            className={controlClassName}
            value={state[field]}
            onChange={(event) => update({ ...state, [field]: event.target.value })}
          />
        </label>
      ))}
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input
          aria-label="Show source"
          checked={state.showSource}
          className="size-5 touch-manipulation"
          type="checkbox"
          onChange={(event) => update({ ...state, showSource: event.target.checked })}
        />
        Show source attribution
      </label>
    </div>
  );
  const source = state.showSource
    ? {
        author: state.author || undefined,
        href: state.href || undefined,
        label: state.label || undefined,
      }
    : undefined;
  return children({
    breadcrumbs: ["Components", "Quote"],
    controls,
    description:
      "Test the regular Scraps semantic quotation, rail geometry, and optional source attribution.",
    preview: (
      <div className="max-w-2xl rounded-md border border-border p-6" data-testid="quote-preview">
        <Quote source={source}>{state.body}</Quote>
      </div>
    ),
    reset: () => {
      const next = defaultState();
      setState(next);
      return serializeQuoteWorkbench(next);
    },
    serialize: () => serializeQuoteWorkbench(state),
    title: "Quote",
  });
}
