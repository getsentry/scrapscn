import { type ReactNode } from "react";

import { Stack, type StackProps } from "./layout";
import { Text } from "./text";
import styles from "./quote.module.css";

interface QuoteBaseProps {
  children: ReactNode;
  source?: {
    author?: string;
    href?: string;
    label?: string;
  };
}

/** The regular Scraps semantic extended quotation with optional source attribution. */
export type QuoteProps = QuoteBaseProps & Omit<StackProps<"blockquote">, "children">;

/** Renders the pinned Scraps figure, citation, and 16px + 12px quote rail geometry. */
export function Quote(props: QuoteProps) {
  const { children, ...spreadProps } = props;
  return (
    <Stack gap="md" as="figure" position="relative" {...spreadProps}>
      <hr aria-orientation="vertical" className={styles.line} />
      <blockquote cite={props.source?.href} className={styles.blockquote}>
        {children}
      </blockquote>
      {props.source ? (
        <figcaption className={styles.caption}>
          <Text as="p">
            &ndash;&nbsp;
            {props.source.author}
            {props.source.label ? (
              <>
                , <cite>{props.source.label}</cite>
              </>
            ) : null}
          </Text>
        </figcaption>
      ) : null}
    </Stack>
  );
}
