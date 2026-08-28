import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import { Pagination, useGetPaginationCaption } from "./pagination";

const pageLinks =
  '<https://sentry.io/api/0/items/?cursor=0:0:1>; rel="previous"; results="false"; cursor="0:0:1", <https://sentry.io/api/0/items/?cursor=0:25:0>; rel="next"; results="true"; cursor="0:25:0"';
const meta = {
  component: Pagination,
  title: "Scraps/Pagination",
} satisfies Meta<typeof Pagination>;
export default meta;
type Story = StoryObj<typeof meta>;

function PaginationWithCaption() {
  const getCaption = useGetPaginationCaption();
  return (
    <Pagination
      caption={getCaption({
        cursor: undefined,
        limit: 25,
        pageLength: 25,
        total: 100,
      })}
      pageLinks={pageLinks}
    />
  );
}

export const States: Story = {
  render: () => (
    <div className="grid max-w-lg gap-6 p-6">
      <PaginationWithCaption />
      <Pagination disabled pageLinks={pageLinks} size="xs" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const previousButtons = canvas.getAllByRole("button", {
      name: "Previous",
    });
    const nextButtons = canvas.getAllByRole("button", { name: "Next" });
    await expect(previousButtons[0]).toBeDisabled();
    await expect(canvas.getByText("1-25 of 100")).toBeVisible();
    await userEvent.click(nextButtons[0]!);
  },
};
