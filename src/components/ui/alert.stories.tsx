import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MemoryRouter } from "react-router-dom";
import { expect, fn, userEvent, within } from "storybook/test";

import { Alert, AlertLink } from "./alert";

const meta = {
  title: "Components/Alert",
  component: Alert,
  args: { children: "This is an informational message", variant: "info" },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: {
    a11y: { config: { rules: [{ enabled: false, id: "svg-img-alt" }] } },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["muted", "info", "warning", "success", "danger"],
    },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  render: () => (
    <Alert.Container>
      <Alert variant="muted">This is a muted alert</Alert>
      <Alert variant="info">This is an info alert</Alert>
      <Alert variant="warning">This is a warning alert</Alert>
      <Alert variant="success">This is a success alert</Alert>
      <Alert variant="danger">This is a danger alert</Alert>
    </Alert.Container>
  ),
};

export const Composition: Story = {
  render: () => (
    <Alert
      variant="warning"
      expand={<div data-expanded-content>Additional diagnostic details.</div>}
      trailingItems={<Alert.Button variant="transparent">Review</Alert.Button>}
    >
      Click the alert or disclosure button to expand it.
    </Alert>
  ),
};

export const Interaction: Story = {
  args: {
    children: "Expandable alert",
    expand: <div>Additional diagnostic details.</div>,
    handleExpandChange: fn(),
    variant: "info",
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.queryByText("Additional diagnostic details.")).toBeNull();
    await userEvent.click(canvas.getByText("Expandable alert"));
    expect(canvas.getByText("Additional diagnostic details.")).toBeVisible();
    expect(args.handleExpandChange).toHaveBeenCalledWith(true);
    await userEvent.click(canvas.getByText("Additional diagnostic details."));
    expect(canvas.getByText("Additional diagnostic details.")).toBeVisible();
  },
};

export const Links: Story = {
  render: () => (
    <AlertLink.Container>
      <AlertLink variant="info" to="/settings">
        Internal alert link
      </AlertLink>
      <AlertLink variant="success" href="https://docs.sentry.io" openInNewTab>
        External alert link
      </AlertLink>
    </AlertLink.Container>
  ),
};
