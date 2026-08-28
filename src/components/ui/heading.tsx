import {
  createElement,
  Fragment,
  type CSSProperties,
  type DetailedHTMLProps,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";

import "./roboto-mono.css";
import { isValidLayoutDomProp, type LayoutResponsive as Responsive } from "./layout-style-engine";
import { headingStaticClassName, resolveTextLineHeight, type BaseTextProps } from "./text";
import { createTextTailwindClassName, type TextTailwindDeclaration } from "./text-tailwind";

type HeadingElement = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
export type HeadingSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";

type BaseHeadingProps = Omit<BaseTextProps, "bold" | "uppercase">;
type ExclusiveHeadingEllipsisProps =
  | { ellipsis?: true; wrap?: never }
  | { ellipsis?: never; wrap?: BaseTextProps["wrap"] };

export type HeadingProps = BaseHeadingProps & {
  as: HeadingElement;
  ref?: Ref<HTMLHeadingElement | null>;
  size?: Responsive<HeadingSize>;
  /** @deprecated Use Heading props for styling. */
  style?: CSSProperties;
} & Omit<DetailedHTMLProps<HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>, "style"> &
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
        keyof DetailedHTMLProps<HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>,
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

const headingSizes = new Map<string, string>([
  ["xs", "11px"],
  ["sm", "12px"],
  ["md", "14px"],
  ["lg", "16px"],
  ["xl", "20px"],
  ["2xl", "24px"],
  ["3xl", "32px"],
  ["4xl", "40px"],
]);

const textAlignValues = new Set(["left", "center", "right", "justify"]);

function defaultHeadingSize(as: HeadingElement | undefined): HeadingSize | undefined {
  if (as === "h1") return "2xl";
  if (as === "h2") return "xl";
  if (as === "h3") return "lg";
  if (as === "h4") return "md";
  if (as === "h5") return "sm";
  if (as === "h6") return "xs";
  return undefined;
}

function resolveHeadingSize(value: unknown): string | undefined {
  if (value === "inherit") return "inherit";
  return typeof value === "string" ? headingSizes.get(value) : undefined;
}

function resolveHeadingLineHeight(value: unknown): string | undefined {
  return value === "inherit" ? "inherit" : resolveTextLineHeight(value);
}

function resolveHeadingAlign(value: unknown): string | undefined {
  return typeof value === "string" && textAlignValues.has(value) ? value : undefined;
}

function hasHeadingRenderFunction(
  props: HeadingProps | HeadingPropsWithRenderFunction,
): props is HeadingPropsWithRenderFunction {
  return typeof props.children === "function";
}

function nativeHeadingProps(props: HeadingProps): Record<string, unknown> {
  const nativeProps: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(props)) {
    if (
      name !== "children" &&
      name !== "className" &&
      name !== "style" &&
      !headingPropNames.has(name) &&
      isValidLayoutDomProp(name)
    ) {
      nativeProps[name] = value;
    }
  }
  return nativeProps;
}

export function Heading(props: HeadingProps | HeadingPropsWithRenderFunction): ReactElement {
  const variant = props.variant ?? "primary";
  const size =
    variant === "inherit" && props.size === undefined
      ? "inherit"
      : (props.size ?? defaultHeadingSize(props.as));
  const density = variant === "inherit" && props.density === undefined ? "inherit" : props.density;
  const declarations: TextTailwindDeclaration[] = [
    {
      property: "font-size",
      value: size,
      resolve: resolveHeadingSize,
    },
    {
      property: "line-height",
      value: density,
      resolve: resolveHeadingLineHeight,
    },
    {
      property: "text-align",
      value: props.align,
      resolve: resolveHeadingAlign,
    },
  ];
  const fontWeightClassName = variant === "inherit" ? "[font-weight:inherit]" : "font-medium";
  const className = headingStaticClassName(
    { ...props, variant },
    createTextTailwindClassName(declarations),
    fontWeightClassName,
  );

  if (hasHeadingRenderFunction(props)) {
    return createElement(Fragment, null, props.children({ className }));
  }

  return createElement(
    props.as,
    { ...nativeHeadingProps(props), className, style: props.style },
    props.children,
  );
}
