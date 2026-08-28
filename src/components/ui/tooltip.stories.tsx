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
    const tooltipStyle = getComputedStyle(tooltip);
    await expect(tooltipStyle.position).toBe("relative");
    await expect(tooltipStyle.padding).toBe("8px 12px");
    await expect(tooltipStyle.borderRadius).toBe("6px");
    await expect(tooltipStyle.fontFamily).toContain("Rubik");
    await expect(tooltipStyle.fontSize).toBe("12px");
    await expect(tooltipStyle.fontWeight).toBe("400");
    await expect(tooltipStyle.lineHeight).toBe("14.4px");
    await expect(tooltipStyle.overflowWrap).toBe("break-word");
    await expect(tooltipStyle.textAlign).toBe("center");
    await expect(tooltipStyle.willChange).toBe("transform, opacity");
    await expect(getComputedStyle(tooltip.parentElement!).zIndex).toBe("10003");
    const arrowSvg = tooltip.querySelector<SVGSVGElement>("svg");
    if (!arrowSvg || !arrowSvg.parentElement) {
      throw new Error("Tooltip arrow is missing");
    }
    await expect(getComputedStyle(arrowSvg).display).toBe("block");
    await expect(getComputedStyle(arrowSvg).width).toBe("16px");
    await expect(getComputedStyle(arrowSvg).height).toBe("8px");
    await expect(getComputedStyle(arrowSvg.parentElement).position).toBe("absolute");
    await expect(["top", "bottom"]).toContain(tooltip.getAttribute("data-side"));
    await expect(getComputedStyle(arrowSvg.querySelector("[data-side-border]")!).display).toBe(
      "none",
    );
  },
};

export const Positions: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-24 p-24">
      {(["top", "right", "bottom", "left"] as const).map((position) => (
        <Tooltip
          forceVisible
          key={position}
          position={position}
          skipWrapper
          title={`${position} tooltip`}
        >
          <Button variant="secondary">{position}</Button>
        </Tooltip>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const expectedTransforms = {
      bottom: "matrix(-1, 0, 0, -1, 0, 0)",
      left: "matrix(0, -1, 1, 0, 0, 0)",
      right: "matrix(0, 1, -1, 0, 0, 0)",
      top: "matrix(1, 0, 0, 1, 0, 0)",
    } as const;

    for (const position of ["top", "right", "bottom", "left"] as const) {
      const tooltip = await body.findByRole("tooltip", {
        name: `${position} tooltip`,
      });
      const arrow = tooltip.querySelector("svg")?.parentElement;
      if (!arrow) throw new Error(`${position} tooltip arrow is missing`);
      await expect(tooltip).toHaveAttribute("data-side", position);
      await expect(getComputedStyle(arrow).transform).toBe(expectedTransforms[position]);
      await expect(getComputedStyle(arrow).height).toBe(
        position === "left" || position === "right" ? "16px" : "8px",
      );
      const sideBorder = arrow.querySelector("[data-side-border]");
      if (!sideBorder) throw new Error(`${position} side border is missing`);
      await expect(getComputedStyle(sideBorder).display).toBe(
        position === "top" || position === "bottom" ? "none" : "inline",
      );
      await expect(sideBorder).toHaveAttribute("points", "-2,0 16,0 8,5.8 6,5.8");
      await expect(getComputedStyle(sideBorder).transform).toBe(
        position === "right" ? "matrix(1, 0, 0, 1, 2, 0)" : "none",
      );
      const topOnly = arrow.querySelectorAll("[data-top-only]");
      const nonTop = arrow.querySelectorAll("[data-non-top]");
      await expect(topOnly[0]).toHaveAttribute("points", "0,0 16,0 8,7.8");
      await expect(topOnly[1]).toHaveAttribute("points", "3,0 13,0 8,4.8");
      await expect(nonTop[0]).toHaveAttribute("points", "0,0 16,0 8,5.8");
      await expect(nonTop[1]).toHaveAttribute("points", "1.5,0 14.5,0 8,4.8");
      for (const polygon of topOnly) {
        await expect(getComputedStyle(polygon).display).toBe(
          position === "top" ? "inline" : "none",
        );
      }
      for (const polygon of nonTop) {
        await expect(getComputedStyle(polygon).display).toBe(
          position === "top" ? "none" : "inline",
        );
      }
    }
  },
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
          within(canvasElement.ownerDocument.body).queryByRole("tooltip"),
        ).not.toBeInTheDocument(),
      { timeout: 2000 },
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
