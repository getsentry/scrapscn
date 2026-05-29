import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect, userEvent, within } from "storybook/test"
import { List, Rows3 } from "lucide-react"

import { SegmentedControl, SegmentedControlItem } from "./segmented-control"

const meta = {
  title: "Components/SegmentedControl",
  component: SegmentedControl,
} satisfies Meta<typeof SegmentedControl>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <SegmentedControl defaultValue="week" aria-label="Time period">
      <SegmentedControlItem value="day">Day</SegmentedControlItem>
      <SegmentedControlItem value="week">Week</SegmentedControlItem>
      <SegmentedControlItem value="month">Month</SegmentedControlItem>
    </SegmentedControl>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const month = canvas.getByRole("radio", { name: "Month" })
    await userEvent.click(month)
    expect(month).toBeChecked()
  },
}

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-4">
      {(["md", "sm", "xs"] as const).map((size) => (
        <SegmentedControl
          key={size}
          size={size}
          defaultValue="all"
          aria-label="Filter"
        >
          <SegmentedControlItem value="all">All</SegmentedControlItem>
          <SegmentedControlItem value="unresolved">Unresolved</SegmentedControlItem>
          <SegmentedControlItem value="ignored">Ignored</SegmentedControlItem>
        </SegmentedControl>
      ))}
    </div>
  ),
}

export const WithIcons: Story = {
  render: () => (
    <SegmentedControl defaultValue="list" aria-label="View">
      <SegmentedControlItem value="list">
        <List /> List
      </SegmentedControlItem>
      <SegmentedControlItem value="grid">
        <Rows3 /> Grid
      </SegmentedControlItem>
    </SegmentedControl>
  ),
}

// Args-driven story so the Controls panel (size, disabled) drives a live instance.
export const Playground: Story = {
  args: { size: "md", disabled: false, "aria-label": "Filter" },
  argTypes: {
    size: { control: "select", options: ["md", "sm", "xs"] },
    disabled: { control: "boolean" },
  },
  render: (args) => (
    <SegmentedControl {...args} defaultValue="all">
      <SegmentedControlItem value="all">All</SegmentedControlItem>
      <SegmentedControlItem value="unresolved">Unresolved</SegmentedControlItem>
      <SegmentedControlItem value="ignored">Ignored</SegmentedControlItem>
    </SegmentedControl>
  ),
}
