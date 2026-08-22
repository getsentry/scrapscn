import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fireEvent, userEvent, within } from "storybook/test";

import { COL_WIDTH_UNDEFINED, Table, type TableColumnConfig } from "./table";

const columns: TableColumnConfig[] = [
  { key: "issue", width: 220 },
  { key: "events", width: 120 },
  { key: "owner" },
];

const rows = [
  ["Checkout failed", "1,248", "Web Platform"],
  ["Database timeout", "842", "Backend"],
  ["Missing source map", "391", "Developer Experience"],
];

function Example({ controlled = false, fixedLast = false, status = false }: { controlled?: boolean; fixedLast?: boolean; status?: boolean }) {
  const [widths, setWidths] = useState(columns);
  const [sort, setSort] = useState<"asc" | "desc">("desc");
  const configured = controlled ? widths : columns;
  return <div className="max-h-72 overflow-auto rounded-md border border-[var(--scraps-theme-border-secondary)]">
    <Table className="w-full text-sm" columns={configured} flexibleLastColumn={!fixedLast} onColumnResize={controlled ? (index, width) => setWidths((current) => current.map((column, columnIndex) => columnIndex === index ? { ...column, width } : column)) : undefined}>
      <Table.Head className="bg-background" sticky><Table.Row>
        <Table.HeadCell className="p-3 text-left font-medium" column="issue" sort={sort} onSort={() => setSort((current) => current === "asc" ? "desc" : "asc")}>Issue</Table.HeadCell>
        <Table.HeadCell className="p-3 text-right font-medium" column="events">Events</Table.HeadCell>
        <Table.HeadCell className="p-3 text-left font-medium" column="owner">Owner</Table.HeadCell>
      </Table.Row></Table.Head>
      {status ? <Table.StatusBody className="min-h-24 p-4 text-muted-foreground">No matching issues</Table.StatusBody> : <Table.Body>{rows.map((row) => <Table.Row className="min-h-12" divider key={row[0]}>{row.map((cell, index) => <Table.Cell className={index === 1 ? "p-3 text-right" : "p-3"} key={cell}>{cell}</Table.Cell>)}</Table.Row>)}</Table.Body>}
    </Table>
    {controlled ? <output className="block border-t border-[var(--scraps-theme-border-secondary)] p-2 text-xs" data-testid="widths">{widths.map((column) => column.width ?? COL_WIDTH_UNDEFINED).join(",")}</output> : null}
  </div>;
}

const meta = { title: "Components/Table", component: Table, parameters: { layout: "padded" } } satisfies Meta<typeof Table>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  render: () => <Example />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("table").style.gridTemplateColumns).toBe("220px 120px minmax(90px, auto)");
    await expect(canvas.getAllByRole("separator")).toHaveLength(2);
    await expect(canvas.getByRole("columnheader", { name: "Issue" })).toHaveAttribute("aria-sort", "descending");
    await userEvent.click(canvas.getByRole("button", { name: "Issue" }));
    await expect(canvas.getByRole("columnheader", { name: "Issue" })).toHaveAttribute("aria-sort", "ascending");
  },
};

export const ControlledWidths: Story = {
  render: () => <Example controlled />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const handle = canvas.getAllByRole("separator")[0];
    handle?.focus();
    await userEvent.keyboard("{Shift>}{ArrowRight}{/Shift}");
    await expect(canvas.getByTestId("widths")).toHaveTextContent("270,120,-1");
    if (handle) await fireEvent.doubleClick(handle);
    await expect(canvas.getByTestId("widths")).toHaveTextContent("-1,120,-1");
  },
};

export const FixedLastColumn: Story = { render: () => <Example fixedLast /> };
export const Status: Story = { render: () => <Example status /> };
