import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AnimatePresence } from "framer-motion";
import { useState } from "react";

import { SlideOverPanel } from "./slide-over-panel";
import { SlideOverPanelEnvironmentProvider } from "./slide-over-panel-environment";

interface ExampleProps {
  mode?: "blocking" | "passive";
  position?: "right" | "bottom" | "left";
}

function Example({ mode = "blocking", position = "right" }: ExampleProps) {
  const [open, setOpen] = useState(true);
  return <div style={{ minHeight: 560 }}><button type="button" onClick={() => setOpen(!open)}>{open ? "Close" : "Open"}</button><SlideOverPanelEnvironmentProvider isMobile={false}><AnimatePresence>{open ? <SlideOverPanel mode={mode} position={position}>{({ isOpening }) => <div data-testid="panel-content">{isOpening ? "Opening" : "Panel content"}</div>}</SlideOverPanel> : null}</AnimatePresence></SlideOverPanelEnvironmentProvider></div>;
}

const meta = { title: "Scraps/Slide Over Panel", component: SlideOverPanel, parameters: { a11y: { test: "todo" }, layout: "fullscreen" } } satisfies Meta<typeof SlideOverPanel>;
export default meta;
type Story = StoryObj<typeof meta>;
export const RightBlocking: Story = { render: () => <Example /> };
export const RightPassive: Story = { render: () => <Example mode="passive" /> };
export const Left: Story = { render: () => <Example position="left" /> };
export const Bottom: Story = { render: () => <Example position="bottom" /> };
