import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Switch } from "./switch";

const meta = {
  title: "Components/Switch",
  component: Switch,
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <Switch defaultChecked aria-label="Enable feature" />,
};

export const Unchecked: Story = { render: () => <Switch aria-label="Enable feature" /> };

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-5">
      <div className="flex items-center gap-2">
        <Switch size="sm" defaultChecked id="sm-on" />
        <label htmlFor="sm-on">Small checked</label>
      </div>
      <div className="flex items-center gap-2">
        <Switch size="lg" id="lg-off" />
        <label htmlFor="lg-off">Large unchecked</label>
      </div>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="space-y-3">
      <Switch disabled defaultChecked aria-label="Enabled (disabled)" />
      <Switch disabled aria-label="Disabled" />
    </div>
  ),
};

// Args-driven story so the Controls panel manipulates a live instance.
export const Playground: Story = {
  args: {
    size: "sm",
    defaultChecked: true,
    disabled: false,
    "aria-label": "Toggle setting",
  },
  argTypes: {
    size: { control: "select", options: ["sm", "lg"] },
    disabled: { control: "boolean" },
  },
  render: (args) => <Switch {...args} />,
};
