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
      {textSizes.map((size) => (
        <Text key={size} size={size}>
          {size} text
        </Text>
      ))}
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
        <Text key={variant} variant={variant}>
          {variant} text
        </Text>
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
      <Text as="label" htmlFor="story-field">
        label
      </Text>
      <Text as="time" dateTime="2026-08-23">
        time
      </Text>
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
      <Text strikethrough underline>
        Strikethrough and underline
      </Text>
      <Text bold italic underline>
        Bold italic underline
      </Text>
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
      <Text as="p" density="compressed">
        Compressed line height
        <br />
        Second line
      </Text>
      <Text as="p">
        Default inherited line height
        <br />
        Second line
      </Text>
      <Text as="p" density="comfortable">
        Comfortable line height
        <br />
        Second line
      </Text>
    </div>
  ),
};

export const OverflowAndWrapping: Story = {
  render: () => (
    <div className="grid w-52 gap-4">
      <Text ellipsis>Long text that truncates inside a narrow container</Text>
      <Text as="span" ellipsis>
        Explicit span truncation
      </Text>
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
      <Text monospace bold={false}>
        Regular mono weight
      </Text>
      <Text tabular>1234567890</Text>
      <Text fraction>1/2 3/4 5/8</Text>
      <Text fraction tabular>
        1/2 3/4 5/8
      </Text>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const inheritedWeight = canvas.getByText("const event = 2048;");
    await expect(getComputedStyle(inheritedWeight).fontFamily).toContain("Roboto Mono");
    await expect(getComputedStyle(inheritedWeight).fontWeight).toBe("400");
    const regular = canvas.getByText("Regular mono weight");
    await expect(getComputedStyle(regular).fontWeight).toBe("425");
    const loadedFaces = await document.fonts.load('425 14px "Roboto Mono"');
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
      <Heading as="h3" style={{ color: "rgb(180, 35, 24)" }} variant="inherit">
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

export const RuntimeContract: Story = {
  render: () => <TextRuntimeContract />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(window.innerWidth).toBeGreaterThanOrEqual(500);

    const responsive = canvas.getByTestId("text-responsive-contract");
    await expect(getComputedStyle(responsive).fontSize).toBe("24px");
    await expect(getComputedStyle(responsive).textAlign).toBe("center");

    const renderFunction = canvas.getByTestId("text-render-contract");
    await expect(getComputedStyle(renderFunction).fontSize).toBe("16px");
    await expect(getComputedStyle(renderFunction).textAlign).toBe("right");
    await expect(
      canvasElement.querySelector("span:has([data-testid='text-render-contract'])"),
    ).toBeNull();

    const inlineOverride = canvas.getByTestId("text-inline-override");
    const inlineStyle = getComputedStyle(inlineOverride);
    await expect(inlineStyle.fontSize).toBe("31px");
    await expect(inlineStyle.lineHeight).toBe("37px");
    await expect(inlineStyle.display).toBe("grid");
    await expect(inlineStyle.textAlign).toBe("justify");

    const textDecoration = getComputedStyle(canvas.getByTestId("text-decoration-contract"));
    await expect(textDecoration.textDecorationLine.split(" ").sort()).toEqual([
      "line-through",
      "underline",
    ]);
    const headingDecoration = getComputedStyle(canvas.getByTestId("heading-decoration-contract"));
    await expect(headingDecoration.textDecorationLine.split(" ").sort()).toEqual([
      "line-through",
      "underline",
    ]);
    await expect(headingDecoration.textDecorationStyle).toBe("dotted");
    await expect(getComputedStyle(canvas.getByTestId("text-word-break-contract")).wordBreak).toBe(
      "break-word",
    );
    await expect(
      getComputedStyle(canvas.getByTestId("heading-word-break-contract")).wordBreak,
    ).toBe("break-word");
    const normalText = getComputedStyle(canvas.getByTestId("text-normal-word-break-contract"));
    await expect(normalText.wordBreak).toBe("normal");
    await expect(normalText.overflowWrap).toBe("anywhere");
    const normalHeading = getComputedStyle(
      canvas.getByTestId("heading-normal-word-break-contract"),
    );
    await expect(normalHeading.wordBreak).toBe("normal");
    await expect(normalHeading.overflowWrap).toBe("anywhere");
    await expect(getComputedStyle(canvas.getByTestId("text-cursor-contract")).cursor).toBe(
      "pointer",
    );
    await expect(getComputedStyle(canvas.getByTestId("heading-ellipsis-contract")).cursor).not.toBe(
      "pointer",
    );
    const headingEllipsis = canvas.getByTestId("heading-ellipsis-contract");
    const headingParent = canvas.getByTestId("heading-ellipsis-parent");
    await expect(headingEllipsis.getBoundingClientRect().width).toBeLessThan(
      headingParent.getBoundingClientRect().width,
    );

    const sans = getComputedStyle(canvas.getByTestId("text-sans-weight"));
    await expect(sans.fontFamily).toContain("Rubik");
    await expect(sans.fontFamily).not.toContain("Roboto Mono");
    await expect(sans.fontWeight).toBe("400");

    const mono = getComputedStyle(canvas.getByTestId("text-mono-weight"));
    await expect(mono.fontFamily).toContain("Roboto Mono");
    await expect(mono.fontFamily).toContain("Monaco");
    await expect(mono.fontFamily).toContain("Consolas");
    await expect(mono.fontFamily).toContain("Courier New");
    await expect(mono.fontWeight).toBe("400");

    const regularMono = getComputedStyle(canvas.getByTestId("text-regular-mono-weight"));
    await expect(regularMono.fontFamily).toContain("Roboto Mono");
    await expect(regularMono.fontWeight).toBe("425");

    const boldMono = getComputedStyle(canvas.getByTestId("text-bold-mono-weight"));
    await expect(boldMono.fontFamily).toContain("Roboto Mono");
    await expect(boldMono.fontWeight).toBe("500");

    const monoHeading = getComputedStyle(canvas.getByTestId("heading-mono-weight"));
    await expect(monoHeading.fontFamily).toContain("Roboto Mono");
    await expect(monoHeading.fontWeight).toBe("500");

    const inheritedHeading = getComputedStyle(canvas.getByTestId("heading-inherit-weight"));
    await expect(inheritedHeading.fontWeight).toBe("700");
    const inheritedMonoHeading = getComputedStyle(
      canvas.getByTestId("heading-mono-inherit-weight"),
    );
    await expect(inheritedMonoHeading.fontFamily).toContain("Roboto Mono");
    await expect(inheritedMonoHeading.fontWeight).toBe("700");

    const inheritedRubik = getComputedStyle(canvas.getByTestId("text-inherit-600"));
    await expect(inheritedRubik.fontFamily).toContain("Rubik");
    await expect(inheritedRubik.fontWeight).toBe("600");
    await expect((await document.fonts.load('600 14px "Rubik"', "Sentry")).length).toBeGreaterThan(
      0,
    );
    await expect(
      (await document.fonts.load('600 14px "Roboto Mono"', "Sentry")).length,
    ).toBeGreaterThan(0);

    await expect(getComputedStyle(canvas.getByTestId("prose-first-block")).marginBottom).toBe(
      "24px",
    );
    await expect(getComputedStyle(canvas.getByTestId("prose-excluded-menu")).marginBottom).toBe(
      "0px",
    );
    await expect(getComputedStyle(canvas.getByTestId("prose-pre")).marginBottom).toBe("24px");
    await expect(getComputedStyle(canvas.getByTestId("prose-last-block")).marginBottom).toBe("0px");

    const inlineCode = getComputedStyle(canvas.getByTestId("prose-inline-code"));
    await expect(inlineCode.fontFamily).toContain("Roboto Mono");
    await expect(inlineCode.fontSize).toBe("19px");
    await expect(inlineCode.fontWeight).toBe("650");
    await expect(inlineCode.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    await expect(inlineCode.paddingInlineStart).not.toBe("0px");

    const proseKbd = getComputedStyle(canvas.getByTestId("prose-kbd"));
    await expect(proseKbd.fontSize).toBe("12px");
    await expect(proseKbd.lineHeight).toBe("29px");
    await expect(proseKbd.fontWeight).toBe("500");

    const preCode = getComputedStyle(canvas.getByTestId("prose-pre-code"));
    await expect(preCode.backgroundColor).toBe("rgba(0, 0, 0, 0)");
    await expect(preCode.paddingInlineStart).toBe("0px");
  },
};

export const RenderFunctions: Story = {
  render: () => (
    <div className="grid gap-3">
      <Text variant="accent">
        {({ className }) => (
          <a className={className} href="#render-text">
            Text link
          </a>
        )}
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
      <Heading as="h2" size="3xl">
        3xl heading
      </Heading>
      <Heading as="h2" size="4xl">
        4xl heading
      </Heading>
      <Heading as="h3" size={{ zero: "xs", "screen:lg": "xl" }}>
        Responsive heading
      </Heading>
    </div>
  ),
};

export const HeadingVariantsAndFeatures: Story = {
  render: () => (
    <div className="grid gap-3">
      {variants.map((variant) => (
        <Heading as="h3" key={variant} variant={variant}>
          {variant} heading
        </Heading>
      ))}
      <div style={{ color: "rebeccapurple", fontSize: "18px", fontWeight: 700, lineHeight: 2 }}>
        <Heading as="h3" variant="inherit">
          Inherited heading
        </Heading>
      </div>
      <Heading as="h3" italic underline strikethrough>
        Decorated heading
      </Heading>
      <Heading as="h3" monospace>
        Monospace heading
      </Heading>
      <Heading as="h3" align="center">
        Centered heading
      </Heading>
      <div className="w-48">
        <Heading as="h3" ellipsis>
          Truncated heading with long content
        </Heading>
      </div>
    </div>
  ),
};

export const ProseComposition: Story = {
  render: () => (
    <Prose>
      <Heading as="h2">Getting started</Heading>
      <p>
        Prose spaces raw blocks and styles <code>inline code</code> plus <kbd>⌘K</kbd>.
      </p>
      <p>A second paragraph keeps the canonical 24 pixel rhythm.</p>
      <ul>
        <li>First item</li>
        <li>Second item</li>
      </ul>
      <pre>
        <code>const block = &quot;unchanged&quot;;</code>
      </pre>
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

function TextRuntimeContract() {
  return (
    <div className="grid gap-6">
      <Container containerType="inline-size" width="700px">
        <Text
          align={{ zero: "left", md: "right", "screen:2xs": "center" }}
          data-testid="text-responsive-contract"
          size={{
            zero: "xs",
            md: "md",
            lg: "xl",
            "screen:2xs": "sm",
            "screen:xs": "2xl",
          }}
        >
          Screen beats container and larger active breakpoints win
        </Text>
      </Container>

      <Text align={{ zero: "left", "screen:xs": "right" }} size={{ zero: "xs", "screen:xs": "lg" }}>
        {({ className }) => (
          <strong className={className} data-testid="text-render-contract">
            Render function child
          </strong>
        )}
      </Text>

      <Text
        align={{ zero: "left", "screen:2xs": "right" }}
        data-testid="text-inline-override"
        density={{ zero: "compressed", "screen:2xs": "comfortable" }}
        display={{ zero: "none", "screen:2xs": "block" }}
        size={{ zero: "xs", "screen:2xs": "2xl" }}
        style={{
          display: "grid",
          fontSize: "31px",
          lineHeight: "37px",
          textAlign: "justify",
        }}
      >
        Inline style wins
      </Text>

      <div className="grid gap-2">
        <Text data-testid="text-decoration-contract" strikethrough underline>
          Text decoration
        </Text>
        <Heading as="h3" data-testid="heading-decoration-contract" strikethrough underline="dotted">
          Heading decoration
        </Heading>
        <Text data-testid="text-word-break-contract" wordBreak="break-word">
          Text word break
        </Text>
        <Heading as="h3" data-testid="heading-word-break-contract" wordBreak="break-word">
          Heading word break
        </Heading>
        <div style={{ overflowWrap: "anywhere" }}>
          <Text data-testid="text-normal-word-break-contract" wordBreak="normal">
            Normal Text word break
          </Text>
          <Heading as="h3" data-testid="heading-normal-word-break-contract" wordBreak="normal">
            Normal Heading word break
          </Heading>
        </div>
        <Text cursor="pointer" data-testid="text-cursor-contract">
          Text cursor
        </Text>
        <div className="w-80" data-testid="heading-ellipsis-parent">
          <Heading
            as="h3"
            className="inline-block"
            cursor="pointer"
            data-testid="heading-ellipsis-contract"
            ellipsis
          >
            Short
          </Heading>
        </div>
      </div>

      <div className="grid gap-2">
        <Text data-testid="text-sans-weight">Sans text</Text>
        <Text data-testid="text-mono-weight" monospace>
          Mono text
        </Text>
        <Text bold={false} data-testid="text-regular-mono-weight" monospace>
          Explicit regular mono text
        </Text>
        <Text bold data-testid="text-bold-mono-weight" monospace>
          Bold mono text
        </Text>
        <Heading as="h3" data-testid="heading-mono-weight" monospace>
          Mono heading
        </Heading>
        <div style={{ fontWeight: 700 }}>
          <Heading as="h3" data-testid="heading-inherit-weight" variant="inherit">
            Inherited heading
          </Heading>
          <Heading as="h3" data-testid="heading-mono-inherit-weight" monospace variant="inherit">
            Inherited mono heading
          </Heading>
        </div>
        <div style={{ fontWeight: 600 }}>
          <Text data-testid="text-inherit-600" variant="inherit">
            Inherited Rubik 600
          </Text>
        </div>
      </div>

      <Prose>
        <p
          data-testid="prose-first-block"
          style={{ fontSize: "19px", fontWeight: 650, lineHeight: "29px" }}
        >
          Inline <code data-testid="prose-inline-code">code</code> and{" "}
          <kbd data-testid="prose-kbd">⌘K</kbd>
        </p>
        <ul data-testid="prose-excluded-menu" role="menu">
          <li role="menuitem">Interactive list</li>
        </ul>
        <pre data-testid="prose-pre">
          <code data-testid="prose-pre-code">const block = true;</code>
        </pre>
        <p data-testid="prose-last-block">Last block</p>
      </Prose>
    </div>
  );
}
