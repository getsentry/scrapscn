"use client";

import { useCallback, useState } from "react";

import type { WorkbenchProps } from "@/components/playground/workbench";
import { CodeBlock, InlineCode } from "@/components/ui/code";

const modes = ["block", "inline"] as const;
const languages = ["typescript", "javascript", "python", "bash", "json"] as const;
const headers = ["floating", "filename", "tabs"] as const;
const inlineVariants = ["accent", "neutral"] as const;
const selectedTabs = ["react", "vue"] as const;

type Mode = (typeof modes)[number];
type Language = (typeof languages)[number];
type Header = (typeof headers)[number];
type InlineVariant = (typeof inlineVariants)[number];

interface CodeWorkbenchState {
  code: string;
  copyButton: boolean;
  dark: boolean;
  header: Header;
  inlineVariant: InlineVariant;
  language: Language;
  lineHighlight: boolean;
  mode: Mode;
  rounded: boolean;
  selectedTab: string;
  selectable: boolean;
}

const defaultCode = "const event = { status: 'captured' };";

function choose<T extends readonly string[]>(
  values: T,
  value: string | null,
  fallback: T[number],
): T[number] {
  return values.find((candidate) => candidate === value) ?? fallback;
}

function defaultState(): CodeWorkbenchState {
  return {
    code: defaultCode,
    copyButton: true,
    dark: false,
    header: "filename",
    inlineVariant: "accent",
    language: "typescript",
    lineHighlight: true,
    mode: "block",
    rounded: true,
    selectedTab: "react",
    selectable: true,
  };
}

function parseCodeWorkbench(params: URLSearchParams): CodeWorkbenchState {
  return {
    code: params.get("codeValue") ?? defaultCode,
    copyButton: params.get("codeCopyButton") !== "false",
    dark: params.get("codeDark") === "true",
    header: choose(headers, params.get("codeHeader"), "filename"),
    inlineVariant: choose(inlineVariants, params.get("codeInlineVariant"), "accent"),
    language: choose(languages, params.get("codeLanguage"), "typescript"),
    lineHighlight: params.get("codeLineHighlight") !== "false",
    mode: choose(modes, params.get("codeMode"), "block"),
    rounded: params.get("codeRounded") !== "false",
    selectedTab: choose(selectedTabs, params.get("codeSelectedTab"), "react"),
    selectable: params.get("codeSelectable") !== "false",
  };
}

function serializeCodeWorkbench(state: CodeWorkbenchState): URLSearchParams {
  return new URLSearchParams({
    codeCopyButton: String(state.copyButton),
    codeDark: String(state.dark),
    codeHeader: state.header,
    codeInlineVariant: state.inlineVariant,
    codeLanguage: state.language,
    codeLineHighlight: String(state.lineHighlight),
    codeMode: state.mode,
    codeRounded: String(state.rounded),
    codeSelectable: String(state.selectable),
    codeSelectedTab: state.selectedTab,
    codeValue: state.code,
  });
}

const selectClassName =
  "h-11 rounded-md border border-input bg-background px-3 text-base sm:h-10 sm:text-sm";

