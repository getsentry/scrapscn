import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { FeatureBadge } from "./badge";

const meta = {
  title: "Components/FeatureBadge",
  component: FeatureBadge,
  argTypes: {
    type: {
      control: "select",
      options: ["alpha", "beta", "new", "experimental", "debug"],
    },
  },
} satisfies Meta<typeof FeatureBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Types: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <FeatureBadge type="alpha" />
      <FeatureBadge type="beta" />
      <FeatureBadge type="new" />
      <FeatureBadge type="experimental" />
      <FeatureBadge type="debug" />
    </div>
  ),
};

export const CustomTooltip: Story = {
  args: {
    type: "new",
    tooltipProps: {
      title: "This very special new feature requires additional context!",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByLabelText("new");
    expect(badge).toBeInTheDocument();
    await userEvent.hover(badge);
    const tooltip = await within(canvasElement.ownerDocument.body).findByRole("tooltip");
    await expect(tooltip).toHaveAttribute("data-side", "right");
    await userEvent.unhover(badge);
    await waitFor(
      () =>
        expect(
          within(canvasElement.ownerDocument.body).queryByRole("tooltip"),
        ).not.toBeInTheDocument(),
      { timeout: 2000 },
    );
  },
};
