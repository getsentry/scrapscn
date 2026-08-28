import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import { Disclosure } from "./disclosure";

const meta = {
  component: Disclosure,
  title: "Scraps/Disclosure",
} satisfies Meta<typeof Disclosure>;
export default meta;
type Story = StoryObj<typeof meta>;

export const VisualAcceptanceMatrix: Story = {
  render: () => (
    <div className="grid gap-8 p-6">
      {(["light", "dark"] as const).map((theme) => (
        <section
          className={theme === "dark" ? "dark bg-background p-4 text-foreground" : "p-4"}
          data-testid={`${theme}-disclosures`}
          key={theme}
        >
          <div className="grid max-w-lg gap-5">
            {(["xs", "sm", "md"] as const).map((size) => (
              <Disclosure defaultExpanded key={size} size={size}>
                <Disclosure.Title>Default {size}</Disclosure.Title>
                <Disclosure.Content>Default content</Disclosure.Content>
              </Disclosure>
            ))}
            <Disclosure defaultExpanded size="sm" variant="outline">
              <Disclosure.Title leadingItems={<span>●</span>} trailingItems={<span>Trailing</span>}>
                Outline
              </Disclosure.Title>
              <Disclosure.Content>Outlined content</Disclosure.Content>
            </Disclosure>
          </div>
        </section>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const theme of ["light", "dark"] as const) {
      const section = canvas.getByTestId(`${theme}-disclosures`);
      const xsButton = within(section).getByRole("button", {
        name: "Default xs",
      });
      const xsPanel = within(section).getByRole("group", {
        name: "Default xs",
      });
      await expect(xsButton).toHaveAttribute("aria-expanded", "true");
      await userEvent.click(xsButton);
      await expect(xsButton).toHaveAttribute("aria-expanded", "false");
      await expect(xsPanel).toHaveAttribute("hidden", "until-found");
      const outline = within(section).getByRole("group", { name: "Outline" });
      await expect(outline).toHaveStyle({
        borderWidth: "1px",
        borderRadius: "8px",
        padding: "8px",
      });
    }
  },
};
