import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect, userEvent, within } from "storybook/test"

import { RadioGroup, RadioGroupItem } from "./radio-group"

const meta = {
  title: "Components/RadioGroup",
  component: RadioGroup,
} satisfies Meta<typeof RadioGroup>

export default meta
type Story = StoryObj<typeof meta>

const options = ["Error", "Warning", "Info"]

export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="Error" aria-label="Log level">
      {options.map((label) => (
        <label key={label} className="flex items-center gap-2 text-sm">
          <RadioGroupItem value={label} />
          {label}
        </label>
      ))}
    </RadioGroup>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const warning = canvas.getByRole("radio", { name: "Warning" })
    await userEvent.click(warning)
    expect(warning).toBeChecked()
  },
}

export const Small: Story = {
  render: () => (
    <RadioGroup defaultValue="Error" aria-label="Log level">
      {options.map((label) => (
        <label key={label} className="flex items-center gap-2 text-sm">
          <RadioGroupItem size="sm" value={label} aria-label={label} />
          {label}
        </label>
      ))}
    </RadioGroup>
  ),
}

export const Disabled: Story = {
  render: () => (
    <RadioGroup defaultValue="Error" aria-label="Log level">
      <label className="flex items-center gap-2 text-sm">
        <RadioGroupItem value="Error" />
        Error
      </label>
      <label className="flex items-center gap-2 text-sm opacity-60">
        <RadioGroupItem value="Warning" disabled />
        Warning (disabled)
      </label>
    </RadioGroup>
  ),
}

// Args-driven story so the Controls panel can toggle `disabled` on the whole group.
export const Playground: Story = {
  args: { disabled: false, "aria-label": "Log level" },
  argTypes: { disabled: { control: "boolean" } },
  render: (args) => (
    <RadioGroup {...args} defaultValue="Error">
      {options.map((label) => (
        <label key={label} className="flex items-center gap-2 text-sm">
          <RadioGroupItem value={label} />
          {label}
        </label>
      ))}
    </RadioGroup>
  ),
}
