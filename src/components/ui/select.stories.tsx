import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Select, type SelectValue } from "./select";

const options: SelectValue<string>[] = [
  { value: "1h", label: "Last hour" },
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "14d", label: "Last 14 days" },
];

const meta = {
  title: "Components/Select",
  component: Select,
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <Select aria-label="Time range" defaultValue="14d" options={options} />,
};

export const Multiple: Story = {
  render: () => (
    <Select
      aria-label="Time ranges"
      clearable
      defaultValue={["1h", "24h"]}
      multiple
      options={options}
    />
  ),
};

export const Searchable: Story = {
  render: () => (
    <Select aria-label="Find a range" options={options} placeholder="Find a range" searchable />
  ),
};

export const Creatable: Story = {
  render: () => <Select aria-label="Create range" creatable options={options} searchable />,
};

export const Grouped: Story = {
  render: () => (
    <Select
      aria-label="Grouped ranges"
      defaultMenuIsOpen
      options={[
        { label: "Recent", options: options.slice(0, 2) },
        { label: "Historic", options: options.slice(2) },
      ]}
      searchable
    />
  ),
};

export const AsyncCreatable: Story = {
  render: () => (
    <Select
      async
      aria-label="Async range"
      cacheOptions
      creatable
      defaultOptions={options}
      loadOptions={async (query) =>
        options.filter((option) =>
          option.label?.toString().toLocaleLowerCase().includes(query.toLocaleLowerCase()),
        )
      }
      searchable
    />
  ),
};
