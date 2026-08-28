import { readFile, writeFile } from "node:fs/promises";

const runtimeOutputPath = "src/components/ui/layout-tailwind.ts";
const candidatesOutputPath = "src/components/ui/layout-tailwind-candidates.ts";
const layoutEnginePath = "src/components/ui/layout-style-engine.ts";

const properties = [
  "container-type",
  "display",
  "position",
  "inset",
  "top",
  "bottom",
  "left",
  "right",
  "overflow",
  "overflow-x",
  "overflow-y",
  "overscroll-behavior",
  "pointer-events",
  "cursor",
  "contain",
  "padding",
  "padding-top",
  "padding-bottom",
  "padding-left",
  "padding-right",
  "margin",
  "margin-top",
  "margin-bottom",
  "margin-left",
  "margin-right",
  "background",
  "border-radius",
  "border-top-left-radius",
  "border-top-right-radius",
  "border-bottom-right-radius",
  "border-bottom-left-radius",
  "width",
  "min-width",
  "max-width",
  "height",
  "min-height",
  "max-height",
  "grid-area",
  "grid-row",
  "grid-column",
  "order",
  "flex",
  "flex-grow",
  "flex-shrink",
  "flex-basis",
  "align-self",
  "justify-self",
  "border-top",
  "border-bottom",
  "border-left",
  "border-right",
  "visibility",
  "white-space",
  "row-gap",
  "column-gap",
  "flex-direction",
  "flex-wrap",
  "justify-content",
  "align-items",
  "grid-template-columns",
  "grid-template-rows",
  "grid-template-areas",
  "grid-auto-columns",
  "grid-auto-rows",
  "grid-auto-flow",
  "align-content",
  "justify-items",
  "box-shadow",
];

const containerBreakpoints = [
  ["zero", "0px"],
  ["3xs", "320px"],
  ["2xs", "384px"],
  ["xs", "448px"],
  ["sm", "512px"],
  ["md", "576px"],
  ["lg", "640px"],
  ["xl", "768px"],
  ["2xl", "896px"],
  ["3xl", "1024px"],
  ["4xl", "1152px"],
  ["5xl", "1280px"],
];

const screenBreakpoints = [
  ["screen:2xs", "2xs", "0px"],
  ["screen:xs", "xs", "500px"],
  ["screen:sm", "sm", "800px"],
  ["screen:md", "md", "992px"],
  ["screen:lg", "lg", "1200px"],
  ["screen:xl", "xl", "1440px"],
  ["screen:2xl", "2xl", "2560px"],
];

function parseStringArray(source, name) {
  const match = source.match(new RegExp(`export const ${name}[^=]*= \\[(.*?)\\];`, "s"));
  if (!match) throw new Error(`Cannot read ${name} from ${layoutEnginePath}`);
  return [...match[1].matchAll(/"([^"]+)"/g)].map((candidate) => candidate[1]);
}

function parseViewportOrder(source) {
  const match = source.match(/export const LAYOUT_VIEWPORT_ORDER[\s\S]*?= \[(.*?)\];/s);
  if (!match) throw new Error(`Cannot read LAYOUT_VIEWPORT_ORDER from ${layoutEnginePath}`);
  return [...match[1].matchAll(/\{ key: "([^"]+)", token: "([^"]+)" \}/g)].map((candidate) => [
    candidate[1],
    candidate[2],
  ]);
}

