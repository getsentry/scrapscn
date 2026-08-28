import type { ComponentProps } from "react";

import {
  Markdown,
  streamingAnimationStyles,
  useTextDecodeAnimation,
  type MarkdownProps,
} from "@/components/ui/markdown";

const props: MarkdownProps = {
  raw: "## Heading",
  variant: "streaming",
  components: {
    Heading: ({ Default, children, level }) => <Default level={level}>{children}</Default>,
    Tag: ({ attrs, name }) => <span>{`${name}:${attrs.id}`}</span>,
  },
};

<Markdown {...props} />;
void streamingAnimationStyles;
void useTextDecodeAnimation;

type Props = ComponentProps<typeof Markdown>;
const sameProps: Props = props;
void sameProps;

// @ts-expect-error raw is required.
<Markdown />;
// @ts-expect-error variant is the canonical finite union.
<Markdown raw="text" variant="animated" />;
<Markdown
  raw="# title"
  components={{
    Heading: ({ Default, children }) => (
      // @ts-expect-error heading levels are constrained to HTML heading levels.
      <Default level={7}>{children}</Default>
    ),
  }}
/>;
