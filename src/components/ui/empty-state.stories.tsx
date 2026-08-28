import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";

import { Button } from "./button";
import { EmptyState } from "./empty-state";

const meta = {
  title: "Scraps/Empty State",
  component: EmptyState,
  parameters: { layout: "padded" },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TitleOnly: Story = { args: { title: "No results." } };

export const Complete: Story = {
  args: {
    action: <Button>Keep searching</Button>,
    description: "Try widening your search or adjusting your filters.",
    illustration: (
      <div aria-label="Empty box" role="img">
        □
      </div>
    ),
    title: "No issues match your search.",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("heading", { name: "No issues match your search." }),
    ).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Keep searching" })).toBeInTheDocument();
  },
};

export const OptionalRegions: Story = {
  render: () => (
    <div className="grid gap-6">
      <EmptyState title="Title only" />
      <EmptyState description="Description" title="With description" />
      <EmptyState action={<Button>Action</Button>} title="With action" />
    </div>
  ),
};

export const LightAndDark: Story = {
  render: () => (
    <div className="grid gap-6 sm:grid-cols-2">
      <EmptyState description="Light theme." title="No results" />
      <div className="dark bg-background p-4 text-foreground">
        <EmptyState description="Dark theme." title="No results" />
      </div>
    </div>
  ),
};
