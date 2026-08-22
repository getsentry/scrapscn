"use client";

import type {
  CSSProperties,
  ImgHTMLAttributes,
  Ref,
} from "react";

import { Container, type Responsive } from "./layout";
import type { LayoutRadiusSize } from "./layout-style-engine";

export interface ImageProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, "height" | "width"> {
  alt: string;
  aspectRatio?: CSSProperties["aspectRatio"];
  height?: Responsive<CSSProperties["height"]>;
  loading?: "eager" | "lazy";
  objectFit?: "contain" | "cover";
  objectPosition?:
    | "center"
    | "top"
    | "bottom"
    | "left"
    | "right"
    | (string & {});
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

  return (
    <Container
      height={height ?? "auto"}
      radius={radius}
      width={width ?? "100%"}
    >
      {({ className: layoutClassName }) => (
        // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
        <img
          {...imageProps}
          className={[layoutClassName, className].filter(Boolean).join(" ")}
          loading={loading}
          ref={ref}
          style={imageStyle}
        />
      )}
    </Container>
  );
}
