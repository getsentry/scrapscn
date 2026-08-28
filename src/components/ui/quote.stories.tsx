import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";

import { Quote } from "./quote";

const meta = {
  component: Quote,
  parameters: { layout: "padded" },
  title: "Scraps/Quote",
} satisfies Meta<typeof Quote>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Geometry: Story = {
  args: {
    children: "The details are not the details. They make the design.",
    source: {
      author: "Charles Eames",
      href: "https://example.com",
      label: "Design",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const quote = canvas.getByRole("blockquote");
    const figure = quote.closest("figure");
    const rail = figure?.querySelector<HTMLElement>('hr[aria-orientation="vertical"]');
    const caption = figure?.querySelector<HTMLElement>("figcaption");
    if (!figure || !rail || !caption) throw new Error("Quote layers are missing");

    const railStyle = getComputedStyle(rail);
    await expect({
      borderLeftStyle: railStyle.borderLeftStyle,
      borderLeftWidth: railStyle.borderLeftWidth,
      boxSizing: railStyle.boxSizing,
      marginLeft: railStyle.marginLeft,
      paddingLeft: railStyle.paddingLeft,
      position: railStyle.position,
      width: railStyle.width,
    }).toEqual({
      borderLeftStyle: "solid",
      borderLeftWidth: "1px",
      boxSizing: "content-box",
      marginLeft: "12px",
      paddingLeft: "16px",
      position: "absolute",
      width: "1px",
    });

    for (const element of [quote, caption]) {
      const style = getComputedStyle(element);
      await expect({
        borderLeftStyle: style.borderLeftStyle,
        borderLeftWidth: style.borderLeftWidth,
        marginLeft: style.marginLeft,
        paddingLeft: style.paddingLeft,
      }).toEqual({
        borderLeftStyle: "none",
        borderLeftWidth: "0px",
        marginLeft: "0px",
        paddingLeft: "28px",
      });
    }
  },
};

export const ThemeColors: Story = {
  render: () => (
    <div className="grid gap-6">
      <div data-testid="light-quote">
        <Quote>Light quote</Quote>
      </div>
      <div className="dark bg-background p-6 text-foreground" data-testid="dark-quote">
        <Quote>Dark quote</Quote>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const railColor = (testId: string) => {
      const rail = canvas.getByTestId(testId).querySelector<HTMLElement>("hr");
      if (!rail) throw new Error(`${testId} rail is missing`);
      return getComputedStyle(rail).borderLeftColor;
    };
    await expect(railColor("light-quote")).toBe("rgb(218, 217, 222)");
    await expect(railColor("dark-quote")).toBe("rgb(20, 17, 25)");
  },
};
