import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
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

function Example({
  controlled = false,
  fixedLast = false,
  status = false,
}: {
  controlled?: boolean;
  fixedLast?: boolean;
  status?: boolean;
}) {
  const [widths, setWidths] = useState(columns);
  const [sort, setSort] = useState<"asc" | "desc">("desc");
  const configured = controlled ? widths : columns;
  return (
    <div className="max-h-72 overflow-auto rounded-md border border-[var(--scraps-theme-border-secondary)]">
      <Table
        className="w-full text-sm"
        columns={configured}
        flexibleLastColumn={!fixedLast}
        onColumnResize={
          controlled
            ? (index, width) =>
                setWidths((current) =>
                  current.map((column, columnIndex) =>
                    columnIndex === index ? { ...column, width } : column,
                  ),
                )
            : undefined
        }
      >
        <Table.Head className="bg-background" sticky>
          <Table.Row>
            <Table.HeadCell
              className="p-3 text-left font-medium"
              column="issue"
              sort={sort}
              onSort={() => setSort((current) => (current === "asc" ? "desc" : "asc"))}
            >
              Issue
            </Table.HeadCell>
            <Table.HeadCell
              className="p-3 text-right font-medium"
              column="events"
              overlays={<span aria-hidden>New</span>}
            >
              Events
            </Table.HeadCell>
            <Table.HeadCell className="p-3 text-left font-medium" column="owner">
              Owner
            </Table.HeadCell>
          </Table.Row>
        </Table.Head>
        {status ? (
          <Table.StatusBody className="min-h-24 p-4 text-muted-foreground">
            No matching issues
          </Table.StatusBody>
        ) : (
          <Table.Body>
            {rows.map((row) => (
              <Table.Row className="min-h-12" divider key={row[0]}>
                {row.map((cell, index) => (
                  <Table.Cell className={index === 1 ? "p-3 text-right" : "p-3"} key={cell}>
                    {cell}
                  </Table.Cell>
                ))}
              </Table.Row>
            ))}
          </Table.Body>
        )}
      </Table>
      {controlled ? (
        <output
          className="block border-t border-[var(--scraps-theme-border-secondary)] p-2 text-xs"
          data-testid="widths"
        >
          {widths.map((column) => column.width ?? COL_WIDTH_UNDEFINED).join(",")}
        </output>
      ) : null}
    </div>
  );
}

const meta = {
  title: "Components/Table",
  component: Table,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Table>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  render: () => <Example />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = canvas.getByRole("table");
    const head = table.querySelector<HTMLElement>("thead");
    const bodyRows = table.querySelectorAll<HTMLElement>("tbody tr");
    const sortButton = canvas.getByRole("button", { name: "Issue" });
    const passiveHeaderContent = canvas
      .getByRole("columnheader", { name: "Events" })
      .querySelector<HTMLElement>(":scope > div");
    const resizers = canvas.getAllByRole("separator");
    if (!head || bodyRows.length < 2 || !passiveHeaderContent || !resizers[0]?.parentElement) {
      throw new Error("Table visual layers are missing");
    }
    await expect(table.style.gridTemplateColumns).toBe("220px 120px minmax(90px, auto)");
    await expect(resizers).toHaveLength(2);
    await expect({
      borderCollapse: getComputedStyle(table).borderCollapse,
      boxSizing: getComputedStyle(table).boxSizing,
      display: getComputedStyle(table).display,
      position: getComputedStyle(head).position,
      top: getComputedStyle(head).top,
      zIndex: getComputedStyle(head).zIndex,
    }).toEqual({
      borderCollapse: "collapse",
      boxSizing: "border-box",
      display: "grid",
      position: "sticky",
      top: "0px",
      zIndex: "2",
    });
    await expect({
      borderBottomColor: getComputedStyle(bodyRows[0]!).borderBottomColor,
      borderBottomStyle: getComputedStyle(bodyRows[0]!).borderBottomStyle,
      borderBottomWidth: getComputedStyle(bodyRows[0]!).borderBottomWidth,
      display: getComputedStyle(bodyRows[0]!).display,
      gridTemplateColumns: getComputedStyle(bodyRows[0]!).gridTemplateColumns,
      position: getComputedStyle(bodyRows[0]!).position,
    }).toEqual({
      borderBottomColor: "rgb(230, 230, 233)",
      borderBottomStyle: "solid",
      borderBottomWidth: "1px",
      display: "grid",
      gridTemplateColumns: "subgrid [] [] [] []",
      position: "relative",
    });
    await expect({
      borderTopStyle: getComputedStyle(sortButton).borderTopStyle,
      borderTopUsesCurrentColor:
        getComputedStyle(sortButton).borderTopColor === getComputedStyle(sortButton).color,
      cursor: getComputedStyle(passiveHeaderContent).cursor,
      display: getComputedStyle(sortButton).display,
      gap: getComputedStyle(sortButton).gap,
      pointerEvents: getComputedStyle(resizers[0].parentElement).pointerEvents,
      resizerPosition: getComputedStyle(resizers[0].parentElement).position,
      resizerZIndex: getComputedStyle(resizers[0].parentElement).zIndex,
    }).toEqual({
      borderTopStyle: "none",
      borderTopUsesCurrentColor: true,
      cursor: "default",
      display: "flex",
      gap: "4px",
      pointerEvents: "none",
      resizerPosition: "absolute",
      resizerZIndex: "1",
    });
    const sortArrow = sortButton.querySelector<SVGElement>("svg");
    if (!sortArrow) throw new Error("Sort arrow is missing");
    await expect(getComputedStyle(sortArrow).transform).toBe("matrix(1, 0, 0, -1, 0, 0)");
    await expect(canvas.getByRole("columnheader", { name: "Issue" })).toHaveAttribute(
      "aria-sort",
      "descending",
    );
    await userEvent.click(sortButton);
    await expect(canvas.getByRole("columnheader", { name: "Issue" })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
    await expect(getComputedStyle(sortArrow).transform).toBe("matrix(1, 0, 0, 1, 0, 0)");
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
