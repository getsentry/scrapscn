import { useRef } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fireEvent, userEvent, within } from "storybook/test";

import { SplitPanel, type SplitPanelHandle } from "./split-panel";

function touchPointerEvent(type: string, clientX: number) {
  return new PointerEvent(type, {
    bubbles: true,
    button: 0,
    cancelable: true,
    clientX,
    clientY: 0,
    isPrimary: true,
    pointerId: 1,
    pointerType: "touch",
  });
}

const meta = {
  title: "Scraps/Split Panel",
  component: SplitPanel,
  args: {
    defaultSize: 200,
    fill: <div className="size-full p-3">Fill pane</div>,
    minSize: 100,
    sized: <div className="size-full p-3">Sized pane</div>,
  },
  decorators: [Story => <div className="h-60 w-full overflow-hidden rounded-md border"><Story /></div>],
} satisfies Meta<typeof SplitPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const HorizontalStart: Story = {
  args: {
    fill: <iframe className="size-full" srcDoc="<p>Replay</p>" title="Replay frame" />,
    orientation: "horizontal",
    placement: "start",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const separator = canvas.getByRole("separator", { name: "Resize panels" });
    await expect(separator).toHaveAttribute("aria-orientation", "vertical");
    separator.focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(separator).toHaveAttribute("aria-valuenow", "210");

    const iframe = canvas.getByTitle("Replay frame");
    const panel = iframe.closest("[data-is-held]");
    if (!panel) throw new Error("Missing SplitPanel root");
    await fireEvent(separator, touchPointerEvent("pointerdown", 210));
    await fireEvent(document, touchPointerEvent("pointermove", 220));
    await expect(panel).toHaveAttribute("data-is-held", "true");
    await expect(getComputedStyle(iframe).pointerEvents).toBe("none");
    await fireEvent(document, touchPointerEvent("pointerup", 210));
    await expect(panel).toHaveAttribute("data-is-held", "false");
  },
};

export const HorizontalEnd: Story = {
  args: { orientation: "horizontal", placement: "end" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const fill = canvas.getByText("Fill pane");
    const sized = canvas.getByText("Sized pane");
    await expect(fill.compareDocumentPosition(sized) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const separator = canvas.getByRole("separator", { name: "Resize panels" });
    separator.focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(separator).toHaveAttribute("aria-valuenow", "190");
  },
};

export const Vertical: Story = {
  args: { orientation: "vertical", placement: "start" },
  play: async ({ canvasElement }) => {
    const separator = within(canvasElement).getByRole("separator", { name: "Resize panels" });
    await expect(separator).toHaveAttribute("aria-orientation", "horizontal");
    await expect(separator).toHaveAttribute("data-orientation", "vertical");
  },
};

function ImperativeSizeDemo() {
  const panelRef = useRef<SplitPanelHandle>(null);
  return (
    <div className="grid h-full grid-rows-[auto_1fr] gap-2">
      <button type="button" onClick={() => panelRef.current?.setSize(320, true)}>Set size to 320</button>
      <SplitPanel
        ref={panelRef}
        defaultSize={200}
        fill={<div className="size-full p-3">Fill pane</div>}
        initialSize={260}
        maxSize={400}
        minSize={100}
        sized={<div className="size-full p-3">Sized pane</div>}
      />
    </div>
  );
}

export const PersistedAndImperativeSize: Story = {
  render: () => <ImperativeSizeDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const separator = canvas.getByRole("separator", { name: "Resize panels" });
    await expect(separator).toHaveAttribute("aria-valuenow", "260");
    await userEvent.click(canvas.getByRole("button", { name: "Set size to 320" }));
    await expect(separator).toHaveAttribute("aria-valuenow", "320");
  },
};

export const DoubleClickReset: Story = {
  args: { defaultSize: 200, initialSize: 320 },
  play: async ({ canvasElement }) => {
    const separator = within(canvasElement).getByRole("separator", { name: "Resize panels" });
    await expect(separator).toHaveAttribute("aria-valuenow", "320");
    await fireEvent.doubleClick(separator);
    await expect(separator).toHaveAttribute("aria-valuenow", "200");
  },
};

export const SinglePane: Story = {
  render: () => <SplitPanel defaultSize={200} sized={<div className="size-full p-3">Sized pane</div>} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Sized pane")).toBeVisible();
    await expect(canvas.queryByRole("separator")).not.toBeInTheDocument();
  },
};

export const ResponsiveOrientation: Story = {
  args: { orientation: { zero: "vertical", "screen:2xs": "horizontal" } },
  play: async ({ canvasElement }) => {
    const separator = within(canvasElement).getByRole("separator", { name: "Resize panels" });
    await expect(separator).toHaveAttribute("data-orientation", "horizontal");
  },
};
