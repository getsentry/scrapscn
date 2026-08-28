import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import {
  CompactSelect,
  CompositeSelect,
  MenuComponents,
  type SelectOptionOrSection,
} from "./compact-select";

const meta = {
  title: "Components/CompactSelect",
  component: CompactSelect,
  parameters: { layout: "centered" },
} satisfies Meta<typeof CompactSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

const projectOptions = [
  { value: "web", label: "Web", details: "Customer-facing application" },
  { value: "api", label: "API", details: "Public and partner endpoints" },
  { value: "worker", label: "Worker", details: "Background processing" },
] satisfies Array<SelectOptionOrSection<string>>;

export const SingleSelection: Story = {
  render: function SingleSelectionStory() {
    const [value, setValue] = useState("web");
    return (
      <CompactSelect
        menuTitle="Project"
        options={projectOptions}
        onChange={(option) => setValue(option.value)}
        value={value}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /Web/ }));
    await expect(canvas.getByRole("listbox")).toBeVisible();
    await userEvent.click(canvas.getByRole("option", { name: /API/ }));
    await expect(canvas.getByRole("button", { name: /API/ })).toBeVisible();
    await expect(canvas.queryByRole("listbox")).not.toBeInTheDocument();
  },
};

export const MultipleSectionsAndSearch: Story = {
  render: function MultipleSectionsStory() {
    const [values, setValues] = useState<string[]>(["web"]);
    return (
      <CompactSelect
        clearable
        menuTitle="Projects"
        multiple
        search={{ highlight: true, placeholder: "Find projects…" }}
        options={[
          {
            key: "active",
            label: "Active",
            showToggleAllButton: true,
            options: projectOptions,
          },
          {
            key: "archived",
            label: "Archived",
            options: [
              { value: "legacy", label: "Legacy" },
              { value: "retired", label: "Retired", disabled: true },
            ],
          },
        ]}
        onChange={(options) => setValues(options.map((option) => option.value))}
        value={values}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /Web/ }));
    await expect(canvas.getByText("Active")).toBeVisible();
    const search = canvas.getByPlaceholderText("Find projects…");
    await userEvent.type(search, "api");
    await expect(canvas.getByRole("option", { name: /API/ })).toBeVisible();
    await expect(canvas.queryByRole("option", { name: /Web/ })).not.toBeInTheDocument();
  },
};

export const SizeMatrix: Story = {
  render: function SizeMatrixStory() {
    const [value, setValue] = useState("web");
    return (
      <div className="grid gap-4">
        {(["xs", "sm", "md"] as const).map((size) => (
          <CompactSelect
            key={size}
            options={projectOptions}
            onChange={(option) => setValue(option.value)}
            size={size}
            trigger={(props, open) => (
              <button
                {...props}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                {size}: {props.children} {open ? "open" : "closed"}
              </button>
            )}
            value={value}
          />
        ))}
      </div>
    );
  },
};

export const CompositeRegions: Story = {
  render: function CompositeRegionsStory() {
    const [period, setPeriod] = useState("24h");
    const [levels, setLevels] = useState<string[]>(["error"]);
    return (
      <CompositeSelect
        menuFooter={
          <div className="flex justify-end gap-2">
            <MenuComponents.CancelButton onClick={() => {}} />
            <MenuComponents.ApplyButton onClick={() => {}} />
          </div>
        }
        menuTitle="Filters"
        trigger={(props) => <button {...props}>Configure filters</button>}
      >
        <CompositeSelect.Region
          label="Period"
          options={[
            { value: "1h", label: "Past hour" },
            { value: "24h", label: "Past day" },
          ]}
          onChange={(option) => setPeriod(option.value)}
          value={period}
        />
        <CompositeSelect.Region
          label="Level"
          multiple
          options={[
            { value: "error", label: "Error" },
            { value: "warning", label: "Warning" },
          ]}
          onChange={(options) => setLevels(options.map((option) => option.value))}
          value={levels}
        />
      </CompositeSelect>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Configure filters" }));
    await expect(canvas.getAllByRole("listbox")).toHaveLength(2);
    await expect(canvas.getByText("Period")).toBeVisible();
    await expect(canvas.getByText("Level")).toBeVisible();
  },
};

export const VirtualizedOptions: Story = {
  render: function VirtualizedOptionsStory() {
    const [value, setValue] = useState("project-1");
    const options = Array.from({ length: 200 }, (_, index) => ({
      label: index === 199 ? "Project 200 with a deliberately long name" : `Project ${index + 1}`,
      value: `project-${index + 1}`,
    }));
    return (
      <CompactSelect
        menuHeight={240}
        options={options}
        onChange={(option) => setValue(option.value)}
        value={value}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: /Project 1/ });
    await userEvent.click(trigger);
    await expect(canvas.getByRole("listbox")).toBeVisible();
    await expect(canvasElement.querySelector('[data-is-virtualized="true"]')).not.toBeNull();
    expect(canvas.queryAllByRole("option").length).toBeLessThan(200);
    const popup = canvasElement.querySelector<HTMLElement>('[data-slot="compact-select-popup"]');
    expect(popup?.getBoundingClientRect().width).toBeGreaterThan(
      trigger.getBoundingClientRect().width,
    );
    const firstOption = canvas.getByRole("option", { name: "Project 1" });
    firstOption.focus();
    await expect(firstOption).toHaveFocus();
    await userEvent.keyboard("{End}");
    await waitFor(() => expect(canvas.getByRole("option", { name: /Project 200/ })).toBeVisible());
  },
};

export const VirtualizedGridOptions: Story = {
  render: function VirtualizedGridOptionsStory() {
    const [value, setValue] = useState("project-1");
    const options = Array.from({ length: 200 }, (_, index) => ({
      details: index % 2 === 0 ? `Variable-height project ${index + 1}` : undefined,
      label: `Project ${index + 1}`,
      value: `project-${index + 1}`,
    }));
    return (
      <CompactSelect
        menuHeight={240}
        mode="grid"
        options={options}
        onChange={(option) => setValue(option.value)}
        value={value}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /Project 1/ }));
    await expect(canvas.getByRole("grid")).toBeVisible();
    await expect(canvasElement.querySelector('[data-is-virtualized="true"]')).not.toBeNull();
    const renderedRows = canvas.queryAllByRole("row");
    expect(renderedRows.length).toBeLessThan(200);
    expect(renderedRows[0]).toHaveAttribute("data-index");
    await expect(canvas.getByText("Variable-height project 1")).toBeVisible();
  },
};
