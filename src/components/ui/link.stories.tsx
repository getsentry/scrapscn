import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MemoryRouter } from "react-router-dom";
import { expect, fn, userEvent, within } from "storybook/test";

import { ExternalLink, Link } from "./link";
import { Text } from "./text";
import { TrackingContextProvider } from "./tracking-context";

const meta = {
  title: "Scraps/Link",
  component: Link,
  decorators: [
    (Story) => (
      <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: { layout: "padded" },
} satisfies Meta<typeof Link>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RouterAndExternal: Story = {
  parameters: {
    a11y: { config: { rules: [{ id: "color-contrast", enabled: false }] } },
  },
  render: () => (
    <div className="flex flex-col items-start gap-3 text-sm">
      <Link to="/issues/">Open issue</Link>
      <Link disabled to={{ pathname: "/issues/" }}>
        Disabled issue
      </Link>
      <ExternalLink href="https://docs.sentry.io">External link</ExternalLink>
      <ExternalLink href="https://docs.sentry.io" openInNewTab={false}>
        Same-tab external link
      </ExternalLink>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("link", { name: "Open issue" })).toHaveAttribute(
      "href",
      "/issues/",
    );
    await expect(canvas.getByText("Disabled issue")).not.toHaveAttribute("href");
    await expect(canvas.getByText("Disabled issue")).not.toHaveAttribute("disabled");
    await expect(canvas.getByRole("link", { name: "External link" })).toHaveAttribute(
      "rel",
      "noreferrer noopener",
    );
    await expect(canvas.getByRole("link", { name: "Same-tab external link" })).not.toHaveAttribute(
      "target",
    );
  },
};

const tracking = fn();

export const Tracking: Story = {
  render: () => (
    <TrackingContextProvider value={() => tracking}>
      <Link
        analyticsEventKey="issue.opened"
        analyticsParams={{ source: "storybook" }}
        aria-label="Open tracked issue"
        to="/issues/"
      >
        Open
      </Link>
    </TrackingContextProvider>
  ),
  play: async ({ canvasElement }) => {
    tracking.mockClear();
    await userEvent.click(within(canvasElement).getByRole("link", { name: "Open tracked issue" }));
    await expect(tracking).toHaveBeenCalledWith({
      "aria-label": "Open tracked issue",
      analyticsEventKey: "issue.opened",
      analyticsEventName: undefined,
      analyticsParams: { source: "storybook", variant: undefined },
      clickType: "link",
    });
  },
};

export const Inline: Story = {
  render: () => (
    <Text>
      This is a paragraph with an <Link to="/issues/">inline link</Link> that inherits its text
      styling.
    </Text>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const paragraph = canvas.getByText(/This is a paragraph/);
    const link = canvas.getByRole("link", { name: "inline link" });
    await expect(getComputedStyle(link).color).toBe(getComputedStyle(paragraph).color);
  },
};

export const LightAndDark: Story = {
  parameters: {
    a11y: { config: { rules: [{ id: "color-contrast", enabled: false }] } },
  },
  render: () => (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col items-start gap-3 bg-background p-4 text-foreground">
        <Link to="/issues/">Light focus</Link>
        <Link disabled to="/issues/">
          Light disabled
        </Link>
      </div>
      <div className="dark flex flex-col items-start gap-3 bg-background p-4 text-foreground">
        <Link to="/issues/">Dark focus</Link>
        <Link disabled to="/issues/">
          Dark disabled
        </Link>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const lightFocus = canvas.getByRole("link", { name: "Light focus" });
    const lightDisabled = canvas.getByText("Light disabled");
    const darkDisabled = canvas.getByText("Dark disabled");

    await userEvent.tab();
    await expect(lightFocus).toHaveFocus();
    await expect(getComputedStyle(lightFocus).borderRadius).toBe("2px");
    await expect(getComputedStyle(lightFocus).boxShadow).toContain("oklch(0.58 0.241 285.2)");
    await expect(getComputedStyle(lightDisabled).color).toBe("rgb(135, 132, 144)");
    await expect(getComputedStyle(darkDisabled).color).toBe("rgb(149, 142, 159)");
    await expect(getComputedStyle(lightDisabled).pointerEvents).toBe("none");
  },
};
