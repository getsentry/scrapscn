"use client";

import type { CSSProperties, ImgHTMLAttributes, Ref } from "react";

import type { Responsive } from "./layout";
import { LAYOUT_THEME, resolveLayoutRadius, type LayoutRadiusSize } from "./layout-style-engine";
import { createLayoutTailwindStyle } from "./layout-tailwind";

export interface ImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "height" | "width"> {
  alt: string;
  aspectRatio?: CSSProperties["aspectRatio"];
  height?: Responsive<CSSProperties["height"]>;
  loading?: "eager" | "lazy";
  objectFit?: "contain" | "cover";
  objectPosition?: "center" | "top" | "bottom" | "left" | "right" | (string & {});
  radius?: Responsive<LayoutRadiusSize>;
  ref?: Ref<HTMLImageElement>;
  src: string;
  width?: Responsive<CSSProperties["width"]>;
}

/** Renders a native image with regular Scraps responsive dimensions and radius. */
export function Image({
  aspectRatio,
  className,
  height,
  loading = "lazy",
  objectFit,
  objectPosition,
  radius,
  ref,
  style,
  width,
  ...imageProps
}: ImageProps) {
  const imageStyle: CSSProperties = {
    aspectRatio,
    objectFit,
    objectPosition,
    ...style,
  };
  const { className: layoutClassName, style: layoutStyle } = createLayoutTailwindStyle(
    [
      { property: "width", value: width ?? "100%" },
      { property: "height", value: height ?? "auto" },
      {
        property: "border-radius",
        value: radius,
        resolve: resolveLayoutRadius,
      },
    ],
    LAYOUT_THEME,
  );

  return (
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    <img
      {...imageProps}
      className={[layoutClassName, className].filter(Boolean).join(" ")}
      loading={loading}
      ref={ref}
      style={{ ...layoutStyle, ...imageStyle }}
    />
  );
}
