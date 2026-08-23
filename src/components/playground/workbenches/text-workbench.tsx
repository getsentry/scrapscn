"use client";

import { useState } from "react";

import type { WorkbenchProps } from "@/components/playground/workbench";
import { Container } from "@/components/ui/layout";
import { Heading, Prose, Text } from "@/components/ui/text-index";
import type {
  HeadingSize,
  TextSize,
} from "@/components/ui/text-style-engine";
import type { TextVariant } from "@/components/ui/text";

const variants = [
  "primary",
  "secondary",
  "muted",
  "accent",
  "success",
  "warning",
  "danger",
  "promotion",
  "inherit",
] as const satisfies readonly TextVariant[];
const textSizes = ["xs", "sm", "md", "lg", "xl", "2xl"] as const satisfies readonly TextSize[];
const headingSizes = [...textSizes, "3xl", "4xl"] as const satisfies readonly HeadingSize[];
const densities = ["default", "compressed", "comfortable"] as const;
const alignments = ["left", "center", "right", "justify"] as const;
const decorations = [
  "none",
  "underline",
  "dotted",
  "strike",
  "underline-strike",
] as const;
const containerWidths = ["384px", "512px", "640px"] as const;

type Density = (typeof densities)[number];
type Alignment = (typeof alignments)[number];
type Decoration = (typeof decorations)[number];
type ContainerWidth = (typeof containerWidths)[number];

interface TextWorkbenchState {
  align: Alignment;
  bold: boolean;
  containerWidth: ContainerWidth;
  decoration: Decoration;
  density: Density;
  ellipsis: boolean;
  headingSize: HeadingSize;
  italic: boolean;
  monospace: boolean;
  prose: boolean;
  responsive: boolean;
  size: TextSize;
  variant: TextVariant;
}

function choose<const Values extends readonly string[]>(
  values: Values,
  value: string | null,
  fallback: Values[number]
): Values[number] {
  return values.find((candidate) => candidate === value) ?? fallback;
}

function parseBoolean(value: string | null, fallback: boolean): boolean {
  return value === null ? fallback : value === "true";
}

function defaultState(): TextWorkbenchState {
  return {
    align: "left",
    bold: false,
    containerWidth: "512px",
    decoration: "none",
    density: "default",
    ellipsis: false,
    headingSize: "2xl",
    italic: false,
    monospace: false,
    prose: true,
    responsive: true,
    size: "md",
    variant: "primary",
  };
}

function parseTextWorkbench(params: URLSearchParams): TextWorkbenchState {
  return {
    align: choose(alignments, params.get("textAlign"), "left"),
    bold: parseBoolean(params.get("textBold"), false),
    containerWidth: choose(
      containerWidths,
      params.get("textContainerWidth"),
      "512px"
    ),
    decoration: choose(decorations, params.get("textDecoration"), "none"),
    density: choose(densities, params.get("textDensity"), "default"),
    ellipsis: parseBoolean(params.get("textEllipsis"), false),
    headingSize: choose(headingSizes, params.get("textHeadingSize"), "2xl"),
    italic: parseBoolean(params.get("textItalic"), false),
    monospace: parseBoolean(params.get("textMonospace"), false),
    prose: parseBoolean(params.get("textProse"), true),
    responsive: parseBoolean(params.get("textResponsive"), true),
    size: choose(textSizes, params.get("textSize"), "md"),
    variant: choose(variants, params.get("textVariant"), "primary"),
  };
}

function serializeTextWorkbench(state: TextWorkbenchState): URLSearchParams {
  return new URLSearchParams({
    textAlign: state.align,
    textBold: String(state.bold),
    textContainerWidth: state.containerWidth,
    textDecoration: state.decoration,
    textDensity: state.density,
    textEllipsis: String(state.ellipsis),
    textHeadingSize: state.headingSize,
    textItalic: String(state.italic),
    textMonospace: String(state.monospace),
    textProse: String(state.prose),
    textResponsive: String(state.responsive),
    textSize: state.size,
    textVariant: state.variant,
  });
}

const controlClassName =
  "h-11 touch-manipulation rounded-md border border-input bg-background px-3 text-base focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-ring sm:h-10 sm:text-sm";

