import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { CheckCircle2, ArrowUpRight, Trash2, AlertTriangle } from "lucide-react"
import { Button } from "./button"

const meta = {
  title: "Components/Button",
  component: Button,
  args: { children: "Button" },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "secondary", "destructive", "warning", "outline", "ghost", "link"],
    },
    size: {
      control: "select",
      options: ["default", "xs", "sm", "lg", "icon", "icon-xs", "icon-sm", "icon-lg"],
    },
    chonk: { control: "boolean" },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const ChonkyVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button>Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="warning">Warning</Button>
    </div>
  ),
}

export const FlatVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
}

export const ChonkDisabled: Story = {
  name: "chonk={false} — flat with variant colors",
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button chonk={false}>Primary flat</Button>
      <Button variant="secondary" chonk={false}>Secondary flat</Button>
      <Button variant="destructive" chonk={false}>Destructive flat</Button>
      <Button variant="warning" chonk={false}>Warning flat</Button>
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-end gap-4">
      <Button size="xs">Extra small</Button>
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
}

export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button><CheckCircle2 /> Resolve</Button>
      <Button variant="secondary">Ignore</Button>
      <Button variant="destructive"><Trash2 /> Delete</Button>
      <Button variant="warning"><AlertTriangle /> Quota alert</Button>
      <Button variant="outline">GitHub <ArrowUpRight /></Button>
    </div>
  ),
}

export const DisabledState: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button disabled>Primary</Button>
      <Button variant="secondary" disabled>Secondary</Button>
      <Button variant="destructive" disabled>Destructive</Button>
    </div>
  ),
}

export const Primary: Story = { args: { children: "Resolve issue" } }
export const Secondary: Story = { args: { variant: "secondary", children: "Ignore" } }
export const Destructive: Story = { args: { variant: "destructive", children: "Delete" } }
export const Warning: Story = { args: { variant: "warning", children: "Quota alert" } }
export const Outline: Story = { args: { variant: "outline", children: "View on GitHub" } }
export const Ghost: Story = { args: { variant: "ghost", children: "Cancel" } }
export const Link: Story = { args: { variant: "link", children: "Learn more" } }
