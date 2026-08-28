import { createRef, type ComponentProps } from "react";

import { Disclosure } from "@/components/ui/disclosure";

const root = {
  children: (
    <>
      <Disclosure.Title>Title</Disclosure.Title>
      <Disclosure.Content>Content</Disclosure.Content>
    </>
  ),
  defaultExpanded: false,
  ref: createRef<HTMLDivElement>(),
  size: "xs",
  variant: "outline",
} satisfies ComponentProps<typeof Disclosure>;
const title = {
  leadingItems: <span />,
  trailingItems: <span>End</span>,
} satisfies ComponentProps<typeof Disclosure.Title>;
const controlled = {
  expanded: true,
  onExpandedChange: () => {},
} satisfies Pick<ComponentProps<typeof Disclosure>, "expanded" | "onExpandedChange">;

void root;
void title;
void controlled;

const invalidSize: ComponentProps<typeof Disclosure> = {
  children: <span />,
  // @ts-expect-error The canonical disclosure has three sizes.
  size: "lg",
};
const invalidRef: ComponentProps<typeof Disclosure> = {
  children: <span />,
  // @ts-expect-error The root ref points to its Stack div.
  ref: createRef<HTMLButtonElement>(),
};

const invalidDisabled: ComponentProps<typeof Disclosure> = {
  children: <span />,
  // @ts-expect-error The canonical disclosure no longer has a disabled prop.
  disabled: true,
};

void invalidSize;
void invalidRef;
void invalidDisabled;
