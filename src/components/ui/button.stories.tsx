import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Check, ExternalLink, Plus, Trash2 } from "lucide-react";
import { expect, fn, userEvent, within } from "storybook/test";

import { Button, ButtonBar, LinkButton } from "./button";
import { LinkBehaviorContextProvider, type LinkProps } from "./link";
import { TrackingContextProvider } from "./tracking-context";

const meta = {
  title: "Scraps/Button",
  component: Button,
  decorators: [
    (Story) => (
      <LinkBehaviorContextProvider
        value={{
          behavior: (props: LinkProps) => props,
          component: ({ to, ...props }: LinkProps) => (
            <a {...props} href={typeof to === "string" ? to : to.pathname} />
          ),
        }}
      >
        <Story />
      </LinkBehaviorContextProvider>
    ),
  ],
  parameters: { layout: "padded" },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button>Secondary</Button>
      <Button variant="primary">Primary</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="warning">Warning</Button>
      <Button variant="transparent">Transparent</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};

export const SizesAndIcons: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button icon={<Plus />} size="zero">
        Zero
      </Button>
      <Button icon={<Plus />} size="xs">
        Extra small
      </Button>
      <Button icon={<Plus />} size="sm">
        Small
      </Button>
      <Button icon={<Plus />} size="md">
        Medium
      </Button>
      <Button aria-label="Add" icon={<Plus />} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "Zero" })).toHaveStyle({ height: "24px" });
    await expect(canvas.getByRole("button", { name: "Extra small" })).toHaveStyle({
      height: "28px",
    });
    await expect(canvas.getByRole("button", { name: "Small" })).toHaveStyle({ height: "32px" });
    await expect(canvas.getByRole("button", { name: "Medium" })).toHaveStyle({ height: "36px" });
    await expect(canvas.getByRole("button", { name: "Add" })).toHaveAttribute(
      "data-shape",
      "square",
    );
    await expect(canvas.getByRole("button", { name: "Zero" })).toHaveStyle({ borderRadius: "4px" });
    await expect(canvas.getByRole("button", { name: "Extra small" })).toHaveStyle({
      borderRadius: "5px",
    });
    await expect(canvas.getByRole("button", { name: "Small" })).toHaveStyle({
      borderRadius: "6px",
    });
    await expect(canvas.getByRole("button", { name: "Medium" })).toHaveStyle({
      borderRadius: "8px",
    });
    await expect(canvas.getByRole("button", { name: "Small" }).querySelector("svg")).toHaveStyle({
      height: "14px",
      width: "14px",
    });
  },
};

const tracking = fn();
const click = fn();

export const StatesAndTracking: Story = {
  render: () => (
    <TrackingContextProvider value={() => tracking}>
      <div className="flex flex-wrap items-center gap-4">
        <Button analyticsEventKey="save.clicked" onClick={click}>
          Save
        </Button>
        <Button busy>Saving</Button>
        <Button disabled>Disabled</Button>
        <Button aria-expanded="true">Expanded</Button>
      </div>
    </TrackingContextProvider>
  ),
  play: async ({ canvasElement }) => {
    tracking.mockClear();
    click.mockClear();
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));
    await expect(tracking).toHaveBeenCalledOnce();
    await expect(click).toHaveBeenCalledOnce();
    await expect(canvas.getByRole("button", { name: "Saving" })).toHaveAttribute(
      "aria-busy",
      "true",
    );
    await expect(canvas.getByRole("button", { name: "Disabled" })).toBeDisabled();
  },
};

export const LinksAndBars: Story = {
  render: () => (
    <div className="grid gap-6">
      <div className="flex gap-4">
        <LinkButton icon={<Check />} to="/issues/">
          Issues
        </LinkButton>
        <LinkButton external href="https://docs.sentry.io" icon={<ExternalLink />}>
          Docs
        </LinkButton>
        <LinkButton disabled href="/disabled/">
          Disabled
        </LinkButton>
      </div>
      <ButtonBar size="sm">
        <Button>One</Button>
        <Button className="active">Two</Button>
        <Button>Three</Button>
      </ButtonBar>
      <ButtonBar orientation="vertical" size="xs">
        <Button>Top</Button>
        <Button icon={<Trash2 />}>Bottom</Button>
      </ButtonBar>
      <ButtonBar data-testid="wrapped-bar" size="sm">
        <Button>Wrapped first</Button>
        <span role="presentation">
          <Button>Wrapped middle</Button>
        </span>
        <div className="dropdown">
          <div className="dropdown-actor">
            <Button>Wrapped last</Button>
          </div>
        </div>
      </ButtonBar>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "Issues" })).toHaveAttribute(
      "href",
      "/issues/",
    );
    await expect(canvas.getByRole("button", { name: "Docs" })).toHaveAttribute("target", "_blank");
    await expect(canvas.getByRole("button", { name: "Disabled" })).not.toHaveAttribute("href");
    await expect(canvas.getByRole("button", { name: "One" })).toHaveAttribute("data-size", "sm");
    await expect(canvas.getByRole("button", { name: "Top" })).toHaveAttribute("data-size", "xs");
    const middle = canvas.getByRole("button", { name: "Wrapped middle" });
    const last = canvas.getByRole("button", { name: "Wrapped last" });
    await expect(middle).toHaveStyle({ borderRadius: "0px", marginLeft: "-1px" });
    await expect(last).toHaveStyle({
      borderBottomLeftRadius: "0px",
      borderTopLeftRadius: "0px",
      marginLeft: "-1px",
    });
  },
};

export const LightAndDark: Story = {
  render: () => (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-wrap gap-4 bg-background p-6 text-foreground">
        <Button variant="primary">Light primary</Button>
        <Button>Light secondary</Button>
      </div>
      <div className="dark flex flex-wrap gap-4 bg-background p-6 text-foreground">
        <Button variant="primary">Dark primary</Button>
        <Button>Dark secondary</Button>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const light = canvas.getByRole("button", { name: "Light secondary" });
    const dark = canvas.getByRole("button", { name: "Dark secondary" });
    await expect(getComputedStyle(light, "::after").backgroundColor).toBe("rgb(255, 255, 255)");
    await expect(getComputedStyle(dark, "::after").backgroundColor).toBe("rgb(46, 41, 54)");
  },
};
