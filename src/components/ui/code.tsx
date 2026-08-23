import { serializeStyles, type SerializedStyles } from "@emotion/serialize";
import type { HTMLProps } from "react";

import styles from "./code.module.css";

export { CodeBlock } from "./code-block";

function classNames(...values: Array<string | false | undefined>) {
  return values.filter(Boolean).join(" ");
}

type InlineCodeVariant = "neutral" | "accent";

interface InlineCodeProps extends HTMLProps<HTMLElementTagNameMap["code"]> {
  variant?: InlineCodeVariant;
}

interface InlineCodeTheme {
  font: { family: { mono: string } };
  radius: { "2xs": string };
  tokens: {
    background: {
      transparent: {
        neutral: { muted: string };
        promotion: { muted: string };
      };
    };
    content: { primary: string; promotion: string };
  };
}

export function inlineCodeStyles(
  theme: InlineCodeTheme,
  props?: InlineCodeProps
): SerializedStyles {
  const neutral = props?.variant === "neutral";
  const color = neutral
    ? theme.tokens.content.primary
    : theme.tokens.content.promotion;
  const background = neutral
    ? theme.tokens.background.transparent.neutral.muted
    : theme.tokens.background.transparent.promotion.muted;

  return serializeStyles([
    [
      "margin:0",
      "padding:0",
      "border:none",
      `font-family:${theme.font.family.mono}`,
      "font-size-adjust:ex-height 0.57",
      `color:${color}`,
      `background:${background}`,
      "padding-inline:0.3ch",
      "margin-inline:-0.15ch",
      `border-radius:${theme.radius["2xs"]}`,
      "border-radius:clamp(0.21em, 0.28em, 0.57em)",
      "text-box-edge:text text",
      "text-box-trim:trim-both",
    ].join(";"),
  ]);
}

export function InlineCode({ className, variant = "accent", ...props }: InlineCodeProps) {
  return (
    <code
      {...props}
      className={classNames(
        styles.inlineCode,
        variant === "neutral" && styles.inlineCodeNeutral,
        className
      )}
    />
  );
}
