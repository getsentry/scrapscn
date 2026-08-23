import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Button } from "./button";
import { Tooltip, TooltipContext } from "./tooltip";

const meta = {
  title: "Scraps/Tooltip",
  component: Tooltip,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tooltip delay={0} skipWrapper title="Helpful text">
      <Button>Hover me</Button>
    </Tooltip>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.hover(canvas.getByRole("button", { name: "Hover me" }));
    const tooltip = await within(canvasElement.ownerDocument.body).findByRole("tooltip", {
      name: "Helpful text",
    });
    await expect(tooltip.querySelector("svg")).not.toBeNull();
    await expect(["top", "bottom"]).toContain(tooltip.getAttribute("data-side"));
  },
};

export const Positions: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-24 p-24">
      {(["top", "right", "bottom", "left"] as const).map((position) => (
        <Tooltip forceVisible key={position} position={position} skipWrapper title={`${position} tooltip`}>
          <Button variant="outline">{position}</Button>
        </Tooltip>
      ))}
    </div>
  ),
};

export const OverflowOnly: Story = {
  render: () => (
    <Tooltip delay={0} showOnlyOnOverflow title="The complete project name">
      <span className="block w-32 truncate" data-overflowing="true">
        an-extremely-long-project-name
      </span>
    </Tooltip>
  ),
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByText("an-extremely-long-project-name");
    await userEvent.hover(trigger);
    const tooltip = await within(canvasElement.ownerDocument.body).findByRole("tooltip");
    await waitFor(() => expect(tooltip).toBeVisible());
    await expect(trigger).toHaveAttribute("aria-describedby");
    await userEvent.unhover(trigger);
    await waitFor(
      () =>
        expect(
          within(canvasElement.ownerDocument.body).queryByRole("tooltip")
        ).not.toBeInTheDocument(),
      { timeout: 2000 }
    );
  },
};

export const ContextPortal: Story = {
  render: () => {
    const [container, setContainer] = useState<HTMLDivElement | null>(null);
    return (
      <div>
        <div data-testid="tooltip-story-portal" ref={setContainer} />
        {container ? (
          <TooltipContext.Provider value={{ container }}>
            <Tooltip forceVisible title="Portaled into this story">
              Context trigger
            </Tooltip>
          </TooltipContext.Provider>
        ) : null}
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const portal = within(canvasElement).getByTestId("tooltip-story-portal");
    const tooltip = await within(portal).findByRole("tooltip", {
      name: "Portaled into this story",
    });
    await expect(portal).toContainElement(tooltip);
  },
};
