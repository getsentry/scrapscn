import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Slider } from "./slider";

const meta = {
  title: "Components/Slider",
  component: Slider,
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-80">
      <Slider defaultValue={40} aria-label="Sample rate" />
    </div>
  ),
};

export const Steps: Story = {
  render: () => (
    <div className="w-80">
      <Slider defaultValue={50} min={0} max={100} step={10} aria-label="Quota" />
    </div>
  ),
};

export const Ticks: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-8">
      <Slider defaultValue={50} ticks={{ count: 11 }} aria-label="Tick count" />
      <Slider defaultValue={50} ticks={{ interval: 25 }} aria-label="Tick interval" />
      <Slider
        defaultValue={50}
        ticks={{ values: [0, 10, 25, 50, 75, 100] }}
        aria-label="Tick values"
      />
    </div>
  ),
};

export const TickLabels: Story = {
  render: () => (
    <div className="w-80">
      <Slider defaultValue={50} ticks={{ count: 5, labels: true }} aria-label="Tick labels" />
    </div>
  ),
};

export const Formatted: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-8">
      <Slider
        defaultValue={50}
        formatOptions={{ style: "unit", unit: "percent" }}
        aria-label="Percentage"
      />
      <Slider
        defaultValue={500}
        min={0}
        max={1000}
        step={50}
        formatOptions={{
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }}
        aria-label="Currency"
      />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="w-80">
      <Slider defaultValue={30} disabled aria-label="Sample rate (disabled)" />
    </div>
  ),
};

export const Playground: Story = {
  args: {
    defaultValue: 40,
    min: 0,
    max: 100,
    step: 1,
    disabled: false,
    "aria-label": "Value",
  },
  argTypes: {
    disabled: { control: "boolean" },
    min: { control: "number" },
    max: { control: "number" },
    step: { control: "number" },
  },
  render: (args) => (
    <div className="w-80">
      <Slider {...args} />
    </div>
  ),
};
