import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Search } from "lucide-react";
import { expect, userEvent, within } from "storybook/test";

import { Input, InputGroup, NumberDragInput, NumberInput, OTPInput } from "./input";
import { Label } from "./label";

const meta = {
  title: "Scraps/Input",
  component: Input,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-80 space-y-2">
      <Label htmlFor="name">Project name</Label>
      <Input id="name" defaultValue="frontend" />
    </div>
  ),
};

export const Placeholder: Story = {
  render: () => <Input className="w-80" placeholder="Search issues..." />,
};

export const Sizes: Story = {
  render: () => (
    <div className="grid w-80 gap-4">
      <Input aria-label="Extra small" placeholder="xs" size="xs" />
      <Input aria-label="Small" placeholder="sm" size="sm" />
      <Input aria-label="Medium" placeholder="md" size="md" />
    </div>
  ),
};

export const WithSearchIcon: Story = {
  name: "Search input (Sentry style)",
  render: () => (
    <InputGroup className="w-96">
      <InputGroup.LeadingItems disablePointerEvents>
        <Search className="size-4" />
      </InputGroup.LeadingItems>
      <InputGroup.Input placeholder="Search issues, events, or users..." />
    </InputGroup>
  ),
};

export const Disabled: Story = {
  render: () => <Input className="w-80" aria-label="DSN" defaultValue="read-only DSN" disabled />,
};

export const ReadOnly: Story = {
  render: () => (
    <Input
      className="w-96"
      aria-label="DSN"
      defaultValue="https://abc123@o0.ingest.sentry.io/456"
      monospace
      readOnly
    />
  ),
};

export const NumericControls: Story = {
  render: () => (
    <div className="grid w-80 gap-4">
      <NumberInput aria-label="Retries" defaultValue={2} max={5} min={0} />
      <NumberDragInput aria-label="Threshold" defaultValue={5} max={10} min={0} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Increase Retries" }));
    await expect(canvas.getByLabelText("Retries")).toHaveValue("3");
    await userEvent.type(canvas.getByLabelText("Threshold"), "{ArrowUp}");
    await expect(canvas.getByLabelText("Threshold")).toHaveValue("6");
  },
};

export const OneTimePassword: Story = {
  render: () => <OTPInput format="000-000" onComplete={() => undefined} />,
};

// Args-driven story so the Controls panel manipulates a live instance.
export const Playground: Story = {
  args: {
    placeholder: "Search issues...",
    disabled: false,
    "aria-label": "Search",
  },
  argTypes: { disabled: { control: "boolean" } },
  render: (args) => <Input className="w-80" {...args} />,
};
