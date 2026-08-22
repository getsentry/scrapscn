import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";

import { Container, Flex, Grid, Stack, Surface } from "./layout";
import { Separator } from "./separator";
import "./layout.stories.css";

const meta = {
  title: "Components/Layout",
  component: Container,
} satisfies Meta<typeof Container>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Shows the public layout primitives in one token-aware composition. */
export const Composition: Story = {
  render: () => (
    <Container
      containerType="inline-size"
      data-testid="layout-container"
      padding="md"
      border="primary"
      radius="md"
    >
      <Stack
        data-testid="responsive-stack"
        direction={{ zero: "column", "screen:lg": "row" }}
        gap="md"
      >
        <Surface variant="primary" padding="md">
          Primary surface
        </Surface>
        <Stack.Separator data-testid="stack-separator" />
        <Grid columns="1fr 1fr" gap="sm">
          <span>One</span>
          <span>Two</span>
        </Grid>
      </Stack>
    </Container>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const container = canvas.getByTestId("layout-container");
    const stack = canvas.getByTestId("responsive-stack");
    await expect(container).not.toHaveAttribute("containerType");
    await expect(stack).not.toHaveAttribute("direction");
    await expect(getComputedStyle(stack).display).toBe("flex");
    await expect(canvasElement.querySelectorAll("style")).toHaveLength(0);
    await expect(canvas.getByTestId("stack-separator")).toHaveAttribute(
      "aria-orientation",
      getComputedStyle(stack).flexDirection === "row"
        ? "vertical"
        : "horizontal"
    );
  },
};

/** Exercises runtime CSS, container queries, canonical defaults, and React 19 refs. */
export const RuntimeContract: Story = {
  render: () => <RuntimeContractExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const containerStack = canvas.getByTestId("container-stack");
    const standaloneSeparator = canvas.getByTestId(
      "standalone-stack-separator"
    );
    const overlay = canvas.getByTestId("overlay");

    await expect(getComputedStyle(containerStack).flexDirection).toBe("row");
    await expect(standaloneSeparator).toHaveAttribute(
      "aria-orientation",
      "vertical"
    );
    await expect(getComputedStyle(overlay).boxShadow).toContain("1px 0px 0px");
    await expect(
      getComputedStyle(canvas.getByTestId("extra-small-radius")).borderRadius
    ).toBe("3px");
    await expect(
      getComputedStyle(canvas.getByTestId("consumer-class")).display
    ).toBe("block");
    await expect(
      getComputedStyle(canvas.getByTestId("consumer-style")).display
    ).toBe("grid");
    await expect(
      getComputedStyle(canvas.getByTestId("consumer-separator-class")).width
    ).toBe("8px");
    await expect(canvasElement.querySelectorAll("style")).toHaveLength(0);
    for (const element of canvas.getAllByTestId("prop-filter")) {
      await expect(element).not.toHaveAttribute("invalidcamelcase");
      await expect(element).toHaveAttribute("aria-label", "Valid ARIA label");
      await expect(element).toHaveAttribute("data-valid", "true");
      await expect(element).toHaveAttribute("role", "group");
      await expect(element).toHaveAttribute("title", "Valid title");
      await userEvent.click(element);
    }
    const filteredSeparator = canvas.getByTestId("separator-prop-filter");
    await expect(filteredSeparator).not.toHaveAttribute("invalidcamelcase");
    await expect(filteredSeparator).toHaveAttribute(
      "aria-label",
      "Valid separator label"
    );
    await expect(filteredSeparator).toHaveAttribute("data-valid", "true");
    await expect(filteredSeparator).toHaveAttribute("tabindex", "0");
    await expect(filteredSeparator).toHaveAttribute("title", "Valid title");
    await userEvent.click(filteredSeparator);
    await expect(canvas.getByTestId("valid-event-count")).toHaveTextContent(
      "6"
    );

    await userEvent.click(
      canvas.getByRole("button", { name: "Unmount ref target" })
    );
    await expect(canvas.getByTestId("ref-result")).toHaveTextContent("cleaned");
  },
};

