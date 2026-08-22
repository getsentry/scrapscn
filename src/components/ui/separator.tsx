"use client";

import { forwardRef, type HTMLAttributes } from "react";

import {
  compileLayoutStyle,
  createLayoutCssDeclaration,
  isValidLayoutDomProp,
  resolveLayoutBorder,
  resolveLayoutMargin,
  resolveLayoutSpacing,
  type LayoutBorderVariant,
  type LayoutMargin,
  type LayoutResponsive,
  type LayoutShorthand,
  type LayoutSpaceSize,
} from "./layout-style-engine";

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
export const Separator = forwardRef<HTMLHRElement, SeparatorProps>(
  function Separator(
    {
      orientation,
      border = "primary",
      margin = "0",
      padding,
      className,
      ...props
    },
    ref
  ) {
    const directionalProperty =
      orientation === "horizontal" ? "border-bottom" : "border-left";
    const { className: generatedClassName, css } = compileLayoutStyle(
      "separator",
      [
        createLayoutCssDeclaration(
          "width",
          orientation === "horizontal" ? "auto" : "1px"
        ),
        createLayoutCssDeclaration(
          "height",
          orientation === "horizontal" ? "1px" : "auto"
        ),
        createLayoutCssDeclaration("flex-shrink", "0"),
        createLayoutCssDeclaration("align-self", "stretch"),
        createLayoutCssDeclaration("border", "none"),
        createLayoutCssDeclaration("padding", padding, resolveLayoutSpacing),
        createLayoutCssDeclaration("margin", margin, resolveLayoutMargin),
        createLayoutCssDeclaration(
          directionalProperty,
          border,
          (value, breakpoint, theme) => {
            const resolved = resolveLayoutBorder(value, breakpoint, theme);
            return resolved ? `${resolved} !important` : undefined;
          }
        ),
      ]
    );
    const domProps: Record<string, unknown> = {};
    for (const [name, value] of Object.entries(props)) {
      if (isValidLayoutDomProp(name)) domProps[name] = value;
    }

    return (
      <>
        {generatedClassName && css ? (
          <style href={generatedClassName} precedence="scraps-layout">
            {css}
          </style>
        ) : null}
        <hr
          {...domProps}
          ref={ref}
          aria-orientation={orientation}
          className={[generatedClassName, className].filter(Boolean).join(" ")}
        />
      </>
    );
  }
);
