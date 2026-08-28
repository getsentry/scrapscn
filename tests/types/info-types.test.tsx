import { createRef, type ComponentProps } from "react";

import { InfoText, InfoTip, type InfoTextProps } from "@/components/ui/info";

const regular = {
  children: "Issue owner",
  title: "Owner details",
  variant: "muted",
} satisfies InfoTextProps<"span">;
const overflow = {
  children: "Issue owner",
  mode: "overflowOnly",
  title: "Owner details",
} satisfies InfoTextProps<"span">;
const label = {
  children: "Issue owner",
  htmlFor: "owner",
  title: "Owner details",
} satisfies InfoTextProps<"label">;
type InfoProps = ComponentProps<typeof InfoText>;
const infoTip = {
  ref: createRef<SVGSVGElement>(),
  size: "xs",
  title: "Owner details",
  variant: "warning",
} satisfies ComponentProps<typeof InfoTip>;

void regular;
void overflow;
void label;
void infoTip;

const invalidOverflow: InfoProps = {
  children: "Issue owner",
  // @ts-expect-error Overflow-only InfoText does not accept display.
  display: "block",
  mode: "overflowOnly",
  title: "Owner details",
};
const invalidVariant: InfoTextProps<"span"> = {
  children: "Issue owner",
  title: "Owner details",
  // @ts-expect-error InfoText variants use Tooltip underline vocabulary.
  variant: "purple",
};
// @ts-expect-error Canonical SVG icon props omit color.
const invalidColor: ComponentProps<typeof InfoTip> = { color: "red", title: "Owner details" };
// @ts-expect-error Canonical SVG icon props omit type.
const invalidType: ComponentProps<typeof InfoTip> = { title: "Owner details", type: "button" };

void invalidOverflow;
void invalidVariant;
void invalidColor;
void invalidType;
