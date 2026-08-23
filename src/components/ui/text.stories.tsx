import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";

import { Container } from "./layout";
import { Heading, Prose, Text } from "./text-index";

const meta = {
  title: "Scraps/Text",
  component: Text,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Text>;

export default meta;
type Story = StoryObj<typeof meta>;

const textSizes = ["xs", "sm", "md", "lg", "xl", "2xl"] as const;
const variants = [
  "primary",
  "muted",
  "secondary",
  "accent",
  "success",
  "warning",
  "danger",
  "promotion",
] as const;

export const Sizes: Story = {
  render: () => (
    <div className="grid gap-3">
      {textSizes.map((size) => <Text key={size} size={size}>{size} text</Text>)}
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("2xl text")).toBeVisible();
  },
};

export const Variants: Story = {
  render: () => (
    <div className="grid gap-3">
      {variants.map((variant) => (
        <Text key={variant} variant={variant}>{variant} text</Text>
      ))}
      <div style={{ color: "rebeccapurple" }}>
        <Text variant="inherit">inherit text</Text>
      </div>
    </div>
  ),
};

export const SemanticElements: Story = {
  render: () => (
    <div className="grid gap-3">
      <Text as="p">paragraph</Text>
      <Text as="span">span</Text>
      <Text as="div">division</Text>
      <Text as="label" htmlFor="story-field">label</Text>
      <Text as="time" dateTime="2026-08-23">time</Text>
      <Text as="legend">legend</Text>
    </div>
  ),
};

export const TypographyFeatures: Story = {
  render: () => (
    <div className="grid gap-3">
      <Text bold>Bold</Text>
      <Text bold={false}>Explicit regular</Text>
      <Text italic>Italic</Text>
      <Text underline>Underline</Text>
      <Text underline="dotted">Dotted underline</Text>
      <Text strikethrough>Strikethrough</Text>
      <Text strikethrough underline>Strikethrough and underline</Text>
      <Text bold italic underline>Bold italic underline</Text>
      <Text uppercase>Uppercase</Text>
    </div>
  ),
};

export const AlignmentAndDensity: Story = {
  render: () => (
    <div className="grid w-80 gap-4">
      <Text align="left">Left aligned</Text>
      <Text align="center">Center aligned</Text>
      <Text align="right">Right aligned</Text>
      <Text align="justify">Justified text wraps across enough words to show the alignment.</Text>
      <Text as="p" density="compressed">Compressed line height<br />Second line</Text>
      <Text as="p">Default inherited line height<br />Second line</Text>
      <Text as="p" density="comfortable">Comfortable line height<br />Second line</Text>
    </div>
  ),
};

export const OverflowAndWrapping: Story = {
  render: () => (
    <div className="grid w-52 gap-4">
      <Text ellipsis>Long text that truncates inside a narrow container</Text>
      <Text as="span" ellipsis>Explicit span truncation</Text>
      <Text wordBreak="break-word">https://example.com/a/very/long/path?with=a-long-value</Text>
      <Text textWrap="balance">Balanced text wrapping across several words</Text>
      <Text textWrap="pretty">Pretty text wrapping across several words</Text>
      <Text wrap="pre-wrap">{"Preserved\n  white space"}</Text>
    </div>
  ),
};

export const NumericAndMonospaceFeatures: Story = {
  render: () => (
    <div className="grid gap-3">
      <Text monospace>const event = 2048;</Text>
      <Text monospace bold={false}>Regular mono weight</Text>
      <Text tabular>1234567890</Text>
      <Text fraction>1/2 3/4 5/8</Text>
      <Text fraction tabular>1/2 3/4 5/8</Text>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const regular = canvas.getByText("const event = 2048;");
    await expect(getComputedStyle(regular).fontFamily).toContain("Roboto Mono Variable");
    await expect(getComputedStyle(regular).fontWeight).toBe("425");
    const loadedFaces = await document.fonts.load('425 14px "Roboto Mono Variable"');
    await expect(loadedFaces.length).toBeGreaterThan(0);
  },
};

export const InheritConsumerOverrides: Story = {
  render: () => (
    <div className="grid gap-3">
      <style>{`.text-inherit-story-class { color: rgb(0, 87, 184); }`}</style>
      <Text className="text-inherit-story-class" variant="inherit">
        Consumer class color
      </Text>
      <Heading
        as="h3"
        style={{ color: "rgb(180, 35, 24)" }}
        variant="inherit"
      >
        Consumer style color
      </Heading>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Consumer class color")).toHaveStyle({
      color: "rgb(0, 87, 184)",
    });
    await expect(canvas.getByText("Consumer style color")).toHaveStyle({
      color: "rgb(180, 35, 24)",
    });
  },
};

export const ResponsiveContainerAndViewport: Story = {
  render: () => (
    <Container containerType="inline-size" width="640px">
      <Text
        align={{ zero: "left", "screen:xs": "center", "screen:lg": "right" }}
        size={{ zero: "xs", sm: "md", lg: "xl", "screen:lg": "2xl" }}
      >
        Responsive text
      </Text>
    </Container>
  ),
};

export const RenderFunctions: Story = {
  render: () => (
    <div className="grid gap-3">
      <Text variant="accent">
        {({ className }) => <a className={className} href="#render-text">Text link</a>}
      </Text>
      <Heading size="xl" variant="promotion">
        {({ className }) => <h2 className={className}>Rendered heading</h2>}
      </Heading>
    </div>
  ),
};

export const HeadingLevelsAndSizes: Story = {
  render: () => (
    <div className="grid gap-3">
      <Heading as="h1">Heading 1</Heading>
      <Heading as="h2">Heading 2</Heading>
      <Heading as="h3">Heading 3</Heading>
      <Heading as="h4">Heading 4</Heading>
      <Heading as="h5">Heading 5</Heading>
      <Heading as="h6">Heading 6</Heading>
      <Heading as="h2" size="3xl">3xl heading</Heading>
      <Heading as="h2" size="4xl">4xl heading</Heading>
      <Heading as="h3" size={{ zero: "xs", "screen:lg": "xl" }}>Responsive heading</Heading>
    </div>
  ),
};

export const HeadingVariantsAndFeatures: Story = {
  render: () => (
    <div className="grid gap-3">
      {variants.map((variant) => (
        <Heading as="h3" key={variant} variant={variant}>{variant} heading</Heading>
      ))}
      <div style={{ color: "rebeccapurple", fontSize: "18px", fontWeight: 700, lineHeight: 2 }}>
        <Heading as="h3" variant="inherit">Inherited heading</Heading>
      </div>
      <Heading as="h3" italic underline strikethrough>Decorated heading</Heading>
      <Heading as="h3" monospace>Monospace heading</Heading>
      <Heading as="h3" align="center">Centered heading</Heading>
      <div className="w-48"><Heading as="h3" ellipsis>Truncated heading with long content</Heading></div>
    </div>
  ),
};

export const ProseComposition: Story = {
  render: () => (
    <Prose>
      <Heading as="h2">Getting started</Heading>
      <p>Prose spaces raw blocks and styles <code>inline code</code> plus <kbd>⌘K</kbd>.</p>
      <p>A second paragraph keeps the canonical 24 pixel rhythm.</p>
      <ul><li>First item</li><li>Second item</li></ul>
      <pre><code>const block = &quot;unchanged&quot;;</code></pre>
      <div className="auto-select-text">Selectable block</div>
      <div className="section">Section block</div>
    </Prose>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Selectable block")).toHaveStyle({
      marginBottom: "24px",
    });
    await expect(canvas.getByText("Section block")).toHaveStyle({
      marginBottom: "0px",
    });
  },
};
