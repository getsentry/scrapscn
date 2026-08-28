import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useRef, useState } from "react";
import { expect, userEvent, within } from "storybook/test";

import { Radio } from "./radio";

const meta = {
  title: "Components/Radio",
  component: Radio,
  args: {
    "aria-label": "Option",
    checked: false,
    disabled: false,
    onChange: () => {},
    size: "md",
  },
  argTypes: {
    checked: { control: "boolean" },
    disabled: { control: "boolean" },
    size: { control: "select", options: ["xs", "sm", "md"] },
  },
} satisfies Meta<typeof Radio>;

export default meta;
type Story = StoryObj<typeof meta>;

const sizes = ["xs", "sm", "md"] as const;

export const Default: Story = {};

export const VisualAcceptanceMatrix: Story = {
  render: () => (
    <div className="grid gap-6">
      {(["light", "dark"] as const).map((theme) => (
        <section key={theme} className={theme === "dark" ? "dark" : undefined}>
          <div className="grid grid-cols-3 gap-4 rounded-lg border border-border bg-background p-5 text-foreground">
            {[false, true].flatMap((disabled) =>
              sizes.flatMap((size) =>
                [false, true].map((checked) => {
                  const label = `${theme} ${size} ${checked ? "checked" : "unchecked"} ${disabled ? "disabled" : "enabled"}`;
                  return (
                    <label key={label} className="flex items-center gap-2 text-sm">
                      <Radio
                        aria-label={label}
                        checked={checked}
                        disabled={disabled}
                        name={label}
                        onChange={() => {}}
                        size={size}
                      />
                      {label}
                    </label>
                  );
                }),
              ),
            )}
          </div>
        </section>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("radio")).toHaveLength(24);

    const lightXs = canvas.getByRole("radio", {
      name: "light xs checked enabled",
    });
    await expect(getComputedStyle(lightXs).width).toBe("12px");
    await expect(getComputedStyle(lightXs).borderColor).toBe("rgb(88, 39, 214)");
    await expect(getComputedStyle(lightXs).backgroundColor).toBe("rgb(117, 83, 255)");
    await expect(getComputedStyle(lightXs, "::after").width).toBe("6px");

    const darkMd = canvas.getByRole("radio", {
      name: "dark md checked enabled",
    });
    await expect(getComputedStyle(darkMd).width).toBe("24px");
    await expect(getComputedStyle(darkMd).borderColor).toBe("rgb(18, 5, 57)");
    await expect(getComputedStyle(darkMd, "::after").width).toBe("12px");

    const darkUnchecked = canvas.getByRole("radio", {
      name: "dark sm unchecked enabled",
    });
    await expect(getComputedStyle(darkUnchecked).borderColor).toBe("rgb(20, 17, 25)");
  },
};

export const NativeGroupContract: Story = {
  render: function NativeRadioGroupStory() {
    const [value, setValue] = useState("warning");
    const radioRef = useRef<HTMLInputElement>(null);
    return (
      <form className="grid gap-3">
        {["error", "warning", "info"].map((option) => (
          <label key={option} className="flex cursor-pointer items-center gap-2 capitalize">
            <Radio
              ref={option === "warning" ? radioRef : undefined}
              checked={value === option}
              name="level"
              value={option}
              onChange={(event) => setValue(event.target.value)}
            />
            {option}
          </label>
        ))}
        <output>{value}</output>
      </form>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const warning = canvas.getByRole("radio", { name: "warning" });
    const info = canvas.getByRole("radio", { name: "info" });
    await expect(warning).toBeChecked();
    await userEvent.click(info);
    await expect(info).toBeChecked();
    await expect(warning).not.toBeChecked();
    await expect(canvas.getByText("info", { selector: "output" })).toBeVisible();
  },
};

export const FocusTreatment: Story = {
  render: () => (
    <div className="grid gap-5">
      <Radio aria-label="Light focus" />
      <div className="dark bg-background p-2">
        <Radio aria-label="Dark focus" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const light = canvas.getByRole("radio", { name: "Light focus" });
    const dark = canvas.getByRole("radio", { name: "Dark focus" });
    await userEvent.tab();
    await expect(light).toHaveFocus();
    await expect(light.className).toContain("focus-visible:![box-shadow:");
    await expect(light.matches(":focus-visible")).toBe(true);
    await expect(getComputedStyle(light).getPropertyValue("--radio-focus").trim()).toBe("#7553ff");
    await userEvent.tab();
    await expect(dark).toHaveFocus();
    await expect(dark.matches(":focus-visible")).toBe(true);
    await expect(getComputedStyle(dark).getPropertyValue("--scraps-radio-focus-mask").trim()).toBe(
      "#2e2936",
    );
  },
};
