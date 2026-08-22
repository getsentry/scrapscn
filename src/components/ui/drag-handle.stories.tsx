import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import { DragHandle, type DragHandleVariant } from "./drag-handle";

const minimum = 80;
const maximum = 360;
const initialSize = 200;

const meta = {
  title: "Components/Drag Handle",
  component: DragHandle,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    "aria-label": "Resize panes",
    isSizedFirst: true,
    max: maximum,
    min: minimum,
    orientation: "horizontal",
    value: initialSize,
    onDoubleClick: () => {},
    onMove: () => {},
  },
} satisfies Meta<typeof DragHandle>;

export default meta;
type Story = StoryObj<typeof meta>;

function DragHandleDemo({ variant }: { variant?: DragHandleVariant }) {
  const [size, setSize] = useState(initialSize);
  return (
    <div className="grid gap-2">
      <output data-testid="size">Sized pane: {size}px</output>
      <div className="flex h-32 overflow-hidden rounded-md border border-[var(--scraps-theme-border-primary)]">
        <div className="shrink-0 bg-card p-3" style={{ flexBasis: `${size}px` }}>Sized</div>
        <DragHandle
          aria-label="Resize panes"
          isSizedFirst
          max={maximum}
          min={minimum}
          orientation="horizontal"
          value={size}
          variant={variant}
          onDoubleClick={() => setSize(initialSize)}
          onMove={(delta) => setSize((current) => Math.max(minimum, Math.min(maximum, current + delta)))}
        />
        <div className="flex-1 p-3">Fill</div>
      </div>
    </div>
  );
}

/** Shows the solid and ghost handle variants in a resizable pane pair. */
export const Variants: Story = {
  render: () => (
    <div className="grid gap-6">
      <DragHandleDemo />
      <DragHandleDemo variant="ghost" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const handles = canvas.getAllByRole("separator", { name: "Resize panes" });
    await expect(handles).toHaveLength(2);
    await expect(handles[0]).toHaveAttribute("aria-orientation", "vertical");
    await expect(handles[0]).toHaveAttribute("data-variant", "solid");
    await expect(handles[1]).toHaveAttribute("data-variant", "ghost");
    handles[0].focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(canvas.getAllByTestId("size")[0]).toHaveTextContent("210px");
  },
};
