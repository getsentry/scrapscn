import {
  createElement,
  Fragment,
  type CSSProperties,
  type DetailedHTMLProps,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";

import "./roboto-mono.css";
import "./rubik.css";
import {
  isLayoutResponsiveValue,
  isValidLayoutDomProp,
  type LayoutResponsive as Responsive,
} from "./layout-style-engine";
import { createTextTailwindClassName, type TextTailwindDeclaration } from "./text-tailwind";

export type TextPrimitive = "span" | "p" | "label" | "div" | "time" | "legend";
export type TextVariant =
  | "accent"
  | "danger"
  | "primary"
  | "promotion"
  | "secondary"
  | "success"
  | "warning"
  | "muted"
  | "inherit";
export type TextSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

type DisplayValue = "inline" | "block" | "inline-block" | "none";

export interface BaseTextProps {
  align?: Responsive<"left" | "center" | "right" | "justify">;
  bold?: boolean;
  cursor?: "default" | "pointer" | "text" | "move" | "not-allowed" | "wait" | "help";
  density?: Responsive<"compressed" | "comfortable">;
  ellipsis?: boolean;
  fraction?: boolean;
  italic?: boolean;
  monospace?: boolean;
  strikethrough?: boolean;
  tabular?: boolean;
  textWrap?: "wrap" | "nowrap" | "balance" | "pretty" | "stable";
  underline?: boolean | "dotted";
  uppercase?: boolean;
  variant?: TextVariant;
  wordBreak?: "normal" | "break-all" | "keep-all" | "break-word";
  wrap?: "nowrap" | "normal" | "pre" | "pre-line" | "pre-wrap";
}

type ExclusiveTextEllipsisProps =
  | { display?: never; ellipsis?: true; wrap?: never }
  | {
      display?: Responsive<DisplayValue>;
      ellipsis?: never;
      wrap?: BaseTextProps["wrap"];
    };

interface TextAttributes<T extends TextPrimitive = "span">
  extends
    BaseTextProps,
    Omit<
      DetailedHTMLProps<HTMLAttributes<HTMLElementTagNameMap[T]>, HTMLElementTagNameMap[T]>,
      "style"
    > {
  as?: T;
  children: ReactNode;
  color?: never;
  dateTime?: T extends "time" ? string : never;
  htmlFor?: T extends "label" ? string : never;
  size?: Responsive<TextSize>;
  /** @deprecated Use Text props for styling. */
  style?: CSSProperties;
}

export type TextProps<T extends TextPrimitive> = TextAttributes<T> & ExclusiveTextEllipsisProps;

export type TextPropsWithRenderFunction<T extends TextPrimitive = "span"> = BaseTextProps &
  ExclusiveTextEllipsisProps & {
    as?: never;
    children: (props: { className: string }) => ReactNode | undefined;
    color?: never;
    dateTime?: never;
    htmlFor?: never;
    ref?: never;
    size?: Responsive<TextSize>;
  } & Partial<
    Record<
      Exclude<
        keyof DetailedHTMLProps<HTMLAttributes<HTMLElementTagNameMap[T]>, HTMLElementTagNameMap[T]>,
        "children"
      >,
      never
    >
  >;

const textPropNames = new Set<string>([
  "align",
  "as",
  "bold",
  "cursor",
  "density",
  "display",
  "ellipsis",
  "fraction",
  "italic",
  "monospace",
  "size",
  "strikethrough",
  "tabular",
  "textWrap",
  "underline",
  "uppercase",
  "variant",
  "wordBreak",
  "wrap",
]);

const variantClassNames: Record<TextVariant, string | undefined> = {
  accent: "text-[var(--scraps-content-accent,#653de9)]",
  danger: "text-[var(--scraps-content-danger,#d50000)]",
  inherit: undefined,
  muted: "text-[var(--scraps-content-secondary,#6a6772)]",
  primary: "text-[var(--scraps-content-primary,#302e36)]",
  promotion: "text-[var(--scraps-content-promotion,#c8007e)]",
  secondary: "text-[var(--scraps-content-secondary,#6a6772)]",
  success: "text-[var(--scraps-content-success,#008900)]",
  warning: "text-[var(--scraps-content-warning,#a45200)]",
};

const fontSizes = new Map<string, string>([
  ["xs", "11px"],
  ["sm", "12px"],
  ["md", "14px"],
  ["lg", "16px"],
  ["xl", "20px"],
  ["2xl", "24px"],
]);

const cursorClassNames: Record<NonNullable<BaseTextProps["cursor"]>, string> = {
  default: "cursor-default",
  pointer: "cursor-pointer",
  text: "cursor-text",
  move: "cursor-move",
  "not-allowed": "cursor-not-allowed",
  wait: "cursor-wait",
  help: "cursor-help",
};

const wrapClassNames: Record<NonNullable<BaseTextProps["wrap"]>, string> = {
  nowrap: "whitespace-nowrap",
  normal: "whitespace-normal",
  pre: "whitespace-pre",
  "pre-line": "whitespace-pre-line",
  "pre-wrap": "whitespace-pre-wrap",
};

const textWrapClassNames: Record<NonNullable<BaseTextProps["textWrap"]>, string> = {
  wrap: "[text-wrap:wrap]",
  nowrap: "[text-wrap:nowrap]",
  balance: "text-balance",
  pretty: "text-pretty",
  stable: "[text-wrap:stable]",
};

const wordBreakClassNames: Record<NonNullable<BaseTextProps["wordBreak"]>, string> = {
  normal: "[word-break:normal]",
  "break-all": "break-all",
  "keep-all": "break-keep",
  "break-word": "[word-break:break-word]",
};

export const ROBOTO_MONO_FONT_FAMILY_CLASS_NAMES = {
  text: '[font-family:var(--font-roboto-mono,"Roboto_Mono"),Monaco,Consolas,"Courier_New",monospace]',
  proseInlineCode:
    '[&_code:not(pre_code)]:[font-family:var(--font-roboto-mono,"Roboto_Mono"),Monaco,Consolas,"Courier_New",monospace]',
  proseKbd:
    '[&_kbd]:[font-family:var(--font-roboto-mono,"Roboto_Mono"),Monaco,Consolas,"Courier_New",monospace]',
};

export function joinTextClassNames(...classNames: Array<string | undefined | false>): string {
  return classNames.filter(Boolean).join(" ");
}

export function resolveTextFontSize(value: unknown): string | undefined {
  return typeof value === "string" ? fontSizes.get(value) : undefined;
}

export function resolveTextLineHeight(value: unknown): string | undefined {
  if (value === "compressed") return "1";
  if (value === "comfortable") return "1.4";
  return undefined;
}

function resolveEnum(values: ReadonlySet<string>) {
  return (value: unknown): string | undefined =>
    typeof value === "string" && values.has(value) ? value : undefined;
}

const resolveDisplayValue = resolveEnum(new Set(["inline", "block", "inline-block", "none"]));
const resolveTextAlignValue = resolveEnum(new Set(["left", "center", "right", "justify"]));

function getDefaultDisplay(props: {
  align?: BaseTextProps["align"];
  as?: TextPrimitive;
  ellipsis?: boolean;
}): DisplayValue | undefined {
  if (props.as === "div") return "block";
  if (props.ellipsis || props.align) {
    return props.as === "span" ? "inline-block" : "block";
  }
  return undefined;
}

function getNativeDisplay(as: TextPrimitive | undefined): DisplayValue {
  return as === "p" || as === "div" || as === "legend" ? "block" : "inline";
}

export function resolveTextDisplay(props: {
  align?: BaseTextProps["align"];
  as?: TextPrimitive;
  display?: Responsive<DisplayValue>;
  ellipsis?: boolean;
}): Responsive<DisplayValue> | undefined {
  const fallback = getDefaultDisplay(props);
  if (props.display === undefined) return fallback;
  if (!isLayoutResponsiveValue(props.display)) return props.display;
  if (props.display.zero !== undefined) return props.display;
  return { zero: fallback ?? getNativeDisplay(props.as), ...props.display };
}

export function textTailwindClassName(
  props: BaseTextProps & {
    as?: TextPrimitive;
    display?: Responsive<DisplayValue>;
    size?: Responsive<TextSize>;
  },
): string | undefined {
  const declarations: TextTailwindDeclaration[] = [
    {
      property: "font-size",
      value: props.size,
      resolve: resolveTextFontSize,
    },
    {
      property: "line-height",
      value: props.density,
      resolve: resolveTextLineHeight,
    },
    {
      property: "display",
      value: resolveTextDisplay(props),
      resolve: resolveDisplayValue,
    },
    {
      property: "text-align",
      value: props.align,
      resolve: resolveTextAlignValue,
    },
  ];
  return createTextTailwindClassName(declarations);
}

function decorationClassName(props: BaseTextProps): string | undefined {
  if (props.strikethrough && props.underline === "dotted") {
    return "[text-decoration:line-through_underline_dotted]";
  }
  if (props.strikethrough && props.underline) {
    return "[text-decoration:line-through_underline]";
  }
  if (props.strikethrough) return "line-through";
  if (props.underline === "dotted") return "underline decoration-dotted";
  if (props.underline) return "underline";
  return undefined;
}

function textFontWeightClassName(props: BaseTextProps): string | undefined {
  if (props.bold === true) return "font-medium";
  if (props.bold === false) {
    return props.monospace ? "font-[425]" : "font-normal";
  }
  return undefined;
}

function commonTextStaticClassName(
  props: BaseTextProps & { className?: string },
  generatedClassName: string | undefined,
  fontWeightClassName: string | undefined,
  componentClassNames: ReadonlyArray<string | undefined | false>,
): string {
  const wrap = props.wrap ?? (props.ellipsis ? "nowrap" : undefined);
  const fontFamilyClassName = props.monospace
    ? ROBOTO_MONO_FONT_FAMILY_CLASS_NAMES.text
    : "[font-family:var(--font-rubik,Rubik),Avenir_Next,sans-serif]";

  return joinTextClassNames(
    "m-0 p-0 [text-box-edge:text_text] [text-box-trim:trim-both]",
    fontFamilyClassName,
    fontWeightClassName,
    variantClassNames[props.variant ?? "primary"],
    props.italic && "italic",
    decorationClassName(props),
    props.tabular && props.fraction
      ? "[font-variant-numeric:tabular-nums_diagonal-fractions]"
      : props.tabular
        ? "tabular-nums"
        : props.fraction
          ? "[font-variant-numeric:diagonal-fractions]"
          : undefined,
    ...componentClassNames,
    wrap && wrapClassNames[wrap],
    props.textWrap && textWrapClassNames[props.textWrap],
    props.wordBreak && wordBreakClassNames[props.wordBreak],
    generatedClassName,
    props.className,
  );
}

export function textStaticClassName(
  props: BaseTextProps & { className?: string },
  generatedClassName?: string,
): string {
  return commonTextStaticClassName(props, generatedClassName, textFontWeightClassName(props), [
    props.uppercase && "uppercase",
    props.ellipsis && "w-full overflow-hidden text-ellipsis",
    props.cursor && cursorClassNames[props.cursor],
  ]);
}

export function headingStaticClassName(
  props: Omit<BaseTextProps, "bold" | "uppercase"> & { className?: string },
  generatedClassName: string | undefined,
  fontWeightClassName: string,
): string {
  return commonTextStaticClassName(props, generatedClassName, fontWeightClassName, [
    props.ellipsis && "overflow-hidden text-ellipsis",
  ]);
}

function nativeTextProps<T extends TextPrimitive>(props: TextProps<T>): Record<string, unknown> {
  const nativeProps: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(props)) {
    if (
      name !== "children" &&
      name !== "className" &&
      name !== "style" &&
      !textPropNames.has(name) &&
      isValidLayoutDomProp(name)
    ) {
      nativeProps[name] = value;
    }
  }
  return nativeProps;
}

function hasTextRenderFunction<T extends TextPrimitive>(
  props: TextProps<T> | TextPropsWithRenderFunction<T>,
): props is TextPropsWithRenderFunction<T> {
  return typeof props.children === "function";
}

export function Text<T extends TextPrimitive = "span">(
  props: TextProps<T> | TextPropsWithRenderFunction<T>,
): ReactElement {
  const className = textStaticClassName(props, textTailwindClassName(props));

  if (hasTextRenderFunction(props)) {
    return createElement(Fragment, null, props.children({ className }));
  }

  return createElement(
    props.as ?? "span",
    { ...nativeTextProps(props), className, style: props.style },
    props.children,
  );
}
