import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";

import { MenuListItem } from "./menu-list-item";

const meta = {
  component: MenuListItem,
  title: "Scraps/MenuListItem",
} satisfies Meta<typeof MenuListItem>;
export default meta;
type Story = StoryObj<typeof meta>;

export const VisualAcceptanceMatrix: Story = {
  render: () => (
    <div className="grid max-w-lg gap-6 p-6">
      {(["light", "dark"] as const).map((theme) => (
        <section
          className={theme === "dark" ? "dark bg-background p-4" : "p-4"}
          data-testid={`${theme}-menu-items`}
          key={theme}
        >
          <ul>
            {(["xs", "sm", "md"] as const).map((size) => (
              <MenuListItem
                details="Supplementary detail"
                isFocused={size === "sm"}
                isSelected={size === "md"}
                key={size}
                label={`Menu ${size}`}
                leadingItems={({ isSelected }) => <span>{isSelected ? "✓" : "○"}</span>}
                priority={size === "md" ? "primary" : "default"}
                size={size}
                trailingItems="⌘K"
              />
            ))}
            <MenuListItem disabled label="Disabled danger" priority="danger" />
          </ul>
        </section>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const theme of ["light", "dark"] as const) {
      const section = canvas.getByTestId(`${theme}-menu-items`);
      await expect(within(section).getByText("Menu xs")).toBeVisible();
      await expect(within(section).getByText("Disabled danger").closest("li")).toHaveAttribute(
        "aria-disabled",
        "true",
      );
    }
  },
};
