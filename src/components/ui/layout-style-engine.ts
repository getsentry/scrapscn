import type { ContainerQueryBreakpoint } from "./container-query-context";

export type LayoutSpaceSize = "0" | "2xs" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
export type LayoutRadiusSize = "0" | "2xs" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";
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
export type LayoutViewportBreakpoint = "2xs" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
export type LayoutResponsiveBreakpoint = LayoutContainerBreakpoint | LayoutViewportBreakpoint;
export type LayoutScreenBreakpoint = `screen:${LayoutViewportBreakpoint}`;
export type LayoutResponsiveKey = LayoutContainerBreakpoint | LayoutScreenBreakpoint;
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

/** Tests whether a layout value uses responsive breakpoint keys. */
export function isLayoutResponsiveValue<T>(
  value: LayoutResponsive<T> | undefined,
): value is Partial<Record<LayoutResponsiveKey, T>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Rejects characters that can escape a CSS declaration value. */
export function sanitizeLayoutCssValue(value: unknown): string | undefined {
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  const cssValue = String(value);
  return /[{};<>]/.test(cssValue) ? undefined : cssValue;
}

/** Tests whether a name can be used as one CSS declaration property. */
export function isValidLayoutCssPropertyName(name: string): boolean {
  return /^(?:--[A-Za-z_][A-Za-z0-9_-]*|-?[A-Za-z_][A-Za-z0-9_-]*)$/.test(name);
}

function resolveLayoutShorthand<T extends string>(
  value: string | undefined,
  resolveToken: (token: T) => string | undefined,
): string | undefined {
  if (value === undefined) return undefined;
  return value
    .split(" ")
    .map((token) => resolveToken(token as T))
    .join(" ");
}

function resolveLayoutBorderValue(
  variant: Exclude<LayoutBorderVariant, "none">,
  theme: LayoutTheme,
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
  theme: LayoutTheme,
): string | undefined {
  if (border === undefined) return undefined;
  if (border === "none") return "none";
  return border
    .split(" ")
    .map(
      (variant) =>
        `1px solid ${resolveLayoutBorderValue(
          variant as Exclude<LayoutBorderVariant, "none">,
          theme,
        )}`,
    )
    .join(" ");
}

/** Resolves a radius token or shorthand to CSS values. */
export function resolveLayoutRadius(
  value: LayoutShorthand<LayoutRadiusSize, 4> | undefined,
  _breakpoint: LayoutResponsiveBreakpoint | undefined,
  theme: LayoutTheme,
): string | undefined {
  return resolveLayoutShorthand<LayoutRadiusSize>(value, (token) => theme.radius[token]);
}

/** Resolves a spacing token or shorthand to CSS values. */
export function resolveLayoutSpacing(
  value: LayoutShorthand<LayoutSpaceSize, 4> | undefined,
  _breakpoint: LayoutResponsiveBreakpoint | undefined,
  theme: LayoutTheme,
): string | undefined {
  return resolveLayoutShorthand<LayoutSpaceSize>(
    value,
    (token) => theme.space[token] ?? theme.space["0"],
  );
}

/** Resolves a margin token or shorthand to CSS values. */
export function resolveLayoutMargin(
  value: LayoutShorthand<LayoutMargin, 4> | undefined,
  _breakpoint: LayoutResponsiveBreakpoint | undefined,
  theme: LayoutTheme,
): string | undefined {
  return resolveLayoutShorthand<LayoutMargin>(value, (token) =>
    token === "auto" || token === "0" ? token : (theme.space[token] ?? theme.space["0"]),
  );
}

const validDomPropertyNames = new Set(
  `abbr about accept acceptCharset accessKey action allow allowFullScreen allowPaymentRequest allowTransparency allowUserMedia alt async autoCapitalize autoComplete autoCorrect autoFocus autoPlay autoSave capture cellPadding cellSpacing challenge charSet checked children cite class classID className cols colSpan color content contentEditable contextMenu controls controlsList coords crossOrigin dangerouslySetInnerHTML data datatype dateTime decoding default defaultChecked defaultValue defer dir disabled disablePictureInPicture disableRemotePlayback download draggable encType enterKeyHint exportparts fallback fetchPriority fetchpriority for form formAction formEncType formMethod formNoValidate formTarget frameBorder headers height hidden high href hrefLang htmlFor httpEquiv id incremental inert innerHTML inlist inputMode integrity is itemID itemProp itemRef itemScope itemType key keyParams keyType kind label lang list loading loop low marginHeight marginWidth max maxLength media mediaGroup method min minLength multiple muted name noValidate nonce on open optimum option part pattern placeholder playsInline popover popoverTarget popoverTargetAction poster prefix preload profile property radioGroup readOnly ref referrerPolicy rel required resource results reversed role rowSpan rows sandbox scope scoped scrolling seamless security selected shape size sizes slot span spellCheck src srcDoc srcLang srcSet start step style summary suppressContentEditableWarning suppressHydrationWarning tabIndex target title translate type typeof unselectable useMap value valueLink vocab width wmode wrap`.split(
    " ",
  ),
);

export function isValidLayoutDomProp(name: string): boolean {
  return (
    validDomPropertyNames.has(name) || /^(?:aria|data|x)-/i.test(name) || /^on[A-Z]/.test(name)
  );
}
