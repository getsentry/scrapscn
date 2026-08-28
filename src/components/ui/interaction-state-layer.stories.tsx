import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import InteractionStateLayer from "./interaction-state-layer";

const meta = {
  title: "Components/Interaction State Layer",
  component: InteractionStateLayer,
} satisfies Meta<typeof InteractionStateLayer>;

export default meta;
type Story = StoryObj<typeof meta>;

const interactionTargetClassName = "relative block size-12 rounded-md border border-border";

/** Shows the regular Scraps interaction overlay in each supported state. */
export const States: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-5">
      <button className={interactionTargetClassName} aria-label="Uncontrolled interaction">
        <InteractionStateLayer />
      </button>
      <div role="listbox" aria-label="Selected interaction list">
        <div
          className={interactionTargetClassName}
          role="option"
          aria-label="Selected interaction"
          aria-selected="true"
        >
          <InteractionStateLayer />
        </div>
      </div>
      <button
        className={interactionTargetClassName}
        aria-label="Expanded interaction"
        aria-expanded="true"
      >
        <InteractionStateLayer />
      </button>
      <div role="listbox" aria-label="Selected without background list">
        <div
          className={interactionTargetClassName}
          role="option"
          aria-label="Selected without background"
          aria-selected="true"
        >
          <InteractionStateLayer hasSelectedBackground={false} />
        </div>
      </div>
      <button className={interactionTargetClassName} aria-label="Disabled interaction" disabled>
        <InteractionStateLayer isPressed />
      </button>
      <button
        className={interactionTargetClassName}
        aria-label="ARIA disabled interaction"
        aria-disabled="true"
      >
        <InteractionStateLayer isPressed />
      </button>
      <div role="listbox" aria-label="Selected and disabled list">
        <div
          className={interactionTargetClassName}
          role="option"
          aria-label="Selected and disabled"
          aria-disabled="true"
          aria-selected="true"
        >
          <InteractionStateLayer />
        </div>
      </div>
      <button
        className={interactionTargetClassName}
        aria-label="Expanded and disabled"
        aria-disabled="true"
        aria-expanded="true"
      >
        <InteractionStateLayer />
      </button>
      <button className={interactionTargetClassName} aria-label="Controlled hover">
        <InteractionStateLayer isHovered />
      </button>
      <button className={interactionTargetClassName} aria-label="Controlled press">
        <InteractionStateLayer higherOpacity isPressed />
      </button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const layerFor = (name: string) =>
      canvas.getByLabelText(name).querySelector('[role="presentation"]') as HTMLElement;

    await expect(layerFor("Uncontrolled interaction")).toHaveAttribute(
      "data-is-hovered",
      "undefined",
    );
    await expect(layerFor("Uncontrolled interaction")).toHaveAttribute(
      "data-is-pressed",
      "undefined",
    );
    await expect(getComputedStyle(layerFor("Selected interaction")).opacity).toBe("0.09");
    await expect(getComputedStyle(layerFor("Expanded interaction")).opacity).toBe("0.09");
    await expect(getComputedStyle(layerFor("Selected without background")).opacity).toBe("0");
    await expect(getComputedStyle(layerFor("Disabled interaction")).opacity).toBe("0");
    await expect(getComputedStyle(layerFor("ARIA disabled interaction")).opacity).toBe("0");
    await expect(getComputedStyle(layerFor("Selected and disabled")).opacity).toBe("0");
    await expect(getComputedStyle(layerFor("Expanded and disabled")).opacity).toBe("0");
    await expect(getComputedStyle(layerFor("Controlled hover")).opacity).toBe("0.06");
    await expect(getComputedStyle(layerFor("Controlled press")).opacity).toBe("0.12");
    await userEvent.hover(canvas.getByLabelText("Controlled press"));
    await expect(getComputedStyle(layerFor("Controlled press")).opacity).toBe("0.12");
  },
};

/** Proves the DOM forwarding, color, and polymorphic element contract. */
export const DomContract: Story = {
  render: () => (
    <div className="grid gap-5">
      <div className={interactionTargetClassName}>
        <InteractionStateLayer
          color="rgb(12, 34, 56)"
          data-contract="forwarded"
          data-testid="raw-color-layer"
          isHovered
          isPressed
          role="button"
          style={{ color: "rgb(1, 2, 3)" }}
          title="Forwarded title"
        />
      </div>
      <div className={interactionTargetClassName}>
        <InteractionStateLayer data-testid="known-token-layer" color="primary" isHovered />
      </div>
      <div className={interactionTargetClassName}>
        <InteractionStateLayer data-testid="semantic-token-layer" color="warning" isHovered />
      </div>
      <div className={interactionTargetClassName}>
        <InteractionStateLayer data-testid="legacy-token-layer" color="blue500" isHovered />
      </div>
      <table>
        <tbody>
          <tr>
            <InteractionStateLayer as="td" data-testid="table-cell-layer" isPressed>
              Cell overlay
            </InteractionStateLayer>
          </tr>
        </tbody>
      </table>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const rawColorLayer = canvas.getByTestId("raw-color-layer");
    const knownTokenLayer = canvas.getByTestId("known-token-layer");
    const semanticTokenLayer = canvas.getByTestId("semantic-token-layer");
    const legacyTokenLayer = canvas.getByTestId("legacy-token-layer");
    const tableCellLayer = canvas.getByTestId("table-cell-layer");

    await expect(rawColorLayer).toHaveAttribute("data-contract", "forwarded");
    await expect(rawColorLayer).toHaveAttribute("title", "Forwarded title");
    await expect(rawColorLayer).toHaveAttribute("role", "presentation");
    await expect(rawColorLayer).not.toHaveAttribute("isHovered");
    await expect(rawColorLayer).not.toHaveAttribute("isPressed");
    await expect(rawColorLayer).not.toHaveAttribute("higherOpacity");
    await expect(rawColorLayer).not.toHaveAttribute("hasSelectedBackground");
    await expect(rawColorLayer).toHaveAttribute("color", "rgb(12, 34, 56)");
    await expect(rawColorLayer).toHaveStyle({ color: "rgb(1, 2, 3)" });
    await expect(knownTokenLayer).toHaveAttribute("color", "primary");
    await expect(knownTokenLayer.style.color).toBe(
      "var(--scraps-theme-primary, var(--primary, primary))",
    );
    await expect(semanticTokenLayer.style.color).toBe(
      "var(--scraps-theme-warning, var(--warning, warning))",
    );
    await expect(legacyTokenLayer.style.color).toBe(
      "var(--scraps-theme-blue500, var(--blue500, blue500))",
    );
    await expect(getComputedStyle(legacyTokenLayer).color).toBe("rgb(101, 61, 233)");
    await expect(tableCellLayer.tagName).toBe("TD");
    await expect(getComputedStyle(tableCellLayer).opacity).toBe("0.09");
  },
};
