/* eslint-disable jsx-a11y/alt-text -- This fixture intentionally checks a missing-alt type error. */
import { Image, type ImageProps } from "@/components/ui/image";
import { createRef } from "react";

const imageProps = {
  alt: "Issue preview",
  aspectRatio: "16 / 9",
  height: { zero: "auto", md: "300px" },
  loading: "lazy",
  objectFit: "cover",
  objectPosition: "top",
  radius: { zero: "sm", md: "full" },
  ref: createRef<HTMLImageElement>(),
  src: "data:image/svg+xml,example",
  width: { zero: "100%", md: "400px" },
} satisfies ImageProps;

<Image {...imageProps} />;
// @ts-expect-error Image requires alt text.
<Image src="data:image/svg+xml,example" />;
// @ts-expect-error The regular Scraps fit variants are fixed.
<Image alt="Example" objectFit="fill" src="data:image/svg+xml,example" />;

export {};
