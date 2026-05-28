import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect, within } from "storybook/test"

import { FeatureBadge } from "./feature-badge"

const meta = {
  title: "Components/FeatureBadge",
  component: FeatureBadge,
  argTypes: {
    type: {
      control: "select",
      options: ["alpha", "beta", "new", "experimental", "debug"],
    },
  },
} satisfies Meta<typeof FeatureBadge>

export default meta
type Story = StoryObj<typeof meta>

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
}

export const CustomTooltip: Story = {
  args: {
    type: "new",
    title: "This very special new feature requires additional context!",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // The badge exposes its rollout stage via aria-label.
    expect(canvas.getByLabelText("new")).toBeInTheDocument()
  },
}
