"use client";

import { forwardRef, type CSSProperties, type HTMLAttributes } from "react";

import {
  isValidLayoutDomProp,
  LAYOUT_THEME,
  resolveLayoutBorder,
  resolveLayoutMargin,
  resolveLayoutSpacing,
  type LayoutBorderVariant,
  type LayoutMargin,
  type LayoutResponsive,
  type LayoutShorthand,
  type LayoutSpaceSize,
} from "./layout-style-engine";
import { createLayoutTailwindStyle, type LayoutTailwindDeclaration } from "./layout-tailwind";

type SeparatorLayoutProps = {
  border?: LayoutResponsive<LayoutBorderVariant>;
  margin?: LayoutResponsive<LayoutShorthand<LayoutMargin, 4>>;
  padding?: LayoutResponsive<LayoutShorthand<LayoutSpaceSize, 4>>;
};

/** Props for the native horizontal or vertical Scraps separator. */
export type SeparatorProps = SeparatorLayoutProps & {
  orientation: "horizontal" | "vertical";
  children?: never;
} & Omit<HTMLAttributes<HTMLHRElement>, "aria-orientation">;

/** A native `hr` with canonical responsive spacing and directional borders. */
export const Separator = forwardRef<HTMLHRElement, SeparatorProps>(function Separator(
  { orientation, border = "primary", margin = "0", padding, className, ...props },
  ref,
) {
  const directionalProperty = orientation === "horizontal" ? "border-bottom" : "border-left";
  const declarations = [
    { property: "width", value: orientation === "horizontal" ? "auto" : "1px" },
    { property: "height", value: orientation === "horizontal" ? "1px" : "auto" },
    { property: "flex-shrink", value: "0" },
    { property: "align-self", value: "stretch" },
    { property: "border-top", value: "none" },
    { property: "border-right", value: "none" },
    { property: "border-bottom", value: "none" },
    { property: "border-left", value: "none" },
    { property: "padding", value: padding, resolve: resolveLayoutSpacing },
    { property: "margin", value: margin, resolve: resolveLayoutMargin },
    {
      property: directionalProperty,
      value: border,
      resolve: resolveLayoutBorder,
    },
  ] satisfies LayoutTailwindDeclaration[];
  const { className: generatedClassName, style: generatedStyle } = createLayoutTailwindStyle(
    declarations,
    LAYOUT_THEME,
  );
  const domProps = Object.fromEntries(
    Object.entries(props).filter(([name]) => isValidLayoutDomProp(name)),
  );

  return (
    <hr
      {...domProps}
      ref={ref}
      aria-orientation={orientation}
      className={[generatedClassName, className].filter(Boolean).join(" ")}
      style={{ ...generatedStyle, ...(props.style as CSSProperties | undefined) }}
    />
  );
});
