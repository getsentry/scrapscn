import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AnimatePresence } from "framer-motion";
import { useState } from "react";
import { expect, waitFor, within } from "storybook/test";

import { SlideOverPanel } from "./slide-over-panel";
import { SlideOverPanelEnvironmentProvider } from "./slide-over-panel-environment";

interface ExampleProps {
  isMobile?: boolean;
  mode?: "blocking" | "passive";
  position?: "right" | "bottom" | "left" | "unspecified";
}

function Example({ isMobile = false, mode = "blocking", position = "right" }: ExampleProps) {
  const [open, setOpen] = useState(true);
  return (
    <div className="h-[560px]">
      <button type="button" onClick={() => setOpen((current) => !current)}>
        {open ? "Close" : "Open"}
      </button>
      <SlideOverPanelEnvironmentProvider isMobile={isMobile}>
        <AnimatePresence>
          {open ? (
            <SlideOverPanel
              ariaLabel="Panel details"
              data-test-id="story-panel"
              mode={mode}
              position={position === "unspecified" ? undefined : position}
            >
              {({ isOpening }) => (
                <div data-testid="panel-content">{isOpening ? "Opening" : "Panel content"}</div>
              )}
            </SlideOverPanel>
          ) : null}
        </AnimatePresence>
      </SlideOverPanelEnvironmentProvider>
    </div>
  );
}

function getPanel(canvasElement: HTMLElement) {
  const panel = within(canvasElement).getByRole("complementary", {
    name: "Panel details",
  });
  return { panel, styles: getComputedStyle(panel) };
}

const meta = {
  title: "Scraps/Slide Over Panel",
  component: SlideOverPanel,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SlideOverPanel>;
export default meta;
type Story = StoryObj<typeof meta>;

export const RightBlocking: Story = {
  render: () => <Example />,
  play: async ({ canvasElement }) => {
    const { panel, styles } = getPanel(canvasElement);
    await waitFor(() => expect(styles.opacity).toBe("1"));
    await expect(panel).toHaveAttribute("mode", "blocking");
    await expect(styles.position).toBe("fixed");
    await expect(styles.top).toBe("0px");
    await expect(styles.right).toBe("0px");
    await expect(styles.bottom).toBe("0px");
    await expect(styles.width).toBe(`${innerWidth / 2}px`);
    await expect(styles.height).toBe(`${innerHeight}px`);
    await expect(styles.overflow).toBe("auto");
    await expect(styles.overscrollBehavior).toBe("contain");
    await expect(styles.zIndex).toBe("9999");
    await expect(styles.backgroundColor).toBe("rgb(255, 255, 255)");
    await expect(styles.color).toBe("rgb(48, 46, 54)");
    await expect(styles.boxShadow).toBe(
      "rgba(16, 16, 48, 0.03) 0px 4px 0px 2px, rgba(16, 16, 48, 0.03) 0px 1px 0px 1px",
    );
    await expect(styles.textAlign).toBe("left");
  },
};

export const RightPassive: Story = {
  render: () => <Example mode="passive" />,
  play: async ({ canvasElement }) => {
    const { panel, styles } = getPanel(canvasElement);
    await waitFor(() => expect(styles.opacity).toBe("1"));
    await expect(panel).toHaveAttribute("mode", "passive");
    await expect(styles.position).toBe("fixed");
    await expect(styles.top).toBe("53px");
    await expect(styles.height).toBe(`${innerHeight - 53}px`);
  },
};

export const Left: Story = {
  render: () => <Example position="left" />,
  play: async ({ canvasElement }) => {
    const { panel, styles } = getPanel(canvasElement);
    await waitFor(() => expect(styles.opacity).toBe("1"));
    await expect(styles.position).toBe("relative");
    await expect(styles.top).toBe("0px");
    await expect(styles.right).toBe("0px");
    await expect(styles.bottom).toBe("0px");
    await expect(styles.left).toBe("0px");
    await expect(styles.width).toBe(`${Math.max(innerWidth * 0.4, 450)}px`);
    await expect(styles.minWidth).toBe("450px");
    await expect(styles.height).toBe(`${panel.parentElement?.clientHeight ?? 0}px`);
  },
};

export const Bottom: Story = {
  render: () => <Example position="bottom" />,
  play: async ({ canvasElement }) => {
    const { styles } = getPanel(canvasElement);
    await waitFor(() => expect(styles.opacity).toBe("1"));
    await expect(styles.position).toBe("sticky");
    await expect(styles.top).toBe("16px");
    await expect(styles.right).toBe("0px");
    await expect(styles.bottom).toBe("0px");
    await expect(styles.left).toBe("0px");
    await expect(styles.height).toBe(`${innerHeight / 2}px`);
  },
};

export const MobileRight: Story = {
  parameters: { viewport: { defaultViewport: "mobile1" } },
  render: () => <Example />,
  play: async ({ canvasElement }) => {
    const { styles } = getPanel(canvasElement);
    await waitFor(() => expect(styles.opacity).toBe("1"));
    await expect(innerWidth).toBeLessThan(800);
    await expect(styles.position).toBe("fixed");
    await expect(styles.top).toBe("16px");
    await expect(styles.right).toBe("0px");
    await expect(styles.bottom).toBe("16px");
    await expect(styles.left).toBe("16px");
    await expect(styles.width).toBe(`${innerWidth - 16}px`);
  },
};

export const UnspecifiedPassive: Story = {
  render: () => <Example mode="passive" position="unspecified" />,
  play: async ({ canvasElement }) => {
    const { panel, styles } = getPanel(canvasElement);
    await waitFor(() => expect(styles.opacity).toBe("1"));
    await expect(panel).toHaveAttribute("mode", "passive");
    await expect(styles.position).toBe("relative");
    await expect(styles.top).toBe("53px");
    await expect(styles.width).toBe(`${Math.max(innerWidth * 0.4, 450)}px`);
    await expect(styles.height).toBe(`${(panel.parentElement?.clientHeight ?? 0) - 53}px`);
  },
};

export const MobileLeftPassive: Story = {
  parameters: { viewport: { defaultViewport: "mobile1" } },
  render: () => <Example isMobile mode="passive" position="left" />,
  play: async ({ canvasElement }) => {
    const { panel, styles } = getPanel(canvasElement);
    await waitFor(() => expect(styles.opacity).toBe("1"));
    await expect(innerWidth).toBeLessThan(800);
    await expect(panel).toHaveAttribute("mode", "passive");
    await expect(styles.position).toBe("fixed");
    await expect(styles.top).toBe("48px");
    await expect(styles.right).toBe("16px");
    await expect(styles.bottom).toBe("16px");
    await expect(styles.left).toBe("0px");
    await expect(styles.width).toBe(`${innerWidth - 16}px`);
  },
};

export const DarkRight: Story = {
  render: () => (
    <div className="dark">
      <Example />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const { styles } = getPanel(canvasElement);
    await waitFor(() => expect(styles.opacity).toBe("1"));
    await expect(styles.backgroundColor).toBe("rgb(57, 52, 66)");
    await expect(styles.color).toBe("rgb(231, 229, 234)");
    await expect(styles.boxShadow).toBe(
      "rgba(0, 0, 24, 0.1) 0px 4px 0px 2px, rgba(0, 0, 24, 0.1) 0px 1px 0px 1px",
    );
  },
};