function RuntimeContractExample() {
  const [showRefTarget, setShowRefTarget] = useState(true);
  const [refResult, setRefResult] = useState("mounted");
  const [validEventCount, setValidEventCount] = useState(0);
  const invalidDomProps = {
    "aria-label": "Valid ARIA label",
    "data-testid": "prop-filter",
    "data-valid": "true",
    invalidCamelCase: "must-not-reach-dom",
    onClick: () => setValidEventCount((count) => count + 1),
    role: "group",
    title: "Valid title",
  };
  const invalidSeparatorDomProps = {
    "aria-label": "Valid separator label",
    "data-testid": "separator-prop-filter",
    "data-valid": "true",
    invalidCamelCase: "must-not-reach-dom",
    onClick: () => setValidEventCount((count) => count + 1),
    tabIndex: 0,
    title: "Valid title",
  };

  return (
    <div className="flex flex-col gap-2">
      <Container containerType="inline-size" width="600px">
        <Stack
          data-testid="container-stack"
          direction={{ zero: "column", md: "row" }}
        >
          <span>First</span>
          <span>Second</span>
        </Stack>
      </Container>
      <Stack.Separator data-testid="standalone-stack-separator" />
      <Surface data-testid="overlay" variant="overlay">
        Overlay
      </Surface>
      <Container data-testid="extra-small-radius" radius="2xs" />
      <Container {...invalidDomProps} />
      <Flex {...invalidDomProps} />
      <Grid {...invalidDomProps} />
      <Stack {...invalidDomProps} />
      <Surface {...invalidDomProps} />
      <Separator {...invalidSeparatorDomProps} orientation="horizontal" />
      <output data-testid="valid-event-count">{validEventCount}</output>
      <Flex data-testid="consumer-class" className="layout-consumer-display">
        Consumer class
      </Flex>
      <Flex data-testid="consumer-style" style={{ display: "grid" }}>
        Consumer style
      </Flex>
      <Separator
        data-testid="consumer-separator-class"
        className="layout-consumer-separator-width"
        orientation="vertical"
      />
      {showRefTarget ? (
        <Container
          containerType="inline-size"
          ref={() => {
            return () => setRefResult("cleaned");
          }}
        />
      ) : null}
      <button type="button" onClick={() => setShowRefTarget(false)}>
        Unmount ref target
      </button>
      <output data-testid="ref-result">{refResult}</output>
    </div>
  );
}

/** Gives wide and narrow viewport baselines for the responsive cascade. */
export const ResponsiveBaselines: Story = {
  render: () => (
    <div className="grid gap-4">
      <Flex
        data-testid="narrow-flex"
        direction={{ "screen:2xs": "column" }}
        gap="xs"
      >
        <span>First</span>
        <span>Second</span>
      </Flex>
      <Flex
        data-testid="wide-narrow-flex"
        direction={{ "screen:2xs": "column", "screen:lg": "row" }}
        gap={{ zero: "xs", "screen:lg": "xl" }}
      >
        <span>First</span>
        <span>Second</span>
      </Flex>
      <SeparatorExamples />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const narrowFlex = canvas.getByTestId("narrow-flex");
    const wideFlex = canvas.getByTestId("wide-narrow-flex");
    await expect(getComputedStyle(narrowFlex).flexDirection).toBe("column");
    await expect(["column", "row"]).toContain(
      getComputedStyle(wideFlex).flexDirection
    );
    await expect(canvas.getByTestId("horizontal-separator").tagName).toBe("HR");
  },
};

function SeparatorExamples() {
  return (
    <Stack gap="sm">
      <span>Above</span>
      <Stack.Separator data-testid="horizontal-separator" />
      <span>Below</span>
    </Stack>
  );
}
