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
import {
  isLayoutResponsiveValue,
  isValidLayoutDomProp,
  type LayoutResponsive as Responsive,
} from "./layout-style-engine";
import {
  combineTextClassNames,
  createTextStyleResource,
  resolveFontSize,
  resolveLineHeight,
  textDeclaration,
  type TextSize,
} from "./text-style-engine";
import styles from "./text.module.css";

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
  extends BaseTextProps,
    Omit<
      DetailedHTMLProps<
        HTMLAttributes<HTMLElementTagNameMap[T]>,
        HTMLElementTagNameMap[T]
      >,
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

export type TextProps<T extends TextPrimitive> = TextAttributes<T> &
  ExclusiveTextEllipsisProps;

export type TextPropsWithRenderFunction<
  T extends TextPrimitive = "span",
> = BaseTextProps &
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
        keyof DetailedHTMLProps<
          HTMLAttributes<HTMLElementTagNameMap[T]>,
          HTMLElementTagNameMap[T]
        >,
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
  accent: styles.accent,
  danger: styles.danger,
  inherit: undefined,
  muted: styles.secondary,
  primary: styles.primary,
  promotion: styles.promotion,
  secondary: styles.secondary,
  success: styles.success,
  warning: styles.warning,
};

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

function resolveDisplay(props: {
  align?: BaseTextProps["align"];
  as?: TextPrimitive;
  display?: Responsive<DisplayValue>;
  ellipsis?: boolean;
}): Responsive<DisplayValue> | undefined {
  const fallback = getDefaultDisplay(props);
  if (props.display === undefined) return fallback;
  if (!isLayoutResponsiveValue(props.display)) return props.display;
  return props.display.zero === undefined
    ? { zero: fallback ?? getNativeDisplay(props.as), ...props.display }
    : props.display;
}

function decorationClassName(props: BaseTextProps): string | undefined {
  if (props.strikethrough && props.underline === "dotted") return styles.strikeDotted;
  if (props.strikethrough && props.underline) return styles.strikeUnderline;
  if (props.strikethrough) return styles.strike;
  if (props.underline === "dotted") return styles.dotted;
  if (props.underline) return styles.underline;
  return undefined;
}

function createTextClassName(
  props: BaseTextProps & { className?: string },
  generatedClassName: string | undefined
): string {
  return (
    combineTextClassNames(
      styles.text,
      variantClassNames[props.variant ?? "primary"],
      props.bold === true && styles.bold,
      props.bold === false &&
        (props.monospace ? styles.regularMono : styles.regularSans),
      props.monospace && styles.mono,
      props.italic && styles.italic,
      decorationClassName(props),
      props.uppercase && styles.uppercase,
      props.ellipsis && styles.ellipsis,
      props.tabular && props.fraction
        ? styles.tabularFraction
        : props.tabular
          ? styles.tabular
          : props.fraction
            ? styles.fraction
            : undefined,
      generatedClassName,
      props.className
    ) ?? ""
  );
}

function textStyleResource(props: BaseTextProps & {
  as?: TextPrimitive;
  display?: Responsive<DisplayValue>;
  size?: Responsive<TextSize>;
}) {
  return createTextStyleResource([
    textDeclaration("font-size", props.size, resolveFontSize),
    textDeclaration("line-height", props.density, resolveLineHeight),
    textDeclaration("display", resolveDisplay(props)),
    textDeclaration("text-align", props.align),
    textDeclaration("cursor", props.cursor),
    textDeclaration("white-space", props.wrap ?? (props.ellipsis ? "nowrap" : undefined)),
    textDeclaration("text-wrap", props.textWrap),
    textDeclaration("word-break", props.wordBreak),
  ]);
}

function nativeTextProps<T extends TextPrimitive>(
  props: TextProps<T>
): Record<string, unknown> {
  const nativeProps: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(props)) {
    if (
      name !== "children" &&
      name !== "className" &&
      !textPropNames.has(name) &&
      (name === "ref" || isValidLayoutDomProp(name))
    ) {
      nativeProps[name] = value;
    }
  }
  return nativeProps;
}

function hasTextRenderFunction<T extends TextPrimitive>(
  props: TextProps<T> | TextPropsWithRenderFunction<T>
): props is TextPropsWithRenderFunction<T> {
  return typeof props.children === "function";
}

export function Text<T extends TextPrimitive = "span">(
  props: TextProps<T> | TextPropsWithRenderFunction<T>
): ReactElement {
  const { className: generatedClassName, resource } = textStyleResource(props);
  const className = createTextClassName(props, generatedClassName);

  if (hasTextRenderFunction(props)) {
    return createElement(Fragment, null, resource, props.children({ className }));
  }

  const element = props.as ?? "span";
  const node = createElement(
    element,
    { ...nativeTextProps(props), className, key: "text-node" },
    props.children
  );
  return createElement(Fragment, null, resource, node);
}
