import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useRef, useState } from "react";
import { expect, userEvent, within } from "storybook/test";

import { Checkbox, type CheckboxProps } from "./checkbox";

const meta = {
  title: "Components/Checkbox",
  component: Checkbox,
  args: {
    "aria-label": "Toggle setting",
    checked: false,
    disabled: false,
    onChange: () => {},
    readOnly: false,
    size: "sm",
  },
  argTypes: {
    checked: { control: "select", options: [false, true, "indeterminate"] },
    disabled: { control: "boolean" },
    size: { control: "select", options: ["xs", "sm", "md"] },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

const checkboxSizes = ["xs", "sm", "md"] satisfies CheckboxProps["size"][];
const checkboxStates = [false, true, "indeterminate"] satisfies CheckboxProps["checked"][];

/** Shows the default small, unchecked Checkbox. */
export const Default: Story = {};

/** Shows every size and state supported by regular Scraps. */
export const SizesAndStates: Story = {
  render: () => (
    <div className="grid grid-cols-3 items-center gap-5">
      {checkboxSizes.flatMap((size) =>
        checkboxStates.map((checked) => (
          <label key={`${size}-${String(checked)}`} className="flex items-center gap-2">
            <Checkbox name={`${size}-${String(checked)}`} size={size} checked={checked} readOnly />
            <span>{`${size} / ${String(checked)}`}</span>
          </label>
        )),
      )}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const indeterminateCheckbox = canvas.getByRole("checkbox", {
      name: "md / indeterminate",
    });

    await expect(indeterminateCheckbox).toHaveProperty("indeterminate", true);
    await expect(indeterminateCheckbox).not.toBeChecked();
  },
};

/** Covers every size, value, enabled state, and theme in the visual acceptance matrix. */
export const VisualAcceptanceMatrix: Story = {
  render: () => (
    <div className="grid gap-6">
      {(["light", "dark"] as const).map((theme) => (
        <section
          key={theme}
          className={theme === "dark" ? "dark" : undefined}
          aria-labelledby={`${theme}-matrix-heading`}
        >
          <div className="grid gap-4 rounded-lg border border-foreground/10 bg-background p-5 text-foreground">
            <h2 id={`${theme}-matrix-heading`} className="font-semibold capitalize">
              {theme}
            </h2>
            {[false, true].map((disabled) => (
              <div key={String(disabled)} className="grid grid-cols-3 items-center gap-4">
                {checkboxSizes.flatMap((size) =>
                  checkboxStates.map((checked) => {
                    const label = `${theme} ${size} ${String(checked)} ${
                      disabled ? "disabled" : "enabled"
                    }`;
                    return (
                      <label key={label} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          name={label}
                          size={size}
                          checked={checked}
                          disabled={disabled}
                          onChange={() => {}}
                        />
                        <span>{label}</span>
                      </label>
                    );
                  }),
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const checkboxes = canvas.getAllByRole("checkbox");
    await expect(checkboxes).toHaveLength(36);

    const lightXs = canvas.getByRole("checkbox", {
      name: "light xs true enabled",
    });
    const lightVisual = lightXs.nextElementSibling as HTMLElement;
    const lightIcon = lightVisual.querySelector("svg");
    await expect(lightXs.parentElement?.tagName).toBe("DIV");
    await expect(lightVisual.tagName).toBe("DIV");
    await expect(getComputedStyle(lightVisual).width).toBe("12px");
    await expect(getComputedStyle(lightVisual).borderRadius).toBe("2px");
    await expect(getComputedStyle(lightVisual).borderColor).toBe("rgb(218, 217, 222)");
    await expect(lightIcon?.getAttribute("viewBox")).toBe("0 0 16 16");
    await expect(lightIcon?.querySelector("path")?.getAttribute("d")).toBe(
      "M2.86 9.14C4.42 10.7 6.9 13.14 6.86 13.14L12.57 3.43",
    );
    await expect(lightIcon?.getAttribute("stroke-width")).toBe("1.8");

    const darkMd = canvas.getByRole("checkbox", {
      name: "dark md indeterminate enabled",
    });
    const darkVisual = darkMd.nextElementSibling as HTMLElement;
    const darkIcon = darkVisual.querySelector("svg");
    await expect(getComputedStyle(darkVisual).width).toBe("22px");
    await expect(getComputedStyle(darkVisual).borderRadius).toBe("6px");
    await expect(getComputedStyle(darkVisual).borderColor).toBe("rgb(20, 17, 25)");
    await expect(darkIcon?.querySelector("path")?.getAttribute("d")).toBe("M3 8H13");
    await expect(darkIcon?.getAttribute("stroke-width")).toBe("2.12");
  },
};

/** Proves that labels and native change events drive controlled state. */
export const Controlled: Story = {
  render: function ControlledCheckboxStory() {
    const [checked, setChecked] = useState(false);

    return (
      <label className="flex cursor-pointer items-center gap-2">
        <Checkbox
          name="controlled"
          checked={checked}
          onChange={(event) => setChecked(event.target.checked)}
        />
        <span>Alert me about new issues</span>
      </label>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole("checkbox", {
      name: "Alert me about new issues",
    });

    await expect(checkbox).not.toBeChecked();
    await userEvent.click(canvas.getByText("Alert me about new issues"));
    await expect(checkbox).toBeChecked();
    checkbox.focus();
    await userEvent.keyboard(" ");
    await expect(checkbox).not.toBeChecked();
  },
};

/** Proves ref forwarding, native focus, and native form submission. */
export const NativeFormContract: Story = {
  render: function NativeCheckboxFormStory() {
    const checkboxRef = useRef<HTMLInputElement>(null);
    const [submittedValue, setSubmittedValue] = useState("Not submitted");

    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          setSubmittedValue(String(formData.get("alerts")));
        }}
      >
        <label className="flex cursor-pointer items-center gap-2">
          <Checkbox
            ref={(node) => {
              checkboxRef.current = node;
              node?.setAttribute("data-ref-forwarded", "true");
              return () => {
                checkboxRef.current = null;
              };
            }}
            name="alerts"
            value="enabled"
            checked
            readOnly
          />
          <span>Include alerts</span>
        </label>
        <button type="submit">Submit</button>
        <output>{submittedValue}</output>
      </form>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole("checkbox", { name: "Include alerts" });

    await expect(checkbox).toHaveAttribute("data-ref-forwarded", "true");
    await expect(checkbox).toHaveProperty("form", canvasElement.querySelector("form"));
    checkbox.focus();
    await expect(checkbox).toHaveFocus();
    await userEvent.click(canvas.getByRole("button", { name: "Submit" }));
    await expect(canvas.getByText("enabled")).toBeVisible();
  },
};

/** Shows the muted checked and unchecked disabled states. */
export const Disabled: Story = {
  render: () => (
    <div className="flex items-center gap-5">
      <Checkbox name="disabled-checked" checked disabled readOnly aria-label="Checked disabled" />
      <Checkbox
        name="disabled-unchecked"
        checked={false}
        disabled
        readOnly
        aria-label="Unchecked disabled"
      />
    </div>
  ),
};

/** Proves focus, disabled, read-only, aria-disabled, and inherited interaction color parity. */
export const InteractionContracts: Story = {
  render: () => (
    <div className="grid gap-4">
      <Checkbox
        checked={false}
        onChange={() => {}}
        aria-label="Interactive"
        style={{ color: "rgb(200, 0, 0)" }}
      />
      <Checkbox checked disabled aria-label="Disabled contract" />
      <Checkbox checked readOnly aria-label="Read-only contract" />
      <Checkbox
        checked
        aria-disabled="true"
        onChange={() => {}}
        aria-label="ARIA-disabled contract"
      />
      <div className="dark bg-background p-2">
        <Checkbox checked={false} onChange={() => {}} aria-label="Dark focus contract" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const interactive = canvas.getByRole("checkbox", { name: "Interactive" });
    const interactionLayer = interactive.parentElement?.querySelector(
      '[role="presentation"]',
    ) as HTMLElement;
    await expect(getComputedStyle(interactionLayer).backgroundColor).toBe("rgb(200, 0, 0)");

    await userEvent.tab();
    await expect(interactive).toHaveFocus();
    await expect(getComputedStyle(interactive.nextElementSibling as HTMLElement).boxShadow).toBe(
      "rgb(255, 255, 255) 0px 0px 0px 0px, rgb(117, 83, 255) 0px 0px 0px 2px",
    );

    const disabled = canvas.getByRole("checkbox", {
      name: "Disabled contract",
    });
    await expect(getComputedStyle(disabled.nextElementSibling as HTMLElement).opacity).toBe("0.6");
    await expect(disabled.parentElement?.querySelector('[role="presentation"]')).toBeNull();

    const readOnly = canvas.getByRole("checkbox", {
      name: "Read-only contract",
    });
    await expect(getComputedStyle(readOnly.parentElement as HTMLElement).cursor).toBe("auto");
    await expect(readOnly.parentElement?.querySelector('[role="presentation"]')).toBeNull();

    const ariaDisabled = canvas.getByRole("checkbox", {
      name: "ARIA-disabled contract",
    });
    await expect(getComputedStyle(ariaDisabled.nextElementSibling as HTMLElement).opacity).toBe(
      "0.6",
    );
    await expect(ariaDisabled.parentElement?.querySelector('[role="presentation"]')).not.toBeNull();

    const darkFocus = canvas.getByRole("checkbox", {
      name: "Dark focus contract",
    });
    darkFocus.focus();
    await expect(getComputedStyle(darkFocus.nextElementSibling as HTMLElement).boxShadow).toBe(
      "rgb(46, 41, 54) 0px 0px 0px 0px, rgb(117, 83, 255) 0px 0px 0px 2px",
    );
  },
};

/** Lets Storybook controls manipulate one canonical Checkbox. */
export const Playground: Story = {};
