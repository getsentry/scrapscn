import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Grid2X2, List, Table2 } from "lucide-react";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";

import { SegmentedControl } from "./segmented-control";

const meta = {
  title: "Components/SegmentedControl",
  component: SegmentedControl,
} satisfies Meta<typeof SegmentedControl>;

export default meta;
type Story = StoryObj<typeof meta>;

interface ControlProps {
  priority?: "default" | "primary" | "secondary";
  size?: "xs" | "sm" | "md";
}

function Control({ priority = "default", size = "md" }: ControlProps) {
  const [value, setValue] = useState("list");

  return (
    <SegmentedControl
      aria-label="View"
      priority={priority}
      size={size}
      value={value}
      onChange={setValue}
    >
      <SegmentedControl.Item key="list" icon={<List aria-hidden="true" />}>
        List
      </SegmentedControl.Item>
      <SegmentedControl.Item key="grid" icon={<Grid2X2 aria-hidden="true" />}>
        Grid
      </SegmentedControl.Item>
      <SegmentedControl.Item key="chart" disabled>
        Chart
      </SegmentedControl.Item>
      <SegmentedControl.Item
        key="table"
        aria-label="Table view"
        icon={<Table2 aria-hidden="true" />}
        tooltip="Table view"
      />
    </SegmentedControl>
  );
}

export const Default: Story = {
  render: () => <Control />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const grid = canvas.getByRole("radio", { name: "Grid" });
    await userEvent.click(grid);
    await expect(grid).toBeChecked();
  },
};

export const VisualAcceptanceMatrix: Story = {
  render: () => (
    <div className="grid gap-5">
      {(["md", "sm", "xs"] as const).flatMap((size) =>
        (["default", "primary", "secondary"] as const).map((priority) => (
          <Control key={`${size}-${priority}`} priority={priority} size={size} />
        )),
      )}
    </div>
  ),
};
