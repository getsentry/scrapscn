import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import { TextArea } from "./textarea";

const meta = {
  title: "Scraps/TextArea",
  component: TextArea,
  args: {
    "aria-label": "Issue description",
    placeholder: "Describe what happened",
  },
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="w-96 max-w-[calc(100vw-2rem)]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TextArea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Sizes: Story = {
  render: (args) => (
    <div className="grid gap-4">
      <TextArea {...args} aria-label="Extra small" size="xs" />
      <TextArea {...args} aria-label="Small" size="sm" />
      <TextArea {...args} aria-label="Medium" size="md" />
    </div>
  ),
};

export const States: Story = {
  render: (args) => (
    <div className="grid gap-4">
      <TextArea {...args} aria-label="Default" />
      <TextArea {...args} aria-label="Disabled" disabled value="Unavailable" readOnly />
      <TextArea {...args} aria-label="Read only" readOnly value="Read-only value" />
      <TextArea {...args} aria-label="Monospace" monospace value="event.type:error" readOnly />
    </div>
  ),
};

export const Autosize: Story = {
  args: { autosize: true, maxRows: 6, rows: 2 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByRole("textbox", { name: "Issue description" });
    await userEvent.type(textarea, "First line{enter}Second line{enter}Third line");
    await expect(textarea).toHaveValue("First line\nSecond line\nThird line");
  },
};

export const LightAndDark: Story = {
  render: (args) => (
    <div className="grid gap-4">
      <div className="bg-background p-6 text-foreground">
        <TextArea {...args} aria-label="Light theme" />
      </div>
      <div className="dark bg-background p-6 text-foreground">
        <TextArea {...args} aria-label="Dark theme" />
      </div>
    </div>
  ),
};
