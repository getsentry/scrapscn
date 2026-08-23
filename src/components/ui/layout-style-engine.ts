import isPropValid from "@emotion/is-prop-valid";

import type { ContainerQueryBreakpoint } from "./container-query-context";

export type LayoutSpaceSize =
  | "0"
  | "2xs"
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl";
export type LayoutRadiusSize =
  | "0"
  | "2xs"
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "full";
export type LayoutBorderVariant =
  | "primary"
  | "secondary"
  | "muted"
  | "accent"
  | "danger"
  | "success"
  | "warning"
  | "promotion"
  | "none";
export type LayoutSurfaceVariant = "primary" | "secondary" | "tertiary";
export type LayoutContainerBreakpoint = ContainerQueryBreakpoint;
export type LayoutViewportBreakpoint =
  | "2xs"
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl";
export type LayoutResponsiveBreakpoint =
  | LayoutContainerBreakpoint
  | LayoutViewportBreakpoint;
export type LayoutScreenBreakpoint = `screen:${LayoutViewportBreakpoint}`;
export type LayoutResponsiveKey =
  | LayoutContainerBreakpoint
  | LayoutScreenBreakpoint;
export type LayoutResponsive<T> = T | Partial<Record<LayoutResponsiveKey, T>>;
export type LayoutShorthand<T extends string, N extends 4 | 2> = N extends 4
  ? `${T} ${T} ${T} ${T}` | `${T} ${T} ${T}` | `${T} ${T}` | T
  : N extends 2
  ? `${T} ${T}` | T
  : never;
export type LayoutMargin = LayoutSpaceSize | "auto" | "0";

export interface LayoutTheme {
  breakpoints: Record<LayoutViewportBreakpoint, string>;
  container: Record<LayoutContainerBreakpoint, string>;
  radius: Record<LayoutRadiusSize, string>;
  shadow: Record<"low" | "medium" | "high", string>;
  space: Record<LayoutSpaceSize, string>;
  tokens: {
    background: Record<LayoutSurfaceVariant | "overlay", string>;
    border: {
      accent: { vibrant: string };
      danger: { vibrant: string };
      muted: string;
      primary: string;
      promotion: { vibrant: string };
      secondary: string;
      success: { vibrant: string };
      warning: { vibrant: string };
    };
  };
}

export const LAYOUT_CONTAINER_ORDER: readonly LayoutContainerBreakpoint[] = [
  "zero",
  "3xs",
  "2xs",
  "xs",
  "sm",
  "md",
  "lg",
  "xl",
  "2xl",
  "3xl",
  "4xl",
  "5xl",
];

export const LAYOUT_VIEWPORT_ORDER: ReadonlyArray<{
  key: LayoutScreenBreakpoint;
  token: LayoutViewportBreakpoint;
}> = [
  { key: "screen:2xs", token: "2xs" },
  { key: "screen:xs", token: "xs" },
  { key: "screen:sm", token: "sm" },
  { key: "screen:md", token: "md" },
  { key: "screen:lg", token: "lg" },
  { key: "screen:xl", token: "xl" },
  { key: "screen:2xl", token: "2xl" },
];

export const LAYOUT_THEME: LayoutTheme = {
  breakpoints: {
    "2xs": "0px",
    xs: "500px",
    sm: "800px",
    md: "992px",
    lg: "1200px",
    xl: "1440px",
    "2xl": "2560px",
  },
  container: {
    zero: "0px",
    "3xs": "320px",
    "2xs": "384px",
    xs: "448px",
    sm: "512px",
    md: "576px",
    lg: "640px",
    xl: "768px",
    "2xl": "896px",
    "3xl": "1024px",
    "4xl": "1152px",
    "5xl": "1280px",
  },
  radius: {
    "0": "0px",
    "2xs": "3px",
    xs: "4px",
    sm: "5px",
    md: "6px",
    lg: "8px",
    xl: "12px",
    "2xl": "16px",
    full: "999px",
  },
  shadow: {
    low: "var(--scraps-theme-shadow-low, 0px 1px 0px 0px #0000200f)",
    medium:
      "var(--scraps-theme-shadow-medium, 0px 2px 0px 1px #10103008, 0px 1px 0px 0px #10103008)",
    high: "var(--scraps-theme-shadow-high, 0px 4px 0px 2px #10103008, 0px 1px 0px 1px #10103008)",
  },
  space: {
    "0": "0px",
    "2xs": "2px",
    xs: "4px",
    sm: "6px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    "2xl": "24px",
    "3xl": "32px",
  },
  tokens: {
    background: {
      primary: "var(--background)",
      secondary: "var(--card)",
      tertiary: "var(--secondary)",
      overlay: "var(--popover)",
    },
    border: {
      primary: "var(--scraps-theme-border-primary)",
      secondary: "var(--scraps-theme-border-secondary)",
      muted: "var(--scraps-theme-border-secondary)",
      accent: { vibrant: "var(--scraps-theme-border-accent)" },
      danger: { vibrant: "var(--scraps-theme-border-danger)" },
      promotion: { vibrant: "var(--scraps-theme-border-promotion)" },
      success: { vibrant: "var(--scraps-theme-border-success)" },
      warning: { vibrant: "var(--scraps-theme-border-warning)" },
    },
  },
};

