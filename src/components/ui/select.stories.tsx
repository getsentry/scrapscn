import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select"

const meta = {
  title: "Components/Select",
  component: Select,
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Select defaultValue="14d">
      <SelectTrigger aria-label="Time range">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="1h">Last hour</SelectItem>
        <SelectItem value="24h">Last 24 hours</SelectItem>
        <SelectItem value="7d">Last 7 days</SelectItem>
        <SelectItem value="14d">Last 14 days</SelectItem>
        <SelectItem value="30d">Last 30 days</SelectItem>
        <SelectItem value="90d">Last 90 days</SelectItem>
      </SelectContent>
    </Select>
  ),
}

export const Small: Story = {
  render: () => (
    <Select defaultValue="all">
      <SelectTrigger size="sm" aria-label="Project">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All projects</SelectItem>
        <SelectItem value="frontend">frontend</SelectItem>
        <SelectItem value="api">api-service</SelectItem>
      </SelectContent>
    </Select>
  ),
}

export const MultipleSelects: Story = {
  name: "Sentry-style filter bar",
  render: () => (
    <div className="flex items-center gap-2">
      <Select defaultValue="all">
        <SelectTrigger aria-label="Projects">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Projects</SelectItem>
          <SelectItem value="frontend">frontend</SelectItem>
          <SelectItem value="api">api-service</SelectItem>
        </SelectContent>
      </Select>
      <Select defaultValue="all">
        <SelectTrigger aria-label="Environments">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Envs</SelectItem>
          <SelectItem value="prod">production</SelectItem>
          <SelectItem value="staging">staging</SelectItem>
        </SelectContent>
      </Select>
      <Select defaultValue="14d">
        <SelectTrigger aria-label="Time range">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1h">Last hour</SelectItem>
          <SelectItem value="24h">Last 24 hours</SelectItem>
          <SelectItem value="7d">Last 7 days</SelectItem>
          <SelectItem value="14d">14D</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
}
