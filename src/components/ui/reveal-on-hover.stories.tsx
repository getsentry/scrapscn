import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { RevealOnHover } from "./reveal-on-hover";

const meta = {
  title: "Scraps/Reveal On Hover",
  component: RevealOnHover,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof RevealOnHover>;

export default meta;
type Story = StoryObj<typeof meta>;

function Row({ dark = false }: { dark?: boolean }) {
  return (
    <div className={dark ? "dark" : undefined}>
      <RevealOnHover
        className="rounded-md border border-border bg-background p-4 text-foreground"
        data-testid={dark ? "dark-row" : "light-row"}
        justify="between"
      >
        <span>{dark ? "Dark issue row" : "Light issue row"}</span>
        <RevealOnHover.Action>
          <button className="touch-manipulation" type="button">Copy</button>
        </RevealOnHover.Action>
        <RevealOnHover.Action visible>
          <button className="touch-manipulation" type="button">Delete</button>
        </RevealOnHover.Action>
      </RevealOnHover>
    </div>
  );
}

export const HoverFocusVisibleAndThemes: Story = {
  render: () => (
    <div className="grid gap-4 sm:grid-cols-2">
      <Row />
      <Row dark />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const lightRoot = canvas.getByTestId("light-row");
    const copy = within(lightRoot).getByRole("button", { name: "Copy" });
    const visible = within(lightRoot)
      .getByRole("button", { name: "Delete" })
      .closest("[data-reveal-on-hover]");

    await expect(visible).toHaveAttribute("data-reveal-on-hover-visible", "");
    const action = copy.closest("[data-reveal-on-hover]");
    if (!action) throw new Error("Missing RevealOnHover action wrapper");
    copy.focus();
    await expect(copy).toHaveFocus();
    await waitFor(() => expect(getComputedStyle(action).opacity).toBe("1"));
  },
};

export const CustomRoot: Story = {
  render: () => (
    <RevealOnHover>
      {({ className }) => (
        <article
          className={`${className} grid grid-cols-[1fr_auto] items-center rounded-md border p-4`}
          data-testid="custom-root"
        >
          <span>Grid content</span>
          <RevealOnHover.Action>
            <button className="touch-manipulation" type="button">Copy</button>
          </RevealOnHover.Action>
        </article>
      )}
    </RevealOnHover>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const customRoot = canvas.getByTestId("custom-root");
    await expect(customRoot.tagName).toBe("ARTICLE");
    const copy = canvas.getByRole("button", { name: "Copy" });
    const action = copy.closest("[data-reveal-on-hover]");
    if (!action) throw new Error("Missing RevealOnHover action wrapper");
    copy.focus();
    await waitFor(() => expect(getComputedStyle(action).opacity).toBe("1"));
    await userEvent.click(copy);
  },
};
