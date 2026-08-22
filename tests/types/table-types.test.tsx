import { createRef } from "react";

import { Table, type TableColumnConfig } from "@/components/ui/table";

const columns: TableColumnConfig[] = [{ key: "name", width: 200 }, { key: "count", resizable: false, width: "min-content" }];
const ref = createRef<HTMLTableElement>();

<Table ref={ref} columns={columns} flexibleLastColumn={false} minimumColumnWidth={100} prependColumnWidths={["40px"]} onColumnResize={(index, width) => {
  const values: [number, number] = [index, width];
  void values;
}}>
  <Table.Head sticky><Table.Row><Table.HeadCell column="name" sort="asc" onSort={() => {}}>Name</Table.HeadCell></Table.Row></Table.Head>
  <Table.Body><Table.Row divider><Table.Cell>Name</Table.Cell></Table.Row></Table.Body>
  <Table.Status>Loading</Table.Status>
</Table>;

// @ts-expect-error Table column widths are numbers, strings, or absent.
const invalidWidth: TableColumnConfig = { key: "bad", width: true };
void invalidWidth;

// @ts-expect-error Sort direction is the canonical asc/desc union.
<Table.HeadCell sort="ascending">Name</Table.HeadCell>;

// @ts-expect-error Resize callbacks receive a numeric width.
<Table columns={columns} onColumnResize={(index: number, width: string) => void [index, width]}><Table.Body /></Table>;

// @ts-expect-error Legacy shadcn compounds are not part of the regular Scraps API.
<Table.Footer />;

export {};