function parseThemeMap(source, name) {
  const match = source.match(new RegExp(`\\n  ${name}: \\{(.*?)\\n  \\},`, "s"));
  if (!match) throw new Error(`Cannot read ${name} theme values from ${layoutEnginePath}`);
  return new Map(
    [...match[1].matchAll(/(?:"([^"]+)"|([\w]+)): "([^"]+)",/g)].map((candidate) => [
      candidate[1] ?? candidate[2],
      candidate[3],
    ]),
  );
}

async function assertBreakpointSource() {
  const source = await readFile(layoutEnginePath, "utf8");
  const containerOrder = parseStringArray(source, "LAYOUT_CONTAINER_ORDER");
  const viewportOrder = parseViewportOrder(source);
  const containerTheme = parseThemeMap(source, "container");
  const viewportTheme = parseThemeMap(source, "breakpoints");
  const actualContainer = containerOrder.map((key) => [key, containerTheme.get(key)]);
  const expectedContainer = containerBreakpoints.map(([key, size]) => [key, size]);
  const actualViewport = viewportOrder.map(([key, token]) => [
    key,
    token,
    viewportTheme.get(token),
  ]);
  const expectedViewport = screenBreakpoints.map(([key, token, size]) => [key, token, size]);
  if (JSON.stringify(actualContainer) !== JSON.stringify(expectedContainer)) {
    throw new Error(
      "Layout container breakpoints changed. Update the Tailwind candidate generator.",
    );
  }
  if (JSON.stringify(actualViewport) !== JSON.stringify(expectedViewport)) {
    throw new Error(
      "Layout viewport breakpoints changed. Update the Tailwind candidate generator.",
    );
  }
}

function propertyCandidates(property) {
  const variable = `--scraps-layout-${property}`;
  return [
    `[${variable}:var(--scraps-layout-base-${property})]`,
    `[${property}:var(${variable})]`,
    ...containerBreakpoints
      .slice(1)
      .map(
        ([key, size]) =>
          `@[${size}]:[${variable}:var(--scraps-layout-container-${key}-${property})]`,
      ),
    ...screenBreakpoints.map(
      ([, token, size]) =>
        `min-[${size}]:![${variable}:var(--scraps-layout-screen-${token}-${property})]`,
    ),
  ];
}

function tailwindValue(value) {
  return value.replaceAll(" ", "_");
}

function literalCandidates(property, value) {
  return [`[${property}:${tailwindValue(value)}]`];
}

function finiteValues() {
  const space = ["0px", "2px", "4px", "6px", "8px", "12px", "16px", "24px", "32px"];
  const margin = [...space, "0", "auto"];
  const radius = ["0px", "3px", "4px", "5px", "6px", "8px", "12px", "16px", "999px"];
  const borders = [
    "none",
    "1px solid var(--scraps-theme-border-primary)",
    "1px solid var(--scraps-theme-border-secondary)",
    "1px solid var(--scraps-theme-border-accent)",
    "1px solid var(--scraps-theme-border-danger)",
    "1px solid var(--scraps-theme-border-promotion)",
    "1px solid var(--scraps-theme-border-success)",
    "1px solid var(--scraps-theme-border-warning)",
  ];
  const flexAlignment = ["flex-start", "flex-end", "center", "baseline", "stretch"];
  const contentAlignment = [
    "flex-start",
    "flex-end",
    "start",
    "end",
    "center",
    "space-between",
    "space-around",
    "space-evenly",
    "stretch",
  ];
  return {
    "container-type": ["normal", "inline-size", "size"],
    display: [
      "block",
      "inline",
      "inline-block",
      "flex",
      "inline-flex",
      "grid",
      "inline-grid",
      "contents",
      "none",
    ],
    position: ["static", "relative", "absolute", "fixed", "sticky"],
    overflow: ["visible", "hidden", "scroll", "auto"],
    "overflow-x": ["visible", "hidden", "scroll", "auto"],
    "overflow-y": ["visible", "hidden", "scroll", "auto"],
    "overscroll-behavior": ["contain", "auto", "none"],
    "padding-top": space,
    "padding-bottom": space,
    "padding-left": space,
    "padding-right": space,
    "margin-top": margin,
    "margin-bottom": margin,
    "margin-left": margin,
    "margin-right": margin,
    background: ["var(--background)", "var(--card)", "var(--secondary)", "var(--popover)"],
    "border-top-left-radius": radius,
    "border-top-right-radius": radius,
    "border-bottom-right-radius": radius,
    "border-bottom-left-radius": radius,
    "border-top": borders,
    "border-bottom": borders,
    "border-left": borders,
    "border-right": borders,
    visibility: ["visible", "hidden", "collapse"],
    "white-space": ["break-spaces", "normal", "nowrap", "pre", "pre-line", "pre-wrap"],
    "row-gap": space,
    "column-gap": space,
    "flex-direction": ["row", "row-reverse", "column", "column-reverse"],
    "flex-wrap": ["nowrap", "wrap", "wrap-reverse"],
    "justify-content": [...contentAlignment, "left", "right"],
    "align-items": [...flexAlignment, "start", "end"],
    "grid-auto-flow": ["row", "column", "row dense", "column dense"],
    "align-content": contentAlignment,
    "justify-items": ["start", "end", "center", "stretch"],
    "box-shadow": [
      "var(--scraps-theme-shadow-low, 0px 1px 0px 0px #0000200f)",
      "var(--scraps-theme-shadow-medium, 0px 2px 0px 1px #10103008, 0px 1px 0px 0px #10103008)",
      "var(--scraps-theme-shadow-high, 0px 4px 0px 2px #10103008, 0px 1px 0px 1px #10103008)",
    ],
  };
}

function compactFiniteValues() {
  const groups = [];
  const groupIndexes = new Map();
  const propertyGroups = {};
  for (const [property, values] of Object.entries(finiteValues())) {
    const identity = JSON.stringify(values);
    let groupIndex = groupIndexes.get(identity);
    if (groupIndex === undefined) {
      groupIndex = groups.length;
      groupIndexes.set(identity, groupIndex);
      groups.push(values);
    }
    propertyGroups[property] = groupIndex;
  }
  return { groups, propertyGroups };
}

function generateRuntimeSource() {
  const propertyUnion = properties.map((property) => JSON.stringify(property)).join(" | ");
  const { groups, propertyGroups } = compactFiniteValues();
  return `// Generated by scripts/generate-layout-tailwind.mjs. Edit the generator instead.
import type { CSSProperties } from "react";

import {
  LAYOUT_CONTAINER_ORDER,
  LAYOUT_VIEWPORT_ORDER,
  isLayoutResponsiveValue,
  sanitizeLayoutCssValue,
  type LayoutContainerBreakpoint,
  type LayoutResponsive,
  type LayoutResponsiveBreakpoint,
  type LayoutResponsiveKey,
  type LayoutTheme,
  type LayoutViewportBreakpoint,
} from "./layout-style-engine";

export type LayoutProperty = ${propertyUnion};

export interface LayoutTailwindDeclaration<T = unknown> {
  property: LayoutProperty;
  value: LayoutResponsive<T> | undefined;
  resolve?: ((
    value: never,
    breakpoint: LayoutResponsiveBreakpoint | undefined,
    theme: LayoutTheme
  ) => string | undefined) | undefined;
}

type CustomProperties = CSSProperties & Record<\`--\${string}\`, string>;
type ResolvedValues = {
  base?: string;
  container: Record<string, string | undefined>;
  screen: Record<string, string | undefined>;
};
type ResolvedDeclarations = Map<LayoutProperty, ResolvedValues>;
export interface LayoutActiveBreakpoints {
  container: LayoutContainerBreakpoint;
  viewport: LayoutViewportBreakpoint;
}

const finiteValueGroups: readonly (readonly string[])[] = ${JSON.stringify(groups, null, 2)};
const finitePropertyGroups: Partial<Record<LayoutProperty, number>> = ${JSON.stringify(propertyGroups, null, 2)};

function resolveValue<T>(
  declaration: LayoutTailwindDeclaration<T>,
  value: T | undefined,
  breakpoint: LayoutResponsiveBreakpoint | undefined,
  theme: LayoutTheme
): string | undefined {
  const resolved = declaration.resolve
    ? declaration.resolve(value as never, breakpoint, theme)
    : value;
  return sanitizeLayoutCssValue(resolved);
}

function variableName(prefix: string, property: LayoutProperty): \`--\${string}\` {
  return \`--scraps-layout-\${prefix}-\${property}\`;
}

function propertyVariableName(property: LayoutProperty): \`--\${string}\` {
  return \`--scraps-layout-\${property}\`;
}

function isFinitePropertyValue(property: LayoutProperty, value: string): boolean {
  const groupIndex = finitePropertyGroups[property];
  return groupIndex !== undefined && finiteValueGroups[groupIndex].includes(value);
}

function tailwindValue(value: string): string {
  return value.replaceAll(" ", "_");
}

function literalClass(property: LayoutProperty, value: string, prefix = ""): string {
  return \`\${prefix}[\${property}:\${tailwindValue(value)}]\`;
}

function resolveDeclaration(
  declaration: LayoutTailwindDeclaration,
  theme: LayoutTheme
): ResolvedValues | undefined {
  const { value } = declaration;
  if (value === undefined) return undefined;
  const values: ResolvedValues = { container: {}, screen: {} };
  if (!isLayoutResponsiveValue(value)) {
    values.base = resolveValue(declaration, value, undefined, theme);
    return values.base === undefined ? undefined : values;
  }

  let found = false;
  const write = (
    key: LayoutResponsiveKey,
    breakpoint: LayoutResponsiveBreakpoint,
    scope: "container" | "screen"
  ) => {
    const resolved = resolveValue(declaration, value[key], breakpoint, theme);
    if (resolved === undefined) return;
    found = true;
    if (key === "zero" || values.base === undefined) {
      values.base = resolved;
    } else {
      values[scope][key] = resolved;
    }
  };
  for (const key of LAYOUT_CONTAINER_ORDER) write(key, key, "container");
  for (const { key, token } of LAYOUT_VIEWPORT_ORDER) write(key, token, "screen");
  return found ? values : undefined;
}

function resolveDeclarations(
  declarations: readonly LayoutTailwindDeclaration[],
  theme: LayoutTheme
): ResolvedDeclarations {
  const resolvedByProperty: ResolvedDeclarations = new Map();
  for (const declaration of declarations) {
    const values = resolveDeclaration(declaration, theme);
    if (!values) continue;
    resolvedByProperty.set(declaration.property, values);
  }
  return resolvedByProperty;
}

function activeDeclarationValue(
  values: ResolvedValues,
  active: LayoutActiveBreakpoints
): string | undefined {
  let resolved = values.base;
  const containerIndex = LAYOUT_CONTAINER_ORDER.indexOf(active.container);
  for (let index = 1; index <= containerIndex; index++) {
    const key = LAYOUT_CONTAINER_ORDER[index];
    if (key !== undefined && values.container[key] !== undefined) {
      resolved = values.container[key];
    }
  }
  const viewportIndex = LAYOUT_VIEWPORT_ORDER.findIndex(
    ({ token }) => token === active.viewport
  );
  for (let index = 0; index <= viewportIndex; index++) {
    const key = LAYOUT_VIEWPORT_ORDER[index]?.key;
    if (key !== undefined && values.screen[key] !== undefined) {
      resolved = values.screen[key];
    }
  }
  return resolved;
}

function resolveActiveDeclarations(
  resolvedByProperty: ResolvedDeclarations,
  active: LayoutActiveBreakpoints
): ResolvedDeclarations {
  const activeDeclarations: ResolvedDeclarations = new Map();
  for (const [property, values] of resolvedByProperty) {
    const resolved = activeDeclarationValue(values, active);
    if (resolved !== undefined) {
      activeDeclarations.set(property, {
        base: resolved,
        container: {},
        screen: {},
      });
    }
  }
  return activeDeclarations;
}

function appendSingleDeclarationClasses(
  classes: string[],
  style: CustomProperties,
  property: LayoutProperty,
  values: ResolvedValues,
  theme: LayoutTheme
): void {
  const useResponsiveVariables =
    Object.values(values.container).some(value => value !== undefined) ||
    Object.values(values.screen).some(value => value !== undefined);
  if (values.base !== undefined) {
    if (isFinitePropertyValue(property, values.base) && !useResponsiveVariables) {
      classes.push(literalClass(property, values.base));
    } else {
      const propertyVariable = propertyVariableName(property);
      const baseVariable = variableName("base", property);
      style[baseVariable] = values.base;
      classes.push(
        \`[\${propertyVariable}:var(\${baseVariable})]\`,
        \`[\${property}:var(\${propertyVariable})]\`
      );
    }
  }
  for (const key of LAYOUT_CONTAINER_ORDER.slice(1)) {
    const value = values.container[key];
    if (value === undefined) continue;
    const prefix = \`@[\${theme.container[key]}]:\`;
    const variable = variableName(\`container-\${key}\`, property);
    style[variable] = value;
    classes.push(\`\${prefix}[\${propertyVariableName(property)}:var(\${variable})]\`);
  }
  for (const { key, token } of LAYOUT_VIEWPORT_ORDER) {
    const value = values.screen[key];
    if (value === undefined) continue;
    const prefix = \`min-[\${theme.breakpoints[token]}]:!\`;
    const variable = variableName(\`screen-\${token}\`, property);
    style[variable] = value;
    classes.push(\`\${prefix}[\${propertyVariableName(property)}:var(\${variable})]\`);
  }
}

/** Produces literal Tailwind classes or compact variable-backed classes. */
export function createLayoutTailwindStyle(
  declarations: readonly LayoutTailwindDeclaration[],
  theme: LayoutTheme,
  renderFunction = false,
  active?: LayoutActiveBreakpoints
): { className?: string; style?: CustomProperties } {
  const classes: string[] = [];
  const style: CustomProperties = {};
  let resolvedByProperty = resolveDeclarations(declarations, theme);
  if (renderFunction) {
    if (!active) throw new Error("Render-function Layout requires active breakpoints");
    resolvedByProperty = resolveActiveDeclarations(resolvedByProperty, active);
  }

  for (const [property, values] of resolvedByProperty) {
    appendSingleDeclarationClasses(classes, style, property, values, theme);
  }

  const className = [...new Set(classes)].join(" ");
  return {
    className: className || undefined,
    style: Object.keys(style).length ? style : undefined,
  };
}
`;
}

function generateCandidatesSource() {
  const candidates = new Set();
  for (const property of properties) {
    for (const candidate of propertyCandidates(property)) candidates.add(candidate);
  }
  for (const [property, values] of Object.entries(finiteValues())) {
    for (const value of values) {
      for (const candidate of literalCandidates(property, value)) candidates.add(candidate);
    }
  }
  return `// Generated by scripts/generate-layout-tailwind.mjs. Tailwind scans this file; never import it.
const layoutTailwindCandidates = \`
${[...candidates].join("\n")}
\`;

void layoutTailwindCandidates;
`;
}

async function writeOrCheck(path, generated) {
  if (process.argv.includes("--check")) {
    const current = await readFile(path, "utf8");
    if (current !== generated) throw new Error(`${path} has drifted. Run node ${process.argv[1]}.`);
    return;
  }
  await writeFile(path, generated);
}

await assertBreakpointSource();
await writeOrCheck(runtimeOutputPath, generateRuntimeSource());
await writeOrCheck(candidatesOutputPath, generateCandidatesSource());
