import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useEffect, useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Breadcrumbs, PageFrame, PRODUCT_NAV, type PageFrameProps } from "./index";

function InteractiveFrame({ active: initialActive = "issues", title, ...props }: PageFrameProps) {
  const [active, setActive] = useState(initialActive);
  useEffect(() => setActive(initialActive), [initialActive]);
  const label = PRODUCT_NAV.find((item) => item.id === active)?.label ?? "Sentry";

  return (
    <PageFrame
      {...props}
      active={active}
      title={title ?? <Breadcrumbs items={[{ label }]} />}
      onNavigate={(key) => {
        setActive(key);
        props.onNavigate?.(key);
      }}
    />
  );
}

const meta = {
  title: "Compositions/Page Frame",
  component: PageFrame,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    controls: { include: ["active"] },
    docs: {
      story: { inline: true, height: "720px", autoplay: false },
      description: {
        component:
          "Reusable Sentry page chrome ported from Ivy’s Seer automation frame: a 76px product rail, 188px secondary sidebar, and 53px header. The rail follows the Figma navigation: Issues, Explore, Dashboards, Insights, Monitors, Settings. Click a product, hover to preview another sidebar, or collapse and pin the navigation. The Mobile story uses a 390px container and a navigation drawer. Supply children, sidebar, actions, and panel to compose a page; connect onNavigate to your router. Unwired header actions are disabled.",
      },
    },
  },
  argTypes: {
    active: { control: "select", options: PRODUCT_NAV.map((item) => item.id) },
  },
  decorators: [
    (Story) => (
      <div className="-m-6">
        <Story />
      </div>
    ),
  ],
  args: {
    active: "issues",
    children: <h1 className="p-6 text-lg font-medium">Page content</h1>,
  },
} satisfies Meta<typeof PageFrame>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
  render: (args) => (
    <div className="w-[1200px]">
      <InteractiveFrame {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nav = canvas.getByRole("navigation", { name: "Products" });
    await expect(
      within(nav)
        .getAllByRole("button")
        .map((button) => button.textContent),
    ).toEqual(["Issues", "Explore", "Dashboards", "Insights", "Monitors", "Settings"]);
    const header = canvasElement.querySelector('[data-slot="page-frame-header"]');
    await expect(nav.closest("aside")).toHaveStyle({ width: "76px" });
    await expect(canvas.getByRole("complementary", { name: "Secondary navigation" })).toHaveStyle({
      width: "188px",
    });
    await expect(header).toHaveStyle({ height: "53px" });
    await expect(within(nav).getByRole("button", { name: "Issues", exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(canvas.getByRole("button", { name: "Ask Seer" })).toBeDisabled();

    const dashboards = within(nav).getByRole("button", { name: "Dashboards" });
    await userEvent.hover(dashboards);
    await expect(canvas.getByText("All Dashboards", { exact: true })).toBeVisible();
    await userEvent.unhover(dashboards);
    await userEvent.hover(canvas.getByRole("heading", { name: "Page content" }));
    await waitFor(() => expect(canvas.getByText("Supergroups")).toBeVisible());

    await userEvent.click(within(nav).getByRole("button", { name: "Explore" }));
    await expect(within(nav).getByRole("button", { name: "Explore" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(
      within(canvas.getByRole("navigation", { name: "Breadcrumb" })).getByText("Explore"),
    ).toBeVisible();
    await userEvent.click(within(nav).getByRole("button", { name: "Issues", exact: true }));

    await userEvent.click(canvas.getByRole("button", { name: "Collapse sidebar" }));
    const expand = canvas.getByRole("button", { name: "Expand sidebar" });
    await expect(expand).toHaveFocus();
    await expect(expand).toHaveAttribute("aria-expanded", "false");
    await expect(canvasElement.querySelector('[data-slot="page-frame-sidebar"]')).toHaveAttribute(
      "data-state",
      "closed",
    );
    await userEvent.hover(within(nav).getByRole("button", { name: "Explore" }));
    await expect(canvas.getByText("Traces", { exact: true })).toBeVisible();
    await expect(canvasElement.querySelector('[data-slot="page-frame-sidebar"]')).toHaveAttribute(
      "data-state",
      "flyout",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Keep sidebar open" }));
    await expect(canvasElement.querySelector('[data-slot="page-frame-sidebar"]')).toHaveAttribute(
      "data-state",
      "docked",
    );
    await expect(canvas.getByRole("button", { name: "Collapse sidebar" })).toHaveFocus();
  },
};

export const Collapsed: Story = {
  render: Desktop.render,
  args: { defaultCollapsed: true },
  parameters: {
    docs: {
      description: {
        story:
          "The collapsed rail keeps an Expand button in the header. Hover or focus a product to preview its secondary navigation, then pin it open.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const expand = canvas.getByRole("button", { name: "Expand sidebar" });
    await expect(expand).toBeVisible();
    await expect(
      canvas.queryByRole("complementary", { name: "Secondary navigation" }),
    ).not.toBeInTheDocument();
    await userEvent.click(expand);
    await expect(canvas.getByRole("complementary", { name: "Secondary navigation" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Collapse sidebar" })).toHaveFocus();
    await userEvent.click(canvas.getByRole("button", { name: "Collapse sidebar" }));
    await expect(canvas.getByRole("button", { name: "Expand sidebar" })).toHaveFocus();
  },
};

function MobileExample(props: PageFrameProps) {
  return (
    <div className="w-[390px]">
      <InteractiveFrame {...props}>
        <h1 className="p-6">Mobile page</h1>
      </InteractiveFrame>
    </div>
  );
}

export const Mobile: Story = {
  render: (args) => <MobileExample {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const documentCanvas = within(canvasElement.ownerDocument.body);
    const open = canvas.getByRole("button", { name: "Open navigation" });
    await expect(open).toBeVisible();
    await expect(canvas.queryByRole("navigation", { name: "Products" })).not.toBeInTheDocument();
    await userEvent.click(open);
    const dialog = await documentCanvas.findByRole("dialog");
    await waitFor(() => expect(dialog).toBeVisible());
    await userEvent.click(within(dialog).getByRole("button", { name: "Dashboards", exact: true }));
    await waitFor(() => expect(documentCanvas.queryByRole("dialog")).not.toBeInTheDocument());
    await expect(open).toHaveFocus();
    await expect(
      canvas.getAllByText("Dashboards").some((element) => element.getClientRects().length > 0),
    ).toBe(true);
    await userEvent.click(open);
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(documentCanvas.queryByRole("dialog")).not.toBeInTheDocument());
    await expect(open).toHaveFocus();
  },
};

export const Dark: Story = {
  render: (args) => (
    <div className="dark w-[1200px]">
      <InteractiveFrame {...args} />
    </div>
  ),
};

export const WithPanel: Story = {
  ...Desktop,
  play: undefined,
  args: {
    panel: (
      <aside aria-label="Details" className="w-64 shrink-0 border-l bg-muted p-4">
        Context panel
      </aside>
    ),
  },
};
