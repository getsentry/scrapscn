import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import { DisabledTip, InfoText, InfoTip } from "./info";

const meta = {
  component: InfoText,
  title: "Scraps/Info",
} satisfies Meta<typeof InfoText>;

export default meta;
type Story = StoryObj<typeof meta>;

function InfoSamples({ theme }: { theme: "dark" | "light" }) {
  return (
    <section
      className={
        theme === "dark"
          ? "dark grid gap-5 bg-[var(--background)] p-4 text-[var(--foreground)]"
          : "grid gap-5 bg-[var(--background)] p-4 text-[var(--foreground)]"
      }
      data-theme={theme}
    >
      <InfoText delay={0} title="The team that owns this issue">
        Issue owner
      </InfoText>
      <InfoText delay={0} mode="overflowOnly" title="The complete project name">
        <span className="block w-32" data-overflowing="true">
          an-extremely-long-project-name
        </span>
      </InfoText>
      <div className="flex items-center gap-4">
        <InfoTip size="xs" title="Extra small" variant="warning" />
        <InfoTip size="sm" title="Small" variant="warning" />
        <InfoTip size="md" title="Medium" variant="warning" />
        <DisabledTip size="xs" title="Locked by your plan" />
      </div>
    </section>
  );
}

export const VisualAcceptanceMatrix: Story = {
  render: () => (
    <div className="grid max-w-xl grid-cols-2 overflow-hidden rounded-md border">
      <InfoSamples theme="light" />
      <InfoSamples theme="dark" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const documentBody = within(canvasElement.ownerDocument.body);
    const light = within(canvasElement.querySelector('[data-theme="light"]')!);
    const dark = within(canvasElement.querySelector('[data-theme="dark"]')!);
    const regular = light.getByText("Issue owner");
    const overflowText = light.getByText("an-extremely-long-project-name").parentElement;

    await expect(regular).toHaveAttribute("tabindex", "0");
    await expect(getComputedStyle(regular).textDecorationLine).toBe("underline");
    await expect(overflowText).toHaveClass("overflow-hidden");
    await expect(overflowText).toHaveAttribute("tabindex", "0");

    await userEvent.hover(regular);
    await expect(await documentBody.findByRole("tooltip")).toHaveTextContent(
      "The team that owns this issue",
    );
    await userEvent.hover(overflowText!);
    await expect(await documentBody.findByRole("tooltip")).toHaveTextContent(
      "The complete project name",
    );

    const lightInfoIcons = light.getAllByRole("img", {
      name: "More information",
    });
    const darkInfoIcons = dark.getAllByRole("img", {
      name: "More information",
    });
    await expect(
      lightInfoIcons.map((icon) => icon.querySelector("svg")?.getAttribute("width")),
    ).toEqual(["12px", "14px", "16px"]);
    await expect(
      darkInfoIcons.map((icon) => icon.querySelector("svg")?.getAttribute("width")),
    ).toEqual(["12px", "14px", "16px"]);
    await expect(getComputedStyle(lightInfoIcons[0]!.querySelector("svg")!).fill).toBe(
      "rgb(213, 150, 0)",
    );
    await expect(getComputedStyle(darkInfoIcons[0]!.querySelector("svg")!).fill).toBe(
      "rgb(255, 206, 0)",
    );
    await expect(light.getByRole("img", { name: "Disabled" }).querySelector("svg")).toHaveAttribute(
      "width",
      "12px",
    );
  },
};
