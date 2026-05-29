import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Button } from "./button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip"

const meta = {
  title: "Components/Tooltip",
  component: Tooltip,
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
} satisfies Meta<typeof Tooltip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outline">Hover me</Button>} />
      <TooltipContent>This is a helpful tooltip</TooltipContent>
    </Tooltip>
  ),
}

export const Positions: Story = {
  render: () => (
    <div className="flex w-fit flex-col items-center gap-12 p-12">
      {(["top", "right", "bottom", "left"] as const).map((side) => (
        <Tooltip key={side} defaultOpen>
          <TooltipTrigger
            render={<Button variant="outline">{side}</Button>}
          />
          <TooltipContent side={side}>{side} tooltip</TooltipContent>
        </Tooltip>
      ))}
    </div>
  ),
}

export const CustomWidth: Story = {
  render: () => (
    <div className="flex gap-3">
      <Tooltip>
        <TooltipTrigger render={<Button variant="outline">Default width</Button>} />
        <TooltipContent>
          This tooltip has a long message that wraps to multiple lines by default.
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger render={<Button variant="outline">Narrow</Button>} />
        <TooltipContent className="max-w-[150px]">
          This tooltip has a long message constrained to a narrower width.
        </TooltipContent>
      </Tooltip>
    </div>
  ),
}

export const RichContent: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outline">Rich content</Button>} />
      <TooltipContent>
        <div className="space-y-1">
          <p className="font-medium">Spike detected</p>
          <p className="text-popover-foreground/80">
            TypeError reported 2,847 times in the last hour.
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  ),
}

export const WithKeybind: Story = {
  name: "With keyboard shortcut",
  render: () => (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outline">Search</Button>} />
      <TooltipContent>
        Open command palette
        <kbd
          data-slot="kbd"
          className="ml-1 inline-flex h-4 items-center rounded-sm bg-foreground/10 px-1 text-[10px]"
        >
          ⌘K
        </kbd>
      </TooltipContent>
    </Tooltip>
  ),
}
