import { createRef } from "react";

import type {
  HeadingProps,
  TextProps,
  TextPropsWithRenderFunction,
} from "@/components/ui/text-index";
import { Heading, Prose, Text } from "@/components/ui/text-index";

const paragraphRef = createRef<HTMLParagraphElement>();
const headingRef = createRef<HTMLHeadingElement>();
const sectionRef = createRef<HTMLElement>();

const label: TextProps<"label"> = {
  as: "label",
  children: "Label",
  htmlFor: "field",
};
const time: TextProps<"time"> = {
  as: "time",
  children: "Today",
  dateTime: "2026-08-23",
};
const responsive: TextProps<"span"> = {
  align: { zero: "left", md: "center", "screen:lg": "right" },
  children: "Responsive",
  display: { zero: "inline", sm: "block", "screen:xl": "none" },
  size: { zero: "xs", lg: "xl", "screen:2xl": "2xl" },
};
const renderText: TextPropsWithRenderFunction = {
  children: ({ className }) => <a className={className}>Link</a>,
  size: "md",
  variant: "promotion",
};
const heading: HeadingProps = {
  as: "h1",
  children: "Title",
  size: "4xl",
};

const validUsage = (
  <>
    <Text as="p" ref={paragraphRef}>Paragraph</Text>
    <Text variant="secondary">Secondary</Text>
    <Text variant="inherit">Inherited</Text>
    <Text strikethrough underline="dotted">Decorated</Text>
    <Heading as="h2" ref={headingRef} size={{ zero: "3xl", "screen:lg": "4xl" }}>
      Heading
    </Heading>
    <Heading variant="accent">
      {({ className }) => <h2 className={className}>Rendered heading</h2>}
    </Heading>
    <Prose as="section" ref={sectionRef}><p>Body</p></Prose>
  </>
);

// @ts-expect-error Text forbids the native color attribute.
const color = <Text color="red">Invalid</Text>;
// @ts-expect-error htmlFor requires as="label".
const htmlFor = <Text htmlFor="field">Invalid</Text>;
// @ts-expect-error dateTime requires as="time".
const dateTime = <Text dateTime="2026-08-23">Invalid</Text>;
// @ts-expect-error Text stops at 2xl.
const oversizedText = <Text size="3xl">Invalid</Text>;
// @ts-expect-error Heading requires a semantic tag in its element form.
const missingHeadingTag = <Heading>Invalid</Heading>;
// @ts-expect-error Heading does not support display.
const headingDisplay = <Heading as="h2" display="none">Invalid</Heading>;
// @ts-expect-error Heading does not support bold.
const headingBold = <Heading as="h2" bold>Invalid</Heading>;
// @ts-expect-error Heading does not support uppercase.
const headingUppercase = <Heading as="h2" uppercase>Invalid</Heading>;
// @ts-expect-error Ellipsis owns display.
const ellipsisDisplay = <Text ellipsis display="block">Invalid</Text>;
// @ts-expect-error Ellipsis owns white-space wrapping.
const ellipsisWrap = <Text ellipsis wrap="pre">Invalid</Text>;
// @ts-expect-error The exact API does not accept ellipsis={false}.
const falseEllipsis = <Text ellipsis={false}>Invalid</Text>;
// @ts-expect-error Render functions own their element attributes.
const renderClassName = <Text className="invalid">{({ className }) => <a className={className}>Link</a>}</Text>;
// @ts-expect-error Render functions cannot select an element.
const renderAs = <Text as="p">{({ className }) => <p className={className}>Invalid</p>}</Text>;
// @ts-expect-error Render functions cannot receive a ref.
const renderRef = <Text ref={paragraphRef}>{({ className }) => <p className={className}>Invalid</p>}</Text>;
// @ts-expect-error The ref must match the selected Text primitive.
const wrongTextRef = <Text as="p" ref={createRef<HTMLLabelElement>()}>Invalid</Text>;

void [
  label,
  time,
  responsive,
  renderText,
  heading,
  validUsage,
  color,
  htmlFor,
  dateTime,
  oversizedText,
  missingHeadingTag,
  headingDisplay,
  headingBold,
  headingUppercase,
  ellipsisDisplay,
  ellipsisWrap,
  falseEllipsis,
  renderClassName,
  renderAs,
  renderRef,
  wrongTextRef,
];
