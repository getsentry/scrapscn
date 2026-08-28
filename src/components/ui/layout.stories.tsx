import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Container, Flex, Grid, Stack, Surface, type ContainerProps } from "./layout";
import { Separator } from "./separator";

import "./layout.stories.css";

const meta: Meta<ContainerProps> = {
  title: "Components/Layout",
  component: Container,
};
export default meta;
type Story = StoryObj<ContainerProps>;

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
    const stackSeparator = canvas.getByTestId("stack-separator");
    await expect(container).not.toHaveAttribute("containerType");
    await expect(stack).not.toHaveAttribute("direction");
    await expect(getComputedStyle(stack).display).toBe("flex");
    await expect(canvasElement.querySelectorAll("style")).toHaveLength(0);
    const separatorOrientation =
      getComputedStyle(stack).flexDirection === "row" ? "vertical" : "horizontal";
    await expect(stackSeparator).toHaveAttribute("aria-orientation", separatorOrientation);
    await expect(stackSeparator).toHaveClass(
      separatorOrientation === "horizontal"
        ? "[border-bottom:1px_solid_var(--scraps-theme-border-primary)]"
        : "[border-left:1px_solid_var(--scraps-theme-border-primary)]",
    );
    const separatorStyle = getComputedStyle(stackSeparator);
    const borderStyle =
      separatorOrientation === "horizontal"
        ? separatorStyle.borderBottomStyle
        : separatorStyle.borderLeftStyle;
    const borderWidth =
      separatorOrientation === "horizontal"
        ? separatorStyle.borderBottomWidth
        : separatorStyle.borderLeftWidth;
    const borderColor =
      separatorOrientation === "horizontal"
        ? separatorStyle.borderBottomColor
        : separatorStyle.borderLeftColor;
    await expect(borderStyle).toBe("solid");
    await expect(borderWidth).toBe("1px");
    await expect(borderColor).toBe("rgb(218, 217, 222)");
  },
};

