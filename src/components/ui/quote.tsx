import { type ReactNode } from "react";

import { Stack, type StackProps } from "./layout";
import { Text } from "./text";

const CONTENT_CLASS_NAMES = "m-0 border-0 border-none p-0 pl-7";

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
      <hr
        aria-orientation="vertical"
        className="absolute top-0 bottom-0 left-0 m-0 ml-3 box-content h-full w-px border-0 border-l border-solid border-l-[var(--scraps-theme-border-primary)] pl-4"
      />
      <blockquote cite={props.source?.href} className={CONTENT_CLASS_NAMES}>
        {children}
      </blockquote>
      {props.source ? (
        <figcaption className={CONTENT_CLASS_NAMES}>
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
