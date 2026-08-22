import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";

import { Separator } from "./separator";

const meta = {
  title: "Components/Separator",
  component: Separator,
  args: { orientation: "horizontal" },
} satisfies Meta<typeof Separator>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Shows native horizontal and vertical separator dimensions. */
export const Orientations: Story = {
  render: () => (
    <div className="flex h-12 gap-4">
      <Separator data-testid="horizontal" orientation="horizontal" />
      <Separator data-testid="vertical" orientation="vertical" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const horizontal = canvas.getByTestId("horizontal");
    const vertical = canvas.getByTestId("vertical");
    await expect(horizontal.tagName).toBe("HR");
    await expect(horizontal).toHaveAttribute("aria-orientation", "horizontal");
    await expect(vertical).toHaveAttribute("aria-orientation", "vertical");
    await expect(getComputedStyle(vertical).width).toBe("1px");
  },
};