/** Exercises runtime CSS, container queries, canonical defaults, and React 19 refs. */
export const RuntimeContract: Story = {
  render: () => <RuntimeContractExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const containerStack = canvas.getByTestId("container-stack");
    const standaloneSeparator = canvas.getByTestId("standalone-stack-separator");
    const overlay = canvas.getByTestId("overlay");

    await expect(getComputedStyle(containerStack).flexDirection).toBe("row");
    await expect(standaloneSeparator).toHaveAttribute("aria-orientation", "vertical");
    await expect(getComputedStyle(overlay).boxShadow).toContain("1px 0px 0px");
    await expect(getComputedStyle(canvas.getByTestId("extra-small-radius")).borderRadius).toBe(
      "3px",
    );
    await expect(getComputedStyle(canvas.getByTestId("consumer-class")).display).toBe("block");
    await expect(getComputedStyle(canvas.getByTestId("consumer-style")).display).toBe("grid");
    await expect(getComputedStyle(canvas.getByTestId("consumer-separator-class")).width).toBe(
      "8px",
    );
    await expect(
      getComputedStyle(canvas.getByTestId("screen-wins-over-container")).flexDirection,
    ).toBe("column-reverse");
    const renderFunction = canvas.getByTestId("responsive-render-function");
    const renderFunctionStyle = getComputedStyle(renderFunction);
    await expect(renderFunctionStyle.display).toBe("grid");
    await expect(renderFunctionStyle.alignItems).toBe("center");
    await expect(renderFunctionStyle.alignContent).toBe("start");
    await expect(renderFunctionStyle.justifyContent).toBe("end");
    await expect(renderFunctionStyle.justifyItems).toBe("start");
    await expect(renderFunctionStyle.paddingTop).toBe("4px");
    await expect(renderFunctionStyle.paddingRight).toBe("12px");
    await expect(renderFunctionStyle.marginTop).toBe("0px");
    await expect(renderFunctionStyle.marginLeft).toBe("6px");
    const cascadeWide = canvas.getByTestId("cascade-wide");
    const cascadeWideStyle = getComputedStyle(cascadeWide);
    await expect(cascadeWideStyle.paddingTop).toBe("4px");
    await expect(cascadeWideStyle.paddingRight).toBe("24px");
    await expect(cascadeWideStyle.marginLeft).toBe("6px");
    await expect(cascadeWideStyle.marginRight).toBe("24px");
    await expect(cascadeWideStyle.borderTopColor).toBe("rgb(255, 0, 43)");
    await expect(cascadeWideStyle.borderRightColor).toBe("rgb(230, 230, 233)");
    await expect(cascadeWideStyle.borderRadius).toBe("12px");
    await expect(cascadeWide).not.toHaveAttribute("style");
    const cascadeNarrow = canvas.getByTestId("cascade-narrow");
    const cascadeNarrowStyle = getComputedStyle(cascadeNarrow);
    await expect(cascadeNarrowStyle.paddingTop).toBe("4px");
    await expect(cascadeNarrowStyle.marginLeft).toBe("6px");
    await expect(cascadeNarrowStyle.borderTopColor).toBe("rgb(255, 0, 43)");
    await expect(cascadeNarrowStyle.borderRadius).toBe("12px");
    await expect(cascadeNarrow).not.toHaveAttribute("style");
    await expect(getComputedStyle(canvas.getByTestId("owned-responsive-radius")).borderRadius).toBe(
      "12px",
    );
    const liveRenderFunction = canvas.getByTestId("live-render-function");
    await waitFor(() => expect(getComputedStyle(liveRenderFunction).paddingTop).toBe("24px"));
    const replacementContainer = canvas.getByTestId("replacement-container");
    const replacementRenderFunction = canvas.getByTestId("replacement-render-function");
    await expect(replacementContainer.tagName).toBe("DIV");
    await waitFor(() => expect(getComputedStyle(replacementRenderFunction).paddingTop).toBe("4px"));
    await userEvent.click(canvas.getByRole("button", { name: "Replace query container" }));
    await waitFor(() =>
      expect(canvas.getByTestId("replacement-container").tagName).toBe("SECTION"),
    );
    await waitFor(() =>
      expect(getComputedStyle(canvas.getByTestId("replacement-render-function")).paddingTop).toBe(
        "24px",
      ),
    );
    await userEvent.click(canvas.getByRole("button", { name: "Widen render container" }));
    await waitFor(() => expect(getComputedStyle(liveRenderFunction).paddingTop).toBe("4px"));
    await userEvent.click(canvas.getByRole("button", { name: "Narrow render container" }));
    await waitFor(() => expect(getComputedStyle(liveRenderFunction).paddingTop).toBe("24px"));
    const renderFunctionClasses = [...renderFunction.classList];
    await expect(new Set(renderFunctionClasses).size).toBe(renderFunctionClasses.length);
    await expect(canvasElement.querySelectorAll("style")).toHaveLength(0);
    for (const element of canvas.getAllByTestId("prop-filter")) {
      await expect(element).not.toHaveAttribute("invalidcamelcase");
      await expect(element).toHaveAttribute("aria-label", "Valid ARIA label");
      await expect(element).toHaveAttribute("data-valid", "true");
      await expect(element).toHaveAttribute("exportparts", "source: layout");
      await expect(element).toHaveAttribute("part", "layout");
      await expect(element).toHaveAttribute("role", "group");
      await expect(element).toHaveAttribute("title", "Valid title");
      await userEvent.click(element);
    }
    const filteredSeparator = canvas.getByTestId("separator-prop-filter");
    await expect(filteredSeparator).not.toHaveAttribute("invalidcamelcase");
    await expect(filteredSeparator).toHaveAttribute("aria-label", "Valid separator label");
    await expect(filteredSeparator).toHaveAttribute("data-valid", "true");
    await expect(filteredSeparator).toHaveAttribute("exportparts", "source: separator");
    await expect(filteredSeparator).toHaveAttribute("part", "separator");
    await expect(filteredSeparator).toHaveAttribute("tabindex", "0");
    await expect(filteredSeparator).toHaveAttribute("title", "Valid title");
    await userEvent.click(filteredSeparator);
    await expect(canvas.getByTestId("valid-event-count")).toHaveTextContent("6");

    await userEvent.click(canvas.getByRole("button", { name: "Unmount ref target" }));
    await expect(canvas.getByTestId("ref-result")).toHaveTextContent("cleaned");
  },
};

