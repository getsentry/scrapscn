import type { HTMLProps } from "react";

import "./roboto-mono.css";

export { CodeBlock } from "./code-block";

function classNames(...values: Array<string | false | undefined>) {
  return values.filter(Boolean).join(" ");
}

type InlineCodeVariant = "neutral" | "accent";

interface InlineCodeProps extends HTMLProps<HTMLElementTagNameMap["code"]> {
  variant?: InlineCodeVariant;
}

const inlineCodeClasses =
  "m-0 border-0 rounded-[clamp(0.21em,0.28em,0.57em)] bg-[var(--scraps-inline-code-background)] px-[0.3ch] font-[425] text-[var(--scraps-inline-code-content)] [font-family:var(--font-roboto-mono,'Roboto_Mono_Variable'),'Roboto_Mono',monospace] [font-size-adjust:ex-height_0.57] [margin-inline:-0.15ch] [text-box-edge:text_text] [text-box-trim:trim-both]";

const neutralInlineCodeClasses =
  "bg-[var(--scraps-inline-code-neutral-background)] text-[var(--scraps-inline-code-neutral-content)]";

export function InlineCode({ className, variant = "accent", ...props }: InlineCodeProps) {
  return (
    <code
      {...props}
      className={classNames(
        inlineCodeClasses,
        variant === "neutral" && neutralInlineCodeClasses,
        className,
      )}
    />
  );
}
