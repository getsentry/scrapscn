import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";

import { Hotkey, Kbd, useHotkeys } from "./hotkey";

const meta = {
  title: "Scraps/Hotkey",
  component: Hotkey,
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: "aria-prohibited-attr", enabled: false },
          { id: "svg-img-alt", enabled: false },
        ],
      },
    },
    layout: "fullscreen",
  },
} satisfies Meta<typeof Hotkey>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DisplayAndVariants: Story = {
  render: () => (
    <div className="grid gap-6 bg-background p-6 text-foreground">
      <div className="flex flex-wrap items-center gap-4">
        <span>Save</span>
        <Hotkey value="mod+s" />
        <span>Navigate</span>
        <Hotkey value="shift+right" />
        <span>Delete</span>
        <Hotkey value={["mod+backspace", "delete"]} />
      </div>
      <div className="flex flex-wrap items-center gap-4 rounded-md bg-card p-4">
        <Hotkey value="mod+k" variant="debossed" />
        <Kbd>Esc</Kbd>
        <Kbd variant="debossed">Tab</Kbd>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const platformModifiers = [
      ...canvas.queryAllByText("Ctrl"),
      ...canvas.queryAllByLabelText("⌘"),
    ];
    await expect(platformModifiers.length).toBeGreaterThan(0);
    const escapeKey = canvas.getByText("Esc");
    await expect(escapeKey.tagName).toBe("KBD");
    await expect(getComputedStyle(escapeKey).fontFamily).toContain("Roboto Mono");
    await expect(canvasElement.querySelectorAll("kbd").length).toBeGreaterThan(10);
  },
};

function ShortcutDemo() {
  const [count, setCount] = useState(0);
  const [includeInputs, setIncludeInputs] = useState(false);
  const [skipPreventDefault, setSkipPreventDefault] = useState(false);

  useHotkeys([
    {
      callback: () => setCount((value) => value + 1),
      includeInputs,
      match: "mod+k",
      skipPreventDefault,
    },
  ]);

  return (
    <div className="grid max-w-md gap-4 p-6">
      <div>
        Press <Hotkey value="mod+k" />
      </div>
      <label className="grid gap-1">
        Text input
        <input aria-label="Hotkey text input" className="border p-2" />
      </label>
      <label>
        <input
          aria-label="Include inputs"
          checked={includeInputs}
          type="checkbox"
          onChange={(event) => setIncludeInputs(event.target.checked)}
        />{" "}
        Include inputs
      </label>
      <label>
        <input
          aria-label="Skip prevent default"
          checked={skipPreventDefault}
          type="checkbox"
          onChange={(event) => setSkipPreventDefault(event.target.checked)}
        />{" "}
        Skip prevent default
      </label>
      <output data-testid="hotkey-count">Matches: {count}</output>
    </div>
  );
}

export const RegisteredShortcut: Story = {
  render: () => <ShortcutDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const shortcut = /Mac|iPhone|iPad/.test(navigator.platform)
      ? "{Meta>}k{/Meta}"
      : "{Control>}k{/Control}";
    await userEvent.keyboard(shortcut);
    await expect(canvas.getByTestId("hotkey-count")).toHaveTextContent("Matches: 1");
    await userEvent.click(canvas.getByLabelText("Hotkey text input"));
    await userEvent.keyboard(shortcut);
    await expect(canvas.getByTestId("hotkey-count")).toHaveTextContent("Matches: 1");
    await userEvent.click(canvas.getByLabelText("Include inputs"));
    await userEvent.click(canvas.getByLabelText("Hotkey text input"));
    await userEvent.keyboard(shortcut);
    await expect(canvas.getByTestId("hotkey-count")).toHaveTextContent("Matches: 2");
  },
};