function RuntimeContractExample() {
  const [showRefTarget, setShowRefTarget] = useState(true);
  const [refResult, setRefResult] = useState("mounted");
  const [validEventCount, setValidEventCount] = useState(0);
  const [liveContainerWidth, setLiveContainerWidth] = useState(400);
  const [replacementHost, setReplacementHost] = useState<"div" | "section">("div");
  const invalidDomProps = {
    "aria-label": "Valid ARIA label",
    "data-testid": "prop-filter",
    "data-valid": "true",
    invalidCamelCase: "must-not-reach-dom",
    onClick: () => setValidEventCount((count) => count + 1),
    exportparts: "source: layout",
    part: "layout",
    role: "group",
    title: "Valid title",
  };
  const invalidSeparatorDomProps = {
    "aria-label": "Valid separator label",
    "data-testid": "separator-prop-filter",
    "data-valid": "true",
    invalidCamelCase: "must-not-reach-dom",
    onClick: () => setValidEventCount((count) => count + 1),
    exportparts: "source: separator",
    part: "separator",
    tabIndex: 0,
    title: "Valid title",
  };

  return (
    <div className="flex flex-col gap-2">
      <Container containerType="inline-size" width="600px">
        <Stack data-testid="container-stack" direction={{ zero: "column", md: "row" }}>
          <span>First</span>
          <span>Second</span>
        </Stack>
      </Container>
      <Container containerType="inline-size" width="600px">
        <Flex
          data-testid="screen-wins-over-container"
          direction={{
            zero: "column",
            md: "row",
            "screen:2xs": "column-reverse",
          }}
        >
          <span>First</span>
          <span>Second</span>
        </Flex>
        <Grid
          align={{ zero: "start", md: "end", "screen:2xs": "end" }}
          alignContent={{ zero: "end", md: "start" }}
          display={{ zero: "grid", md: "inline-grid", "screen:2xs": "grid" }}
          justify={{ zero: "start", md: "end" }}
          justifyItems={{ zero: "end", md: "start" }}
          margin="0"
          marginLeft={{ zero: "0", md: "sm" }}
          padding={{ zero: "xl", md: "lg" }}
          paddingTop={{ zero: "sm", md: "xs" }}
        >
          {({ className }) => (
            <section
              className={className}
              data-testid="responsive-render-function"
              style={{ alignItems: "center" }}
            >
              Responsive render function
            </section>
          )}
        </Grid>
      </Container>
      <Container containerType="inline-size" width="600px">
        <Container
          data-testid="owned-responsive-radius"
          radius={{ zero: "lg", md: "sm", "screen:2xs": "xl" }}
        />
        <Container
          border={{ zero: "primary", "screen:2xs": "secondary" }}
          borderTop={{ md: "danger" }}
          margin={{ zero: "xl", "screen:2xs": "2xl" }}
          marginLeft={{ md: "sm" }}
          padding={{ zero: "xl", "screen:2xs": "2xl" }}
          paddingTop={{ md: "xs" }}
          radius={{ zero: "lg", md: "sm", "screen:2xs": "xl" }}
        >
          {({ className }) => (
            <section className={className} data-testid="cascade-wide">
              Wide declaration cascade
            </section>
          )}
        </Container>
      </Container>
      <Container containerType="inline-size" width="400px">
        <Container
          border={{ zero: "primary", "screen:2xs": "secondary" }}
          borderTop={{ md: "danger" }}
          margin={{ zero: "xl", "screen:2xs": "2xl" }}
          marginLeft={{ md: "sm" }}
          padding={{ zero: "xl", "screen:2xs": "2xl" }}
          paddingTop={{ md: "xs" }}
          radius={{ zero: "lg", md: "sm", "screen:2xs": "xl" }}
        >
          {({ className }) => (
            <section className={className} data-testid="cascade-narrow">
              Narrow declaration cascade
            </section>
          )}
        </Container>
      </Container>
      <Container containerType="inline-size" width={`${liveContainerWidth}px`}>
        <Container padding={{ zero: "2xl", md: "xs" }}>
          {({ className }) => (
            <section className={className} data-testid="live-render-function">
              Live render function
            </section>
          )}
        </Container>
      </Container>
      <button
        type="button"
        onClick={() => setLiveContainerWidth((width) => (width === 400 ? 600 : 400))}
      >
        {liveContainerWidth === 400 ? "Widen render container" : "Narrow render container"}
      </button>
      <Container
        as={replacementHost}
        containerType="inline-size"
        data-testid="replacement-container"
        width={replacementHost === "div" ? "600px" : "400px"}
      >
        <Container padding={{ zero: "2xl", md: "xs" }}>
          {({ className }) => (
            <span className={className} data-testid="replacement-render-function">
              Replacement render function
            </span>
          )}
        </Container>
      </Container>
      <button
        type="button"
        onClick={() => setReplacementHost((host) => (host === "div" ? "section" : "div"))}
      >
        {replacementHost === "div" ? "Replace query container" : "Restore query container"}
      </button>
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
      <Flex
        data-testid="consumer-style"
        display={{ zero: "flex", "screen:2xs": "inline-flex" }}
        style={{ display: "grid" }}
      >
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
      <Flex data-testid="narrow-flex" direction={{ "screen:2xs": "column" }} gap="xs">
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
    await expect(["column", "row"]).toContain(getComputedStyle(wideFlex).flexDirection);
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
