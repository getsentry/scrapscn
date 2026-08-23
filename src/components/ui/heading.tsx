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
  isValidLayoutDomProp,
  type LayoutResponsive as Responsive,
} from "./layout-style-engine";
import {
  combineTextClassNames,
  createTextStyleResource,
  resolveFontSize,
  resolveLineHeight,
  textDeclaration,
  type HeadingSize,
} from "./text-style-engine";
import styles from "./text.module.css";
import type { BaseTextProps, TextVariant } from "./text";

type HeadingElement = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
type BaseHeadingProps = Omit<BaseTextProps, "bold" | "uppercase">;
type ExclusiveHeadingEllipsisProps =
  | { ellipsis?: true; wrap?: never }
  | { ellipsis?: never; wrap?: BaseTextProps["wrap"] };

export type HeadingProps = BaseHeadingProps & {
  as: HeadingElement;
  ref?: React.Ref<HTMLHeadingElement | null>;
  size?: Responsive<HeadingSize>;
  /** @deprecated Use Heading props for styling. */
  style?: CSSProperties;
} & Omit<
    DetailedHTMLProps<HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>,
    "style"
  > &
  ExclusiveHeadingEllipsisProps;

type HeadingPropsWithRenderFunction = BaseHeadingProps &
  ExclusiveHeadingEllipsisProps & {
    as?: never;
    children: (props: { className: string }) => ReactNode | undefined;
    ref?: never;
    size?: Responsive<HeadingSize>;
  } & Partial<
    Record<
      Exclude<
        keyof DetailedHTMLProps<
          HTMLAttributes<HTMLHeadingElement>,
          HTMLHeadingElement
        >,
        "children"
      >,
      never
    >
  >;

const headingPropNames = new Set<string>([
  "align",
  "as",
  "cursor",
  "density",
  "ellipsis",
  "fraction",
  "italic",
  "monospace",
  "size",
  "strikethrough",
  "tabular",
  "textWrap",
  "underline",
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

function defaultHeadingSize(as: HeadingElement | undefined): HeadingSize | undefined {
  if (as === "h1") return "2xl";
  if (as === "h2") return "xl";
  if (as === "h3") return "lg";
  if (as === "h4") return "md";
  if (as === "h5") return "sm";
  if (as === "h6") return "xs";
  return undefined;
}

function decorationClassName(props: BaseHeadingProps): string | undefined {
  if (props.strikethrough && props.underline === "dotted") return styles.strikeDotted;
  if (props.strikethrough && props.underline) return styles.strikeUnderline;
  if (props.strikethrough) return styles.strike;
  if (props.underline === "dotted") return styles.dotted;
  if (props.underline) return styles.underline;
  return undefined;
}

function nativeHeadingProps(
  props: HeadingProps
): Record<string, unknown> {
  const nativeProps: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(props)) {
    if (
      name !== "children" &&
      name !== "className" &&
      !headingPropNames.has(name) &&
      (name === "ref" || isValidLayoutDomProp(name))
    ) {
      nativeProps[name] = value;
    }
  }
  return nativeProps;
}

function hasHeadingRenderFunction(
  props: HeadingProps | HeadingPropsWithRenderFunction
): props is HeadingPropsWithRenderFunction {
  return typeof props.children === "function";
}

export function Heading(
  props: HeadingProps | HeadingPropsWithRenderFunction
): ReactElement {
  const variant = props.variant ?? "primary";
  const size =
    variant === "inherit" && props.size === undefined
      ? "inherit"
      : props.size ?? defaultHeadingSize(props.as);
  const density =
    variant === "inherit" && props.density === undefined
      ? "inherit"
      : props.density;
  const { className: generatedClassName, resource } = createTextStyleResource([
    textDeclaration("font-size", size, resolveFontSize),
    textDeclaration("line-height", density, resolveLineHeight),
    textDeclaration("text-align", props.align),
    textDeclaration(
      "white-space",
      props.wrap ?? (props.ellipsis ? "nowrap" : undefined)
    ),
    textDeclaration("text-wrap", props.textWrap),
    textDeclaration("word-break", props.wordBreak),
  ]);
  const className =
    combineTextClassNames(
      styles.text,
      styles.heading,
      variant === "inherit" && styles.headingInherit,
      variantClassNames[variant],
      props.monospace && styles.mono,
      props.italic && styles.italic,
      decorationClassName(props),
      props.ellipsis && styles.headingEllipsis,
      props.tabular && props.fraction
        ? styles.tabularFraction
        : props.tabular
          ? styles.tabular
          : props.fraction
            ? styles.fraction
            : undefined,
      generatedClassName,
      props.className
    ) ?? "";

  if (hasHeadingRenderFunction(props)) {
    return createElement(Fragment, null, resource, props.children({ className }));
  }

  const node = createElement(
    props.as,
    { ...nativeHeadingProps(props), className, key: "heading-node" },
    props.children
  );
  return createElement(Fragment, null, resource, node);
}
