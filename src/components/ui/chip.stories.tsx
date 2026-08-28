import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import { Chip } from "./chip";

const meta = {
  component: Chip,
  title: "Scraps/Chip",
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

const themeColors = {
  light: {
    accent: "rgb(101, 61, 233)",
    background: "rgb(255, 255, 255)",
    border: "rgb(218, 217, 222)",
    primary: "rgb(48, 46, 54)",
    secondary: "rgb(106, 103, 114)",
  },
  dark: {
    accent: "rgb(171, 168, 248)",
    background: "rgb(46, 41, 54)",
    border: "rgb(20, 17, 25)",
    primary: "rgb(231, 229, 234)",
    secondary: "rgb(181, 176, 189)",
  },
} as const;

export const VisualAcceptanceMatrix: Story = {
  render: () => (
    <div className="grid gap-6">
      {(["light", "dark"] as const).map((theme) => (
        <section
          className={theme === "dark" ? "dark bg-background p-4 text-foreground" : "p-4"}
          key={theme}
        >
          <div className="flex flex-wrap items-center gap-4" data-testid={`${theme}-chips`}>
            {(["xs", "sm", "md"] as const).map((size) => (
              <Chip key={size} operator="is" property="browser" size={size} value="Chrome" />
            ))}
            <Chip readonly operator="is" property="browser" size="md" value="Chrome" />
            <Chip size="md" value="Chrome" />
            <Chip onDismiss={() => {}} operator="is" property="browser" size="md" value="Chrome" />
            <Chip onDismiss={() => {}} size="md" value="Chrome" />
          </div>
        </section>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const theme of ["light", "dark"] as const) {
      const chips = canvas.getByTestId(`${theme}-chips`);
      const roots = chips.querySelectorAll<HTMLElement>(":scope > div");
      const colors = themeColors[theme];
      await expect(roots).toHaveLength(7);
      for (const [index, geometry] of [
        { height: "20px", padding: "4px", radius: "3px" },
        { height: "24px", padding: "6px", radius: "4px" },
        { height: "28px", padding: "8px", radius: "5px" },
      ].entries()) {
        const style = getComputedStyle(roots[index]!);
        await expect(style.height).toBe(geometry.height);
        await expect(style.borderRadius).toBe(geometry.radius);
        await expect(style.paddingLeft).toBe(geometry.padding);
        await expect(style.paddingRight).toBe(geometry.padding);
        await expect(style.backgroundColor).toBe(colors.background);
        await expect(style.borderColor).toBe(colors.border);
        await expect(style.boxShadow).toMatch(
          new RegExp(`${colors.border.replace(/[()]/g, "\\$&")} 0px 1px 0px 0px$`),
        );
      }

      const queryText = roots[2]!.querySelectorAll("span");
      await expect(getComputedStyle(queryText[0]!).color).toBe(colors.primary);
      await expect(getComputedStyle(queryText[1]!).color).toBe(colors.secondary);
      await expect(getComputedStyle(queryText[2]!).color).toBe(colors.accent);
      const readonlyText = roots[3]!.querySelectorAll("span");
      await expect(getComputedStyle(readonlyText[2]!).color).toBe(colors.secondary);
      await expect(getComputedStyle(roots[4]!.querySelector("span")!).color).toBe(colors.primary);

      const dismiss = within(roots[5]!).getByRole("button", {
        name: "Remove browser is Chrome",
      });
      await expect(getComputedStyle(roots[5]!).paddingRight).toBe("0px");
      await expect(getComputedStyle(dismiss).width).toBe("24px");
      await expect(getComputedStyle(dismiss).height).toBe("26px");
      await expect(getComputedStyle(dismiss).color).toBe(colors.secondary);
      await expect(getComputedStyle(dismiss.querySelector("svg")!).width).toBe("12px");
      await expect(dismiss.className).toContain("hover:!bg-[var(--scraps-chip-hover)]");
      await expect(dismiss.className).toContain("hover:!text-[var(--scraps-chip-content-primary)]");
    }
    const firstDismiss = canvas.getAllByRole("button", {
      name: "Remove browser is Chrome",
    })[0]!;
    await userEvent.tab();
    await expect(firstDismiss).toHaveFocus();
    await expect(getComputedStyle(firstDismiss).boxShadow).not.toBe("none");
    await userEvent.click(firstDismiss);
  },
};