function CodeSelect<T extends string>({
  label,
  onChange,
  value,
  values,
}: {
  label: string;
  onChange: (value: T) => void;
  value: T;
  values: readonly T[];
}) {
  return (
    <label className="grid gap-1 text-sm">
      {label}
      <select
        aria-label={label}
        className={selectClassName}
        value={value}
        onChange={(event) => {
          const next = values.find((option) => option === event.target.value);
          if (next !== undefined) onChange(next);
        }}
      >
        {values.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function CodeToggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 items-center gap-2 text-sm">
      <input
        aria-label={label}
        checked={checked}
        className="size-5 touch-manipulation"
        type="checkbox"
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}

export function CodeWorkbench({ children, onSearchChange, sourceSearch }: WorkbenchProps) {
  const [state, setState] = useState(() => parseCodeWorkbench(new URLSearchParams(sourceSearch)));
  const [copies, setCopies] = useState(0);
  const [highlights, setHighlights] = useState(0);
  const recordCopy = useCallback(() => setCopies((count) => count + 1), []);
  const recordHighlight = useCallback(() => setHighlights((count) => count + 1), []);

  function update(next: CodeWorkbenchState) {
    setState(next);
    onSearchChange(serializeCodeWorkbench(next));
  }

  const controls = (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <h2 className="text-sm font-semibold">Code setup</h2>
        <p className="text-xs text-muted-foreground">Changes stay in the share URL.</p>
      </div>
      <CodeSelect
        label="Code mode"
        value={state.mode}
        values={modes}
        onChange={(mode) => update({ ...state, mode })}
      />
      <CodeSelect
        label="Language"
        value={state.language}
        values={languages}
        onChange={(language) => update({ ...state, language })}
      />
      {state.mode === "block" ? (
        <>
          <CodeSelect
            label="Header"
            value={state.header}
            values={headers}
            onChange={(header) => update({ ...state, header })}
          />
          <CodeToggle
            checked={state.dark}
            label="Dark code theme"
            onChange={(dark) => update({ ...state, dark })}
          />
          <CodeToggle
            checked={state.copyButton}
            label="Copy button"
            onChange={(copyButton) => update({ ...state, copyButton })}
          />
          <CodeToggle
            checked={state.lineHighlight}
            label="Highlight first line"
            onChange={(lineHighlight) => update({ ...state, lineHighlight })}
          />
          <CodeToggle
            checked={state.rounded}
            label="Rounded corners"
            onChange={(rounded) => update({ ...state, rounded })}
          />
          <CodeToggle
            checked={state.selectable}
            label="Selectable code"
            onChange={(selectable) => update({ ...state, selectable })}
          />
        </>
      ) : (
        <CodeSelect
          label="Inline variant"
          value={state.inlineVariant}
          values={inlineVariants}
          onChange={(inlineVariant) => update({ ...state, inlineVariant })}
        />
      )}
      <label className="grid gap-1 text-sm sm:col-span-2">
        Code value
        <textarea
          aria-label="Code value"
          className="min-h-24 rounded-md border border-input bg-background p-3 font-mono text-base sm:text-sm"
          value={state.code}
          onChange={(event) => update({ ...state, code: event.target.value })}
        />
      </label>
    </div>
  );

  const tabs =
    state.header === "tabs"
      ? [
          { label: "React", value: "react" },
          { label: "Vue", value: "vue" },
        ]
      : undefined;
  const preview = (
    <div className="grid min-w-0 gap-3 rounded-md border border-border p-4">
      {state.mode === "inline" ? (
        <p className="text-base">
          Inspect{" "}
          <InlineCode data-testid="inline-code-preview" variant={state.inlineVariant}>
            {state.code}
          </InlineCode>{" "}
          in context.
        </p>
      ) : (
        <CodeBlock
          dark={state.dark}
          disableUserSelection={!state.selectable}
          filename={state.header === "filename" ? "example.ts" : undefined}
          hideCopyButton={!state.copyButton}
          isRounded={state.rounded}
          language={state.language}
          linesToHighlight={state.lineHighlight ? [1] : undefined}
          selectedTab={state.selectedTab}
          tabs={tabs}
          onAfterHighlight={recordHighlight}
          onCopy={recordCopy}
          onTabClick={(selectedTab) => update({ ...state, selectedTab })}
        >
          {state.code}
        </CodeBlock>
      )}
      <output data-testid="code-copy-count">Copies: {copies}</output>
      <output data-testid="code-highlight-count">Highlights: {highlights}</output>
    </div>
  );

  return children({
    breadcrumbs: ["Components", "Code"],
    controls,
    description:
      "Test regular Scraps block and inline code, Prism languages, headers, copy behavior, and theme variants.",
    preview,
    reset: () => {
      const next = defaultState();
      setState(next);
      setCopies(0);
      setHighlights(0);
      return serializeCodeWorkbench(next);
    },
    serialize: () => serializeCodeWorkbench(state),
    title: "Code",
  });
}
