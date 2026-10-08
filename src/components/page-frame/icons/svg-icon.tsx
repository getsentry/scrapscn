import * as React from "react";

import { cn } from "../../../lib/utils";

export type IconSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
export type SVGIconDirection = "up" | "right" | "down" | "left";
export type IconVariant = "muted" | "accent" | "success" | "warning" | "danger" | "promotion";

export interface SVGIconProps extends Omit<React.SVGAttributes<SVGSVGElement>, "color" | "type"> {
  size?: IconSize | number;
  variant?: IconVariant;
  ref?: React.Ref<SVGSVGElement>;
}

const ICON_SIZES: Record<IconSize, string> = {
  xs: "12px",
  sm: "14px",
  md: "16px",
  lg: "24px",
  xl: "32px",
  "2xl": "72px",
};

const ICON_DIRECTION_TO_ROTATION_ANGLE = {
  up: 0,
  right: 90,
  down: 180,
  left: 270,
} as const;

// Maps a semantic variant to the matching scrapscn design token. Default is
// `currentColor`, so icons inherit color from Tailwind text utilities.
const VARIANT_COLOR: Record<IconVariant, string> = {
  muted: "var(--muted-foreground)",
  accent: "var(--primary)",
  success: "var(--success-vibrant)",
  warning: "var(--warning)",
  danger: "var(--destructive)",
  promotion: "var(--promotion)",
};

export function SvgIcon({ size = "md", variant, className, ...rest }: SVGIconProps) {
  const dim = typeof size === "number" ? `${size}px` : ICON_SIZES[size];
  const fill = variant ? VARIANT_COLOR[variant] : "currentColor";

  return (
    <svg
      aria-hidden={rest["aria-label"] ? undefined : true}
      role="img"
      viewBox="0 0 16 16"
      className={cn("inline-block shrink-0", className)}
      {...rest}
      fill={fill}
      height={dim}
      width={dim}
    />
  );
}

SvgIcon.ICON_DIRECTION_TO_ROTATION_ANGLE = ICON_DIRECTION_TO_ROTATION_ANGLE;
SvgIcon.ICON_SIZES = ICON_SIZES;
