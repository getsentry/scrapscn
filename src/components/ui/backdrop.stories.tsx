import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AnimatePresence } from "framer-motion";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Backdrop } from "./backdrop";

function BackdropStory({ zIndex = "modal" }: { zIndex?: "widgetBuilderDrawer" | "drawer" | "modal" }) {
  const [visible, setVisible] = useState(true);

  return (
    <div className="relative isolate min-h-80 overflow-hidden [transform:translateZ(0)]">
      <button
        className="relative z-[10001]"
        type="button"
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? "Dismiss overlay" : "Show overlay"}
      </button>
      <AnimatePresence>
        {visible ? (
          <Backdrop
            zIndex={zIndex}
            onClick={() => setVisible(false)}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

const meta = {
  title: "Scraps/Backdrop",
  component: Backdrop,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Backdrop>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Modal: Story = {
  render: () => <BackdropStory />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dismissButton = canvas.getByRole("button", { name: "Dismiss overlay" });
    const overlay = canvasElement.querySelector<HTMLElement>("[data-overlay]");
    await expect(overlay).not.toBeNull();
    await expect(overlay).toHaveAttribute("data-overlay", "true");
    await expect(overlay).toHaveStyle({ zIndex: "10000" });
    dismissButton.focus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(overlay).not.toBeInTheDocument());
    const showButton = canvas.getByRole("button", { name: "Show overlay" });
    showButton.focus();
    await userEvent.keyboard(" ");
    await waitFor(() => expect(canvasElement.querySelector("[data-overlay]")).not.toBeNull());
  },
};

export const Drawer: Story = {
  render: () => <BackdropStory zIndex="drawer" />,
};

export const WidgetBuilderDrawer: Story = {
  render: () => <BackdropStory zIndex="widgetBuilderDrawer" />,
};
