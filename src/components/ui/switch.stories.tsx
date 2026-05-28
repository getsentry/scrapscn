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
  render: () => <Switch defaultChecked />,
}

export const Unchecked: Story = {
  render: () => <Switch />,
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
      <Switch disabled defaultChecked />
      <Switch disabled />
    </div>
  ),
}
