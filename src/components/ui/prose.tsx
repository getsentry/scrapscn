import {
  createElement,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";

import "./roboto-mono.css";
import { joinTextClassNames, ROBOTO_MONO_FONT_FAMILY_CLASS_NAMES } from "./text";

export type ProseProps<T extends keyof HTMLElementTagNameMap = "div"> = {
  as?: T;
  children?: ReactNode;
  ref?: Ref<HTMLElementTagNameMap[T] | null>;
} & HTMLAttributes<HTMLElementTagNameMap[T]>;

const proseBlockSpacingClasses = [
  "[&_h1]:mb-6",
  "[&_h2]:mb-6",
  "[&_h3]:mb-6",
  "[&_h4]:mb-6",
  "[&_h5]:mb-6",
  "[&_h6]:mb-6",
  "[&_p]:mb-6",
  "[&_ul:not([role=listbox],[role=grid],[role=menu])]:mb-6",
  "[&_ol:not([role=listbox],[role=grid],[role=menu])]:mb-6",
  "[&_table]:mb-6",
  "[&_dl]:mb-6",
  "[&_blockquote]:mb-6",
  "[&_form]:mb-6",
  "[&_pre]:mb-6",
  "[&_.auto-select-text]:mb-6",
  "[&_.section]:mb-6",
  "[&_[class^=highlight-]]:mb-6",
  "[&_h1:last-child]:mb-0",
  "[&_h2:last-child]:mb-0",
  "[&_h3:last-child]:mb-0",
  "[&_h4:last-child]:mb-0",
  "[&_h5:last-child]:mb-0",
  "[&_h6:last-child]:mb-0",
  "[&_p:last-child]:mb-0",
  "[&_ul:not([role=listbox],[role=grid],[role=menu]):last-child]:mb-0",
  "[&_ol:not([role=listbox],[role=grid],[role=menu]):last-child]:mb-0",
  "[&_table:last-child]:mb-0",
  "[&_dl:last-child]:mb-0",
  "[&_blockquote:last-child]:mb-0",
  "[&_form:last-child]:mb-0",
  "[&_pre:last-child]:mb-0",
  "[&_.auto-select-text:last-child]:mb-0",
  "[&_.section:last-child]:mb-0",
  "[&_[class^=highlight-]:last-child]:mb-0",
];

const proseInlineCodeClasses = [
  "[&_code:not(pre_code)]:m-0",
  "[&_code:not(pre_code)]:border-0",
  "[&_code:not(pre_code)]:rounded-[clamp(0.21em,0.28em,0.57em)]",
  "[&_code:not(pre_code)]:bg-[var(--scraps-inline-code-background)]",
  "[&_code:not(pre_code)]:px-[0.3ch]",
  ROBOTO_MONO_FONT_FAMILY_CLASS_NAMES.proseInlineCode,
  "[&_code:not(pre_code)]:text-[var(--scraps-inline-code-content)]",
  "[&_code:not(pre_code)]:[font-size-adjust:ex-height_0.57]",
  "[&_code:not(pre_code)]:[margin-inline:-0.15ch]",
  "[&_code:not(pre_code)]:[text-box-edge:text_text]",
  "[&_code:not(pre_code)]:[text-box-trim:trim-both]",
];

const proseKbdClasses = [
  "[&_kbd]:m-0",
  "[&_kbd]:inline-flex",
  "[&_kbd]:h-[1.67em]",
  "[&_kbd]:items-center",
  "[&_kbd]:justify-center",
  "[&_kbd]:rounded-[5px]",
  "[&_kbd]:border",
  "[&_kbd]:border-b-2",
  "[&_kbd]:border-[var(--scraps-hotkey-border-primary)]",
  "[&_kbd]:bg-[var(--scraps-hotkey-background-primary)]",
  "[&_kbd]:px-1",
  ROBOTO_MONO_FONT_FAMILY_CLASS_NAMES.proseKbd,
  "[&_kbd]:[font-size:12px]",
  "[&_kbd]:font-medium",
  "[&_kbd]:text-[var(--scraps-hotkey-content-primary)]",
  "[&_kbd]:shadow-none",
];

const proseClasses = [
  ...proseBlockSpacingClasses,
  ...proseInlineCodeClasses,
  ...proseKbdClasses,
].join(" ");

export function Prose<T extends keyof HTMLElementTagNameMap = "div">({
  as,
  children,
  className,
  ...props
}: ProseProps<T>): ReactElement {
  return createElement(
    as ?? "article",
    { ...props, className: joinTextClassNames(proseClasses, className) },
    children,
  );
}