function TextSelect<Value extends string>({
  label,
  onChange,
  value,
  values,
}: {
  label: string;
  onChange: (value: Value) => void;
  value: Value;
  values: readonly Value[];
}) {
  return (
    <label className="grid gap-1 text-sm">
      {label}
      <select
        aria-label={label}
        className={controlClassName}
        value={value}
        onChange={(event) => {
          const next = values.find((candidate) => candidate === event.target.value);
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

function TextToggle({
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

function ConfiguredText({ state }: { state: TextWorkbenchState }) {
  const underline =
    state.decoration === "dotted"
      ? "dotted"
      : state.decoration === "underline" ||
          state.decoration === "underline-strike"
        ? true
        : undefined;
  const strikethrough =
    state.decoration === "strike" || state.decoration === "underline-strike";
  const sharedProps = {
    align: state.align,
    bold: state.bold,
    density: state.density === "default" ? undefined : state.density,
    italic: state.italic,
    monospace: state.monospace,
    size: state.size,
    strikethrough,
    underline,
    variant: state.variant,
  } satisfies Omit<React.ComponentProps<typeof Text>, "children" | "ellipsis">;

  return (
    <Text
      {...sharedProps}
      {...(state.ellipsis ? { ellipsis: true } : {})}
      data-testid="text-preview"
    >
      Sentry keeps the complete event context available while the issue title stays concise.
    </Text>
  );
}

export function TextWorkbench({
  children,
  onSearchChange,
  sourceSearch,
}: WorkbenchProps) {
  const [state, setState] = useState(() =>
    parseTextWorkbench(new URLSearchParams(sourceSearch))
  );

  function update(next: TextWorkbenchState) {
    setState(next);
    onSearchChange(serializeTextWorkbench(next));
  }

  const controls = (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <h2 className="text-sm font-semibold">Text setup</h2>
        <p className="text-xs text-muted-foreground">Changes stay in the share URL.</p>
      </div>
      <TextSelect
        label="Text variant"
        value={state.variant}
        values={variants}
        onChange={(variant) => update({ ...state, variant })}
      />
      <TextSelect
        label="Text size"
        value={state.size}
        values={textSizes}
        onChange={(size) => update({ ...state, size })}
      />
      <TextSelect
        label="Heading size"
        value={state.headingSize}
        values={headingSizes}
        onChange={(headingSize) => update({ ...state, headingSize })}
      />
      <TextSelect
        label="Text density"
        value={state.density}
        values={densities}
        onChange={(density) => update({ ...state, density })}
      />
      <TextSelect
        label="Text alignment"
        value={state.align}
        values={alignments}
        onChange={(align) => update({ ...state, align })}
      />
      <TextSelect
        label="Text decoration"
        value={state.decoration}
        values={decorations}
        onChange={(decoration) => update({ ...state, decoration })}
      />
      <TextSelect
        label="Query container width"
        value={state.containerWidth}
        values={containerWidths}
        onChange={(containerWidth) => update({ ...state, containerWidth })}
      />
      <TextToggle
        checked={state.bold}
        label="Bold"
        onChange={(bold) => update({ ...state, bold })}
      />
      <TextToggle
        checked={state.italic}
        label="Italic"
        onChange={(italic) => update({ ...state, italic })}
      />
      <TextToggle
        checked={state.monospace}
        label="Monospace"
        onChange={(monospace) => update({ ...state, monospace })}
      />
      <TextToggle
        checked={state.ellipsis}
        label="Ellipsis"
        onChange={(ellipsis) => update({ ...state, ellipsis })}
      />
      <TextToggle
        checked={state.responsive}
        label="Responsive examples"
        onChange={(responsive) => update({ ...state, responsive })}
      />
      <TextToggle
        checked={state.prose}
        label="Prose composition"
        onChange={(prose) => update({ ...state, prose })}
      />
    </div>
  );

  const preview = (
    <div className="grid min-w-0 gap-8">
      <section className="grid min-w-0 gap-3">
        <Heading
          as="h2"
          data-testid="heading-preview"
          density={state.density === "default" ? undefined : state.density}
          italic={state.italic}
          monospace={state.monospace}
          size={state.headingSize}
          variant={state.variant}
        >
          Text composition
        </Heading>
        <div className="min-w-0 max-w-md">
          <ConfiguredText state={state} />
        </div>
        <Text variant={state.variant}>
          {({ className }) => (
            <a className={className} data-testid="text-render-preview" href="#prose">
              Render-function link
            </a>
          )}
        </Text>
        <Heading size="lg" variant={state.variant}>
          {({ className }) => (
            <h3 className={className} data-testid="heading-render-preview">
              Render-function heading
            </h3>
          )}
        </Heading>
        <div className="flex flex-wrap gap-4">
          <Text
            className="text-[#0057b8]"
            data-testid="text-inherit-class-preview"
            variant="inherit"
          >
            Consumer class color
          </Text>
          <Heading
            as="h3"
            data-testid="heading-inherit-style-preview"
            size="md"
            style={{ color: "rgb(180, 35, 24)" }}
            variant="inherit"
          >
            Consumer style color
          </Heading>
          <Text data-testid="text-mono-regular-preview" monospace>
            Regular monospace
          </Text>
          <Text bold data-testid="text-mono-bold-preview" monospace>
            Medium monospace
          </Text>
        </div>
      </section>

      {state.responsive ? (
        <section className="grid min-w-0 gap-4">
          <Heading as="h3" size="lg">Responsive cascade</Heading>
          <Text
            align={{ zero: "left", "screen:xs": "center", "screen:lg": "right" }}
            data-testid="text-responsive-viewport"
            size={{ zero: "xs", "screen:xs": "lg", "screen:lg": "2xl" }}
          >
            Viewport responsive text
          </Text>
          <Container
            border="primary"
            className="box-content"
            containerType="inline-size"
            data-testid="text-query-container"
            padding="md"
            width={state.containerWidth}
          >
            <Text
              data-testid="text-responsive-container"
              size={{ zero: "xs", sm: "md", lg: "xl" }}
            >
              Container responsive text
            </Text>
          </Container>
        </section>
      ) : null}

      {state.prose ? (
        <Prose data-testid="prose-preview" id="prose">
          <Heading as="h3" size="lg">Prose composition</Heading>
          <p>
            Raw prose applies <code>inline code</code> and <kbd>⌘K</kbd> without
            component wrappers.
          </p>
          <pre><code>preformatted code is not restyled as inline code</code></pre>
        </Prose>
      ) : null}
    </div>
  );

  return children({
    breadcrumbs: ["Components", "Text"],
    controls,
    description:
      "Test regular Scraps Text, Heading, Prose, semantic color, responsive type, and raw inline composition.",
    preview,
    reset: () => {
      const next = defaultState();
      setState(next);
      return serializeTextWorkbench(next);
    },
    serialize: () => serializeTextWorkbench(state),
    title: "Text",
  });
}
