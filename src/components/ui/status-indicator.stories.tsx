import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";

import { StatusIndicator } from "./status-indicator";

const variants = [
  "accent",
  "danger",
  "warning",
  "success",
  "promotion",
  "muted",
] as const;

const meta = {
  title: "Scraps/Status Indicator",
  component: StatusIndicator,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof StatusIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

function VariantGrid({ theme }: { theme: "dark" | "light" }) {
  return (
    <div className={theme === "dark" ? "dark" : undefined}>
      <div className="grid gap-4 bg-background p-6 text-foreground">
        <h2 className="text-sm font-medium capitalize">{theme}</h2>
        <div className="flex flex-wrap gap-6">
          {variants.map((variant) => (
            <div className="flex items-center gap-2" key={variant}>
              <StatusIndicator aria-label={variant} variant={variant} />
              <span>{variant}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export const VariantsInLightAndDark: Story = {
  render: () => (
    <div className="grid sm:grid-cols-2">
      <VariantGrid theme="light" />
      <VariantGrid theme="dark" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("img")).toHaveLength(12);
    await expect(canvas.getAllByRole("img", { name: "accent" })[0]).toHaveStyle({
      "--status-iterations": "infinite",
      "--status-fill": "none",
    });
  },
};

export const IterationAndAccessibility: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <div className="flex items-center gap-2">
        <StatusIndicator data-testid="decorative" variant="muted" />
        <span>Decorative indicator</span>
      </div>
      <StatusIndicator aria-label="Online" variant="success" />
      <StatusIndicator
        animationIterationCount={3}
        aria-label="Authentication Method Active"
        role="status"
        variant="accent"
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("decorative")).toHaveAttribute("aria-hidden", "true");
    await expect(canvas.getByRole("img", { name: "Online" })).toHaveStyle({
      "--status-iterations": "infinite",
      "--status-fill": "none",
    });
    await expect(
      canvas.getByRole("status", { name: "Authentication Method Active" })
    ).toHaveStyle({
      "--status-iterations": "3",
      "--status-fill": "forwards",
    });
  },
};
