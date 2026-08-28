import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CheckCircle2, CircleDot, Megaphone } from "lucide-react";
import { expect, fn, userEvent, within } from "storybook/test";

import { Tag } from "./badge";

const meta = {
  title: "Components/Tag",
  component: Tag,
  argTypes: {
    variant: {
      control: "select",
      options: ["muted", "info", "promotion", "danger", "warning", "success"],
    },
  },
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Variants: Story = {
  parameters: {
    a11y: { config: { rules: [{ enabled: false, id: "color-contrast" }] } },
  },
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Tag variant="muted">Default</Tag>
      <Tag variant="success">Success</Tag>
      <Tag variant="danger">Error</Tag>
      <Tag variant="warning">Warning</Tag>
      <Tag variant="info">Info</Tag>
      <Tag variant="promotion">Promotion</Tag>
    </div>
  ),
};

export const WithIcons: Story = {
  parameters: {
    a11y: { config: { rules: [{ enabled: false, id: "color-contrast" }] } },
  },
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Tag icon={<CheckCircle2 />} variant="success">
        Resolved
      </Tag>
      <Tag icon={<CircleDot />} variant="info">
        Ongoing
      </Tag>
      <Tag icon={<Megaphone />} variant="promotion">
        Announcement
      </Tag>
    </div>
  ),
};

export const Dismissible: Story = {
  args: {
    variant: "info",
    children: "Dismiss me",
    onDismiss: fn(),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Dismiss" }));
    expect(args.onDismiss).toHaveBeenCalledOnce();
  },
};