export type LayoutCssResolver<T> = (
  value: T | undefined,
  breakpoint: LayoutResponsiveBreakpoint | undefined,
  theme: LayoutTheme
) => string | undefined;

export interface LayoutCssDeclaration {
  property: string;
  theme: LayoutTheme;
  value: LayoutResponsive<unknown> | undefined;
  resolve: (
    value: unknown,
    breakpoint: LayoutResponsiveBreakpoint | undefined
  ) => string | undefined;
}

interface CompiledResponsiveDeclaration {
  base?: string;
  queries: string[];
}

/** Tests whether a layout value uses responsive breakpoint keys. */
export function isLayoutResponsiveValue<T>(
  value: LayoutResponsive<T> | undefined
): value is Partial<Record<LayoutResponsiveKey, T>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizeLayoutCssValue(value: unknown): string | undefined {
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  const cssValue = String(value);
  return /[{};<>]/.test(cssValue) ? undefined : cssValue;
}

function compileResponsiveDeclaration(
  declaration: LayoutCssDeclaration,
  selector?: string
): CompiledResponsiveDeclaration {
  if (!isLayoutResponsiveValue(declaration.value)) {
    const value = declaration.resolve(declaration.value, undefined);
    return {
      base:
        value === undefined ? undefined : `${declaration.property}: ${value};`,
      queries: [],
    };
  }

  const responsiveValue = declaration.value;
  let first = true;
  let base: string | undefined;
  const queries: string[] = [];
  const emit = (
    key: LayoutResponsiveKey,
    breakpoint: LayoutResponsiveBreakpoint,
    atRule: "@container" | "@media",
    size: string
  ) => {
    const value = declaration.resolve(responsiveValue[key], breakpoint);
    if (value === undefined) return;
    const property = `${declaration.property}: ${value};`;
    if (first) {
      base = property;
      first = false;
      return;
    }
    queries.push(
      selector
        ? `${atRule} (min-width: ${size}) { ${selector} { ${property} } }`
        : `${atRule} (min-width: ${size}) { ${property} }`
    );
  };
  for (const breakpoint of LAYOUT_CONTAINER_ORDER) {
    emit(
      breakpoint,
      breakpoint,
      "@container",
      declaration.theme.container[breakpoint]
    );
  }
  for (const { key, token } of LAYOUT_VIEWPORT_ORDER) {
    emit(key, token, "@media", declaration.theme.breakpoints[token]);
  }
  return { base, queries };
}

/** Compiles one public responsive property without a component selector. */
export function compileResponsiveLayoutValue<T>(
  property: string,
  value: LayoutResponsive<T> | undefined,
  theme: LayoutTheme,
  resolver?: LayoutCssResolver<T>
): string | undefined {
  const declaration = createLayoutCssDeclaration(
    property,
    value,
    resolver,
    theme
  );
  const compiled = compileResponsiveDeclaration(declaration);
  return (
    [compiled.base, ...compiled.queries].filter(Boolean).join("") || undefined
  );
}

function resolveLayoutShorthand<T extends string>(
  value: string | undefined,
  resolveToken: (token: T) => string | undefined
): string | undefined {
  if (value === undefined) return undefined;
  return value
    .split(" ")
    .map((token) => resolveToken(token as T))
    .join(" ");
}

function resolveLayoutBorderValue(
  variant: Exclude<LayoutBorderVariant, "none">,
  theme: LayoutTheme
): string {
  if (variant === "primary") return theme.tokens.border.primary;
  if (variant === "secondary" || variant === "muted") {
    return theme.tokens.border.secondary;
  }
  return theme.tokens.border[variant].vibrant;
}

