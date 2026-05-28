import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Search } from "lucide-react"
import { Input } from "./input"
import { InputGroup, InputGroupAddon, InputGroupInput } from "./input-group"
import { Label } from "./label"

const meta = {
  title: "Components/Input",
  component: Input,
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="w-80 space-y-2">
      <Label htmlFor="name">Project name</Label>
      <Input id="name" defaultValue="frontend" />
    </div>
  ),
}

export const Placeholder: Story = {
  render: () => <Input className="w-80" placeholder="Search issues..." />,
}

export const WithSearchIcon: Story = {
  name: "Search input (Sentry style)",
  render: () => (
    <InputGroup className="w-96">
      <InputGroupAddon>
        <Search className="size-4" />
      </InputGroupAddon>
      <InputGroupInput placeholder="Search issues, events, or users..." />
    </InputGroup>
  ),
}

export const Disabled: Story = {
  render: () => <Input className="w-80" defaultValue="read-only DSN" disabled />,
}

export const ReadOnly: Story = {
  render: () => (
    <Input
      className="w-96 font-mono text-sm"
      defaultValue="https://abc123@o0.ingest.sentry.io/456"
      readOnly
    />
  ),
}
