import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { ExternalLink } from "lucide-react"

import { Link } from "./link"

const meta = {
  title: "Components/Link",
  component: Link,
  argTypes: {
    variant: { control: "select", options: ["accent", "muted"] },
  },
} satisfies Meta<typeof Link>

export default meta
type Story = StoryObj<typeof meta>

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-3 text-sm">
      <Link href="#" variant="accent">
        Accent link (default)
      </Link>
      <Link href="#" variant="muted">
        Muted link
      </Link>
      <Link href="#" variant="muted" external>
        External link <ExternalLink className="h-3 w-3" />
      </Link>
    </div>
  ),
}

export const Playground: Story = {
  args: { variant: "accent", children: "Read the docs", href: "#" },
  render: (args) => <Link {...args} />,
}
