"use client";

import { useState } from "react";

import type { WorkbenchProps } from "@/components/playground/workbench";
import { Markdown, type MarkdownProps } from "@/components/ui/markdown";

const defaultRaw = `## Checkout regression

The **authentication** path now returns \`401 Unauthorized\`.

- [x] Find the first bad release
- [ ] Verify the fix

| Release | Failures |
| --- | ---: |
| 26.8.0 | 312 |

{% ref type="issue" id="SENTRY-123" /%}`;

type MarkdownWorkbenchState = {
  customTag: boolean;
  raw: string;
  variant: NonNullable<MarkdownProps["variant"]>;
};

const defaultState = {
  customTag: true,
  raw: defaultRaw,
  variant: "static",
} satisfies MarkdownWorkbenchState;

function createDefaultState(): MarkdownWorkbenchState {
  return { ...defaultState };
}

function parse(params: URLSearchParams): MarkdownWorkbenchState {
  return {
    customTag: params.get("markdownCustomTag") !== "false",
    raw: params.get("markdownRaw") ?? defaultRaw,
    variant: params.get("markdownVariant") === "streaming" ? "streaming" : "static",
  };
}

function serialize(state: MarkdownWorkbenchState) {
  return new URLSearchParams({
    markdownCustomTag: String(state.customTag),
    markdownRaw: state.raw,
    markdownVariant: state.variant,
  });
}

const fieldClassName = "rounded-md border border-input bg-background px-3 text-base sm:text-sm";

export function MarkdownWorkbench({ children, onSearchChange, sourceSearch }: WorkbenchProps) {
  const [state, setState] = useState(() => parse(new URLSearchParams(sourceSearch)));

  function update(next: MarkdownWorkbenchState) {
    setState(next);
    onSearchChange(serialize(next));
  }

  const controls = (
    <div className="grid gap-4">
      <div>
        <h2 className="text-sm font-semibold">Markdown setup</h2>
        <p className="text-xs text-muted-foreground">
          Edit rendered content, streaming behavior, and a custom Scraps tag.
        </p>
      </div>
      <label className="grid gap-1 text-sm">
        Rendering variant
        <select
          aria-label="Markdown variant"
          className={`${fieldClassName} h-11 sm:h-10`}
          value={state.variant}
          onChange={(event) =>
            update({
              ...state,
              variant: event.target.value === "streaming" ? "streaming" : "static",
            })
          }
        >
          <option value="static">static</option>
          <option value="streaming">streaming</option>
        </select>
      </label>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input
          aria-label="Render custom Markdown tag"
          checked={state.customTag}
          className="size-5 touch-manipulation"
          type="checkbox"
          onChange={(event) => update({ ...state, customTag: event.target.checked })}
        />
        Render custom tag
      </label>
      <label className="grid gap-1 text-sm">
        Markdown source
        <textarea
          aria-label="Markdown source"
          className={`${fieldClassName} min-h-56 py-2 font-mono`}
          value={state.raw}
          onChange={(event) => update({ ...state, raw: event.target.value })}
        />
      </label>
    </div>
  );

  const preview = (
    <div
      className="w-full max-w-[72ch] rounded-[8px] border border-[var(--scraps-theme-border-primary)] bg-background p-6 text-foreground"
      data-testid="markdown-preview"
    >
      <Markdown
        raw={state.raw}
        variant={state.variant}
        components={
          state.customTag
            ? {
                Tag: ({ attrs }) => (
                  <a
                    href={`/issues/${attrs.id}/`}
                    className="text-[var(--scraps-content-accent)] underline"
                  >
                    {attrs.id}
                  </a>
                ),
              }
            : undefined
        }
      />
    </div>
  );

  return children({
    breadcrumbs: ["Components", "Markdown"],
    controls,
    description:
      "Test regular Scraps Markdown tokens, safe HTML, component overrides, tags, and streaming updates.",
    preview,
    reset: () => {
      const next = createDefaultState();
      setState(next);
      return serialize(next);
    },
    serialize: () => serialize(state),
    title: "Markdown",
  });
}
