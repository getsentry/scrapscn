import { createRef } from "react";

import { Quote, type QuoteProps } from "@/components/ui/quote";

const quoteProps = {
  children: "A quote",
  className: "consumer-class",
  gap: "lg",
  ref: createRef<HTMLQuoteElement>(),
  source: { author: "Ada", href: "https://example.com", label: "Notes" },
} satisfies QuoteProps;

<Quote {...quoteProps} />;
// @ts-expect-error Quote always requires content.
<Quote />;
// @ts-expect-error The canonical source fields are strings.
<Quote source={{ author: 7 }}>A quote</Quote>;

export {};
