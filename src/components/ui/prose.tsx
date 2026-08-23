import {
  createElement,
  Fragment,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";

import "./roboto-mono.css";
import { inlineCodeStyles } from "./code";
import { kbdStyles } from "./kbd-styles";
import { combineTextClassNames } from "./text-style-engine";
import styles from "./text.module.css";

export type ProseProps<T extends keyof HTMLElementTagNameMap = "div"> = {
  as?: T;
  children?: ReactNode;
  ref?: Ref<HTMLElementTagNameMap[T] | null>;
} & HTMLAttributes<HTMLElementTagNameMap[T]>;

const proseTheme = {
  border: { md: "1px", xl: "2px" },
  font: {
    family: {
      mono: 'var(--font-roboto-mono, "Roboto Mono Variable"), "Roboto Mono", Monaco, Consolas, "Courier New", monospace',
    },
    size: { sm: "12px" },
    weight: { sans: { medium: 500 } },
  },
  radius: { "2xs": "3px", sm: "5px" },
  space: { xs: "4px" },
  tokens: {
    background: {
      primary: "var(--scraps-hotkey-background-primary)",
      secondary: "var(--scraps-hotkey-background-secondary)",
      transparent: {
        neutral: { muted: "var(--scraps-inline-code-neutral-background)" },
        promotion: { muted: "var(--scraps-inline-code-background)" },
      },
    },
    border: { primary: "var(--scraps-hotkey-border-primary)" },
    content: {
      primary: "var(--scraps-hotkey-content-primary)",
      promotion: "var(--scraps-inline-code-content)",
      secondary: "var(--scraps-hotkey-content-secondary)",
    },
  },
};

const proseCompositionCss = `
:where(.${styles.prose}) code:not(pre code) { ${inlineCodeStyles(proseTheme).styles};font-weight:425 }
:where(.${styles.prose}) kbd { ${kbdStyles(proseTheme).styles} }
`;

export function Prose<T extends keyof HTMLElementTagNameMap = "div">({
  as,
  children,
  className,
  ...props
}: ProseProps<T>): ReactElement {
  const element = as ?? "article";
  const node = createElement(
    element,
    {
      ...props,
      className: combineTextClassNames(styles.prose, className),
      key: "prose-node",
    },
    children
  );
  return createElement(
    Fragment,
    null,
    <style href="scraps-prose-composition" precedence="scraps-text">
      {proseCompositionCss}
    </style>,
    node
  );
}
