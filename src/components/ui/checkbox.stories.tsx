import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Checkbox } from "./checkbox"
import { Label } from "./label"

const meta = {
  title: "Components/Checkbox",
  component: Checkbox,
} satisfies Meta<typeof Checkbox>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Checkbox id="email" defaultChecked />
        <Label htmlFor="email">Email alerts for new issues</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="slack" defaultChecked />
        <Label htmlFor="slack">Slack notifications</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="webhook" />
        <Label htmlFor="webhook">Webhook integration</Label>
      </div>
    </div>
  ),
}

export const Small: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox size="sm" defaultChecked id="sm" />
      <Label htmlFor="sm" className="text-xs">Small checkbox</Label>
    </div>
  ),
}

export const Disabled: Story = {
  render: () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Checkbox disabled defaultChecked id="d1" />
        <Label htmlFor="d1">Checked disabled</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox disabled id="d2" />
        <Label htmlFor="d2">Unchecked disabled</Label>
      </div>
    </div>
  ),
}

// Args-driven story so the Controls panel manipulates a live instance.
export const Playground: Story = {
  args: {
    size: "default",
    defaultChecked: true,
    disabled: false,
    "aria-label": "Toggle setting",
  },
  argTypes: {
    size: { control: "select", options: ["sm", "default"] },
    disabled: { control: "boolean" },
  },
  render: (args) => <Checkbox {...args} />,
}
