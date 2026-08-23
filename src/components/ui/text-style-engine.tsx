import type { ReactElement } from "react";

import {
  compileLayoutStyle,
  createLayoutCssDeclaration,
  LAYOUT_THEME,
  type LayoutCssDeclaration,
  type LayoutResponsiveBreakpoint,
} from "./layout-style-engine";

export type TextSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
export type HeadingSize = TextSize | "3xl" | "4xl";

const fontSizes: Record<HeadingSize, string> = {
  xs: "11px",
  sm: "12px",
  md: "14px",
  lg: "16px",
  xl: "20px",
  "2xl": "24px",
  "3xl": "32px",
  "4xl": "40px",
};

export function resolveFontSize(
  size: HeadingSize | "inherit" | undefined
): string | undefined {
  return size === "inherit" ? size : size === undefined ? undefined : fontSizes[size];
}

export function resolveLineHeight(
  density: "compressed" | "comfortable" | "inherit" | undefined
): string | undefined {
  if (density === "compressed") return "1";
  if (density === "comfortable") return "1.4";
  return density;
}

export function textDeclaration<T>(
  property: string,
  value: T | Partial<Record<string, T>> | undefined,
  resolver?: (
    value: T | undefined,
    breakpoint: LayoutResponsiveBreakpoint | undefined
  ) => string | undefined
): LayoutCssDeclaration {
  return createLayoutCssDeclaration(
    property,
    value,
    resolver,
    LAYOUT_THEME
  );
}

export function createTextStyleResource(
  declarations: readonly LayoutCssDeclaration[]
): { className?: string; resource?: ReactElement } {
  const { className, css } = compileLayoutStyle("text", declarations);
  return {
    className,
    resource:
      className && css ? (
        <style href={className} precedence="scraps-text">
          {css}
        </style>
      ) : undefined,
  };
}

export function combineTextClassNames(
  ...classNames: Array<string | undefined | false>
): string | undefined {
  const combined = classNames.filter(Boolean).join(" ");
  return combined || undefined;
}
