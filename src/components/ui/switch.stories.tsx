import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Switch } from "./switch"
import { Label } from "./label"

const meta = {
  title: "Components/Switch",
  component: Switch,
} satisfies Meta<typeof Switch>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => <Switch defaultChecked aria-label="Enable feature" />,
}

export const Unchecked: Story = {
  render: () => <Switch aria-label="Enable feature" />,
}

export const Small: Story = {
  render: () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Switch size="sm" defaultChecked id="sm-on" />
        <Label htmlFor="sm-on">Small checked</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch size="sm" id="sm-off" />
        <Label htmlFor="sm-off">Small unchecked</Label>
      </div>
    </div>
  ),
}

export const WithLabel: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between w-80">
        <div>
          <Label htmlFor="autofix">Auto-fix suggestions</Label>
          <p className="text-xs text-muted-foreground">Let Seer suggest fixes</p>
        </div>
        <Switch id="autofix" defaultChecked />
      </div>
      <div className="flex items-center justify-between w-80">
        <div>
          <Label htmlFor="replay">Session replay</Label>
          <p className="text-xs text-muted-foreground">Record user sessions</p>
        </div>
        <Switch id="replay" />
      </div>
    </div>
  ),
}

export const Disabled: Story = {
  render: () => (
    <div className="space-y-3">
      <Switch disabled defaultChecked aria-label="Enabled (disabled)" />
      <Switch disabled aria-label="Disabled" />
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
  render: (args) => <Switch {...args} />,
}