/** Resolves a semantic border token to a one-pixel CSS border. */
export function resolveLayoutBorder(
  border: LayoutBorderVariant | undefined,
  _breakpoint: LayoutResponsiveBreakpoint | undefined,
  theme: LayoutTheme
): string | undefined {
  if (border === undefined) return undefined;
  if (border === "none") return "none";
  return border
    .split(" ")
    .map(
      (variant) =>
        `1px solid ${resolveLayoutBorderValue(
          variant as Exclude<LayoutBorderVariant, "none">,
          theme
        )}`
    )
    .join(" ");
}

/** Resolves a radius token or shorthand to CSS values. */
export function resolveLayoutRadius(
  value: LayoutShorthand<LayoutRadiusSize, 4> | undefined,
  _breakpoint: LayoutResponsiveBreakpoint | undefined,
  theme: LayoutTheme
): string | undefined {
  return resolveLayoutShorthand<LayoutRadiusSize>(
    value,
    (token) => theme.radius[token]
  );
}

/** Resolves a spacing token or shorthand to CSS values. */
export function resolveLayoutSpacing(
  value: LayoutShorthand<LayoutSpaceSize, 4> | undefined,
  _breakpoint: LayoutResponsiveBreakpoint | undefined,
  theme: LayoutTheme
): string | undefined {
  return resolveLayoutShorthand<LayoutSpaceSize>(
    value,
    (token) => theme.space[token] ?? theme.space["0"]
  );
}

/** Resolves a margin token or shorthand to CSS values. */
export function resolveLayoutMargin(
  value: LayoutShorthand<LayoutMargin, 4> | undefined,
  _breakpoint: LayoutResponsiveBreakpoint | undefined,
  theme: LayoutTheme
): string | undefined {
  return resolveLayoutShorthand<LayoutMargin>(value, (token) =>
    token === "auto" || token === "0"
      ? token
      : theme.space[token] ?? theme.space["0"]
  );
}

/** Creates one declaration for the shared responsive CSS compiler. */
export function createLayoutCssDeclaration<T>(
  property: string,
  value: LayoutResponsive<T> | undefined,
  resolver?: LayoutCssResolver<T>,
  theme: LayoutTheme = LAYOUT_THEME
): LayoutCssDeclaration {
  return {
    property,
    theme,
    value: value as LayoutResponsive<unknown> | undefined,
    resolve: (candidate, breakpoint) =>
      resolver
        ? resolver(candidate as T | undefined, breakpoint, theme)
        : sanitizeLayoutCssValue(candidate),
  };
}

function hashCompiledLayoutCss(css: string): string {
  let result = 5381;
  for (let index = 0; index < css.length; index++) {
    result = (result * 33) ^ css.charCodeAt(index);
  }
  return (result >>> 0).toString(36);
}

export interface CompiledLayoutStyle {
  className?: string;
  css?: string;
}

/** Compiles and hashes canonical CSS so equivalent responsive values dedupe. */
export function compileLayoutStyle(
  namespace: "layout" | "separator" | "text",
  declarations: readonly LayoutCssDeclaration[]
): CompiledLayoutStyle {
  if (!declarations.some((declaration) => declaration.value !== undefined)) {
    return {};
  }
  const placeholder = "scraps-layout-placeholder";
  const selector = `:where(.${placeholder})`;
  const base: string[] = [];
  const queries: string[] = [];
  for (const declaration of declarations) {
    const compiled = compileResponsiveDeclaration(declaration, selector);
    if (compiled.base) base.push(compiled.base);
    queries.push(...compiled.queries);
  }
  const canonicalCss = `${selector} { ${base.join(" ")} } ${queries.join(" ")}`;
  const className = `scraps-${namespace}-${hashCompiledLayoutCss(
    canonicalCss
  )}`;
  return {
    className,
    css: canonicalCss.replaceAll(placeholder, className),
  };
}

/** Joins generated and consumer class names without empty tokens. */
export function combineLayoutClassNames(
  ...classNames: Array<string | undefined>
): string | undefined {
  const combined = classNames.filter(Boolean).join(" ");
  return combined || undefined;
}

/** Matches Emotion's native DOM prop validity gate. */
export function isValidLayoutDomProp(name: string): boolean {
  return isPropValid(name);
}
